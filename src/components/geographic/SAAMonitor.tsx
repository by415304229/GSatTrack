/**
 * SAA区域监控面板
 * 显示进入SAA区域的卫星列表
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { SAAEntryEvent } from '../../types/geographic.types';

interface SAAMonitorProps {
  events: SAAEntryEvent[];
  visible: boolean;
}

/**
 * SAA监控面板组件
 */
export const SAAMonitor: React.FC<SAAMonitorProps> = ({
  events,
  visible
}) => {
  // 过滤活跃事件（未退出的）
  const activeEvents = useMemo(() => {
    return events.filter(event => !event.exitTime);
  }, [events]);

  if (!visible || activeEvents.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-slate-900/90 border border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm z-50">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <h3 className="text-sm font-bold text-white">SAA区域警告</h3>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {activeEvents.map(event => (
          <div
            key={event.satelliteId}
            className="bg-slate-800/50 rounded p-2 border border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400">
                {event.satelliteName}
              </span>
              <span className="text-[10px] text-yellow-500">
                进入中
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              位置: {event.position.lat.toFixed(2)}°, {event.position.lon.toFixed(2)}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SAAMonitor;
