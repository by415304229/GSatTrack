/**
 * 弧段动画工具
 * 实现固定长度线段在连线上移动的动画效果
 */

/**
 * 动画方向
 */
export enum AnimationDirection {
  SATELLITE_TO_STATION = 'satellite_to_station',  // 从卫星到地面站
  STATION_TO_SATELLITE = 'station_to_satellite'    // 从地面站到卫星
}

/**
 * 线段数据
 */
export interface Segment {
  startPosition: number;  // 线段起点在连线上的位置（0-1）
  endPosition: number;    // 线段终点在连线上的位置（0-1）
}

/**
 * 弧段动画状态
 */
export interface ArcAnimationState {
  direction: AnimationDirection;
  segments: Segment[];
}

/**
 * 弧段动画配置
 */
export interface ArcAnimationConfig {
  segmentCount: number;    // 线段数量（默认3）
  segmentLength: number;   // 每个线段的长度（占连线的比例，如0.2表示20%）
  cycleDuration: number;   // 完整往返周期时长（秒）
  extensionFactor?: number; // 扩展系数，让线段能完全移出目标位置（默认1.3）
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ArcAnimationConfig = {
  segmentCount: 3,
  segmentLength: 0.2,  // 每个线段占连线20%的长度
  cycleDuration: 2.0,  // 2秒完成一个往返周期
  extensionFactor: 1.3  // 扩展系数，让线段能完全移出目标位置
};

/**
 * 计算动画状态
 * @param elapsedTime 经过的时间（秒）
 * @param config 动画配置
 * @returns 当前动画状态
 */
export function calculateArcAnimationState(
  elapsedTime: number,
  config: ArcAnimationConfig = DEFAULT_CONFIG
): ArcAnimationState {
  const { segmentCount, segmentLength, cycleDuration, extensionFactor = 1.3 } = config;

  // 计算周期进度（0-1）
  const rawCycleProgress = (elapsedTime % cycleDuration) / cycleDuration;

  // 前半周期：卫星 -> 地面站
  // 后半周期：地面站 -> 卫星
  const direction = rawCycleProgress < 0.5
    ? AnimationDirection.SATELLITE_TO_STATION
    : AnimationDirection.STATION_TO_SATELLITE;

  // 计算半周期内的进度（0-1）
  const halfCycleProgress = rawCycleProgress < 0.5
    ? rawCycleProgress * 2  // 0-0.5 -> 0-1
    : (rawCycleProgress - 0.5) * 2;  // 0.5-1 -> 0-1

  // 计算扩展范围：将[0,1]映射到扩展范围
  // 例如extensionFactor=1.3时，映射到[-0.15, 1.15]
  const extension = (extensionFactor - 1) / 2;  // 扩展量（每侧）
  const extendedStart = -extension;  // 例如：-0.15
  const extendedEnd = 1 + extension;    // 例如：1.15
  const extendedRange = extendedEnd - extendedStart;  // 总范围：1.3

  // 计算每个线段的位置
  const segments: Segment[] = [];
  const segmentInterval = extendedRange / segmentCount;  // 线段间隔（基于扩展范围）

  for (let i = 0; i < segmentCount; i++) {
    // 线段在扩展范围内的中心位置
    const centerPosInExtended = extendedStart + (halfCycleProgress + i * segmentInterval) % extendedRange;

    // 计算线段的起点和终点位置（在扩展范围内）
    let startPos = centerPosInExtended - segmentLength / 2;
    let endPos = centerPosInExtended + segmentLength / 2;

    // 只显示[0, 1]范围内的部分
    const visibleStart = Math.max(0, startPos);
    const visibleEnd = Math.min(1, endPos);

    // 只添加有可见部分的线段
    if (visibleStart < visibleEnd) {
      segments.push({
        startPosition: visibleStart,
        endPosition: visibleEnd
      });
    }
  }

  return {
    direction,
    segments
  };
}

/**
 * 计算2D线段的起点和终点
 * @param startX 起点X
 * @param startY 起点Y
 * @param endX 终点X
 * @param endY 终点Y
 * @param segmentStartPos 线段起点位置（0-1）
 * @param segmentEndPos 线段终点位置（0-1）
 * @returns [起点X, 起点Y, 终点X, 终点Y]
 */
export function calculateSegmentEndpoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  segmentStartPos: number,
  segmentEndPos: number
): [number, number, number, number] {
  const segmentStartX = startX + (endX - startX) * segmentStartPos;
  const segmentStartY = startY + (endY - startY) * segmentStartPos;
  const segmentEndX = startX + (endX - startX) * segmentEndPos;
  const segmentEndY = startY + (endY - startY) * segmentEndPos;

  return [segmentStartX, segmentStartY, segmentEndX, segmentEndY];
}

/**
 * 计算3D线段的起点和终点
 * @param start 起点坐标
 * @param end 终点坐标
 * @param segmentStartPos 线段起点位置（0-1）
 * @param segmentEndPos 线段终点位置（0-1）
 * @returns [起点, 终点]
 */
export function calculate3DSegmentEndpoints(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  segmentStartPos: number,
  segmentEndPos: number
): [{ x: number; y: number; z: number }, { x: number; y: number; z: number }] {
  const segmentStart = {
    x: start.x + (end.x - start.x) * segmentStartPos,
    y: start.y + (end.y - start.y) * segmentStartPos,
    z: start.z + (end.z - start.z) * segmentStartPos
  };

  const segmentEnd = {
    x: start.x + (end.x - start.x) * segmentEndPos,
    y: start.y + (end.y - start.y) * segmentEndPos,
    z: start.z + (end.z - start.z) * segmentEndPos
  };

  return [segmentStart, segmentEnd];
}
