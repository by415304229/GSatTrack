/**
 * 弧段数据管理 Hook
 * 提供弧段数据的获取和状态管理
 */
import { useState, useCallback } from 'react';
import arcService from '../services/arcService';
import type { ArcSegment } from '../services/types/api.types';

interface UseArcServiceResult {
  arcs: ArcSegment[];
  upcomingArcs: ArcSegment[];
  activeArcs: ArcSegment[];
  isLoading: boolean;
  error: string | null;
  fetchArcs: (satelliteId?: string) => Promise<void>;
  fetchUpcomingArcs: (satelliteId?: string, hours?: number) => Promise<void>;
  fetchActiveArcs: (satelliteId?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 弧段数据管理 Hook
 */
export const useArcService = (): UseArcServiceResult => {
  const [arcs, setArcs] = useState<ArcSegment[]>([]);
  const [upcomingArcs, setUpcomingArcs] = useState<ArcSegment[]>([]);
  const [activeArcs, setActiveArcs] = useState<ArcSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取弧段列表
  const fetchArcs = useCallback(async (scid?: string) => {
    console.log('[useArcService] 获取弧段列表:', { scid });
    setIsLoading(true);
    setError(null);

    try {
      const data = await arcService.fetchArcs({ scid });
      setArcs(data);
      console.log('[useArcService] 弧段列表更新，数量:', data.length);
    } catch (err: any) {
      setError(err.message || '获取弧段数据失败');
      console.error('[useArcService] 获取弧段列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取即将到来的弧段
  const fetchUpcomingArcs = useCallback(async (
    scid?: string,
    hours: number = 24
  ) => {
    console.log('[useArcService] 获取即将到来的弧段:', { scid, hours });
    setIsLoading(true);
    setError(null);

    try {
      const data = await arcService.fetchUpcomingArcs(scid, hours);
      setUpcomingArcs(data);
      console.log('[useArcService] 即将到来的弧段更新，数量:', data.length);
    } catch (err: any) {
      setError(err.message || '获取即将到来的弧段失败');
      console.error('[useArcService] 获取即将到来的弧段失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取当前活跃的弧段
  const fetchActiveArcs = useCallback(async (scid?: string) => {
    console.log('[useArcService] 获取活跃弧段:', { scid });
    setIsLoading(true);
    setError(null);

    try {
      const data = await arcService.fetchActiveArcs(scid);
      setActiveArcs(data);
      console.log('[useArcService] 活跃弧段更新，数量:', data.length);
    } catch (err: any) {
      setError(err.message || '获取活跃弧段失败');
      console.error('[useArcService] 获取活跃弧段失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 刷新所有数据
  const refresh = useCallback(async () => {
    console.log('[useArcService] 刷新所有弧段数据');
    await Promise.all([
      fetchArcs(),
      fetchUpcomingArcs(),
      fetchActiveArcs()
    ]);
  }, [fetchArcs, fetchUpcomingArcs, fetchActiveArcs]);

  return {
    arcs,
    upcomingArcs,
    activeArcs,
    isLoading,
    error,
    fetchArcs,
    fetchUpcomingArcs,
    fetchActiveArcs,
    refresh
  };
};

export default useArcService;
