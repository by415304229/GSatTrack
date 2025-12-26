/**
 * 弧段连线3D虚线组件
 * 在3D场景中绘制带流动效果的虚线
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Point3D } from '../../utils/arcVisualization';

interface DashedLine3DProps {
  startPoint: Point3D;
  endPoint: Point3D;
  color: string;
  isActive: boolean;
  speed?: number;
}

/**
 * 弧段连线3D虚线组件
 * 使用lineDashedMaterial实现简单虚线效果
 */
export const DashedLine3D: React.FC<DashedLine3DProps> = ({
  startPoint,
  endPoint,
  color,
  isActive
}) => {
  const materialRef = useRef<THREE.LineDashedMaterial>(null);
  const dashOffsetRef = useRef(0);

  // 解析颜色
  const { color: rgbColor, opacity } = useMemo(() => {
    const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
      return {
        color: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`,
        opacity: a * (isActive ? 1.0 : 0.5)
      };
    }
    if (color.startsWith('#')) {
      return { color, opacity: isActive ? 1.0 : 0.5 };
    }
    return { color: '#ffffff', opacity: isActive ? 1.0 : 0.5 };
  }, [color, isActive]);

  // 创建几何体数据（手动计算线段距离）
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();

    // 设置位置属性
    const positions = new Float32Array([
      startPoint.x, startPoint.y, startPoint.z,
      endPoint.x, endPoint.y, endPoint.z
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 手动计算线段距离（用于虚线材质）
    const distances = new Float32Array([0, 1]);
    geom.setAttribute('lineDistance', new THREE.BufferAttribute(distances, 1));

    return geom;
  }, [startPoint, endPoint]);

  // 动画更新
  useFrame(() => {
    if (materialRef.current && isActive) {
      dashOffsetRef.current -= 0.01;
      materialRef.current.dashOffset = dashOffsetRef.current;
    }
  });

  return (
    <line geometry={geometry}>
      <lineDashedMaterial
        ref={materialRef}
        color={rgbColor}
        dashSize={0.3}
        gapSize={0.2}
        scale={1}
        dashOffset={0}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </line>
  );
};

export default DashedLine3D;
