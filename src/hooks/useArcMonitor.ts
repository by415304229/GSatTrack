/**
 * 弧段监控 Hook
 * 结合弧段数据和实时状态计算
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import arcService from '../services/arcService';
import type { ArcSegment } from '../services/types/api.types';
import type { ArcWithStatus } from '../types/arc.types';
import { ArcStatus } from '../types/arc.types';
import { calculateArcStatus, sortArcsByTime } from '../utils/arcTimeUtils';

interface UseArcMonitorOptions {
  lookAheadHours?: number;
  maxDisplayCount?: number;
  enabled?: boolean;
}

interface UseArcMonitorResult {
  upcomingArcs: ArcWithStatus[];
  activeArcs: ArcWithStatus[];
  displayArcs: ArcWithStatus[];  // 用于预报面板显示的弧段
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * 弧段监控 Hook
 * 获取弧段数据并计算实时状态（基于系统时间）
 */
export const useArcMonitor = (
  options: UseArcMonitorOptions = {}
): UseArcMonitorResult => {
  const { lookAheadHours = 24, maxDisplayCount = 4, enabled = true } = options;

  // 原始弧段数据
  const [rawArcs, setRawArcs] = useState<ArcSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理后的弧段数据
  const [processedArcs, setProcessedArcs] = useState<{
    upcoming: ArcWithStatus[];
    active: ArcWithStatus[];
    display: ArcWithStatus[];
  }>({ upcoming: [], active: [], display: [] });

  // 使用 ref 记录上次更新时间，避免频繁更新
  const lastUpdateTime = useRef<number>(0);
  const UPDATE_INTERVAL = 200; // 状态更新间隔（ms），降低到200ms使倒计时更流畅
  const rafIdRef = useRef<number | null>(null); // 存储 requestAnimationFrame ID

  // 刷新弧段数据
  const refresh = useCallback(async () => {
    if (!enabled) return;

    // 首次加载显示 loading，后台刷新使用 isRefreshing
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const arcs = await arcService.fetchUpcomingArcs(undefined, lookAheadHours);
      setRawArcs(arcs);
    } catch (err: any) {
      setError(err.message || '获取弧段数据失败');
      console.error('[useArcMonitor] 获取弧段数据失败:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [enabled, lookAheadHours, isInitialLoad]);

  // 初始加载
  useEffect(() => {
    refresh();

    // 设置定时刷新（每60秒）
    if (enabled) {
      const interval = setInterval(() => {
        refresh();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [enabled, refresh]);

  // 实时更新弧段状态（基于系统时间）
  useEffect(() => {
    const updateArcStatus = () => {
      const now = new Date();

      // 限制更新频率
      if (now.getTime() - lastUpdateTime.current < UPDATE_INTERVAL) {
        // 继续下一帧
        rafIdRef.current = requestAnimationFrame(updateArcStatus);
        return;
      }
      lastUpdateTime.current = now.getTime();

      const sortedArcs = sortArcsByTime(rawArcs);

      const processed = sortedArcs.reduce((acc, arc) => {
        const withStatus = calculateArcStatus(arc, now);

        if (withStatus.status === ArcStatus.ACTIVE) {
          acc.active.push(withStatus);
          acc.display.push(withStatus);
        } else if (withStatus.status === ArcStatus.UPCOMING) {
          acc.upcoming.push(withStatus);
          // 只显示即将到来的弧段（最多4条）
          if (acc.display.length < maxDisplayCount) {
            acc.display.push(withStatus);
          }
        }

        return acc;
      }, {
        upcoming: [] as ArcWithStatus[],
        active: [] as ArcWithStatus[],
        display: [] as ArcWithStatus[]
      });

      setProcessedArcs(processed);

      // 继续下一帧
      rafIdRef.current = requestAnimationFrame(updateArcStatus);
    };

    // 启动动画帧循环
    rafIdRef.current = requestAnimationFrame(updateArcStatus);

    // 清理函数
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [rawArcs, maxDisplayCount]);

  return {
    upcomingArcs: processedArcs.upcoming,
    activeArcs: processedArcs.active,
    displayArcs: processedArcs.display,
    isLoading,
    isRefreshing,
    error,
    refresh
  };
};

export default useArcMonitor;
