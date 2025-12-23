/**
 * 弧段服务
 * 负责从 PurestAdmin 获取卫星过境弧段数据
 */
import { getHttpClient } from './http/httpClient';
import type { ArcSegment, ArcQueryParams, PagedList } from './types/api.types';
import { env } from '../config/env.config';

class ArcService {
  private httpClient = getHttpClient();
  private readonly CACHE_KEY = 'api_arcs';
  private readonly CACHE_DURATION = env.CACHE_DURATION_ARC;

  /**
   * 查询弧段列表
   * @param params 查询参数
   * @returns 弧段列表
   */
  async fetchArcs(params: ArcQueryParams = {}): Promise<ArcSegment[]> {
    console.log('[ArcService] 获取弧段数据...', params);

    // 构建查询字符串
    const queryParams = new URLSearchParams();

    // 分页参数
    if (params.pageIndex) queryParams.append('pageIndex', params.pageIndex.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    else queryParams.append('pageSize', '200'); // 默认获取更多数据

    // 筛选参数
    if (params.scid) queryParams.append('scid', params.scid);
    if (params.satName) queryParams.append('satName', params.satName);
    if (params.channelType) queryParams.append('channelType', params.channelType);
    if (params.siteName) queryParams.append('siteName', params.siteName);
    if (params.startTimeBegin) queryParams.append('startTimeBegin', params.startTimeBegin);
    if (params.startTimeEnd) queryParams.append('startTimeEnd', params.startTimeEnd);
    if (params.endTimeBegin) queryParams.append('endTimeBegin', params.endTimeBegin);
    if (params.endTimeEnd) queryParams.append('endTimeEnd', params.endTimeEnd);

    const queryString = queryParams.toString();
    const url = `/arc/paged-list?${queryString}`;

    try {
      const response = await this.httpClient.get<PagedList<ArcSegment>>(url);
      console.log('[ArcService] 获取到弧段数据:', response);

      // 从分页响应中提取 items
      const arcs = response.items || response.data || [];

      // 缓存数据
      this.saveToCache(arcs);

      return arcs;
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
   * 获取即将到来的弧段
   * @param scid 卫星 ID（可选）
   * @param hours 时间范围（小时）
   * @returns 弧段列表
   */
  async fetchUpcomingArcs(scid?: string, hours: number = 24): Promise<ArcSegment[]> {
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 3600000);

    console.log('[ArcService] 获取即将到来的弧段:', { scid, hours });

    return this.fetchArcs({
      scid,
      startTimeBegin: now.toISOString(),
      startTimeEnd: endTime.toISOString(),
      pageSize: 200
    });
  }

  /**
   * 获取当前活跃的弧段
   * @param scid 卫星 ID（可选）
   * @returns 活跃弧段列表
   */
  async fetchActiveArcs(scid?: string): Promise<ArcSegment[]> {
    console.log('[ArcService] 获取活跃弧段:', { scid });

    const arcs = await this.fetchArcs({ scid, pageSize: 200 });
    const now = new Date();

    const activeArcs = arcs.filter(arc => {
      const startTime = new Date(arc.startTime);
      const endTime = new Date(arc.endTime);
      return now >= startTime && now <= endTime;
    });

    console.log('[ArcService] 活跃弧段数量:', activeArcs.length);
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
        console.log('[ArcService] 缓存已过期');
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
      console.log('[ArcService] 数据已缓存');
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
