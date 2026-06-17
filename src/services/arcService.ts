/**
 * 弧段服务
 * 负责从 PurestAdmin 获取卫星过境弧段数据
 */
import { getHttpClient } from './http/httpClient';
import type { ArcSegment, ArcQueryParams, PagedList } from './types/api.types';
import { env } from '../config/env.config';
import { parseApiTime, toApiLocalString } from '../utils/time';

class ArcService {
  private httpClient = getHttpClient();
  private readonly CACHE_KEY = 'api_arcs';
  private readonly CACHE_DURATION = env.CACHE_DURATION_ARC;
  private readonly MAX_RECORDS = env.ARC_MAX_RECORDS;
  // 后续页并发数，避免压垮后端
  private readonly MAX_CONCURRENCY = 3;

  /**
   * 查询弧段列表（自动循环拉取所有分页）
   * @param params 查询参数
   * @returns 弧段列表
   *
   * 说明：之前版本只发一次请求拿前 200 条，弧段总数超过 200 时会静默丢数据。
   * 现在先拉首页拿到 total/pageCount，再分批并发拉剩余页。
   * 首页失败抛错走降级缓存；后续页失败跳过，返回已拿到的部分数据。
   */
  async fetchArcs(params: ArcQueryParams = {}): Promise<ArcSegment[]> {
    const pageSize = params.pageSize ?? 200;

    try {
      // 第 1 页必须串行：要先拿到 total/pageCount 才知道后续要拉几页
      const first = await this._fetchPage(params, 1, pageSize);
      let allArcs = this._extractItems(first);

      const total = Math.min(first.total ?? allArcs.length, this.MAX_RECORDS);
      const pageCount = first.pageCount ?? Math.ceil(total / pageSize);

      if (pageCount > 1 && allArcs.length < total) {
        const restPages: number[] = [];
        for (let p = 2; p <= pageCount; p++) restPages.push(p);

        // 分批并发，每批 MAX_CONCURRENCY 个
        for (let i = 0; i < restPages.length; i += this.MAX_CONCURRENCY) {
          if (allArcs.length >= total) break;
          const batch = restPages.slice(i, i + this.MAX_CONCURRENCY);
          const results = await Promise.allSettled(
            batch.map(p => this._fetchPage(params, p, pageSize))
          );
          for (const r of results) {
            if (r.status !== 'fulfilled') {
              console.warn('[ArcService] 拉取弧段分页失败，跳过该页:', r.reason);
              continue;
            }
            const items = this._extractItems(r.value);
            if (items.length === 0) continue;
            allArcs = allArcs.concat(items);
          }
        }
      }

      // 兜底裁剪，防止极端情况下数据超量
      allArcs = allArcs.slice(0, this.MAX_RECORDS);

      this.saveToCache(allArcs);
      return allArcs;
    } catch (error) {
      console.error('[ArcService] 获取弧段数据失败:', error);

      // 降级：返回缓存数据
      const cached = this.getFromCache();
      if (cached) {
        console.warn('[ArcService] 使用缓存的弧段数据');
        return cached;
      }

      throw error;
    }
  }

  /**
   * 拉取单页弧段（私有）
   */
  private async _fetchPage(params: ArcQueryParams, pageIndex: number, pageSize: number): Promise<PagedList<ArcSegment>> {
    const queryParams = new URLSearchParams();
    queryParams.append('pageIndex', String(pageIndex));
    queryParams.append('pageSize', String(pageSize));

    if (params.scid) queryParams.append('scid', params.scid);
    if (params.satName) queryParams.append('satName', params.satName);
    if (params.channelType) queryParams.append('channelType', params.channelType);
    if (params.siteName) queryParams.append('siteName', params.siteName);
    if (params.startTimeBegin) queryParams.append('startTimeBegin', params.startTimeBegin);
    if (params.startTimeEnd) queryParams.append('startTimeEnd', params.startTimeEnd);
    if (params.endTimeBegin) queryParams.append('endTimeBegin', params.endTimeBegin);
    if (params.endTimeEnd) queryParams.append('endTimeEnd', params.endTimeEnd);

    const url = `/arc/paged-list?${queryParams.toString()}`;
    return this.httpClient.get<PagedList<ArcSegment>>(url);
  }

  /**
   * 从分页响应中提取 items（私有）
   * 兼容 items / data 两种字段命名
   */
  private _extractItems(response: PagedList<ArcSegment>): ArcSegment[] {
    return response.items || response.data || [];
  }

  /**
   * 获取即将到来的弧段
   * @param scid 卫星 ID（可选）
   * @param hours 时间范围（小时）
   * @returns 弧段列表
   */
  async fetchUpcomingArcs(scid?: string, hours: number = 24): Promise<ArcSegment[]> {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 3600000);

    // 向前扩展查询时间范围，确保能获取到已经开始但未结束的活跃弧段
    // 假设最长入境弧段不超过 2 小时
    const lookBackHours = 2;
    const startTime = new Date(now.getTime() - lookBackHours * 3600000);

    return this.fetchArcs({
      scid,
      startTimeBegin: toApiLocalString(startTime),
      startTimeEnd: toApiLocalString(endTime),
      pageSize: 200
    });
  }

  /**
   * 获取当前活跃的弧段
   * @param scid 卫星 ID（可选）
   * @returns 活跃弧段列表
   */
  async fetchActiveArcs(scid?: string): Promise<ArcSegment[]> {
    const arcs = await this.fetchArcs({ scid, pageSize: 200 });
    const now = new Date();

    const activeArcs = arcs.filter(arc => {
      const startTime = parseApiTime(arc.startTime);
      const endTime = parseApiTime(arc.endTime);
      if (!startTime || !endTime) return false;
      return now >= startTime && now <= endTime;
    });

    return activeArcs;
  }

  /**
   * 从缓存获取
   */
  private getFromCache(): ArcSegment[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > this.CACHE_DURATION;

      if (isExpired) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[ArcService] 读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存到缓存
   */
  private saveToCache(data: ArcSegment[]): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[ArcService] 保存缓存失败:', error);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('[ArcService] 缓存已清除');
  }
}

// 导出单例
const arcService = new ArcService();
export default arcService;
