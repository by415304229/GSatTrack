/**
 * 中国国境线2D渲染组件
 * 在Canvas上绘制国境线
 */

import type { GeographicBoundary } from '../../types/geographic.types';
import { latLonTo2DCoordinates } from '../../utils/geographic/coordinateConverter';

/**
 * 计算两点间距离
 */
const calculateDistance = (p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number => {
  const dlat = p2.lat - p1.lat;
  const dlon = p2.lon - p1.lon;
  return Math.sqrt(dlat * dlat + dlon * dlon);
};

/**
 * 检测是否为闭合环
 */
const isClosedRing = (points: Array<{ lat: number; lon: number }>, threshold: number = 0.1): boolean => {
  if (points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return calculateDistance(first, last) < threshold;
};

/**
 * 计算环的面积
 */
const calculateRingArea = (points: Array<{ lat: number; lon: number }>): number => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p1 = points[j];
    const p2 = points[i];
    area += (p2.lon - p1.lon) * (p2.lat + p1.lat);
  }

  return Math.abs(area) / 2;
};

/**
 * 获取环的包围盒
 */
const getRingBoundingBox = (points: Array<{ lat: number; lon: number }>) => {
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

  points.forEach(p => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  });

  return {
    minLat, maxLat, minLon, maxLon,
    latSpan: maxLat - minLat,
    lonSpan: maxLon - minLon
  };
};

/**
 * 检查是否为有效岛屿
 */
const isValidIsland = (points: Array<{ lat: number; lon: number }>): boolean => {
  if (points.length < 5) return false;
  if (!isClosedRing(points, 1)) return false;

  // 面积检查
  const area = calculateRingArea(points);
  const MIN_AREA = 0.00002;
  const MAX_AREA = 0.08;

  if (area < MIN_AREA || area > MAX_AREA) return false;

  // 检查环的形状
  let perimeter = 0;
  for (let i = 0; i < points.length - 1; i++) {
    perimeter += calculateDistance(points[i], points[i + 1]);
  }

  const compactness = perimeter / Math.max(area, 0.00001);
  return compactness < 400;
};

/**
 * 分割国境线为多个环
 */
const splitBorderRings = (
  coordinates: Array<{ lat: number; lon: number }>
): Array<Array<{ lat: number; lon: number }>> => {
  if (coordinates.length < 100) {
    return [];
  }

  const rings: Array<Array<{ lat: number; lon: number }>> = [];
  let currentRing: Array<{ lat: number; lon: number }> = [];

  // 分析数据特征
  let totalDistance = 0;
  for (let i = 1; i < Math.min(coordinates.length, 1000); i++) {
    totalDistance += calculateDistance(coordinates[i - 1], coordinates[i]);
  }

  const avgDistance = totalDistance / Math.min(coordinates.length - 1, 999);
  const DISTANCE_THRESHOLD = Math.min(3, Math.max(0.3, avgDistance * 20));
  const MIN_POINTS_PER_RING = 5;

  for (let i = 0; i < coordinates.length; i++) {
    const point = coordinates[i];

    if (currentRing.length === 0) {
      currentRing.push(point);
      continue;
    }

    const prevPoint = currentRing[currentRing.length - 1];
    const distance = calculateDistance(prevPoint, point);

    // 检测跳跃点（新环开始）
    if (distance > DISTANCE_THRESHOLD) {
      if (currentRing.length >= MIN_POINTS_PER_RING) {
        rings.push([...currentRing]);
      }
      currentRing = [point];
    } else {
      currentRing.push(point);
    }
  }

  // 处理最后一个环
  if (currentRing.length >= 15) {
    rings.push(currentRing);
  }

  return rings;
};

/**
 * 分类边界环为主陆地和岛屿
 */
const classifyBorderRings = (
  rings: Array<Array<{ lat: number; lon: number }>>
): { mainlandRings: typeof rings; islandRings: typeof rings } => {
  if (rings.length === 0) {
    return { mainlandRings: [], islandRings: [] };
  }

  const mainlandRings: Array<Array<{ lat: number; lon: number }>> = [];
  const islandRings: Array<Array<{ lat: number; lon: number }>> = [];

  // 按面积排序
  const sortedRings = [...rings].sort((a, b) => {
    return calculateRingArea(b) - calculateRingArea(a);
  });

  // 大陆环通常是前几个面积最大的
  const mainlandCandidates = sortedRings.slice(0, Math.min(5, sortedRings.length));

  mainlandCandidates.forEach(ring => {
    const area = calculateRingArea(ring);
    if (area > 0.1) {
      mainlandRings.push(ring);
    }
  });

  // 识别岛屿
  const remainingRings = rings.filter(ring => !mainlandRings.includes(ring));

  remainingRings.forEach(ring => {
    const bbox = getRingBoundingBox(ring);
    const { latSpan, lonSpan } = bbox;

    // 快速排除明显不是岛屿的环
    if (latSpan > 4 || lonSpan > 4) {
      if (calculateRingArea(ring) > 0.04) {
        mainlandRings.push(ring);
      }
      return;
    }

    // 检查是否为有效岛屿
    if (isValidIsland(ring)) {
      // 确保闭合
      if (!isClosedRing(ring, 0.3)) {
        islandRings.push([...ring, { ...ring[0] }]);
      } else {
        islandRings.push(ring);
      }
    }
  });

  return { mainlandRings, islandRings };
};

/**
 * 检测是否跨越地图边界（经度±180°）
 */
const crossesMapBoundary = (points: Array<{ lat: number; lon: number }>): boolean => {
  for (let i = 1; i < points.length; i++) {
    const lonDiff = Math.abs(points[i].lon - points[i - 1].lon);
    if (lonDiff > 180) {
      return true;
    }
  }
  return false;
};

/**
 * 绘制单个环
 */
const drawRing = (
  ctx: CanvasRenderingContext2D,
  points: Array<{ lat: number; lon: number }>,
  width: number,
  height: number,
  style: {
    color?: string;
    strokeWidth?: number;
    opacity?: number;
    dashArray?: number[];
  }
): void => {
  if (points.length === 0) return;

  // 检测是否跨越边界
  if (crossesMapBoundary(points)) {
    // 分段绘制
    let currentSegment: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < points.length; i++) {
      const coord = latLonTo2DCoordinates(points[i].lat, points[i].lon, width, height);

      if (currentSegment.length === 0) {
        currentSegment.push(coord);
        continue;
      }

      const lonDiff = Math.abs(points[i].lon - points[i - 1].lon);
      if (lonDiff > 180) {
        // 跨越边界，绘制当前段并开始新段
        if (currentSegment.length > 1) {
          drawSegment(ctx, currentSegment, style);
        }
        currentSegment = [coord];
      } else {
        currentSegment.push(coord);
      }
    }

    // 绘制最后一段
    if (currentSegment.length > 1) {
      drawSegment(ctx, currentSegment, style);
    }
  } else {
    // 正常绘制
    const coords = points.map(p =>
      latLonTo2DCoordinates(p.lat, p.lon, width, height)
    );
    drawSegment(ctx, coords, style);
  }
};

/**
 * 绘制线段
 */
const drawSegment = (
  ctx: CanvasRenderingContext2D,
  coords: Array<{ x: number; y: number }>,
  style: {
    color?: string;
    strokeWidth?: number;
    opacity?: number;
    dashArray?: number[];
  }
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);

  for (let i = 1; i < coords.length; i++) {
    ctx.lineTo(coords[i].x, coords[i].y);
  }

  // 如果首尾点很近，闭合路径
  const firstLastDist = Math.sqrt(
    Math.pow(coords[0].x - coords[coords.length - 1].x, 2) +
    Math.pow(coords[0].y - coords[coords.length - 1].y, 2)
  );
  if (firstLastDist < 5) {
    ctx.closePath();
  }

  ctx.strokeStyle = style.color || '#00AAE1';
  ctx.lineWidth = style.strokeWidth || 0.3;
  ctx.globalAlpha = style.opacity ?? 0.8;

  if (style.dashArray) {
    ctx.setLineDash(style.dashArray);
  }

  ctx.stroke();
  ctx.restore();
};

/**
 * 中国国境线2D渲染类
 */
export class ChinaBorder2D {
  private boundary: GeographicBoundary;
  private width = 0;
  private height = 0;
  private rings: { mainland: Array<Array<{ lat: number; lon: number }>>; islands: Array<Array<{ lat: number; lon: number }>> } = {
    mainland: [],
    islands: []
  };

  constructor(boundary: GeographicBoundary) {
    this.boundary = boundary;
    this.processCoordinates();
  }

  /**
   * 处理坐标数据，分割并分类环
   */
  private processCoordinates(): void {
    if (!this.boundary.coordinates || this.boundary.coordinates.length < 100) {
      return;
    }

    const rings = splitBorderRings(this.boundary.coordinates);
    const { mainlandRings, islandRings } = classifyBorderRings(rings);

    this.rings = {
      mainland: mainlandRings,
      islands: islandRings
    };
  }

  /**
   * 更新2D坐标（响应地图尺寸变化）
   */
  update(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * 在Canvas上绘制
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.rings.mainland.length === 0 && this.rings.islands.length === 0) {
      return;
    }

    const style = {
      color: this.boundary.style?.color || '#00AAE1',
      strokeWidth: this.boundary.style?.strokeWidth || 0.3,
      opacity: this.boundary.style?.opacity ?? 0.8,
      dashArray: this.boundary.style?.dashArray
    };

    // 绘制主陆地
    this.rings.mainland.forEach(ring => {
      drawRing(ctx, ring, this.width, this.height, style);
    });

    // 绘制岛屿
    this.rings.islands.forEach(ring => {
      drawRing(ctx, ring, this.width, this.height, {
        ...style,
        strokeWidth: (style.strokeWidth || 0.3) * 0.7
      });
    });
  }
}

export default ChinaBorder2D;
