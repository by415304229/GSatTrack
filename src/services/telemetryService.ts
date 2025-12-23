/**
 * 遥测服务
 * 负责从 PurestAdmin 获取卫星遥测单元数据
 */
import { getHttpClient } from './http/httpClient';
import type { TelemetryUnit, PagedList } from './types/api.types';

class TelemetryService {
  private httpClient = getHttpClient();

  /**
   * 获取遥测单元列表
   * @param groupId 卫星组 ID
   * @param pageIndex 页码
   * @param pageSize 页容量
   * @returns 遥测单元列表
   */
  async fetchTelemetryUnits(
    groupId: number,
    pageIndex: number = 1,
    pageSize: number = 100
  ): Promise<TelemetryUnit[]> {
    console.log(`[TelemetryService] 获取卫星组 ${groupId} 遥测单元...`);

    try {
      const response = await this.httpClient.get<PagedList<TelemetryUnit>>(
        `/satellite-telemetry/paged?groupId=${groupId}&pageIndex=${pageIndex}&pageSize=${pageSize}`
      );
      console.log(`[TelemetryService] 卫星组 ${groupId} 遥测单元数量:`, response.total);

      return response.items || response.data || [];
    } catch (error) {
      console.error(`[TelemetryService] 获取卫星组 ${groupId} 遥测失败:`, error);
      return [];
    }
  }

  /**
   * 获取全部遥测单元（最多 10 万条）
   * @param groupId 卫星组 ID
   * @returns 遥测单元列表
   */
  async fetchAllTelemetryUnits(groupId: number): Promise<TelemetryUnit[]> {
    console.log(`[TelemetryService] 获取卫星组 ${groupId} 全部遥测单元...`);

    try {
      const response = await this.httpClient.get<TelemetryUnit[]>(
        `/satellite-telemetry/all?groupId=${groupId}`
      );
      console.log(`[TelemetryService] 卫星组 ${groupId} 全部遥测单元数量:`, response.length);
      return response;
    } catch (error) {
      console.error(`[TelemetryService] 获取卫星组 ${groupId} 全部遥测失败:`, error);
      return [];
    }
  }

  /**
   * 批量获取多个卫星组的遥测单元
   * @param groupIds 卫星组 ID 列表
   * @returns 卫星组 ID 到遥测单元列表的映射
   */
  async fetchMultipleGroupTelemetry(groupIds: number[]): Promise<Map<number, TelemetryUnit[]>> {
    console.log(`[TelemetryService] 批量获取 ${groupIds.length} 个卫星组遥测...`);

    const resultMap = new Map<number, TelemetryUnit[]>();

    // 并行请求
    const promises = groupIds.map(async (groupId) => {
      const units = await this.fetchTelemetryUnits(groupId, 1, 200);
      if (units.length > 0) {
        resultMap.set(groupId, units);
      }
    });

    await Promise.all(promises);

    console.log(`[TelemetryService] 成功获取 ${resultMap.size} 个卫星组遥测`);
    return resultMap;
  }
}

// 导出单例
const telemetryService = new TelemetryService();
export default telemetryService;
