/**
 * 地理要素配置
 * 集中管理地理要素的默认配置
 */

import type { GeographicLayerConfig } from '../types/geographic.types';

/**
 * 地理图层默认配置
 */
export const GEOGRAPHIC_CONFIG: GeographicLayerConfig = {
  showChinaBorder: true,
  showSAA: true,
  chinaBorderColor: '#ef4444',  // 红色
  saaFillColor: '#fbbf24',       // 黄色
  saaStrokeColor: '#fbbf24',
  saaOpacity: 0.15,
  monitorSAAEntry: true,
  saaNotificationThreshold: 0.5
};

/**
 * 数据源配置
 */
export const DATA_SOURCE_CONFIG = {
  /** 中国国境线数据URL */
  CHINA_BORDER_URL: '/data/geographic/china-border.geojson',
  /** SAA边界数据URL（如果使用文件） */
  SAA_BOUNDARY_URL: '/data/geographic/saa-boundary.geojson'
};

/**
 * SAA区域科学定义
 * 基于 ESA SACS (https://sacs.aeronomie.be/info/saa.php)
 */
export const SAA_DEFINITION = {
  /** 中心点纬度 */
  centerLat: -22.5,
  /** 中心点经度 */
  centerLon: -40,
  /** 纬度范围（南纬） */
  latRange: { min: -40, max: -5 },
  /** 经度范围（西经） */
  lonRange: { min: -80, max: 0 },
  /** 近似半径（千米） */
  radiusKm: 2500
};

/**
 * 渲染配置
 */
export const RENDER_CONFIG = {
  /** 地球半径（场景单位） */
  earthRadius: 1,
  /** 3D渲染略高于地表的比例 */
  surfaceElevation: 1.005,
  /** 坐标简化容差（度） */
  simplifyTolerance: 0.1,
  /** SAA多边形采样间隔（度） */
  saaSampleStep: 5
};
