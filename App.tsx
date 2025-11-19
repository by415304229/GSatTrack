import React, { useEffect, useState } from 'react';
import { fetchSatelliteGroups } from './services/satelliteService';
import { getSatellitePosition, calculateOrbitPath } from './utils/satMath';
import { OrbitalPlaneGroup, SatellitePos } from './types';
import Earth3D from './components/Earth3D';
import Map2D from './components/Map2D';
import { Activity, Globe, Map as MapIcon, RefreshCw, Satellite } from 'lucide-react';

// Plane Monitor Component: Handles the math loop for a specific group
const PlaneMonitor = ({ group, active }: { group: OrbitalPlaneGroup; active: boolean }) => {
  const [satellites, setSatellites] = useState<SatellitePos[]>([]);
  
  // Update Loop
  useEffect(() => {
    if (!active) return;

    const update = () => {
      const now = new Date();
      
      // Process satellite positions
      // We calculate orbit paths for the first 60 satellites to maintain high performance
      // while satisfying the requirement for >50 satellites.
      const positions = group.tles.map((tle, idx) => {
        const pos = getSatellitePosition(tle, now);
        if (pos) {
            // Recalculate orbit path every frame to ensure it aligns with the rotating ECEF earth
            if (idx < 60) {
                pos.orbitPath = calculateOrbitPath(tle);
            }
        }
        return pos;
      }).filter(p => p !== null) as SatellitePos[];
      
      setSatellites(positions);
    };

    const interval = setInterval(update, 1000); // Update every second
    update(); // Initial

    return () => clearInterval(interval);
  }, [group, active]);

  if (!active) return null;

  // Determine theme color based on group ID
  const themeColor = group.id.includes('starlink') ? '#0ea5e9' : group.id.includes('gps') ? '#eab308' : '#22c55e';

  return (
    <div className="flex flex-col h-full border-t border-slate-700 bg-slate-900/50">
        {/* Monitor Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-2">
                <Activity size={16} color={themeColor} />
                <span className="font-bold text-sm tracking-wider" style={{color: themeColor}}>{group.name.toUpperCase()} PLANES</span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{satellites.length} UNITS</span>
            </div>
            <div className="text-xs font-mono text-slate-500">
                ALT: ~{satellites[0]?.alt.toFixed(0) || 0}km
            </div>
        </div>

        {/* Visualization Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0">
            <div className="relative flex flex-col min-h-[300px] lg:min-h-0">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    <Globe size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-200">3D INERTIAL VIEW</span>
                </div>
                <Earth3D satellites={satellites} color={themeColor} />
            </div>
            <div className="relative flex flex-col min-h-[300px] lg:min-h-0">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                    <MapIcon size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-200">SUB-SATELLITE POINTS</span>
                </div>
                <Map2D satellites={satellites} color={themeColor} />
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
      // Default activate all or first
      if (data.length > 0) setActiveGroups([data[0].id]);
      setLoading(false);
    };
    load();
  }, []);

  const toggleGroup = (id: string) => {
    setActiveGroups(prev => {
        if (prev.includes(id)) {
            // Prevent closing the last one
            if (prev.length === 1) return prev;
            return prev.filter(g => g !== id);
        }
        return [...prev, id];
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center px-6 bg-slate-900 shrink-0 justify-between">
        <div className="flex items-center gap-3">
            <Satellite className="text-cyan-500" />
            <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight">ORBITAL OPS</h1>
                <div className="text-[10px] text-slate-400 tracking-widest">MULTI-PLANE TRACKING SYSTEM</div>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="hidden md:flex gap-2">
                 {groups.map(g => (
                     <button 
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className={`px-3 py-1 text-xs font-bold rounded border transition-all ${
                            activeGroups.includes(g.id) 
                            ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                            : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                        }`}
                     >
                        {g.name}
                     </button>
                 ))}
             </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {loading ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
                <RefreshCw className="animate-spin text-cyan-500" size={32} />
                <div className="text-sm text-slate-400 animate-pulse">ACQUIRING TELEMETRY...</div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col">
                 {/* Render active groups */}
                 {activeGroups.map(groupId => {
                     const group = groups.find(g => g.id === groupId);
                     if (!group) return null;
                     return (
                         <div key={groupId} className="flex-1 min-h-[500px] flex flex-col">
                             <PlaneMonitor group={group} active={true} />
                         </div>
                     );
                 })}
                 
                 {/* Empty State */}
                 {activeGroups.length === 0 && (
                     <div className="flex-1 flex items-center justify-center text-slate-600">
                         Select an Orbital Plane to begin tracking.
                     </div>
                 )}
            </div>
        )}
      </main>
      
      {/* Footer Status */}
      <footer className="h-6 bg-slate-900 border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-500 justify-between shrink-0">
          <div className="flex gap-4">
              <span>SYSTEM: NOMINAL</span>
              <span>DATA SOURCE: CELESTRAK</span>
          </div>
          <div>
              RENDERER: THREE.JS / CANVAS 2D
          </div>
      </footer>
    </div>
  );
}