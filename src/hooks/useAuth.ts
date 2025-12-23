/**
 * 认证管理 Hook
 * 提供登录、登出和认证状态管理
 */
import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

interface UseAuthResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  autoLogin: (forceRefresh?: boolean) => Promise<boolean>;
}

/**
 * 认证管理 Hook
 */
export const useAuth = (): UseAuthResult => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化检查认证状态
  useEffect(() => {
    const checkAuth = () => {
      console.log('[useAuth] 检查认证状态...');
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
      console.log('[useAuth] 认证状态:', authenticated);
    };

    checkAuth();
  }, []);

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    console.log('[useAuth] 执行登录:', username);
    setError(null);
    setIsLoading(true);

    try {
      await authService.login(username, password);
      setIsAuthenticated(true);
      console.log('[useAuth] 登录成功');
    } catch (err: any) {
      const errorMessage = err.message || '登录失败';
      setError(errorMessage);
      setIsAuthenticated(false);
      console.error('[useAuth] 登录失败:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    console.log('[useAuth] 执行登出');
    setError(null);
    setIsLoading(true);

    try {
      await authService.logout();
      setIsAuthenticated(false);
      console.log('[useAuth] 登出成功');
    } catch (err: any) {
      setError(err.message || '登出失败');
      console.error('[useAuth] 登出失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 自动登录
  const autoLogin = useCallback(async (forceRefresh: boolean = false) => {
    console.log('[useAuth] 执行自动登录', { forceRefresh });
    setError(null);
    setIsLoading(true);

    try {
      const success = await authService.autoLogin(forceRefresh);
      setIsAuthenticated(success);
      console.log('[useAuth] 自动登录结果:', success);
      return success;
    } catch (err: any) {
      setError(err.message || '自动登录失败');
      setIsAuthenticated(false);
      console.error('[useAuth] 自动登录失败:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    autoLogin
  };
};

export default useAuth;
