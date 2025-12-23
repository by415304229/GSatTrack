/**
 * 认证服务
 * 负责用户登录、登出和 Token 管理
 */
import { getHttpClient } from './http/httpClient';
import type { LoginResponse } from './types/api.types';
import TokenManager from './http/tokenManager';
import { env } from '../config/env.config';

class AuthService {
  private httpClient = getHttpClient();
  private tokenManager = TokenManager.getInstance();

  /**
   * 用户登录
   * @param account 账号
   * @param password 密码
   * @returns 登录响应数据
   */
  async login(account: string, password: string): Promise<LoginResponse> {
    console.log('[AuthService] 开始登录:', account);
    console.log('[AuthService] 请求端点: /auth/login');
    console.log('[AuthService] 完整 URL:', `${env.API_BASE_URL}/auth/login`);

    try {
      // 使用 postWithHeaders 获取响应头（Token 在响应头中）
      const response = await this.httpClient.postWithHeaders<LoginResponse>(
        '/auth/login',
        { account, password },
        { skipAuth: true } // 登录请求不需要 Token
      );

      console.log('[AuthService] 登录响应数据:', response.data);

      // 从响应头获取 Token（小写 accesstoken）
      const accessToken = response.headers.get('accesstoken');

      if (!accessToken) {
        throw new Error('登录失败：未获取到 Token');
      }

      // 存储 Token（默认 24 小时有效期）
      this.tokenManager.setAccessToken(accessToken, 86400);

      // 存储自动登录凭证
      this.tokenManager.setAutoLoginCredentials(account, password);

      console.log('[AuthService] 登录成功，用户:', response.data.name);
      return response.data;
    } catch (error: any) {
      console.error('[AuthService] 登录失败:', error);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    console.log('[AuthService] 用户登出');

    // 清除 Token
    this.tokenManager.clearTokens();

    // 可选：调用后端登出接口
    // await this.httpClient.post('/auth/logout', {});
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const hasValidToken = this.tokenManager.hasValidToken();
    console.log('[AuthService] 认证状态:', hasValidToken);
    return hasValidToken;
  }

  /**
   * 自动登录
   * @param forceRefresh 是否强制刷新token（忽略本地token状态）
   * @returns 登录是否成功
   */
  async autoLogin(forceRefresh: boolean = false): Promise<boolean> {
    console.log('[AuthService] 尝试自动登录...', { forceRefresh });

    // 如果不强制刷新，且已有有效 Token，直接返回成功
    if (!forceRefresh && this.isAuthenticated()) {
      console.log('[AuthService] 已有有效 Token，无需重新登录');
      return true;
    }

    // 尝试从存储的凭证登录
    const credentials = this.tokenManager.getAutoLoginCredentials();

    // 如果没有存储的凭证，使用环境变量中的凭证
    const account = credentials?.username || env.AUTO_LOGIN_USERNAME;
    const password = credentials?.password || env.AUTO_LOGIN_PASSWORD;

    try {
      await this.login(account, password);
      console.log('[AuthService] 自动登录成功');
      return true;
    } catch (error) {
      console.error('[AuthService] 自动登录失败:', error);
      return false;
    }
  }

  /**
   * 设置自动登录凭证
   */
  enableAutoLogin(account: string, password: string): void {
    this.tokenManager.setAutoLoginCredentials(account, password);
    console.log('[AuthService] 自动登录已启用');
  }

  /**
   * 禁用自动登录
   */
  disableAutoLogin(): void {
    this.tokenManager.clearAutoLoginCredentials();
    console.log('[AuthService] 自动登录已禁用');
  }
}

// 导出单例
const authService = new AuthService();
export default authService;
