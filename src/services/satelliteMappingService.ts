/**
 * 卫星数据关联服务
 * 负责将API卫星数据与TLE数据通过NORAD ID进行关联
 */
import satelliteApiService from './satelliteApiService';
import type { APISatellite } from './types/api.types';
import { batchUpdateMappings } from './NamingMappingService';

/**
 * 请求队列项
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  endpoint: string;
  config: any;
}

/**
 * 卫星映射服务类
 */
class SatelliteMappingService {
  private apiSatellites: APISatellite[] = [];
  private readonly CACHE_KEY = 'satellite_mapping_cache';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
  private isInitialized = false;

  /**
   * 获取并关联卫星数据
   * @returns API中的有效卫星列表（有nordID的卫星）
   */
  async fetchAndMapSatellites(): Promise<APISatellite[]> {
    // 检查缓存
    const cached = this.getFromCache();
    if (cached) {
      console.log('[SatelliteMappingService] 使用缓存数据，卫星数量:', cached.length);
      this.apiSatellites = cached;
      return cached.filter(s => s.nordID);
    }

    console.log('[SatelliteMappingService] 从API获取卫星数据...');
    const satellites = await satelliteApiService.fetchSatellites();
    this.apiSatellites = satellites;

    // 过滤出有 nordID 的卫星
    const validSatellites = satellites.filter(s => s.nordID);
    console.log('[SatelliteMappingService] 有效卫星数量（有NORAD ID）:', validSatellites.length);

    // 更新 NamingMappingService
    await this.updateNameMappings(validSatellites);

    // 缓存数据
    this.saveToCache(satellites);
    this.isInitialized = true;

    return validSatellites;
  }

  /**
   * 根据NORAD ID查找卫星
   * @param noradId NORAD ID（字符串格式）
   * @returns 卫星数据或null
   */
  findByNoradId(noradId: string): APISatellite | null {
    return this.apiSatellites.find(s => s.nordID?.toString() === noradId) || null;
  }

  /**
   * 根据SCID查找卫星
   * @param scid SCID（字符串格式，可能包含括号如 "8197(2005H)"）
   * @returns 卫星数据或null
   */
  findByScid(scid: string): APISatellite | null {
    // 提取 SCID 的数字部分（去掉括号内容）
    // 例如: "8197(2005H)" -> "8197"
    const scidNumber = scid.split('(')[0];
    return this.apiSatellites.find(s => s.scid?.toString() === scidNumber) || null;
  }

  /**
   * 根据SCID获取对应的NORAD ID
   * @param scid SCID（字符串格式，可能包含括号如 "8197(2005H)"）
   * @returns NORAD ID（字符串格式）或null
   */
  getNoradIdByScid(scid: string): string | null {
    const satellite = this.findByScid(scid);
    return satellite?.nordID?.toString() || null;
  }

  /**
   * 获取已映射的NORAD ID列表
   * @returns NORAD ID字符串数组
   */
  getMappedNoradIds(): string[] {
    return this.apiSatellites
      .filter(s => s.nordID)
      .map(s => s.nordID!.toString());
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('[SatelliteMappingService] 缓存已清除');
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 更新命名映射到 NamingMappingService
   */
  private async updateNameMappings(satellites: APISatellite[]): Promise<void> {
    try {
      const mappings = satellites.map(s => ({
        noradId: s.nordID!.toString(),
        displayName: s.sateliteName,
        tleName: ''
      }));

      await batchUpdateMappings(mappings);
      console.log('[SatelliteMappingService] 命名映射已更新，数量:', mappings.length);
    } catch (error) {
      console.error('[SatelliteMappingService] 更新命名映射失败:', error);
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
        console.log('[SatelliteMappingService] 缓存已过期');
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[SatelliteMappingService] 读取缓存失败:', error);
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
      console.log('[SatelliteMappingService] 数据已缓存');
    } catch (error) {
      console.error('[SatelliteMappingService] 保存缓存失败:', error);
    }
  }
}

// 导出单例
const satelliteMappingService = new SatelliteMappingService();
export default satelliteMappingService;
