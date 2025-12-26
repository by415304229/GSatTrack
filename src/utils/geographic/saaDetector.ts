/**
 * SAA进入检测工具
 * 监控卫星进入SAA区域
 */

import type { SAAEntryEvent } from '../../types/geographic.types';
import type { SatellitePos } from '../../types';

/**
 * SAA区域边界定义
 */
const SAA_BOUNDS = {
  latMin: -40,
  latMax: -5,
  lonMin: -80,
  lonMax: 0
};

/**
 * 判断单个卫星是否在SAA区域内
 */
export function isSatelliteInSAA(satellite: SatellitePos): boolean {
  const { lat, lon } = satellite;

  return (
    lat >= SAA_BOUNDS.latMin &&
    lat <= SAA_BOUNDS.latMax &&
    lon >= SAA_BOUNDS.lonMin &&
    lon <= SAA_BOUNDS.lonMax
  );
}

/**
 * 检测多个卫星的SAA进入事件
 */
export function detectSAAEntries(satellites: SatellitePos[]): SAAEntryEvent[] {
  const events: SAAEntryEvent[] = [];

  for (const satellite of satellites) {
    if (isSatelliteInSAA(satellite)) {
      events.push({
        satelliteId: satellite.id,
        satelliteName: satellite.name,
        entryTime: new Date(),
        position: {
          lat: satellite.lat,
          lon: satellite.lon,
          alt: satellite.alt || 0
        }
      });
    }
  }

  return events;
}

/**
 * 判断点是否在SAA区域内
 */
export function isPointInSAA(lat: number, lon: number): boolean {
  return (
    lat >= SAA_BOUNDS.latMin &&
    lat <= SAA_BOUNDS.latMax &&
    lon >= SAA_BOUNDS.lonMin &&
    lon <= SAA_BOUNDS.lonMax
  );
}

/**
 * 获取SAA区域中心点
 */
export function getSAACenter(): { lat: number; lon: number } {
  return {
    lat: (SAA_BOUNDS.latMin + SAA_BOUNDS.latMax) / 2,
    lon: (SAA_BOUNDS.lonMin + SAA_BOUNDS.lonMax) / 2
  };
}

/**
 * 获取SAA区域边界
 */
export function getSAABounds(): typeof SAA_BOUNDS {
  return SAA_BOUNDS;
}
