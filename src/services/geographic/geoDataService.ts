/**
 * GeoJSON数据服务
 * 负责加载、缓存、解析地理要素数据
 */

import type { GeographicBoundary, GeoJSONData } from '../../types/geographic.types';
import { DATA_SOURCE_CONFIG } from '../../config/geographic.config';

class GeoDataService {
  private cache: Map<string, GeoJSONData> = new Map();

  /**
   * 加载中国国境线数据
   */
  async loadChinaBorder(): Promise<GeographicBoundary> {
    const cacheKey = 'china-border';

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.parseGeoJSONToBoundary(this.cache.get(cacheKey)!, '中国国境线');
    }

    try {
      const response = await fetch(DATA_SOURCE_CONFIG.CHINA_BORDER_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GeoJSONData = await response.json();
      this.cache.set(cacheKey, data);

      return this.parseGeoJSONToBoundary(data, '中国国境线');
    } catch (error) {
      throw new Error(
        `加载中国国境线数据失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 解析GeoJSON为边界数据
   */
  private parseGeoJSONToBoundary(
    geoJSON: GeoJSONData,
    name: string
  ): GeographicBoundary {
    const allCoordinates: Array<{ lat: number; lon: number }> = [];

    for (const feature of geoJSON.features) {
      const { geometry } = feature;

      if (geometry.type === 'Polygon') {
        // Polygon: [[[lon, lat], ...]]
        const coords = geometry.coordinates[0] as number[][];
        coords.forEach(([lon, lat]) => {
          allCoordinates.push({ lat, lon });
        });
      } else if (geometry.type === 'LineString') {
        // LineString: [[lon, lat], ...]
        const coords = geometry.coordinates as number[][];
        coords.forEach(([lon, lat]) => {
          allCoordinates.push({ lat, lon });
        });
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon: [[[[lon, lat], ...]], ...]
        const polygons = geometry.coordinates as number[][][][];
        polygons.forEach(polygon => {
          const rings = polygon[0] as number[][];
          rings.forEach(([lon, lat]) => {
            allCoordinates.push({ lat, lon });
          });
        });
      }
    }

    if (allCoordinates.length === 0) {
      throw new Error(`GeoJSON数据中未找到有效坐标: ${name}`);
    }

    return {
      id: name,
      name,
      type: 'border',
      coordinates: allCoordinates,
      style: {
        color: '#ef4444',
        opacity: 0.8,
        strokeWidth: 2
      }
    };
  }

  /**
   * 直接加载GeoJSON数据
   */
  async loadGeoJSON(url: string): Promise<GeoJSONData> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GeoJSONData = await response.json();
      this.cache.set(url, data);
      return data;
    } catch (error) {
      throw new Error(
        `加载GeoJSON失败 (${url}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export default new GeoDataService();
