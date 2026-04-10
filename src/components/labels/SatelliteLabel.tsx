/**
 * 单个卫星标签组件
 * 使用 Billboard + Html 实现 3D 悬浮标签效果
 */
import { Billboard, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import type { SatelliteLabelConfig } from '../../types/label.types';

interface SatelliteLabelProps {
  /** 卫星位置 {x, y, z} */
  position: { x: number; y: number; z: number };
  /** 卫星名称 */
  name: string;
  /** 标签配置 */
  config: SatelliteLabelConfig;
}

/** 地球半径（场景单位） */
const EARTH_RADIUS = 1;

/**
 * 检测卫星是否被地球遮挡
 * @param satPos 卫星位置
 * @param cameraPos 相机位置
 * @returns true 如果卫星被地球遮挡
 */
function isSatelliteOccluded(
  satPos: THREE.Vector3,
  cameraPos: THREE.Vector3
): boolean {
  // 相机到卫星的方向向量
  const dir = satPos.clone().sub(cameraPos);
  const distance = dir.length();
  dir.normalize();

  // 计算射线到地心的最短距离
  const toCenter = cameraPos.clone().negate();
  const proj = toCenter.dot(dir);

  // 如果投影点在相机后面，则不被遮挡
  if (proj < 0) return false;

  const closestPoint = cameraPos.clone().add(dir.clone().multiplyScalar(proj));
  const distToCenter = closestPoint.length();

  // 如果最短距离小于地球半径，且交点在相机和卫星之间，则被遮挡
  return distToCenter < EARTH_RADIUS && proj < distance;
}

export const SatelliteLabel: React.FC<SatelliteLabelProps> = ({
  position,
  name,
  config
}) => {
  const { camera } = useThree();
  const [visible, setVisible] = useState(true);
  const satPosRef = useRef(new THREE.Vector3(position.x, position.y, position.z));

  // 更新卫星位置引用
  satPosRef.current.set(position.x, position.y, position.z);

  useFrame(() => {
    if (config.hideOccluded) {
      const occluded = isSatelliteOccluded(satPosRef.current, camera.position);
      setVisible(!occluded);
    } else {
      setVisible(true);
    }
  });

  // 如果不可见，不渲染
  if (!visible) return null;

  return (
    <Billboard
      position={[position.x, position.y, position.z]}
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <Html
        position={[0, 0.03, 0]}
        center
        distanceFactor={2}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transition: 'opacity 0.2s ease'
        }}
      >
        <div
          style={{
            fontSize: `${config.fontSize}px`,
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            padding: '1px 5px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            textShadow: '0 0 4px rgba(0,0,0,0.9)',
            border: '1px solid rgba(100,200,255,0.3)'
          }}
        >
          {name}
        </div>
      </Html>
    </Billboard>
  );
};
