/**
 * 轮询服务 Hook
 * 提供定时轮询能力
 */
import { useEffect, useRef, useCallback } from 'react';

type PollingFunction = () => Promise<void>;

interface UsePollingServiceOptions {
  interval: number;        // 轮询间隔（毫秒）
  immediate?: boolean;     // 是否立即执行第一次
  enabled?: boolean;       // 是否启用轮询
}

interface UsePollingServiceResult {
  startPolling: () => void;
  stopPolling: () => void;
  restartPolling: () => void;
  isPolling: boolean;
}

/**
 * 轮询服务 Hook
 * 用于定时轮询 API 数据
 */
export const usePollingService = (
  pollingFn: PollingFunction,
  options: UsePollingServiceOptions
): UsePollingServiceResult => {
  const { interval, immediate = true, enabled = true } = options;

  const intervalRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (isPollingRef.current || !enabled) {
      console.log('[usePollingService] 轮询已在运行或未启用');
      return;
    }

    console.log('[usePollingService] 启动轮询，间隔:', interval);
    isPollingRef.current = true;

    // 立即执行一次
    if (immediate) {
      pollingFn().catch(console.error);
    }

    // 设置定时器
    intervalRef.current = window.setInterval(() => {
      pollingFn().catch(console.error);
    }, interval);
  }, [pollingFn, interval, immediate, enabled]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
    console.log('[usePollingService] 停止轮询');
  }, []);

  // 重启轮询
  const restartPolling = useCallback(() => {
    console.log('[usePollingService] 重启轮询');
    stopPolling();
    startPolling();
  }, [stopPolling, startPolling]);

  // 组件挂载时启动，卸载时停止
  useEffect(() => {
    if (enabled) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    restartPolling,
    isPolling: isPollingRef.current
  };
};

/**
 * 弧段数据轮询 Hook - 预配置版本
 * @param pollingFn 轮询函数
 * @param intervalMs 轮询间隔（毫秒），默认 60 秒
 */
export const useArcPolling = (
  pollingFn: PollingFunction,
  intervalMs: number = 60000
) => {
  return usePollingService(pollingFn, {
    interval: intervalMs,
    immediate: true,
    enabled: true
  });
};

/**
 * 遥测数据轮询 Hook - 预配置版本
 * @param pollingFn 轮询函数
 * @param intervalMs 轮询间隔（毫秒），默认 30 秒
 */
export const useTelemetryPolling = (
  pollingFn: PollingFunction,
  intervalMs: number = 30000
) => {
  return usePollingService(pollingFn, {
    interval: intervalMs,
    immediate: true,
    enabled: true
  });
};

export default usePollingService;
