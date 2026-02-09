import { FileText, Satellite, Settings } from 'lucide-react';
import React from 'react';
import { StationPanel } from './StationPanel';
import { TimeControls } from './TimeControls';
import { ViewToggle } from './ViewToggle';

interface HeaderProps {
  simTime: Date;
  timeRate: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onRateChange: (rate: number) => void;
  onResetToRealTime: () => void;
  viewMode: '3d' | '2d' | 'split';
  onViewModeChange: (mode: '3d' | '2d' | 'split') => void;
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    color: string;
  }>;
  onAddStation: (name: string, lat: number, lon: number) => void;
  onRemoveStation: (id: string) => void;
  onSettingsOpen: () => void;
  onTLEImportOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({
  simTime,
  timeRate,
  isPaused,
  onPauseToggle,
  onRateChange,
  onResetToRealTime,
  viewMode,
  onViewModeChange,
  stations,
  onAddStation,
  onRemoveStation,
  onSettingsOpen,
  onTLEImportOpen
}) => {
  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#050914] shrink-0 relative z-20">
      {/* 左侧：Logo */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Satellite className="text-cyan-400" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl leading-none tracking-tighter text-white">
              格思航天
              <span className="text-cyan-500">长管系统</span>
            </h1>
            <div className="text-xs text-cyan-600 font-mono tracking-[0.15em] uppercase mt-1">
              全球卫星跟踪
            </div>
          </div>
        </div>
      </div>

      {/* 中间：北京时间显示 - 绝对居中 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <TimeControls
          time={simTime}
          rate={timeRate}
          paused={isPaused}
          onPauseToggle={onPauseToggle}
          onRateChange={onRateChange}
          onResetToRealTime={onResetToRealTime}
        />
      </div>

      {/* 右侧：视图切换 + 地面站 + 设置 + 导入TLE */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
        <StationPanel
          stations={stations}
          onAdd={onAddStation}
          onRemove={onRemoveStation}
        />
        <button
          onClick={onSettingsOpen}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-sm font-bold transition-colors flex items-center gap-1.5"
        >
          <Settings size={14} />
          设置
        </button>
        <button
          onClick={onTLEImportOpen}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-sm font-bold transition-colors flex items-center gap-1.5"
        >
          <FileText size={14} />
          导入TLE
        </button>
      </div>
    </header>
  );
};

export default Header;