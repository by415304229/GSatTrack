/**
 * Vite 环境变量类型定义
 */
interface ImportMetaEnv {
  // API 配置
  readonly VITE_API_BASE_URL: string

  // 自动登录凭证
  readonly VITE_AUTO_LOGIN_USERNAME: string
  readonly VITE_AUTO_LOGIN_PASSWORD: string

  // 轮询间隔配置（毫秒）
  readonly VITE_ARC_POLLING_INTERVAL: string
  readonly VITE_TELEMETRY_POLLING_INTERVAL: string

  // 缓存配置
  readonly VITE_CACHE_DURATION_ARC: string
  readonly VITE_CACHE_DURATION_SATELLITE: string

  // 其他环境变量
  readonly VITE_DEBUG_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
