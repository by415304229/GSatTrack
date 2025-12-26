/**
 * 中国国境线3D渲染组件
 * 使用Three.js Line渲染国境线
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { latLonArrayTo3DCoordinates, coordinatesToPositionArray } from '../../utils/geographic/coordinateConverter';
import type { GeographicBoundary } from '../../types/geographic.types';

interface ChinaBorder3DProps {
  boundary: GeographicBoundary;
  visible: boolean;
}

/**
 * 中国国境线3D组件
 */
export const ChinaBorder3D: React.FC<ChinaBorder3DProps> = ({
  boundary,
  visible
}) => {
  // 转换坐标为3D场景坐标（略高于地表以避免z-fighting）
  const positions = useMemo(() => {
    const coords3D = latLonArrayTo3DCoordinates(boundary.coordinates, 1.002);
    return coordinatesToPositionArray(coords3D);
  }, [boundary.coordinates]);

  // 创建几何体
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [positions]);

  if (!visible) {
    return null;
  }

  const style = boundary.style;

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={style?.color || '#ef4444'}
        transparent
        opacity={style?.opacity ?? 0.8}
        linewidth={1}
      />
    </line>
  );
};

export default ChinaBorder3D;
