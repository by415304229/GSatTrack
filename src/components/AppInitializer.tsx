/**
 * 应用初始化组件
 * 负责应用启动时的自动登录和初始化工作
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useArcService } from '../hooks/useArcService';
import satelliteApiService from '../services/satelliteApiService';
import { env } from '../config/env.config';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * 应用初始化组件
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { autoLogin, isAuthenticated } = useAuth();
  const { fetchUpcomingArcs } = useArcService();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<string>('');
  const isInitializing = useRef(false);
  const pollingTimerRef = useRef<number | null>(null);

  // 启动轮询
  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      return; // 已经在轮询中
    }

    console.log('[AppInitializer] 启动弧段数据轮询，间隔:', env.ARC_POLLING_INTERVAL);

    // 立即执行一次（初始化时已经执行过了，所以这里可以跳过）
    // 然后定时执行
    pollingTimerRef.current = window.setInterval(async () => {
      console.log('[AppInitializer] 定时轮询弧段数据...');
      try {
        await fetchUpcomingArcs();
      } catch (error) {
        console.error('[AppInitializer] 弧段数据轮询失败:', error);
      }
    }, env.ARC_POLLING_INTERVAL);
  }, [fetchUpcomingArcs]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
      console.log('[AppInitializer] 停止弧段数据轮询');
    }
  }, []);

  // 组件卸载时停止轮询
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    // 防止重复初始化
    if (isInitializing.current || isInitialized) {
      return;
    }

    const initialize = async () => {
      // 标记开始初始化
      isInitializing.current = true;
      console.log('[AppInitializer] 开始应用初始化...');

      try {
        // 如果已认证，直接完成初始化
        if (isAuthenticated) {
          console.log('[AppInitializer] 已有有效认证，跳过登录');
          await loadData();
          return;
        }

        // 尝试自动登录
        console.log('[AppInitializer] 尝试自动登录...');
        setInitStatus('正在登录...');
        const loginSuccess = await autoLogin();

        if (!loginSuccess) {
          console.error('[AppInitializer] 自动登录失败');
          setInitError('自动登录失败，请检查网络连接或 API 配置');
          return;
        }

        console.log('[AppInitializer] 自动登录成功');
        // 登录成功后加载数据
        await loadData();

      } catch (error) {
        console.error('[AppInitializer] 应用初始化失败:', error);
        setInitError(error instanceof Error ? error.message : '未知错误');
      } finally {
        setIsInitialized(true);
        isInitializing.current = false;
      }
    };

    const loadData = async () => {
      try {
        // 加载卫星数据
        setInitStatus('正在加载卫星数据...');
        console.log('[AppInitializer] 加载卫星数据...');
        const satellites = await satelliteApiService.fetchSatellites();
        console.log('[AppInitializer] 卫星数据加载完成，数量:', satellites.length);

        // 加载弧段数据
        setInitStatus('正在加载弧段数据...');
        console.log('[AppInitializer] 加载弧段数据...');
        await fetchUpcomingArcs();
        console.log('[AppInitializer] 弧段数据加载完成');

        setInitStatus('');

        // 数据加载完成后启动轮询
        if (!initError) {
          startPolling();
        }
      } catch (error) {
        console.error('[AppInitializer] 数据加载失败:', error);
        // 数据加载失败不阻止应用启动
        console.warn('[AppInitializer] 数据加载失败，但应用将继续运行');
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPolling, initError]); // 添加 startPolling 和 initError 依赖

  // 显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono text-lg">系统初始化中...</p>
          {initStatus && <p className="text-slate-400 text-sm mt-2">{initStatus}</p>}
          <p className="text-slate-500 text-xs mt-4">正在连接 PurestAdmin 服务</p>
        </div>
      </div>
    );
  }

  // 显示初始化错误
  if (initError) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-8">
        <div className="bg-red-950/20 border border-red-800/50 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
            <h2 className="text-xl font-bold text-red-400">初始化失败</h2>
          </div>
          <p className="text-red-300 mb-2">无法连接到 PurestAdmin 服务</p>
          <p className="text-slate-400 text-sm mb-4">{initError}</p>
          <div className="text-slate-500 text-xs space-y-1">
            <p>请检查：</p>
            <p>• API 服务地址是否正确</p>
            <p>• 网络连接是否正常</p>
            <p>• 浏览器控制台获取详细错误信息</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
