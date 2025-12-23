/**
 * 遥测数据管理 Hook
 * 提供遥测单元数据的获取和状态管理
 */
import { useState, useCallback } from 'react';
import telemetryService from '../services/telemetryService';
import type { TelemetryUnit } from '../services/types/api.types';

interface UseTelemetryResult {
  telemetryUnits: Map<number, TelemetryUnit[]>;
  isLoading: boolean;
  error: string | null;
  fetchByGroup: (groupId: number, pageIndex?: number, pageSize?: number) => Promise<TelemetryUnit[]>;
  fetchAllByGroup: (groupId: number) => Promise<TelemetryUnit[]>;
  fetchMultipleGroups: (groupIds: number[]) => Promise<Map<number, TelemetryUnit[]>>;
  clearError: () => void;
}

/**
 * 遥测数据管理 Hook
 */
export const useTelemetry = (): UseTelemetryResult => {
  const [telemetryUnits, setTelemetryUnits] = useState<Map<number, TelemetryUnit[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取卫星组的遥测单元
  const fetchByGroup = useCallback(async (
    groupId: number,
    pageIndex: number = 1,
    pageSize: number = 100
  ) => {
    console.log('[useTelemetry] 获取卫星组遥测:', groupId);
    setIsLoading(true);
    setError(null);

    try {
      const units = await telemetryService.fetchTelemetryUnits(groupId, pageIndex, pageSize);

      if (units.length > 0) {
        setTelemetryUnits(prev => new Map(prev).set(groupId, units));
        console.log('[useTelemetry] 卫星组遥测更新，数量:', units.length);
      }

      return units;
    } catch (err: any) {
      setError(err.message || '获取遥测单元失败');
      console.error('[useTelemetry] 获取卫星组遥测失败:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取卫星组的全部遥测单元
  const fetchAllByGroup = useCallback(async (groupId: number) => {
    console.log('[useTelemetry] 获取卫星组全部遥测:', groupId);
    setIsLoading(true);
    setError(null);

    try {
      const units = await telemetryService.fetchAllTelemetryUnits(groupId);

      if (units.length > 0) {
        setTelemetryUnits(prev => new Map(prev).set(groupId, units));
        console.log('[useTelemetry] 卫星组全部遥测更新，数量:', units.length);
      }

      return units;
    } catch (err: any) {
      setError(err.message || '获取全部遥测单元失败');
      console.error('[useTelemetry] 获取卫星组全部遥测失败:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 批量获取多个卫星组的遥测
  const fetchMultipleGroups = useCallback(async (groupIds: number[]) => {
    console.log('[useTelemetry] 批量获取卫星组遥测:', groupIds);
    setIsLoading(true);
    setError(null);

    try {
      const data = await telemetryService.fetchMultipleGroupTelemetry(groupIds);
      setTelemetryUnits(data);
      console.log('[useTelemetry] 批量遥测更新，卫星组数量:', data.size);
      return data;
    } catch (err: any) {
      setError(err.message || '批量获取遥测单元失败');
      console.error('[useTelemetry] 批量获取遥测失败:', err);
      return new Map();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    telemetryUnits,
    isLoading,
    error,
    fetchByGroup,
    fetchAllByGroup,
    fetchMultipleGroups,
    clearError
  };
};

export default useTelemetry;
