/**
 * 弧段预报横幅组件
 * 显示正在入境的卫星（ACTIVE 状态）
 * 每个弧段独立显示为紧凑悬浮条，可单独关闭
 */

import { Clock, Radio, X } from 'lucide-react';
import React, { useState } from 'react';
import type { ArcWithStatus } from '../../types/arc.types';
import { extractCityName } from '../../utils/arcVisualization';
import { formatRemainingTimeShort } from '../../utils/arcTimeUtils';

interface ArcForecastBannerProps {
  activeArcs: ArcWithStatus[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
}

/**
 * 单个弧段悬浮条组件
 */
interface ArcBarItemProps {
  arc: ArcWithStatus;
  onClose: () => void;
}

const ArcBarItem: React.FC<ArcBarItemProps> = ({ arc, onClose }) => {
  const cityName = extractCityName(arc.siteName) || arc.siteName;

  return (
    <div className="bg-[#020617]/60 backdrop-blur border border-emerald-500/30 rounded-lg px-4 py-2.5 shadow-lg">
      <div className="flex items-center gap-8 text-xs">
        <Radio size={12} className="text-emerald-400 animate-pulse shrink-0" />
        <span className="text-slate-300 whitespace-nowrap">
          {arc.satName}
        </span>
        <span className="text-emerald-400 whitespace-nowrap">
          {cityName}
        </span>
        <span className="text-emerald-400 font-mono font-bold tabular-nums text-sm ml-auto">
          {formatRemainingTimeShort(arc.timeToEnd)}
        </span>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-slate-700/50 rounded-full transition-colors shrink-0"
        >
          <X size={10} className="text-slate-500 hover:text-slate-300" />
        </button>
      </div>
    </div>
  );
};

/**
 * 弧段预报横幅组件
 * 屏幕中央上方显示正在入境的卫星（ACTIVE 状态）
 */
export const ArcForecastBanner: React.FC<ArcForecastBannerProps> = ({
  activeArcs,
  isLoading = false,
  isRefreshing = false,
  error = null
}) => {
  // 跟踪被用户关闭的弧段ID
  const [hiddenArcIds, setHiddenArcIds] = useState<Set<number>>(new Set());

  // 过滤已关闭的弧段
  const displayArcs = activeArcs.filter(arc => !hiddenArcIds.has(arc.taskID));

  // 关闭单个弧段
  const handleCloseArc = (taskId: number) => {
    setHiddenArcIds(prev => new Set(prev).add(taskId));
  };

  // 如果没有数据且不在加载中，不显示
  if (displayArcs.length === 0 && !isLoading && !error) {
    return null;
  }

  // 只在首次加载（不是后台刷新）且没有数据时显示 loading
  const shouldShowLoading = isLoading && !isRefreshing && displayArcs.length === 0;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2">
      {shouldShowLoading ? (
        <div className="bg-[#020617]/60 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-2 shadow-lg">
          <span className="text-xs text-slate-500">加载中...</span>
        </div>
      ) : error ? (
        <div className="bg-[#020617]/60 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-2 shadow-lg">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      ) : displayArcs.length === 0 ? (
        <div className="bg-[#020617]/60 backdrop-blur border border-slate-700/50 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock size={10} />
            暂无活跃弧段
          </div>
        </div>
      ) : (
        displayArcs.map((arc) => (
          <ArcBarItem
            key={arc.taskID}
            arc={arc}
            onClose={() => handleCloseArc(arc.taskID)}
          />
        ))
      )}
    </div>
  );
};

export default ArcForecastBanner;
