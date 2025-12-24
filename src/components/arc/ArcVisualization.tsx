/**
 * 弧段可视化配置组件
 * 用于设置面板中配置弧段连线显示
 */

import { Eye, EyeOff } from 'lucide-react';
import React from 'react';
import type { ArcVisualizationConfig } from '../../types/arc.types';

interface ArcVisualizationProps {
  config: ArcVisualizationConfig;
  onConfigChange: (config: Partial<ArcVisualizationConfig>) => void;
}

/**
 * 弧段可视化配置组件
 * 用于设置面板中
 */
export const ArcVisualization: React.FC<ArcVisualizationProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide">
        弧段连线
      </h3>

      <div className="space-y-2">
        {/* 启用/禁用 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">显示弧段连线</span>
          <button
            onClick={() => onConfigChange({ enabled: !config.enabled })}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            {config.enabled ? (
              <Eye size={14} className="text-cyan-400" />
            ) : (
              <EyeOff size={14} className="text-slate-500" />
            )}
          </button>
        </div>

        {config.enabled && (
          <>
            {/* 仅显示活跃弧段 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">仅显示活跃</span>
              <input
                type="checkbox"
                checked={config.showActiveOnly}
                onChange={(e) => onConfigChange({ showActiveOnly: e.target.checked })}
                className="rounded text-cyan-600 bg-slate-800 border-slate-600"
              />
            </div>

            {/* 线宽 */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-slate-400">连线宽度</span>
                <span className="text-[10px] text-cyan-400">{config.lineWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={config.lineWidth}
                onChange={(e) => onConfigChange({ lineWidth: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* 动画效果 */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">动画效果</span>
              <input
                type="checkbox"
                checked={config.animate}
                onChange={(e) => onConfigChange({ animate: e.target.checked })}
                className="rounded text-cyan-600 bg-slate-800 border-slate-600"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArcVisualization;
