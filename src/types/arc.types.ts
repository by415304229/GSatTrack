/**
 * 弧段相关类型定义
 */

import type { ArcSegment } from '../services/types/api.types';

/**
 * 弧段状态枚举
 */
export enum ArcStatus {
  UPCOMING = 'upcoming',    // 即将到来
  ACTIVE = 'active',        // 活跃中
  EXPIRED = 'expired'       // 已过期
}

/**
 * 带状态的弧段数据
 */
export interface ArcWithStatus extends ArcSegment {
  status: ArcStatus;
  timeToStart: number;      // 距离开始的毫秒数
  timeToEnd: number;        // 距离结束的毫秒数
  progress: number;         // 弧段进度（0-1）
}

/**
 * 弧段可视化配置
 */
export interface ArcVisualizationConfig {
  enabled: boolean;           // 是否显示连线
  showActiveOnly: boolean;    // 仅显示活跃弧段
  activeColor: string;        // 活跃弧段颜色（RGBA）
  upcomingColor: string;      // 即将到来弧段颜色（RGBA）
  lineWidth: number;          // 连线宽度
  animate: boolean;           // 是否动画效果
  pulseSpeed: number;         // 脉冲速度
}

/**
 * 弧段预报配置
 */
export interface ArcForecastConfig {
  lookAheadHours: number;   // 预报时间范围（小时）
  maxDisplayCount: number;  // 最大显示数量
  autoRefresh: boolean;     // 自动刷新
}
