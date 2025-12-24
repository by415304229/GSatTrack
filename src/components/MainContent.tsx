import { RefreshCw } from 'lucide-react';
import React from 'react';
import { PlaneMonitor } from './PlaneMonitor';
import type { ArcSegment, ArcVisualizationConfig } from '../types/arc.types';

interface MainContentProps {
  loading: boolean;
  group?: {
    id: string;
    name: string;
    description?: string;
    tles: Array<{
      name: string;
      satId: string;
      line1: string;
      line2: string;
    }>;
  };
  simTime: Date;
  stations: Array<{
    id: string;
    name: string;
    lat: number;
    lon: number;
    color: string;
  }>;
  viewMode: '3d' | '2d' | 'split';
  orbitWindowMinutes: number;
  selectedSatellites: Set<string>;
  timeRate?: number;
  // 弧段数据
  arcs?: ArcSegment[];
  arcVisualizationConfig?: ArcVisualizationConfig;
}

const MainContent: React.FC<MainContentProps> = ({
  loading,
  group,
  simTime,
  stations,
  viewMode,
  orbitWindowMinutes,
  selectedSatellites,
  timeRate,
  arcs,
  arcVisualizationConfig
}) => {
  if (loading) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <RefreshCw className="animate-spin text-cyan-400" size={32} />
          <div className="text-xs font-mono text-cyan-500/80">初始化轨道动力学系统...</div>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-slate-600 font-mono text-sm">未找到卫星数据</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col relative">
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          <PlaneMonitor
            group={group}
            active={true}
            simulatedTime={simTime}
            groundStations={stations}
            viewMode={viewMode}
            orbitWindowMinutes={orbitWindowMinutes}
            selectedSatellites={selectedSatellites}
            timeRate={timeRate}
            arcs={arcs}
            arcVisualizationConfig={arcVisualizationConfig}
          />
        </div>
      </div>
    </main>
  );
};

export default MainContent;