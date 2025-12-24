/**
 * 本地存储工具
 * 用于持久化用户配置
 */

const STORAGE_KEYS = {
  SPEECH_CONFIG: 'gsat_speech_config',
  ARC_VISIBILITY_CONFIG: 'gsat_arc_visibility_config'
} as const;

/**
 * 保存语音配置
 */
export const saveSpeechConfig = (config: unknown): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SPEECH_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('[Storage] 保存语音配置失败:', error);
  }
};

/**
 * 加载语音配置
 */
export const loadSpeechConfig = (): unknown | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SPEECH_CONFIG);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Storage] 加载语音配置失败:', error);
    return null;
  }
};

/**
 * 保存弧段可见性配置
 */
export const saveArcVisibilityConfig = (config: unknown): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ARC_VISIBILITY_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('[Storage] 保存弧段配置失败:', error);
  }
};

/**
 * 加载弧段可见性配置
 */
export const loadArcVisibilityConfig = (): unknown | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARC_VISIBILITY_CONFIG);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Storage] 加载弧段配置失败:', error);
    return null;
  }
};
