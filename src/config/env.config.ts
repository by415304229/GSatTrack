/**
 * 环境变量配置
 * 统一管理应用的环境变量
 */
export const env = {
  // API 配置
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://172.24.28.5:5000/api/v1',

  // 自动登录凭证
  AUTO_LOGIN_USERNAME: import.meta.env.VITE_AUTO_LOGIN_USERNAME || 'admin',
  AUTO_LOGIN_PASSWORD: import.meta.env.VITE_AUTO_LOGIN_PASSWORD || '123456',

  // 轮询间隔（毫秒）
  ARC_POLLING_INTERVAL: Number(import.meta.env.VITE_ARC_POLLING_INTERVAL) || 60000,
  TELEMETRY_POLLING_INTERVAL: Number(import.meta.env.VITE_TELEMETRY_POLLING_INTERVAL) || 30000,

  // 缓存时长（毫秒）
  CACHE_DURATION_ARC: Number(import.meta.env.VITE_CACHE_DURATION_ARC) || 300000,
  CACHE_DURATION_SATELLITE: Number(import.meta.env.VITE_CACHE_DURATION_SATELLITE) || 3600000,
};

export default env;
