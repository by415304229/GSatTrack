/**
 * 坐标转换工具
 * 处理3D和2D视图的坐标转换
 */

import { latLonToScene } from '../satMath';
import type { GeographicBoundary } from '../../types/geographic.types';

/**
 * 经纬度转3D场景坐标数组
 * 利用现有的 latLonToScene 函数
 */
export function latLonArrayTo3DCoordinates(
  coordinates: Array<{ lat: number; lon: number }>,
  radius: number = 1
): Array<{ x: number; y: number; z: number }> {
  return coordinates.map(coord =>
    latLonToScene(coord.lat, coord.lon, radius)
  );
}

/**
 * 经纬度转2D地图坐标（墨卡托投影）
 */
export function latLonTo2DCoordinates(
  lat: number,
  lon: number,
  width: number,
  height: number
): { x: number; y: number } {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/**
 * 经纬度数组转2D坐标数组
 */
export function latLonArrayTo2DCoordinates(
  coordinates: Array<{ lat: number; lon: number }>,
  width: number,
  height: number
): Array<{ x: number; y: number }> {
  return coordinates.map(coord =>
    latLonTo2DCoordinates(coord.lat, coord.lon, width, height)
  );
}

/**
 * 将边界数据转换为2D坐标并缓存
 */
export class Boundary2DCoordinates {
  private boundary: GeographicBoundary;
  private coords2D: Array<{ x: number; y: number }> = [];
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(boundary: GeographicBoundary) {
    this.boundary = boundary;
  }

  /**
   * 更新2D坐标（响应地图尺寸变化）
   */
  update(width: number, height: number): void {
    // 仅在尺寸变化时重新计算
    if (this.lastWidth !== width || this.lastHeight !== height) {
      this.coords2D = latLonArrayTo2DCoordinates(
        this.boundary.coordinates,
        width,
        height
      );
      this.lastWidth = width;
      this.lastHeight = height;
    }
  }

  /**
   * 获取2D坐标
   */
  getCoordinates(): Array<{ x: number; y: number }> {
    return this.coords2D;
  }

  /**
   * 获取边界样式
   */
  getStyle() {
    return this.boundary.style;
  }
}

/**
 * 3D坐标转BufferGeometry的position数组
 */
export function coordinatesToPositionArray(
  coords3D: Array<{ x: number; y: number; z: number }>
): Float32Array {
  const positions = new Float32Array(coords3D.length * 3);

  coords3D.forEach((point, i) => {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  });

  return positions;
}

/**
 * 创建闭合三角面的索引数组（用于多边形填充）
 */
export function createPolygonIndexArray(vertexCount: number): Uint16Array {
  if (vertexCount < 3) {
    return new Uint16Array([]);
  }

  // 使用TriangleFan方式创建索引
  const indices: number[] = [];
  for (let i = 1; i < vertexCount - 1; i++) {
    indices.push(0, i, i + 1);
  }

  return new Uint16Array(indices);
}
