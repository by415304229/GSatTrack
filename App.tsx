import React, { useEffect, useState } from 'react';
import { fetchSatelliteGroups } from './services/satelliteService';
import { getSatellitePosition, calculateOrbitPath } from './utils/satMath';
import { OrbitalPlaneGroup, SatellitePos } from './types';
import Earth3D from './components/Earth3D';
import Map2D from './components/Map2D';
import { Activity, Globe, Map as MapIcon, RefreshCw, Satellite, Zap, Radio } from 'lucide-react';

// Neon Sci-Fi Palette
const ORBIT_COLORS = [
    '#00f3ff', // Cyan
    '#bd00ff', // Neon Purple
    '#00ff9f', // Neon Green
    '#ff0055', // Neon Red
    '#fcee0a', // Neon Yellow
    '#ff9100', // Neon Orange
];

// Plane Monitor Component
const PlaneMonitor = ({ group, active }: { group: OrbitalPlaneGroup; active: boolean }) => {
  const [satellites, setSatellites] = useState<SatellitePos[]>([]);
  
  useEffect(() => {
    if (!active) return;

    const update = () => {
      const now = new Date();
      
      const positions = group.tles.map((tle, idx) => {
        const pos = getSatellitePosition(tle, now);
        if (pos) {
            // Calculate orbits for enough sats to look cool, but not melt CPU
            if (idx < 75) {
                pos.orbitPath = calculateOrbitPath(tle);
            }
            // Assign color based on index
            pos.color = ORBIT_COLORS[idx % ORBIT_COLORS.length];
        }
        return pos;
      }).filter(p => p !== null) as SatellitePos[];
      
      setSatellites(positions);
    };

    const interval = setInterval(update, 1000); 
    update(); 

    return () => clearInterval(interval);
  }, [group, active]);

  if (!active) return null;

  return (
    <div className="flex flex-col h-full bg-[#020617] relative">
        {/* Decorative HUD lines */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

        {/* Monitor Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0B1120] border-b border-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-sm opacity-50 animate-pulse rounded-full"></div>
                    <Activity size={18} className="text-cyan-400 relative z-10" />
                </div>
                <div>
                    <h2 className="font-mono font-bold text-base text-slate-100 tracking-widest uppercase">
                        {group.name}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-cyan-500/70 font-mono">
                        <span>STATUS: ORBITAL</span>
                        <span>•</span>
                        <span>TRACKING: {satellites.length}</span>
                    </div>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-xs font-mono text-slate-400">ALTITUDE AVG</div>
                <div className="text-lg font-mono font-bold text-white leading-none">
                    ~{satellites[0]?.alt.toFixed(0) || 0}<span className="text-xs text-slate-500 ml-1">KM</span>
                </div>
            </div>
        </div>

        {/* Visualization Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
            <div className="relative flex flex-col min-h-[300px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                    <Globe size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D INERTIAL VISUALIZER</span>
                </div>
                <div className="flex-1 p-4 bg-[#020617]">
                    <Earth3D satellites={satellites} />
                </div>
            </div>
            <div className="relative flex flex-col min-h-[300px] lg:min-h-0">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                    <MapIcon size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">GROUND TRACK TELEMETRY</span>
                </div>
                <div className="flex-1 p-4 bg-[#020617]">
                    <Map2D satellites={satellites} />
                </div>
            </div>
        </div>
    </div>
  );
};

export default function App() {
  const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchSatelliteGroups();
      setGroups(data);
      if (data.length > 0) setActiveGroups([data[0].id]);
      setLoading(false);
    };
    load();
  }, []);

  const toggleGroup = (id: string) => {
    setActiveGroups(prev => {
        if (prev.includes(id)) {
            if (prev.length === 1) return prev;
            return prev.filter(g => g !== id);
        }
        return [...prev, id];
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-[#050914] shrink-0 justify-between relative z-20">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Satellite className="text-cyan-400" size={24} />
            </div>
            <div>
                <h1 className="font-black text-xl leading-none tracking-tighter text-white">
                    ORBITAL<span className="text-cyan-500">OPS</span>
                </h1>
                <div className="text-[10px] text-cyan-600 font-mono tracking-[0.2em] uppercase mt-1">
                    Qianfan Global Tracking
                </div>
            </div>
        </div>
        
        {/* Group Selectors */}
        <div className="flex items-center gap-2">
             {groups.map(g => (
                 <button 
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    className={`group relative px-4 py-2 text-xs font-bold rounded transition-all overflow-hidden ${
                        activeGroups.includes(g.id) 
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700'
                    }`}
                 >
                    <span className="relative z-10 uppercase tracking-wider font-mono">{g.name}</span>
                    {activeGroups.includes(g.id) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                 </button>
             ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        {loading ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-6 z-10">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                    <RefreshCw className="animate-spin text-cyan-400 relative z-10" size={48} />
                </div>
                <div className="font-mono text-sm text-cyan-500/80 animate-pulse flex items-center gap-2">
                    <Radio size={14} className="animate-ping" />
                    ESTABLISHING UPLINK...
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col z-10">
                 {activeGroups.map(groupId => {
                     const group = groups.find(g => g.id === groupId);
                     if (!group) return null;
                     return (
                         <div key={groupId} className="flex-1 flex flex-col">
                             <PlaneMonitor group={group} active={true} />
                         </div>
                     );
                 })}
            </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="h-8 bg-[#050914] border-t border-slate-800 flex items-center px-6 text-[10px] font-mono text-slate-600 justify-between shrink-0 z-20">
          <div className="flex gap-6">
              <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-slate-400">SYSTEM ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <Zap size={10} className="text-yellow-500" />
                  <span className="text-slate-400">LIVE FEED: CELESTRAK</span>
              </div>
          </div>
          <div className="tracking-widest opacity-50">
              SECURE TERMINAL // V.2.4.0
          </div>
      </footer>
    </div>
  );
}