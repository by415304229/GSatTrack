/**
 * 语音播报相关类型定义
 */

/**
 * 语音播报配置
 */
export interface SpeechConfig {
  enabled: boolean;           // 是否启用语音播报
  volume: number;             // 音量（0-1）
  rate: number;               // 语速（0.1-10）
  pitch: number;              // 音调（0-2）
  language: string;           // 语言（zh-CN, en-US）
  voiceName?: string;         // 指定语音名称
  advanceNoticeMinutes: number; // 提前播报时间（分钟）
}

/**
 * 播报消息类型
 */
export interface SpeechMessage {
  text: string;
  priority?: 'low' | 'normal' | 'high';
  timestamp?: number;
}

/**
 * 语音事件
 */
export interface SpeechEvent {
  type: 'start' | 'end' | 'error' | 'boundary';
  message?: string;
}
