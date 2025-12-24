/**
 * 语音播报 Hook
 * 封装语音播报功能，提供配置管理
 */

import { useEffect, useState, useCallback } from 'react';
import speechService from '../services/speechService';
import type { SpeechConfig } from '../types/speech.types';
import { loadSpeechConfig, saveSpeechConfig } from '../utils/storage';

/**
 * 默认语音配置
 */
const DEFAULT_CONFIG: SpeechConfig = {
  enabled: true,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  language: 'zh-CN',
  advanceNoticeMinutes: 1
};

interface UseSpeechSynthesisResult {
  config: SpeechConfig;
  isSupported: boolean;
  isSpeaking: boolean;
  updateConfig: (newConfig: Partial<SpeechConfig>) => void;
  speak: (text: string) => void;
  stop: () => void;
  testSpeech: () => void;
}

/**
 * 语音播报 Hook
 */
export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const [config, setConfig] = useState<SpeechConfig>(() => {
    // 从本地存储加载配置
    const saved = loadSpeechConfig() as SpeechConfig | null;
    return saved ? { ...DEFAULT_CONFIG, ...saved } : DEFAULT_CONFIG;
  });

  const [isSupported, setIsSupported] = useState(speechService.isSupported());
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 初始化时设置配置到服务
  useEffect(() => {
    speechService.updateConfig(config);
  }, []);

  // 更新配置
  const updateConfig = useCallback((newConfig: Partial<SpeechConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    speechService.updateConfig(updated);
    saveSpeechConfig(updated);
  }, [config]);

  // 播报
  const speak = useCallback((text: string) => {
    if (config.enabled && isSupported) {
      speechService.speak(text);
    }
  }, [config.enabled, isSupported]);

  // 停止
  const stop = useCallback(() => {
    speechService.stop();
  }, []);

  // 测试语音
  const testSpeech = useCallback(() => {
    speak('语音播报测试');
  }, [speak]);

  // 监听播报状态
  useEffect(() => {
    const handleStart = () => setIsSpeaking(true);
    const handleEnd = () => setIsSpeaking(false);
    const handleError = () => setIsSpeaking(false);

    speechService.on('start', handleStart);
    speechService.on('end', handleEnd);
    speechService.on('error', handleError);

    return () => {
      speechService.off('start', handleStart);
      speechService.off('end', handleEnd);
      speechService.off('error', handleError);
    };
  }, []);

  return {
    config,
    isSupported,
    isSpeaking,
    updateConfig,
    speak,
    stop,
    testSpeech
  };
};

export default useSpeechSynthesis;
