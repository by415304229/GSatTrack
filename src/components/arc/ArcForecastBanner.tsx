/**
 * 弧段预报横幅组件
 * 显示在屏幕中央上方的弧段预报信息
 */

import { Clock, Radio, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { ArcWithStatus } from '../../types/arc.types';
import { ArcCountdown } from './ArcCountdown';

interface ArcForecastBannerProps {
  arcs: ArcWithStatus[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 弧段预报横幅组件
 * 屏幕中央上方显示，最多4条预报信息
 */
export const ArcForecastBanner: React.FC<ArcForecastBannerProps> = ({
  arcs,
  isLoading = false,
  error = null
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // 如果没有数据且不在加载中，不显示
  const shouldShow = isVisible && (arcs.length > 0 || isLoading || error);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-[#020617]/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl max-w-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-cyan-400" />
            <span className="text-xs font-bold text-white">弧段预报</span>
            {arcs.length > 0 && (
              <span className="text-[10px] text-slate-500">
                ({arcs.length}条)
              </span>
            )}
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X size={12} className="text-slate-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-xs text-slate-500">加载中...</div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-xs text-red-400">{error}</div>
            </div>
          ) : arcs.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-xs text-slate-600 flex items-center justify-center gap-2">
                <Clock size={12} />
                暂无预报弧段
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {arcs.map((arc) => (
                <ArcCountdown
                  key={arc.taskID}
                  arc={arc}
                  showIcon={true}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArcForecastBanner;
