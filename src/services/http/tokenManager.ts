/**
 * Token 管理器
 * 负责 JWT Token 的存储、验证和自动登录凭证管理
 */
class TokenManager {
  private static instance: TokenManager;

  // localStorage 键名
  private readonly ACCESS_TOKEN_KEY = 'purest_access_token';
  private readonly REFRESH_TOKEN_KEY = 'purest_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'purest_token_expiry';
  private readonly AUTO_LOGIN_CREDENTIALS_KEY = 'purest_auto_login';

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 存储 Access Token
   */
  setAccessToken(token: string, expiresIn?: number): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
    console.log('[TokenManager] Access Token 已存储');
  }

  /**
   * 获取 Access Token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * 检查 Token 是否过期
   */
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return false;
    const isExpired = Date.now() > parseInt(expiry);
    if (isExpired) {
      console.log('[TokenManager] Token 已过期');
    }
    return isExpired;
  }

  /**
   * 存储 Refresh Token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * 获取 Refresh Token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * 清除所有 Token
   */
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    console.log('[TokenManager] 所有 Token 已清除');
  }

  /**
   * 存储自动登录凭证
   * 使用 Base64 编码存储（生产环境应使用加密）
   */
  setAutoLoginCredentials(username: string, password: string): void {
    const credentials = btoa(`${username}:${password}`);
    localStorage.setItem(this.AUTO_LOGIN_CREDENTIALS_KEY, credentials);
    console.log('[TokenManager] 自动登录凭证已存储');
  }

  /**
   * 获取自动登录凭证
   */
  getAutoLoginCredentials(): { username: string; password: string } | null {
    const credentials = localStorage.getItem(this.AUTO_LOGIN_CREDENTIALS_KEY);
    if (!credentials) return null;

    try {
      const decoded = atob(credentials);
      const [username, password] = decoded.split(':');
      return { username, password };
    } catch (error) {
      console.error('[TokenManager] 解析自动登录凭证失败:', error);
      return null;
    }
  }

  /**
   * 清除自动登录凭证
   */
  clearAutoLoginCredentials(): void {
    localStorage.removeItem(this.AUTO_LOGIN_CREDENTIALS_KEY);
    console.log('[TokenManager] 自动登录凭证已清除');
  }

  /**
   * 检查是否有有效的 Token
   */
  hasValidToken(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired();
  }
}

export default TokenManager;
