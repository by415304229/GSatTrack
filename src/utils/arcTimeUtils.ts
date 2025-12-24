/**
 * 弧段时间计算工具
 */

import type { ArcSegment } from '../services/types/api.types';
import type { ArcWithStatus } from '../types/arc.types';
import { ArcStatus } from '../types/arc.types';

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
