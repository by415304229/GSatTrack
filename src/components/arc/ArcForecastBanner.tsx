/**
 * 弧段预报横幅组件
 * 显示正在入境的卫星（ACTIVE 状态）
 * 每个弧段独立显示为紧凑悬浮条，可单独关闭
 */

import { Clock, Radio } from 'lucide-react';
import React from 'react';
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
}

const ArcBarItem: React.FC<ArcBarItemProps> = ({ arc }) => {
  const cityName = extractCityName(arc.siteName) || arc.siteName;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={10} className="text-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs text-slate-300">{arc.satName}入境</span>
          <span className="text-xs text-emerald-400">{cityName}</span>
        </div>
        <span className="text-xs text-emerald-400 font-mono font-bold tabular-nums">
          {formatRemainingTimeShort(arc.timeToEnd)}
        </span>
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
  // 如果没有数据且不在加载中，不显示
  if (activeArcs.length === 0 && !isLoading && !error) {
    return null;
  }

  // 只在首次加载（不是后台刷新）且没有数据时显示 loading
  const shouldShowLoading = isLoading && !isRefreshing && activeArcs.length === 0;

  return (
    <div className="fixed top-[23rem] left-0 z-20 w-80 bg-[#020617]/60 backdrop-blur border border-emerald-500/30 rounded-t-none shadow-lg">
      {/* 面板标题 */}
      <div className="px-3 py-2 border-b border-emerald-500/20 flex items-center gap-2">
        <Radio size={12} className="text-emerald-400 animate-pulse shrink-0" />
        <span className="text-xs font-bold text-emerald-400">正在入境</span>
        <span className="text-[10px] text-slate-500 ml-auto">
          {activeArcs.length} 条活跃
        </span>
      </div>

      {/* 弧段列表 */}
      <div className="p-2 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {shouldShowLoading ? (
          <div className="text-xs text-slate-500 text-center py-2">加载中...</div>
        ) : error ? (
          <div className="text-xs text-red-400 text-center py-2">{error}</div>
        ) : activeArcs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 py-2">
            <Clock size={10} />
            暂无活跃弧段
          </div>
        ) : (
          activeArcs.map((arc) => (
            <ArcBarItem
              key={arc.taskID}
              arc={arc}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ArcForecastBanner;
