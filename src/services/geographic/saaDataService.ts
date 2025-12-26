/**
 * SAA（南大西洋地磁异常区）数据服务
 * 提供SAA边界数据和卫星进入检测
 */

import type { SAABoundary, SAAEntryEvent } from '../../types/geographic.types';
import type { SatellitePos } from '../../types';
import { SAA_DEFINITION, RENDER_CONFIG } from '../../config/geographic.config';

class SAADataService {
  private saaBoundary: SAABoundary | null = null;

  /**
   * 加载SAA边界数据
   * 注意：SAA边界是代码生成的，不需要外部文件
   */
  async loadSAABoundary(): Promise<SAABoundary> {
    if (this.saaBoundary) {
      return this.saaBoundary;
    }

    // 生成SAA多边形坐标
    const coordinates = this.generateSAAPolygon();

    this.saaBoundary = {
      id: 'saa-zone',
      name: '南大西洋地磁异常区',
      type: 'zone',
      coordinates,
      center: { lat: SAA_DEFINITION.centerLat, lon: SAA_DEFINITION.centerLon },
      radius: SAA_DEFINITION.radiusKm,
      style: {
        color: '#fbbf24',
        opacity: 0.6,
        strokeWidth: 2,
        fill: '#fbbf24',
        fillOpacity: 0.15
      }
    };

    return this.saaBoundary;
  }

  /**
   * 生成SAA多边形坐标
   * 基于科学定义：5°S-40°S, 80°W-0°
   */
  private generateSAAPolygon(): Array<{ lat: number; lon: number }> {
    const coords: Array<{ lat: number; lon: number }> = [];
    const { latRange, lonRange } = SAA_DEFINITION;
    const step = RENDER_CONFIG.saaSampleStep;

    // 北边界（从西到东）
    for (let lon = lonRange.min; lon <= lonRange.max; lon += step) {
      coords.push({ lat: latRange.max, lon });
    }

    // 东边界（从北到南）
    for (let lat = latRange.max; lat >= latRange.min; lat -= step) {
      coords.push({ lat, lon: lonRange.max });
    }

    // 南边界（从东到西）
    for (let lon = lonRange.max; lon >= lonRange.min; lon -= step) {
      coords.push({ lat: latRange.min, lon });
    }

    // 西边界（从南到北）
    for (let lat = latRange.min; lat <= latRange.max; lat += step) {
      coords.push({ lat, lon: lonRange.min });
    }

    // 闭合多边形
    coords.push({ lat: latRange.max, lon: lonRange.min });

    return coords;
  }

  /**
   * 检测卫星是否在SAA区域内
   */
  isSatelliteInSAA(satellite: SatellitePos): boolean {
    const { lat, lon } = satellite;
    const { latRange, lonRange } = SAA_DEFINITION;

    return (
      lat >= latRange.min &&
      lat <= latRange.max &&
      lon >= lonRange.min &&
      lon <= lonRange.max
    );
  }

  /**
   * 检测卫星即将进入SAA（基于轨道预测）
   */
  willEnterSAA(
    satellite: SatellitePos,
    orbitPath: Array<{ lat: number; lon: number }>
  ): SAAEntryEvent | null {
    if (!this.saaBoundary) {
      return null;
    }

    for (let i = 0; i < orbitPath.length; i++) {
      const point = orbitPath[i];
      if (this.isPointInSAA(point)) {
        return {
          satelliteId: satellite.id,
          satelliteName: satellite.name,
          entryTime: new Date(Date.now() + i * 1000),
          position: { lat: point.lat, lon: point.lon, alt: satellite.alt || 0 }
        };
      }
    }

    return null;
  }

  /**
   * 判断点是否在SAA区域内
   */
  private isPointInSAA(point: { lat: number; lon: number }): boolean {
    const { latRange, lonRange } = SAA_DEFINITION;

    return (
      point.lat >= latRange.min &&
      point.lat <= latRange.max &&
      point.lon >= lonRange.min &&
      point.lon <= lonRange.max
    );
  }

  /**
   * 检测多个卫星的SAA进入事件
   */
  detectSAAEntries(satellites: SatellitePos[]): SAAEntryEvent[] {
    const events: SAAEntryEvent[] = [];

    for (const satellite of satellites) {
      if (this.isSatelliteInSAA(satellite)) {
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
   * 获取SAA中心点
   */
  getSAACenter(): { lat: number; lon: number } {
    return { lat: SAA_DEFINITION.centerLat, lon: SAA_DEFINITION.centerLon };
  }

  /**
   * 获取SAA定义信息
   */
  getSAADefinition(): typeof SAA_DEFINITION {
    return SAA_DEFINITION;
  }
}

export default new SAADataService();
