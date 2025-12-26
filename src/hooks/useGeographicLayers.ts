/**
 * 地理图层管理Hook
 * 管理国境线和SAA区域的加载和状态
 */

import { useState, useEffect, useCallback } from 'react';
import type { GeographicBoundary, SAABoundary, SAAEntryEvent, GeographicLayerConfig } from '../types/geographic.types';
import type { SatellitePos } from '../types';
import geoDataService from '../services/geographic/geoDataService';
import saaDataService from '../services/geographic/saaDataService';
import { GEOGRAPHIC_CONFIG } from '../config/geographic.config';

interface UseGeographicLayersResult {
  chinaBorder: GeographicBoundary | null;
  saaBoundary: SAABoundary | null;
  saaEvents: SAAEntryEvent[];
  config: GeographicLayerConfig;
  loading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<GeographicLayerConfig>) => void;
  refresh: () => Promise<void>;
}

/**
 * 地理图层管理Hook
 */
export const useGeographicLayers = (
  satellites: SatellitePos[]
): UseGeographicLayersResult => {
  const [chinaBorder, setChinaBorder] = useState<GeographicBoundary | null>(null);
  const [saaBoundary, setSaaBoundary] = useState<SAABoundary | null>(null);
  const [saaEvents, setSaaEvents] = useState<SAAEntryEvent[]>([]);
  const [config, setConfig] = useState<GeographicLayerConfig>(GEOGRAPHIC_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [border, saa] = await Promise.all([
        geoDataService.loadChinaBorder(),
        saaDataService.loadSAABoundary()
      ]);

      setChinaBorder(border);
      setSaaBoundary(saa);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载地理数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 检测SAA事件
  useEffect(() => {
    if (!config.monitorSAAEntry || !saaBoundary) {
      setSaaEvents([]);
      return;
    }

    const events = saaDataService.detectSAAEntries(satellites);
    setSaaEvents(events);
  }, [satellites, config.monitorSAAEntry, saaBoundary]);

  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<GeographicLayerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    chinaBorder,
    saaBoundary,
    saaEvents,
    config,
    loading,
    error,
    updateConfig,
    refresh: loadData
  };
};
