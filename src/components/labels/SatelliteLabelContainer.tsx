/**
 * 卫星标签容器组件
 * 批量管理所有卫星标签的渲染
 */
import React from 'react';
import { SatelliteLabel } from './SatelliteLabel';
import type { SatellitePos } from '../../types';
import type { SatelliteLabelConfig } from '../../types/label.types';

interface SatelliteLabelContainerProps {
  /** 卫星位置列表 */
  satellites: SatellitePos[];
  /** 标签配置 */
  config: SatelliteLabelConfig;
}

export const SatelliteLabelContainer: React.FC<SatelliteLabelContainerProps> = ({
  satellites,
  config
}) => {
  if (!config.enabled) {
    return null;
  }

  return (
    <group>
      {satellites.map((sat) => (
        <SatelliteLabel
          key={sat.id}
          position={{ x: sat.x, y: sat.y, z: sat.z }}
          name={sat.displayName || sat.name}
          config={config}
        />
      ))}
    </group>
  );
};
