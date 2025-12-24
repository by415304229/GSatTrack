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
    <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#050914] shrink-0 relative z-20">
      {/* Logo and Title - 靠左 */}
      <div className="flex items-center gap-4 absolute left-6">
        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <Satellite className="text-cyan-400" size={24} />
        </div>
        <div>
          <h1 className="font-black text-xl leading-none tracking-tighter text-white">
            格思航天
            <span className="text-cyan-500">长管系统</span>
          </h1>
          <div className="text-[10px] text-cyan-600 font-mono tracking-[0.2em] uppercase mt-1">
            全球卫星跟踪
          </div>
        </div>
      </div>

      {/* Center Controls - 居中 */}
      <div className="flex items-center gap-4 mx-auto">
        <TimeControls
          time={simTime}
          rate={timeRate}
          paused={isPaused}
          onPauseToggle={onPauseToggle}
          onRateChange={onRateChange}
          onResetToRealTime={onResetToRealTime}
        />
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
        <StationPanel
          stations={stations}
          onAdd={onAddStation}
          onRemove={onRemoveStation}
        />
        <button
          onClick={onSettingsOpen}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1.5"
        >
          <Settings size={12} />
          设置
        </button>
        <button
          onClick={onTLEImportOpen}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1.5"
        >
          <FileText size={12} />
          导入TLE
        </button>
      </div>
    </header>
  );
};

export default Header;