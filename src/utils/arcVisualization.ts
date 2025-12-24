/**
 * 弧段可视化工具
 * 计算弧段连线位置和状态
 */

import type { ArcSegment } from '../services/types/api.types';
import type { ArcVisualizationConfig } from '../types/arc.types';

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

  // 创建卫星位置映射
  const satPosMap = new Map<string, Point3D>();
  satellites.forEach(sat => {
    satPosMap.set(sat.id, { x: sat.x, y: sat.y, z: sat.z });
  });

  // 创建地面站位置映射（需要转换为3D坐标）
  const stationPosMap = new Map<string, Point3D>();
  groundStations.forEach(station => {
    const pos = latLonToVector3(station.lat, station.lon, 1.0);
    stationPosMap.set(station.name, pos);
  });

  // 遍历弧段，计算连线
  arcs.forEach(arc => {
    // 如果只显示活跃弧段，过滤掉未活跃的
    if (config.showActiveOnly && !isArcActive(arc, currentTime)) {
      return;
    }

    const satPos = satPosMap.get(arc.scid);
    const stationPos = stationPosMap.get(arc.siteName);

    if (satPos && stationPos) {
      const isActive = isArcActive(arc, currentTime);
      connections.push({
        satellite: satPos,
        station: stationPos,
        isActive,
        color: isActive ? config.activeColor : config.upcomingColor
      });
    }
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

  // 创建卫星位置映射（2D坐标）
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
    if (config.showActiveOnly && !isArcActive(arc, currentTime)) {
      return;
    }

    const satPos = satPosMap.get(arc.scid);
    const stationPos = stationPosMap.get(arc.siteName);

    if (satPos && stationPos) {
      const isActive = isArcActive(arc, currentTime);
      connections.push({
        satellite: satPos,
        station: stationPos,
        isActive,
        color: isActive ? config.activeColor : config.upcomingColor
      });
    }
  });

  return connections;
};

/**
 * 将经纬度转换为3D单位向量（球面坐标）
 * @param lat 纬度（度）
 * @param lon 经度（度）
 * @param radius 半径
 * @returns 3D向量
 */
function latLonToVector3(lat: number, lon: number, radius: number): Point3D {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return { x, y, z };
}
