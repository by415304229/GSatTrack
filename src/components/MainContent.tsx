import { RefreshCw } from 'lucide-react';
import React from 'react';
import { PlaneMonitor } from './PlaneMonitor';

interface MainContentProps {
  loading: boolean;
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
}

const MainContent: React.FC<MainContentProps> = ({
  loading,
  groups,
  activeGroups,
  simTime,
  stations,
  viewMode,
  orbitWindowMinutes,
  selectedSatellites
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

  return (
    <main className="flex-1 overflow-hidden flex flex-col relative">
      <div className="flex-1 flex flex-col">
        {activeGroups.map(groupId => {
          const group = groups.find(g => g.id === groupId);
          if (!group) return null;
          return (
            <div key={groupId} className="flex-1 border-b border-slate-800 last:border-0">
              <PlaneMonitor
                group={group}
                active={true}
                simulatedTime={simTime}
                groundStations={stations}
                viewMode={viewMode}
                orbitWindowMinutes={orbitWindowMinutes}
                selectedSatellites={selectedSatellites}
              />
            </div>
          );
        })}
        {activeGroups.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm">
            未选择活动数据源
          </div>
        )}
      </div>
    </main>
  );
};

export default MainContent;