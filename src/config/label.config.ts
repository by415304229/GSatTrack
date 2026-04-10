/**
 * 卫星标签配置
 * 集中管理标签显示的默认配置
 */

import type { SatelliteLabelConfig } from '../types/label.types';

/** 默认标签配置 */
export const DEFAULT_LABEL_CONFIG: SatelliteLabelConfig = {
  enabled: true,
  hideOccluded: true,
  fontSize: 14
};

/** localStorage 存储键 */
const LABEL_CONFIG_KEY = 'gsat_label_config';

/** 从 localStorage 加载配置 */
export const loadLabelConfig = (): SatelliteLabelConfig => {
  try {
    const saved = localStorage.getItem(LABEL_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load label config:', e);
  }
  return DEFAULT_LABEL_CONFIG;
};

/** 保存配置到 localStorage */
export const saveLabelConfig = (config: SatelliteLabelConfig): void => {
  try {
    localStorage.setItem(LABEL_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save label config:', e);
  }
};
