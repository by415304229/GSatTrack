/**
 * HTTP 客户端
 * 统一的 fetch 封装，支持请求拦截、错误处理、超时控制
 */
import TokenManager from './tokenManager';

/**
 * HTTP 请求配置
 */
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  skipAuth?: boolean;  // 跳过 Token 认证
  returnHeaders?: boolean;  // 是否返回响应头
  skipRetry?: boolean;  // 跳过401自动重试
}

/**
 * 等待队列中的请求
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  endpoint: string;
  config: RequestConfig;
}

/**
 * HTTP 响应（包含响应头）
 */
interface HttpResponse<T = any> {
  data: T;
  headers: Headers;
}

/**
 * HTTP 客户端类
 */
class HttpClient {
  private baseURL: string;
  private defaultTimeout: number = 30000;
  private tokenManager: TokenManager;
  private isRefreshing: boolean = false;  // 是否正在刷新token
  private pendingRequests: PendingRequest[] = [];  // 等待队列

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.tokenManager = TokenManager.getInstance();
  }

  /**
   * 核心请求方法
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      skipAuth = false,
      returnHeaders = false
    } = config;

    // 构建完整 URL
    const url = `${this.baseURL}${endpoint}`;

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 添加认证 Token
    if (!skipAuth) {
      const token = this.tokenManager.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // 使用 AbortController 实现超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`[HttpClient] ${method} ${url}`, body ? { body } : '');

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok) {
        // 处理401未授权错误
        if (response.status === 401 && !skipAuth && !config.skipRetry) {
          console.log('[HttpClient] 收到401响应，尝试重新认证...');
          return this.handle401Error(endpoint, config);
        }

        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error(`[HttpClient] 请求失败:`, response.status, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // 如果需要返回响应头（用于获取 Token）
      if (returnHeaders) {
        console.log(`[HttpClient] 响应成功（含响应头）:`, data);
        // 获取 accesstoken 响应头（小写）
        const accessToken = response.headers.get('accesstoken');
        if (accessToken) {
          console.log('[HttpClient] 从响应头获取到 Token:', accessToken.substring(0, 20) + '...');
        }
        return { data, headers: response.headers } as T;
      }

      console.log(`[HttpClient] 响应成功:`, data);
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error('[HttpClient] 请求超时');
        throw new Error('请求超时，请稍后重试');
      }

      if (error.message === 'Failed to fetch') {
        console.error('[HttpClient] 网络连接失败');
        throw new Error('网络连接失败，请检查网络设置');
      }

      console.error('[HttpClient] 请求错误:', error);
      throw error;
    }
  }

  /**
   * 处理401错误
   * 尝试重新认证并重试请求
   */
  private async handle401Error<T>(endpoint: string, config: RequestConfig): Promise<T> {
    // 如果已经在刷新token，将请求加入队列
    if (this.isRefreshing) {
      console.log('[HttpClient] Token刷新中，请求加入队列...');
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject, endpoint, config });
      });
    }

    // 开始刷新token
    this.isRefreshing = true;
    console.log('[HttpClient] 开始重新认证...');

    try {
      // 动态导入authService避免循环依赖
      const { default: authService } = await import('../authService');
      // 强制刷新token，忽略本地token状态
      const loginSuccess = await authService.autoLogin(true);

      if (!loginSuccess) {
        throw new Error('重新认证失败');
      }

      console.log('[HttpClient] 重新认证成功，重试原请求...');

      // 认证成功，重试原请求和所有排队的请求
      const originalRequest = this.request<T>(endpoint, config);
      const queuedRequests = this.pendingRequests.map(req =>
        this.request(req.endpoint, req.config)
          .then(req.resolve)
          .catch(req.reject)
      );

      // 清空队列
      this.pendingRequests = [];

      // 等待所有请求完成
      await Promise.all(queuedRequests);

      return originalRequest;
    } catch (error) {
      console.error('[HttpClient] 重新认证失败:', error);

      // 认证失败，拒绝所有排队的请求
      this.pendingRequests.forEach(req => {
        req.reject(error);
      });
      this.pendingRequests = [];

      throw new Error('认证失败，请重新登录');
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * GET 请求
   */
  get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body' | 'returnHeaders'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST 请求
   */
  post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'returnHeaders'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * POST 请求（返回响应头）
   */
  postWithHeaders<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'returnHeaders'>): Promise<HttpResponse<T>> {
    return this.request<HttpResponse<T>>(endpoint, { ...config, method: 'POST', body, returnHeaders: true });
  }

  /**
   * PUT 请求
   */
  put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'returnHeaders'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * DELETE 请求
   */
  delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body' | 'returnHeaders'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// 单例模式
let httpClientInstance: HttpClient | null = null;

/**
 * 获取 HTTP 客户端单例
 */
export const getHttpClient = (): HttpClient => {
  if (!httpClientInstance) {
    // 从环境变量获取 API 基础 URL
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://172.24.28.5:5000/api/v1';
    httpClientInstance = new HttpClient(baseURL);
    console.log('[HttpClient] 初始化，baseURL:', baseURL);
  }
  return httpClientInstance;
};

export type { RequestConfig, HttpResponse };
