/**
 * 卫星 API 服务
 * 负责从 PurestAdmin 获取卫星基础数据
 */
import { getHttpClient } from './http/httpClient';
import type { APISatellite, PagedList } from './types/api.types';
import { env } from '../config/env.config';

class SatelliteApiService {
  private httpClient = getHttpClient();
  private readonly CACHE_KEY = 'api_satellites';
  private readonly CACHE_DURATION = env.CACHE_DURATION_SATELLITE;

  /**
   * 获取卫星列表
   * @param pageIndex 页码，默认 1
   * @param pageSize 页容量，默认 200（获取全部）
   * @returns 卫星列表
   */
  async fetchSatellites(pageIndex: number = 1, pageSize: number = 200): Promise<APISatellite[]> {
    console.log('[SatelliteApiService] 获取卫星列表...', { pageIndex, pageSize });

    // 优先从缓存读取
    const cached = this.getFromCache();
    if (cached) {
      console.log('[SatelliteApiService] 使用缓存数据，卫星数量:', cached.length);
      return cached;
    }

    try {
      const queryParams = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString()
      });

      const response = await this.httpClient.get<PagedList<APISatellite>>(
        `/satelite/paged-list?${queryParams}`
      );

      console.log('[SatelliteApiService] 获取到卫星数据:', response);

      // 从分页响应中提取 items
      const satellites = response.items || response.data || [];

      // 缓存数据
      this.saveToCache(satellites);

      return satellites;
    } catch (error) {
      console.error('[SatelliteApiService] 获取卫星列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据 ID 获取单个卫星
   * @param satID 卫星 ID
   * @returns 卫星数据或 null
   */
  async fetchSatelliteById(satID: number): Promise<APISatellite | null> {
    console.log(`[SatelliteApiService] 获取卫星 ${satID}...`);

    try {
      // 使用分页接口，设置 pageSize=1 来获取单个卫星
      const response = await this.httpClient.get<PagedList<APISatellite>>(
        `/satelite/paged-list?pageIndex=1&pageSize=200`
      );

      const satellite = response.items?.find(s => s.satID === satID);

      if (satellite) {
        console.log(`[SatelliteApiService] 卫星 ${satID} 数据:`, satellite);
      } else {
        console.warn(`[SatelliteApiService] 未找到卫星 ${satID}`);
      }

      return satellite || null;
    } catch (error) {
      console.error(`[SatelliteApiService] 获取卫星 ${satID} 失败:`, error);
      return null;
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(): APISatellite[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > this.CACHE_DURATION;

      if (isExpired) {
        console.log('[SatelliteApiService] 缓存已过期');
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SatelliteApiService] 读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存到缓存
   */
  private saveToCache(data: APISatellite[]): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('[SatelliteApiService] 数据已缓存');
    } catch (error) {
      console.error('[SatelliteApiService] 保存缓存失败:', error);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('[SatelliteApiService] 缓存已清除');
  }
}

// 导出单例
const satelliteApiService = new SatelliteApiService();
export default satelliteApiService;
