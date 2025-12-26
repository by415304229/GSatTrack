/**
 * 弧段预报左上角面板
 * 显示即将入境的卫星列表
 * 支持折叠/展开功能
 */

import { ChevronRight, ChevronLeft, Clock, Radio } from 'lucide-react';
import React, { useState } from 'react';
import type { ArcWithStatus } from '../../types/arc.types';
import { extractCityName } from '../../utils/arcVisualization';
import { formatCountdownShort, formatTimeRange } from '../../utils/arcTimeUtils';

interface ArcUpcomingPanelProps {
  upcomingArcs: ArcWithStatus[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 单个即将入境弧段项
 */
interface ArcUpcomingItemProps {
  arc: ArcWithStatus;
}

const ArcUpcomingItem: React.FC<ArcUpcomingItemProps> = ({ arc }) => {
  const cityName = extractCityName(arc.siteName) || arc.siteName;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={10} className="text-amber-400 shrink-0" />
          <span className="text-xs text-slate-300">{arc.satName}</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono font-bold tabular-nums">
          {formatCountdownShort(arc.timeToStart)}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-slate-500">{cityName}</span>
        <span className="text-[9px] text-slate-600 font-mono">
          {formatTimeRange(arc.startTime, arc.endTime)}
        </span>
      </div>
    </div>
  );
};

/**
 * 左上角即将入境面板组件
 * 支持折叠/展开
 */
export const ArcUpcomingPanel: React.FC<ArcUpcomingPanelProps> = ({
  upcomingArcs,
  isLoading = false,
  error = null
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 最多显示4条
  const displayArcs = upcomingArcs.slice(0, 4);

  // 如果没有数据且不在加载中，不显示
  const shouldShow = displayArcs.length > 0 || isLoading || error;
  if (!shouldShow) {
    return null;
  }

  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  return (
    <div className="fixed top-20 left-0 z-20">
      {isCollapsed ? (
        // 折叠状态：只显示一个可点击的竖条
        <button
          onClick={toggleCollapse}
          className="bg-[#020617]/80 backdrop-blur border border-amber-500/30 border-l-0 rounded-r-lg shadow-lg px-2 py-3 hover:bg-amber-500/10 transition-colors"
          title="即将入境"
        >
          <Clock size={16} className="text-amber-400" />
        </button>
      ) : (
        // 展开状态：显示完整面板
        <div className="w-80 bg-[#020617]/60 backdrop-blur border border-amber-500/30 rounded-lg shadow-lg">
          {/* 面板标题 */}
          <div className="px-3 py-2 border-b border-amber-500/20 flex items-center gap-2">
            <Clock size={12} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-400">即将入境</span>
            <span className="text-[10px] text-slate-500 ml-auto">
              {displayArcs.length} 条预报
            </span>
            <button
              onClick={toggleCollapse}
              className="p-1 hover:bg-amber-500/10 rounded transition-colors"
              title="折叠"
            >
              <ChevronLeft size={14} className="text-amber-400" />
            </button>
          </div>

          {/* 弧段列表 */}
          <div className="p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {displayArcs.map((arc) => (
              <ArcUpcomingItem key={arc.taskID} arc={arc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArcUpcomingPanel;
