/**
 * 卫星标签配置类型定义
 */

export interface SatelliteLabelConfig {
  /** 是否启用卫星标签显示 */
  enabled: boolean;
  /** 被遮挡时隐藏标签 */
  hideOccluded: boolean;
  /** 标签字体大小 (px) */
  fontSize: number;
}
