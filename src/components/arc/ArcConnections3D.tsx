/**
 * 弧段连线3D渲染组件
 * 在3D场景中绘制卫星与地面站的连线
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ArcConnection3D } from '../../utils/arcVisualization';

interface ArcConnections3DProps {
  connections: ArcConnection3D[];
  lineWidth?: number;
}

/**
 * 弧段连线3D组件
 */
export const ArcConnections3D: React.FC<ArcConnections3DProps> = ({
  connections,
  lineWidth = 1.5
}) => {
  // 使用useMemo缓存几何体数据
  const lineData = useMemo(() => {
    return connections.map((conn) => {
      // 解析颜色
      const color = new THREE.Color(conn.color);

      // 创建位置数组
      const positions = new Float32Array([
        conn.satellite.x, conn.satellite.y, conn.satellite.z,
        conn.station.x, conn.station.y, conn.station.z
      ]);

      return { positions, color: color.getStyle(), isActive: conn.isActive };
    });
  }, [connections]);

  if (lineData.length === 0) {
    return null;
  }

  return (
    <group>
      {lineData.map((data, index) => (
        <line key={`arc-connection-${index}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={data.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={data.color}
            transparent
            opacity={data.isActive ? 0.8 : 0.3}
            linewidth={lineWidth}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
};

export default ArcConnections3D;
