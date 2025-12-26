/**
 * 地理要素类型定义
 * 用于中国国境线、SAA区域等地理要素的渲染和管理
 */

/**
 * 地理要素类型枚举
 */
export enum GeographicFeatureType {
  BORDER = 'border',  // 边界线
  ZONE = 'zone',      // 区域
  AREA = 'area'       // 区域范围
}

/**
 * 边界样式配置
 */
export interface BoundaryStyle {
  /** CSS颜色值 */
  color: string;
  /** 透明度 0-1 */
  opacity: number;
  /** 线宽 */
  strokeWidth: number;
  /** 填充颜色（可选） */
  fill?: string;
  /** 填充透明度 */
  fillOpacity?: number;
  /** 虚线样式 [实线长度, 间隔长度] */
  dashArray?: number[];
}

/**
 * 地理边界基础接口
 */
export interface GeographicBoundary {
  /** 唯一标识符 */
  id: string;
  /** 名称 */
  name: string;
  /** 类型 */
  type: GeographicFeatureType;
  /** 坐标点数组 (经纬度) */
  coordinates: Array<{ lat: number; lon: number }>;
  /** 样式配置 */
  style?: BoundaryStyle;
}

/**
 * SAA区域边界
 */
export interface SAABoundary extends GeographicBoundary {
  /** 中心点坐标 */
  center: { lat: number; lon: number };
  /** 半径（千米） */
  radius: number;
  /** 强度等级（等值线） */
  intensityLevels?: Array<{
    level: number;
    coordinates: Array<{ lat: number; lon: number }>;
  }>;
}

/**
 * 卫星进入SAA事件
 */
export interface SAAEntryEvent {
  /** 卫星ID */
  satelliteId: string;
  /** 卫星名称 */
  satelliteName: string;
  /** 进入时间 */
  entryTime: Date;
  /** 退出时间（可选） */
  exitTime?: Date;
  /** 最大强度 */
  maxIntensity?: number;
  /** 位置信息 */
  position: { lat: number; lon: number; alt: number };
}

/**
 * 地理图层配置
 */
export interface GeographicLayerConfig {
  /** 显示中国国境线 */
  showChinaBorder: boolean;
  /** 显示SAA区域 */
  showSAA: boolean;
  /** 国境线颜色 */
  chinaBorderColor: string;
  /** SAA填充颜色 */
  saaFillColor: string;
  /** SAA边界颜色 */
  saaStrokeColor: string;
  /** SAA透明度 */
  saaOpacity: number;
  /** 监控SAA进入事件 */
  monitorSAAEntry: boolean;
  /** SAA事件通知阈值（强度） */
  saaNotificationThreshold: number;
}

/**
 * GeoJSON要素接口
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'LineString' | 'MultiPolygon';
    coordinates: number[][][] | number[][] | number[][][][][];
  };
  properties: {
    name?: string;
    adcode?: string;
    level?: string;
    [key: string]: any;
  };
}

/**
 * GeoJSON数据接口
 */
export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
