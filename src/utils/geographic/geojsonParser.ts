/**
 * GeoJSON解析工具
 * 将GeoJSON转换为项目内部格式
 */

import type { GeoJSONData, GeographicBoundary } from '../../types/geographic.types';

/**
 * 解析GeoJSON LineString为边界坐标
 */
export function parseLineString(
  geoJSON: GeoJSONData
): Array<{ lat: number; lon: number }> {
  const coordinates: Array<{ lat: number; lon: number }> = [];

  for (const feature of geoJSON.features) {
    const { geometry } = feature;

    if (geometry.type === 'LineString') {
      const coords = geometry.coordinates as number[][];
      coords.forEach(([lon, lat]) => {
        coordinates.push({ lat, lon });
      });
    } else if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0] as number[][];
      coords.forEach(([lon, lat]) => {
        coordinates.push({ lat, lon });
      });
    }
  }

  return coordinates;
}

/**
 * 简化坐标点数量
 * 使用距离阈值简化，减少渲染点数
 */
export function simplifyCoordinates(
  coordinates: Array<{ lat: number; lon: number }>,
  tolerance: number = 0.1
): Array<{ lat: number; lon: number }> {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  const simplified: Array<{ lat: number; lon: number }> = [coordinates[0]];
  let lastPoint = coordinates[0];

  for (let i = 1; i < coordinates.length; i++) {
    const current = coordinates[i];
    const distance = Math.sqrt(
      Math.pow(current.lat - lastPoint.lat, 2) +
      Math.pow(current.lon - lastPoint.lon, 2)
    );

    if (distance >= tolerance) {
      simplified.push(current);
      lastPoint = current;
    }
  }

  // 确保最后一个点被包含
  const last = simplified[simplified.length - 1];
  if (last !== coordinates[coordinates.length - 1]) {
    simplified.push(coordinates[coordinates.length - 1]);
  }

  return simplified;
}

/**
 * 验证GeoJSON数据格式
 */
export function validateGeoJSON(data: unknown): data is GeoJSONData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const geoJSON = data as Record<string, unknown>;

  if (geoJSON.type !== 'FeatureCollection') {
    return false;
  }

  if (!Array.isArray(geoJSON.features)) {
    return false;
  }

  for (const feature of geoJSON.features) {
    if (!feature || typeof feature !== 'object') {
      return false;
    }

    if (feature.type !== 'Feature') {
      return false;
    }

    if (!feature.geometry || typeof feature.geometry !== 'object') {
      return false;
    }

    const geometry = feature.geometry as Record<string, unknown>;
    const validTypes = ['Polygon', 'LineString', 'MultiPolygon'];

    if (!validTypes.includes(geometry.type as string)) {
      return false;
    }
  }

  return true;
}

/**
 * 从GeoJSON提取名称属性
 */
export function extractName(feature: { properties?: Record<string, unknown> }): string {
  const props = feature.properties || {};

  return (
    props.name as string ||
    props.NAME as string ||
    props.中文名 as string ||
    'Unknown'
  );
}
