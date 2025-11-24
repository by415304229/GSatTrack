import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface RouteGuardProps {
  children: React.ReactNode;
  authRequired?: boolean;
  permissions?: string[];
  fallback?: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  authRequired = false,
  permissions = [],
  fallback = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!authRequired && permissions.length === 0) {
        setIsAuthorized(true);
        return;
      }

      setIsLoading(true);
      try {
        // 模拟权限检查
        // 实际项目中这里应该调用真实的权限验证API
        const hasPermission = await simulatePermissionCheck(authRequired, permissions);
        
        if (!hasPermission) {
          setIsAuthorized(false);
          // 可以重定向到登录页或无权限页
          if (authRequired) {
            navigate('/login', { replace: true });
          } else {
            navigate('/unauthorized', { replace: true });
          }
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('权限检查失败:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [location.pathname, authRequired, permissions, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 font-mono text-sm">验证访问权限...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex items-center justify-center p-8">
        <div className="bg-red-950/20 border border-red-800/50 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
            <h2 className="text-xl font-bold text-red-400">访问被拒绝</h2>
          </div>
          <p className="text-red-300 mb-4">
            您没有权限访问此页面。请联系系统管理员获取相应权限。
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// 模拟权限检查函数
async function simulatePermissionCheck(authRequired: boolean, permissions: string[]): Promise<boolean> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟权限检查逻辑
  if (authRequired) {
    // 检查是否已登录（模拟）
    const isAuthenticated = localStorage.getItem('auth_token') !== null;
    if (!isAuthenticated) {
      return false;
    }
  }

  if (permissions.length > 0) {
    // 检查用户权限（模拟）
    const userPermissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
    const hasRequiredPermission = permissions.some(permission => 
      userPermissions.includes(permission)
    );
    if (!hasRequiredPermission) {
      return false;
    }
  }

  return true;
}

export default RouteGuard;