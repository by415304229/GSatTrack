/**
 * SAA区域3D渲染组件
 * 使用半透明网格渲染SAA区域
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { latLonArrayTo3DCoordinates, coordinatesToPositionArray, createPolygonIndexArray } from '../../utils/geographic/coordinateConverter';
import type { SAABoundary } from '../../types/geographic.types';

interface SAABoundary3DProps {
  saaBoundary: SAABoundary;
  visible: boolean;
}

/**
 * SAA区域3D组件
 */
export const SAABoundary3D: React.FC<SAABoundary3DProps> = ({
  saaBoundary,
  visible
}) => {
  // 转换边界坐标为3D坐标（略高于地表）
  const boundaryPositions = useMemo(() => {
    const coords3D = latLonArrayTo3DCoordinates(saaBoundary.coordinates, 1.003);
    return coordinatesToPositionArray(coords3D);
  }, [saaBoundary.coordinates]);

  // 创建边界几何体
  const boundaryGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(boundaryPositions, 3));
    return geom;
  }, [boundaryPositions]);

  // 创建填充几何体
  const fillGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(boundaryPositions, 3));

    // 创建三角形索引
    const indices = createPolygonIndexArray(boundaryPositions.length / 3);
    if (indices.length > 0) {
      geom.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    return geom;
  }, [boundaryPositions]);

  if (!visible) {
    return null;
  }

  const style = saaBoundary.style;

  return (
    <group>
      {/* 边界线 */}
      <line geometry={boundaryGeometry}>
        <lineBasicMaterial
          color={style?.color || '#fbbf24'}
          transparent
          opacity={style?.opacity ?? 0.6}
        />
      </line>

      {/* 半透明填充区域 */}
      {fillGeometry && (
        <mesh geometry={fillGeometry}>
          <meshBasicMaterial
            color={style?.fill || '#fbbf24'}
            transparent
            opacity={style?.fillOpacity ?? 0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};

export default SAABoundary3D;
