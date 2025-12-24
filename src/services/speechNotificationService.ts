/**
 * 语音通知服务
 * 负责弧段事件的语音播报逻辑
 */

import type { ArcWithStatus } from '../types/arc.types';
import type { SpeechConfig } from '../types/speech.types';
import speechService from './speechService';

/**
 * 已通知的弧段记录
 */
interface NotifiedArc {
  taskID: number;
  notifiedAt: number;
}

/**
 * 语音通知服务类
 */
class SpeechNotificationService {
  private notifiedArcs: Map<number, number> = new Map();
  private checkInterval: number = 5000; // 5秒检查一次

  /**
   * 检查并播报到期弧段
   * @param arcs 弧段列表
   * @param config 语音配置
   */
  checkAndNotify(arcs: ArcWithStatus[], config: SpeechConfig): void {
    if (!config.enabled || !speechService.isSupported()) return;

    const now = Date.now();
    const advanceMs = config.advanceNoticeMinutes * 60 * 1000;

    arcs.forEach(arc => {
      const arcId = arc.taskID;
      const startTime = new Date(arc.startTime).getTime();
      const timeUntilStart = startTime - now;

      // 检查是否需要播报（在提前通知时间窗口内，且未播报过）
      if (
        timeUntilStart <= advanceMs &&
        timeUntilStart > 0 &&
        !this.notifiedArcs.has(arcId)
      ) {
        this.speakArcIncoming(arc);
        this.notifiedArcs.set(arcId, now);
      }

      // 清理过期的通知记录（弧段开始1分钟后清理）
      if (timeUntilStart < -60000) {
        this.notifiedArcs.delete(arcId);
      }
    });
  }

  /**
   * 播报弧段即将到来
   */
  private speakArcIncoming(arc: ArcWithStatus): void {
    const message = `${arc.satName}卫星即将通过${arc.siteName}信关站`;
    speechService.speak(message);
    console.log('[SpeechNotification] 播报:', message);
  }

  /**
   * 播报弧段开始（可选功能）
   */
  speakArcStart(arc: ArcWithStatus): void {
    const message = `${arc.satName}卫星已进入${arc.siteName}信关站可见范围`;
    speechService.speak(message);
  }

  /**
   * 播报弧段结束（可选功能）
   */
  speakArcEnd(arc: ArcWithStatus): void {
    const message = `${arc.satName}卫星已离开${arc.siteName}信关站可见范围`;
    speechService.speak(message);
  }

  /**
   * 清除所有通知记录
   */
  clearNotifications(): void {
    this.notifiedArcs.clear();
  }

  /**
   * 清除特定弧段的通知记录
   */
  clearNotification(arcId: number): void {
    this.notifiedArcs.delete(arcId);
  }
}

// 导出单例
const speechNotificationService = new SpeechNotificationService();
export default speechNotificationService;
