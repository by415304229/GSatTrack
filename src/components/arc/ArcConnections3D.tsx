/**
 * 弧段连线3D渲染组件
 * 在3D场景中绘制卫星与地面站的连线
 */

import React from 'react';
import type { ArcConnection3D } from '../../utils/arcVisualization';
import { ArcLine3D } from './ArcLine3D';

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
  if (connections.length === 0) {
    return null;
  }

  return (
    <>
      {connections.map((conn, index) => (
        <ArcLine3D
          key={`arc-connection-${index}`}
          startPoint={conn.satellite}
          endPoint={conn.station}
          color={conn.color}
          isActive={conn.isActive}
        />
      ))}
    </>
  );
};

export default ArcConnections3D;
