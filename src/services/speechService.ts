/**
 * 语音播报服务
 * 封装 Web Speech API
 */

import type { SpeechConfig, SpeechMessage, SpeechEvent } from '../types/speech.types';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: SpeechConfig = {
  enabled: true,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  language: 'zh-CN',
  advanceNoticeMinutes: 1
};

/**
 * 语音播报服务类
 */
class SpeechService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: SpeechConfig;
  private eventListeners: Map<string, Set<(event: SpeechEvent) => void>>;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.eventListeners = new Map();
    this.config = { ...DEFAULT_CONFIG };

    // 加载语音列表
    this.loadVoices();

    // 监听语音变化
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * 加载可用语音
   */
  private loadVoices(): void {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
    console.log('[SpeechService] 可用语音数量:', this.voices.length);
  }

  /**
   * 获取中文语音
   */
  private getChineseVoice(): SpeechSynthesisVoice | null {
    return this.voices.find(voice =>
      voice.lang.startsWith('zh') && voice.localService
    ) || this.voices.find(voice => voice.lang.startsWith('zh')) || null;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SpeechConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[SpeechService] 配置已更新:', this.config);
  }

  /**
   * 获取配置
   */
  getConfig(): SpeechConfig {
    return { ...this.config };
  }

  /**
   * 播报文本
   */
  speak(message: SpeechMessage | string): void {
    if (!this.synthesis || !this.config.enabled) return;

    // 停止当前播报
    this.stop();

    const text = typeof message === 'string' ? message : message.text;
    const utterance = new SpeechSynthesisUtterance(text);

    // 配置语音参数
    utterance.volume = this.config.volume;
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.lang = this.config.language;

    // 选择中文语音
    const voice = this.getChineseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // 事件监听
    utterance.onstart = () => this.emit('start', { type: 'start', message: text });
    utterance.onend = () => this.emit('end', { type: 'end', message: text });
    utterance.onerror = (event) => this.emit('error', {
      type: 'error',
      message: `播报失败: ${event.error}`
    });

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  /**
   * 停止播报
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 暂停播报
   */
  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  /**
   * 恢复播报
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * 事件监听
   */
  on(event: string, callback: (event: SpeechEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: (event: SpeechEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: SpeechEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * 检查浏览器支持
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// 导出单例
const speechService = new SpeechService();
export default speechService;
