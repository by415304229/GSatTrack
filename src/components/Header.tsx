import clsx from 'clsx';
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
  groups: Array<{
    id: string;
    name: string;
    description?: string;
    tles: Array<{
      name: string;
      satId: string;
      line1: string;
      line2: string;
    }>;
  }>;
  activeGroups: string[];
  onActiveGroupsChange: (groups: string[]) => void;
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
  onTLEImportOpen,
  groups,
  activeGroups,
  onActiveGroupsChange
}) => {
  return (
    <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#050914] shrink-0 justify-between relative z-20">
      {/* Logo and Title */}
      <div className="flex items-center gap-4">
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

      {/* Center Controls */}
      <div className="flex items-center gap-4">
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
          SETTINGS
        </button>
        <button
          onClick={onTLEImportOpen}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1.5"
        >
          <FileText size={12} />
          导入TLE
        </button>
      </div>

      {/* Group Switcher */}
      <div className="flex items-center gap-2">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => {
              // 互斥切换逻辑：点击已激活的组不做操作，点击新组则只激活该组
              if (!activeGroups.includes(g.id)) {
                onActiveGroupsChange([g.id]);
              }
            }}
            className={clsx(
              "px-3 py-1.5 text-[10px] font-bold rounded transition-all border uppercase tracking-wider",
              activeGroups.includes(g.id)
                ? "bg-cyan-950 text-cyan-400 border-cyan-500/50"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300"
            )}
          >
            {g.name}
          </button>
        ))}
      </div>
    </header>
  );
};

export default Header;