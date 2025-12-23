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
