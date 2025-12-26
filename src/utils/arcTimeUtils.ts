/**
 * 弧段时间计算工具
 */

import type { ArcSegment } from '../services/types/api.types';
import type { ArcWithStatus, ArcVisualizationConfig } from '../types/arc.types';
import { ArcStatus } from '../types/arc.types';

/**
 * 1分钟的毫秒数
 */
export const ONE_MINUTE_MS = 60 * 1000;

/**
 * 计算弧段状态
 * @param arc 弧段数据
 * @param currentTime 当前时间
 * @returns 带状态的弧段数据
 */
export const calculateArcStatus = (
  arc: ArcSegment,
  currentTime: Date
): ArcWithStatus => {
  const startTime = new Date(arc.startTime);
  const endTime = new Date(arc.endTime);
  const now = currentTime.getTime();

  const timeToStart = startTime.getTime() - now;
  const timeToEnd = endTime.getTime() - now;

  let status: ArcStatus;
  if (now >= startTime.getTime() && now <= endTime.getTime()) {
    status = ArcStatus.ACTIVE;
  } else if (now < startTime.getTime()) {
    status = ArcStatus.UPCOMING;
  } else {
    status = ArcStatus.EXPIRED;
  }

  // 计算进度
  const totalDuration = endTime.getTime() - startTime.getTime();
  const elapsed = now - startTime.getTime();
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

  return {
    ...arc,
    status,
    timeToStart,
    timeToEnd,
    progress
  };
};

/**
 * 按时间排序弧段（即将到来的排前面）
 */
export const sortArcsByTime = (
  arcs: ArcSegment[]
): ArcSegment[] => {
  return [...arcs].sort((a, b) => {
    const aStart = new Date(a.startTime).getTime();
    const bStart = new Date(b.startTime).getTime();
    return aStart - bStart;
  });
};

/**
 * 格式化倒计时为可读文本
 * @param milliseconds 毫秒数
 * @returns 格式化后的文本，如"5分30秒"
 */
export const formatCountdown = (milliseconds: number): string => {
  const absMs = Math.abs(milliseconds);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分`;
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

/**
 * 格式化倒计时为中文描述
 * @param milliseconds 毫秒数
 * @returns 格式化后的文本，如"将于5分30秒后入境"
 */
export const formatArcCountdown = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return '已入境';
  }
  return `将于${formatCountdown(milliseconds)}后入境`;
};

/**
 * 格式化时间范围为可读文本
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 格式化后的时间范围
 */
export const formatTimeRange = (
  startTime: string | Date,
  endTime: string | Date
): string => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
};

/**
 * 格式化倒计时为 mm:ss 格式（紧凑版本）
 * 用于显示距离开始时间的倒计时
 * @param milliseconds 毫秒数
 * @returns 格式化后的文本，如 "05:30" 或 "1h05m"
 */
export const formatCountdownShort = (milliseconds: number): string => {
  const absMs = Math.abs(milliseconds);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60}m`;
  }

  return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
};

/**
 * 计算弧段详细状态（包含1分钟缓冲期）
 * @param arc 弧段数据
 * @param currentTime 当前时间
 * @returns 带详细状态的弧段数据
 */
export const calculateArcDetailedStatus = (
  arc: ArcSegment,
  currentTime: Date
): ArcWithStatus => {
  const startTime = new Date(arc.startTime);
  const endTime = new Date(arc.endTime);
  const now = currentTime.getTime();

  const startMs = startTime.getTime();
  const endMs = endTime.getTime();

  let status: ArcStatus;
  let bufferTimeRemaining: number | undefined;

  // 入境前1分钟内
  if (now >= startMs - ONE_MINUTE_MS && now < startMs) {
    status = ArcStatus.PRE_APPROACH;
    bufferTimeRemaining = startMs - now;
  }
  // 入境中
  else if (now >= startMs && now <= endMs) {
    status = ArcStatus.ACTIVE;
  }
  // 出境后1分钟内
  else if (now > endMs && now <= endMs + ONE_MINUTE_MS) {
    status = ArcStatus.POST_EXIT;
    bufferTimeRemaining = endMs + ONE_MINUTE_MS - now;
  }
  // 即将到来（>1分钟前）
  else if (now < startMs - ONE_MINUTE_MS) {
    status = ArcStatus.UPCOMING;
  }
  // 已过期（>1分钟后）
  else {
    status = ArcStatus.EXPIRED;
  }

  const timeToStart = startMs - now;
  const timeToEnd = endMs - now;

  // 计算进度
  const totalDuration = endMs - startMs;
  const elapsed = now - startMs;
  const progress = Math.max(0, Math.min(1, elapsed / totalDuration));

  return {
    ...arc,
    status,
    timeToStart,
    timeToEnd,
    progress,
    bufferTimeRemaining
  };
};

/**
 * 判断弧段是否应该显示连线
 * @param status 弧段状态
 * @returns 是否显示连线
 */
export const shouldShowArcConnection = (status: ArcStatus): boolean => {
  return [
    ArcStatus.PRE_APPROACH,
    ArcStatus.ACTIVE,
    ArcStatus.POST_EXIT
  ].includes(status);
};

/**
 * 根据状态获取连线颜色
 * @param status 弧段状态
 * @param config 可视化配置
 * @returns 颜色字符串
 */
export const getArcConnectionColor = (
  status: ArcStatus,
  config: ArcVisualizationConfig
): string => {
  switch (status) {
    case ArcStatus.ACTIVE:
      return config.activeColor;
    case ArcStatus.PRE_APPROACH:
      return config.preApproachColor || 'rgba(128, 128, 128, 0.5)';
    case ArcStatus.POST_EXIT:
      return config.postExitColor || 'rgba(128, 128, 128, 0.5)';
    default:
      return 'transparent';
  }
};

/**
 * 格式化剩余时间为 mm:ss 格式（紧凑版本）
 * 用于显示弧段结束倒计时
 * @param timeToEnd 距离结束的毫秒数
 * @returns 格式化后的文本，如 "05:30" 或 "1h05m"
 */
export const formatRemainingTimeShort = (timeToEnd: number): string => {
  const absMs = Math.max(0, timeToEnd);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60}m`;
  }

  return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
};
