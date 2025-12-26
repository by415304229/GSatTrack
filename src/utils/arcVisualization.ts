/**
 * 弧段可视化工具
 * 计算弧段连线位置和状态
 */

import type { ArcSegment } from '../services/types/api.types';
import type { ArcVisualizationConfig } from '../types/arc.types';
import { ArcStatus } from '../types/arc.types';
import satelliteMappingService from '../services/satelliteMappingService';
import { latLonToScene } from './satMath';
import { calculateArcDetailedStatus, shouldShowArcConnection, getArcConnectionColor } from './arcTimeUtils';

/**
 * 3D点坐标
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D点坐标
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * 弧段连线数据（3D）
 */
export interface ArcConnection3D {
  satellite: Point3D;
  station: Point3D;
  isActive: boolean;
  color: string;
}

/**
 * 弧段连线数据（2D）
 */
export interface ArcConnection2D {
  satellite: Point2D;
  station: Point2D;
  isActive: boolean;
  color: string;
}

/**
 * 卫星位置数据接口（需要与现有代码兼容）
 */
export interface SatellitePosition {
  id: string;
  name: string;
  displayName?: string;
  x: number;
  y: number;
  z: number;
  lat?: number;
  lon?: number;
}

/**
 * 地面站数据接口
 */
export interface GroundStationData {
  name: string;
  lat: number;
  lon: number;
}

/**
 * SiteName 映射表
 * API 提供的名称（如 "东北信关站-东北信关天线2"）映射到标准城市名
 * 需要与 HomePage 中的 stations.name 保持一致
 */
const SITE_NAME_MAPPING: Record<string, string> = {
  '东北': '抚远',
  '东北信关站': '抚远',
  '库尔勒': '库尔勒',
  '库尔勒信关站': '库尔勒',
  '新疆': '库尔勒',
  '新疆信关站': '库尔勒',
  '上海': '上海',
  '上海信关站': '上海',
  '吉隆坡': '吉隆坡',
  '吉隆坡信关站': '吉隆坡'
};

/**
 * 从 API 提供的 SiteName 中提取标准城市名
 * @param apiSiteName API 提供的站点名称，如 "东北信关站-东北信关天线2"
 * @returns 标准化的城市名，如 "抚远"
 */
export function extractCityName(apiSiteName: string): string | null {
  // 直接查找
  if (apiSiteName in SITE_NAME_MAPPING) {
    return SITE_NAME_MAPPING[apiSiteName];
  }

  // 尝试从名称中提取关键词
  for (const [key, value] of Object.entries(SITE_NAME_MAPPING)) {
    if (apiSiteName.includes(key)) {
      return value;
    }
  }

  console.warn(`[arcVisualization] 未找到站点映射: ${apiSiteName}`);
  return null;
}

/**
 * 判断弧段是否活跃
 * @param arc 弧段数据
 * @param currentTime 当前时间
 * @returns 是否活跃
 */
export const isArcActive = (
  arc: ArcSegment,
  currentTime: Date
): boolean => {
  const start = new Date(arc.startTime).getTime();
  const end = new Date(arc.endTime).getTime();
  const now = currentTime.getTime();
  return now >= start && now <= end;
};

/**
 * 计算3D场景中的弧段连线
 * @param arcs 弧段列表
 * @param satellites 卫星位置列表
 * @param groundStations 地面站列表
 * @param currentTime 当前时间
 * @param config 可视化配置
 * @returns 3D连线数组
 */
export const calculateArcConnections3D = (
  arcs: ArcSegment[],
  satellites: SatellitePosition[],
  groundStations: GroundStationData[],
  currentTime: Date,
  config: ArcVisualizationConfig
): ArcConnection3D[] => {
  const connections: ArcConnection3D[] = [];

  // 创建卫星位置映射 - 使用 NORAD ID (即 sat.id)
  const satPosMap = new Map<string, Point3D>();
  satellites.forEach(sat => {
    satPosMap.set(sat.id, { x: sat.x, y: sat.y, z: sat.z });
  });

  // 创建地面站位置映射（需要转换为3D坐标）
  const stationPosMap = new Map<string, Point3D>();
  groundStations.forEach(station => {
    const pos = latLonToScene(station.lat, station.lon, 1.0);
    stationPosMap.set(station.name, pos);
  });

  // 遍历弧段，计算连线
  arcs.forEach(arc => {
    // 计算详细状态（包含1分钟缓冲期）
    const arcWithStatus = calculateArcDetailedStatus(arc, currentTime);

    // 判断是否应该显示连线
    if (!shouldShowArcConnection(arcWithStatus.status)) {
      return;
    }

    // 如果只显示活跃弧段，过滤掉非活跃的
    if (config.showActiveOnly && arcWithStatus.status !== ArcStatus.ACTIVE) {
      return;
    }

    // 通过 SCID 获取对应的 NORAD ID
    const noradId = satelliteMappingService.getNoradIdByScid(arc.scid);
    if (!noradId) {
      return;
    }

    // 使用 NORAD ID 查找卫星位置
    const satPos = satPosMap.get(noradId);
    if (!satPos) {
      return;
    }

    // 从 API 的 siteName 中提取标准城市名
    const cityName = extractCityName(arc.siteName);
    if (!cityName) {
      return;
    }

    // 使用标准城市名查找地面站位置
    const stationPos = stationPosMap.get(cityName);
    if (!stationPos) {
      return;
    }

    // 根据状态获取颜色
    const color = getArcConnectionColor(arcWithStatus.status, config);

    connections.push({
      satellite: satPos,
      station: stationPos,
      isActive: arcWithStatus.status === ArcStatus.ACTIVE,
      color
    });
  });

  return connections;
};

/**
 * 计算2D地图中的弧段连线
 * @param arcs 弧段列表
 * @param satellites 卫星位置列表
 * @param groundStations 地面站列表
 * @param currentTime 当前时间
 * @param canvasWidth 画布宽度
 * @param canvasHeight 画布高度
 * @param config 可视化配置
 * @returns 2D连线数组
 */
export const calculateArcConnections2D = (
  arcs: ArcSegment[],
  satellites: SatellitePosition[],
  groundStations: GroundStationData[],
  currentTime: Date,
  canvasWidth: number,
  canvasHeight: number,
  config: ArcVisualizationConfig
): ArcConnection2D[] => {
  const connections: ArcConnection2D[] = [];

  // 创建卫星位置映射（2D坐标） - 使用 NORAD ID (即 sat.id)
  const satPosMap = new Map<string, Point2D>();
  satellites.forEach(sat => {
    if (sat.lat !== undefined && sat.lon !== undefined) {
      const x = ((sat.lon + 180) / 360) * canvasWidth;
      const y = ((90 - sat.lat) / 180) * canvasHeight;
      satPosMap.set(sat.id, { x, y });
    }
  });

  // 创建地面站位置映射（2D坐标）
  const stationPosMap = new Map<string, Point2D>();
  groundStations.forEach(station => {
    const x = ((station.lon + 180) / 360) * canvasWidth;
    const y = ((90 - station.lat) / 180) * canvasHeight;
    stationPosMap.set(station.name, { x, y });
  });

  // 遍历弧段，计算连线
  arcs.forEach(arc => {
    // 计算详细状态（包含1分钟缓冲期）
    const arcWithStatus = calculateArcDetailedStatus(arc, currentTime);

    // 判断是否应该显示连线
    if (!shouldShowArcConnection(arcWithStatus.status)) {
      return;
    }

    // 如果只显示活跃弧段，过滤掉非活跃的
    if (config.showActiveOnly && arcWithStatus.status !== ArcStatus.ACTIVE) {
      return;
    }

    // 通过 SCID 获取对应的 NORAD ID
    const noradId = satelliteMappingService.getNoradIdByScid(arc.scid);
    if (!noradId) {
      return;
    }

    // 使用 NORAD ID 查找卫星位置
    const satPos = satPosMap.get(noradId);
    if (!satPos) {
      return;
    }

    // 从 API 的 siteName 中提取标准城市名
    const cityName = extractCityName(arc.siteName);
    if (!cityName) {
      return;
    }

    // 使用标准城市名查找地面站位置
    const stationPos = stationPosMap.get(cityName);
    if (!stationPos) {
      return;
    }

    // 根据状态获取颜色
    const color = getArcConnectionColor(arcWithStatus.status, config);

    connections.push({
      satellite: satPos,
      station: stationPos,
      isActive: arcWithStatus.status === ArcStatus.ACTIVE,
      color
    });
  });

  return connections;
};
