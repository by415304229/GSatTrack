/**
 * 弧段监控 Hook
 * 结合弧段数据和实时状态计算
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import useArcService from './useArcService';
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

  // 获取弧段数据
  const { upcomingArcs: rawUpcoming, fetchUpcomingArcs, isLoading, error } = useArcService();

  // 处理后的弧段数据
  const [processedArcs, setProcessedArcs] = useState<{
    upcoming: ArcWithStatus[];
    active: ArcWithStatus[];
    display: ArcWithStatus[];
  }>({ upcoming: [], active: [], display: [] });

  // 使用 ref 记录上次更新时间，避免频繁更新
  const lastUpdateTime = useRef<number>(0);
  const UPDATE_INTERVAL = 1000; // 每秒更新一次状态

  // 刷新弧段数据
  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchUpcomingArcs(undefined, lookAheadHours);
  }, [enabled, lookAheadHours, fetchUpcomingArcs]);

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
        return;
      }
      lastUpdateTime.current = now.getTime();

      const sortedArcs = sortArcsByTime(rawUpcoming);

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
    };

    updateArcStatus();

    // 每秒更新一次状态
    const interval = setInterval(updateArcStatus, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [rawUpcoming, maxDisplayCount]);

  return {
    upcomingArcs: processedArcs.upcoming,
    activeArcs: processedArcs.active,
    displayArcs: processedArcs.display,
    isLoading,
    error,
    refresh
  };
};

export default useArcMonitor;
