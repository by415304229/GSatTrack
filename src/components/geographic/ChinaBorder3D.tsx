
/**
 * 中国国境线3D渲染组件
 * 使用Three.js Line渲染国境线
 */

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { latLonArrayTo3DCoordinates, coordinatesToPositionArray } from '../../utils/geographic/coordinateConverter';
import type { GeographicBoundary } from '../../types/geographic.types';

interface ChinaBorder3DProps {
  boundary: GeographicBoundary;
  visible: boolean;
}

/**
 * 计算两点间距离（经纬度简单欧氏距离）
 */
const calculateDistance = (p1: { lat: number; lon: number }, p2: { lat: number; lon: number }): number => {
  const dlat = p2.lat - p1.lat;
  const dlon = p2.lon - p1.lon;
  return Math.sqrt(dlat * dlat + dlon * dlon);
};

/**
 * 检测是否为闭合环（首尾点距离很近）
 */
const isClosedRing = (points: Array<{ lat: number; lon: number }>, threshold: number = 0.1): boolean => {
  if (points.length < 3) return false;
  
  const first = points[0];
  const last = points[points.length - 1];
  const distance = calculateDistance(first, last);
  
  return distance < threshold;
};

/**
 * 计算环的近似面积（平面近似，适用于小范围）
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
  let centerLat = 0, centerLon = 0;
  
  points.forEach(p => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
    centerLat += p.lat;
    centerLon += p.lon;
  });
  
  centerLat /= points.length;
  centerLon /= points.length;
  
  return {
    minLat, maxLat, minLon, maxLon,
    centerLat, centerLon,
    latSpan: maxLat - minLat,
    lonSpan: maxLon - minLon
  };
};

/**
 * 检查是否为有效岛屿（针对小岛乱线问题优化）
 */
const isValidIsland = (points: Array<{ lat: number; lon: number }>): boolean => {
  // 基础检查
  if (points.length < 5) return false;
  if (!isClosedRing(points, 1)) return false;
  
  const bbox = getRingBoundingBox(points);
  const { centerLat, centerLon, latSpan, lonSpan } = bbox;
  
  // 1. 识别主要岛屿（海南、台湾）- 放宽条件
  // 海南岛区域
  if (centerLat >= 18 && centerLat <= 21 && centerLon >= 108 && centerLon <= 111) {
    return latSpan > 0.5 && lonSpan > 0.5;
  }
  
  // 台湾岛区域
  if (centerLat >= 22 && centerLat <= 25.5 && centerLon >= 119.5 && centerLon <= 122.5) {
    return latSpan > 0.5 && lonSpan > 0.5;
  }
  
  // 2. 南海诸岛 - 更严格的过滤
  if (centerLat >= 4 && centerLat <= 23 && centerLon >= 108 && centerLon <= 122) {
    // 南海小岛的额外检查
    const area = calculateRingArea(points);
    
    // 检查是否为乱线：计算环的"紧密度"
    let perimeter = 0;
    for (let i = 0; i < points.length - 1; i++) {
      perimeter += calculateDistance(points[i], points[i + 1]);
    }
    
    // 周长/面积比 - 乱线通常这个值很大
    const compactness = perimeter / Math.max(area, 0.00001);
    
    // 有效的小岛应该：面积适中，紧密度合理
    const MIN_AREA = 0.000005;  // 最小面积
    const MAX_AREA = 0.05;     // 最大面积
    const MAX_COMPACTNESS = 800; // 最大紧密度（乱线通常大于这个值）
    
    // 额外检查：小岛不应该太狭长
    const aspectRatio = Math.max(latSpan, 0.001) / Math.max(lonSpan, 0.001);
    const MAX_ASPECT_RATIO = 15; // 最大长宽比
    
    return area > MIN_AREA && 
          area < MAX_AREA && 
          compactness < MAX_COMPACTNESS &&
          aspectRatio < MAX_ASPECT_RATIO &&
          aspectRatio > 1/MAX_ASPECT_RATIO;
  }
  
  // 3. 其他区域的岛屿 - 更严格的检查
  const area = calculateRingArea(points);
  const MIN_AREA = 0.00002;
  const MAX_AREA = 0.08;
  
  if (area < MIN_AREA || area > MAX_AREA) return false;
  
  // 检查环的形状是否合理
  let perimeter = 0;
  for (let i = 0; i < points.length - 1; i++) {
    perimeter += calculateDistance(points[i], points[i + 1]);
  }
  
  const compactness = perimeter / Math.max(area, 0.00001);
  return compactness < 400; // 合理的岛屿紧密度
};

/**
 * 检查是否为南海断续线（非闭合的国境线段）
 */
const isSouthChinaSeaBorder = (points: Array<{ lat: number; lon: number }>): boolean => {
  if (points.length < 10 || points.length > 200) return false;
  
  const bbox = getRingBoundingBox(points);
  const { centerLat, centerLon, latSpan, lonSpan } = bbox;
  
  // 必须是南海区域
  if (!(centerLat >= 4 && centerLat <= 23 && centerLon >= 108 && centerLon <= 122)) {
    return false;
  }
  
  // 南海断续线通常不是闭合环
  const isClosed = isClosedRing(points, 0.5);
  if (isClosed) return false;
  
  // 面积适中（不是太大的区域）
  const area = calculateRingArea(points);
  if (area > 0.1) return false;
  
  // 检查是否为合理的线段（不是乱线）
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i-1], points[i]);
  }
  
  // 有效的线段应该有合理的长度
  return totalDistance > 0.01 && totalDistance < 5;
};

/**
 * 智能分类边界环为主陆地和岛屿（优化版）
 */
const classifyBorderRings = (
  rings: Array<Array<{ lat: number; lon: number }>>
): { mainlandRings: typeof rings; islandRings: typeof rings } => {
  if (rings.length === 0) {
    return { mainlandRings: [], islandRings: [] };
  }
  
  const mainlandRings: Array<Array<{ lat: number; lon: number }>> = [];
  const islandRings: Array<Array<{ lat: number; lon: number }>> = [];

  // 1. 首先检查是否有南海断续线
  rings.forEach(ring => {
    if (isSouthChinaSeaBorder(ring)) {
      mainlandRings.push(ring); // 南海断续线归入主陆地
    }
  });
  
  // 找出大陆环（面积最大的几个环
  const otherRings = rings.filter(ring => !mainlandRings.includes(ring));
  
  if (otherRings.length === 0) {
    return { mainlandRings, islandRings };
  }

  const sortedRings = [...otherRings].sort((a, b) => {
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
  
  // 识别岛屿（排除已经识别为大陆的环）
  const remainingRings = otherRings.filter(ring => !mainlandRings.includes(ring));
  
  remainingRings.forEach(ring => {
    const bbox = getRingBoundingBox(ring);
    const { latSpan, lonSpan } = bbox;
    
    // 快速排除明显不是岛屿的环
    if (latSpan > 4 || lonSpan > 4) {
      // 太大，可能是大陆的其他部分
      if (calculateRingArea(ring) > 0.04) {
        mainlandRings.push(ring);
      }
      return;
    }
    
    // 检查是否为有效岛屿
    if (isValidIsland(ring)) {
      // 对于小岛，确保它们闭合良好
      if (!isClosedRing(ring, 0.3)) {
        const closedRing = [...ring, { ...ring[0] }];
        islandRings.push(closedRing);
      } else {
        islandRings.push(ring);
      }
    }
  });
  
  return { mainlandRings, islandRings };
};

/**
 * 闭合环组件
 */
const BorderRing: React.FC<{
  points: Array<{ lat: number; lon: number }>;
  color: string;
  opacity: number;
  lineWidth: number;
}> = ({ points, color, opacity, lineWidth }) => {
  const positions = useMemo(() => {
    const coords3D = latLonArrayTo3DCoordinates(points, 1.01);
    return coordinatesToPositionArray(coords3D);
  }, [points]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.computeBoundingSphere();
    return geom;
  }, [positions]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        lineWidth={lineWidth}
        depthTest={true}
        depthWrite={false}
      />
    </line>
  );
};

/**
 * 中国国境线3D组件 - 专门处理海南岛和台湾岛
 */
export const ChinaBorder3D: React.FC<ChinaBorder3DProps> = ({
  boundary,
  visible
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // 智能分割国境线，特别关注海南岛和台湾岛
  const { mainlandRings, islandRings } = useMemo(() => {
    if (!boundary.coordinates || boundary.coordinates.length < 100) {
      return { mainlandRings: [], islandRings: [] };
    }

    const rings: Array<Array<{ lat: number; lon: number }>> = [];
    let currentRing: Array<{ lat: number; lon: number }> = [];
    
    // 自适应参数：根据数据特征调整
    let totalDistance = 0;
    let maxDistance = 0;
    
    // 分析数据特征
    for (let i = 1; i < Math.min(boundary.coordinates.length, 1000); i++) {
      const dist = calculateDistance(boundary.coordinates[i-1], boundary.coordinates[i]);
      totalDistance += dist;
      maxDistance = Math.max(maxDistance, dist);
    }
    
    const avgDistance = totalDistance / Math.min(boundary.coordinates.length - 1, 999);
    
    // 自适应阈值：正常相邻点距离的10倍，但不超过2度
    const DISTANCE_THRESHOLD = Math.min(3, Math.max(0.3, avgDistance * 20));
    const MIN_POINTS_PER_RING = 5;
    
    for (let i = 0; i < boundary.coordinates.length; i++) {
      const point = boundary.coordinates[i];
      const { lat, lon } = point;
      
      if (currentRing.length === 0) {
        currentRing.push(point);
        continue;
      }
      
      const prevPoint = currentRing[currentRing.length - 1];
      const distance = calculateDistance(prevPoint, point);
      
      // 检测跳跃点（新环开始）
      if (distance > DISTANCE_THRESHOLD) {
        // 保存当前环
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
    
    return classifyBorderRings(rings);
    
  }, [boundary.coordinates]);

  // 如果不可见或没有数据，不渲染
  if (!visible || (mainlandRings.length === 0 && islandRings.length === 0)) {
    return null;
  }

  const style = boundary.style;
  const color = style?.color || '#00AAE1';
  const opacity = style?.opacity ?? 0.8;
  const lineWidth = style?.strokeWidth ? Math.min(style.strokeWidth, 1) : 1;

  return (
    <group ref={groupRef}>
      {/* 渲染主陆地国境线 */}
      {mainlandRings.map((ring, ringIndex) => (
        <BorderRing
          key={`mainland-${ringIndex}`}
          points={ring}
          color={color}
          opacity={opacity}
          lineWidth={lineWidth}
        />
      ))}
      
      {/* 渲染岛屿国境线 - 小岛使用更细的线 */}
      {islandRings.map((ring, ringIndex) => {
        const bbox = getRingBoundingBox(ring);
        const { latSpan, lonSpan } = bbox;
        
        // 非常小的岛使用更细的线
        const isTinyIsland = latSpan < 0.15 && lonSpan < 0.15;
        const islandLineWidth = isTinyIsland 
          ? Math.max(0.3, lineWidth * 0.5)
          : Math.max(0.5, lineWidth * 0.7);
        
        return (
          <BorderRing
            key={`island-${ringIndex}`}
            points={ring}
            color={color}
            opacity={opacity}
            lineWidth={islandLineWidth}
          />
        );
      })}
    </group>
  );
};

export default ChinaBorder3D;