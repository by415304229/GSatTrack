
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchSatelliteGroups } from './services/satelliteService';
import { getSatellitePosition, calculateOrbitPath } from './utils/satMath';
import { OrbitalPlaneGroup, SatellitePos, GroundStation } from './types';
import Earth3D from './components/Earth3D';
import Map2D from './components/Map2D';
import SatelliteDetail from './components/SatelliteDetail';
import { Activity, Globe, Map as MapIcon, RefreshCw, Satellite, Zap, Radio, Play, Pause, FastForward, Plus, MapPin, Clock } from 'lucide-react';
import clsx from 'clsx';

const ORBIT_COLORS = ['#06b6d4', '#3b82f6'];

// --- Time Control Components ---
const TimeControls = ({ 
    time, 
    rate, 
    paused, 
    onTogglePause, 
    onChangeRate, 
    onReset 
}: { 
    time: Date, 
    rate: number, 
    paused: boolean, 
    onTogglePause: () => void, 
    onChangeRate: (r: number) => void,
    onReset: () => void
}) => {
    return (
        <div className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 rounded-md px-3 py-1.5">
            <div className="font-mono text-xs text-cyan-400 w-[140px]">
                {time.toISOString().replace('T', ' ').substring(0, 19)} UTC
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <button onClick={onTogglePause} className="hover:text-cyan-400 transition-colors">
                {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>
            <button onClick={onReset} className="text-[10px] font-bold hover:text-cyan-400 px-2">LIVE</button>
            <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
                {[1, 10, 100, 1000].map(r => (
                    <button 
                        key={r}
                        onClick={() => onChangeRate(r)}
                        className={clsx(
                            "px-2 py-0.5 text-[10px] font-mono border-r border-slate-800 last:border-0 hover:bg-slate-800 transition-colors",
                            rate === r ? "bg-cyan-900 text-cyan-400" : "text-slate-400"
                        )}
                    >
                        {r}x
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Ground Station UI ---
const StationPanel = ({ 
    stations, 
    onAdd, 
    onRemove 
}: { 
    stations: GroundStation[], 
    onAdd: (name: string, lat: number, lon: number) => void, 
    onRemove: (id: string) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLat, setNewLat] = useState('');
    const [newLon, setNewLon] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && newLat && newLon) {
            onAdd(newName, parseFloat(newLat), parseFloat(newLon));
            setNewName(''); setNewLat(''); setNewLon('');
            setIsOpen(false);
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0B1120] border border-slate-800 rounded-md hover:border-cyan-500/50 transition-colors"
            >
                <MapPin size={14} className="text-emerald-500" />
                <span className="text-xs font-mono">STATIONS ({stations.length})</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#020617] border border-slate-700 rounded-md shadow-xl z-50 p-4">
                    <h3 className="text-xs font-bold text-white mb-3 flex justify-between">
                        GROUND STATIONS
                        <button onClick={() => setIsOpen(false)}><Plus size={14} className="rotate-45" /></button>
                    </h3>
                    
                    <div className="space-y-2 max-h-[150px] overflow-y-auto mb-4">
                        {stations.map(st => (
                            <div key={st.id} className="flex justify-between items-center text-[10px] font-mono bg-slate-900 p-2 rounded border border-slate-800">
                                <span className="text-emerald-400">{st.name}</span>
                                <button onClick={() => onRemove(st.id)} className="text-red-400 hover:text-red-300">DEL</button>
                            </div>
                        ))}
                        {stations.length === 0 && <div className="text-[10px] text-slate-600 italic">No active stations</div>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-800 pt-3">
                        <input 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs" 
                            placeholder="Station Name" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input 
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs" 
                                placeholder="Lat" 
                                type="number"
                                value={newLat}
                                onChange={e => setNewLat(e.target.value)}
                            />
                            <input 
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs" 
                                placeholder="Lon" 
                                type="number"
                                value={newLon}
                                onChange={e => setNewLon(e.target.value)}
                            />
                        </div>
                        <button className="w-full py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-bold">ADD STATION</button>
                    </form>
                </div>
            )}
        </div>
    );
};

// --- View Mode Toggle ---
const ViewToggle = ({ mode, onChange }: { mode: '3d' | '2d' | 'split', onChange: (mode: '3d' | '2d' | 'split') => void }) => {
    return (
        <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
            <button 
                onClick={() => onChange('3d')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5 border-r border-slate-800 last:border-0",
                    mode === '3d' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <Globe size={12} />
                3D
            </button>
            <button 
                onClick={() => onChange('2d')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5 border-r border-slate-800 last:border-0",
                    mode === '2d' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <MapIcon size={12} />
                2D
            </button>
            <button 
                onClick={() => onChange('split')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5",
                    mode === 'split' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <Activity size={12} />
                SPLIT
            </button>
        </div>
    );
};

// --- Main Monitor Component ---
const PlaneMonitor = ({ 
    group, 
    active, 
    simulatedTime,
    groundStations,
    viewMode = 'split'
}: { 
    group: OrbitalPlaneGroup; 
    active: boolean;
    simulatedTime: Date;
    groundStations: GroundStation[];
    viewMode?: '3d' | '2d' | 'split';
}) => {
  const [satellites, setSatellites] = useState<SatellitePos[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  
  // Cache for orbit paths (recalculated less frequently than position)
  const orbitCacheRef = useRef<Record<string, {path: {x:number, y:number, z:number, lat:number, lon:number}[], lastUpdated: number}>>({});
  
  // Update Loop
  useEffect(() => {
    if (!active) return;
    
    const positions = group.tles.map((tle, idx) => {
        // Use simulatedTime instead of new Date()
        const pos = getSatellitePosition(tle, simulatedTime);
        if (pos) {
            // Optimization: Only draw full orbits for first 60 sats to save FPS
            if (idx < 60) {
                const satId = tle.satId;
                const cache = orbitCacheRef.current[satId];
                
                // Recalculate orbit if cache expired (10s) or time jumped significantly
                const timeMs = simulatedTime.getTime();
                if (!cache || Math.abs(timeMs - cache.lastUpdated) > 10000) {
                    // Pass simulatedTime to orbit calculator
                    const path = calculateOrbitPath(tle, simulatedTime);
                    orbitCacheRef.current[satId] = { path, lastUpdated: timeMs };
                    pos.orbitPath = path;
                } else {
                    pos.orbitPath = cache.path;
                }
            }
            pos.color = ORBIT_COLORS[idx % ORBIT_COLORS.length];
        }
        return pos;
    }).filter(p => p !== null) as SatellitePos[];
      
    setSatellites(positions);
    
  }, [group, active, simulatedTime]);

  const handleSatClick = (sat: SatellitePos) => {
      setSelectedSatId(sat.id);
  };

  const selectedSat = satellites.find(s => s.id === selectedSatId);

  if (!active) return null;

  return (
    <div className="flex flex-col h-full bg-[#020617] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        {selectedSat && (
            <SatelliteDetail sat={selectedSat} onClose={() => setSelectedSatId(null)} />
        )}
        
        {/* Monitor Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0B1120] border-b border-slate-800/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
                <Activity size={18} className="text-cyan-400" />
                <div>
                    <h2 className="font-mono font-bold text-base text-slate-100 tracking-widest uppercase">{group.name}</h2>
                    <div className="flex items-center gap-2 text-[10px] text-cyan-500/70 font-mono">
                        <span>STATUS: ORBITAL</span>
                        <span>•</span>
                        <span>TRACKING: {satellites.length}</span>
                    </div>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <div className="text-xs font-mono text-slate-400">AVG ALTITUDE</div>
                <div className="text-lg font-mono font-bold text-white leading-none">~{satellites[0]?.alt.toFixed(0) || 0}<span className="text-xs text-slate-500 ml-1">KM</span></div>
            </div>
        </div>

        {/* Views */}
        <div className="flex-1 min-h-0">
            {viewMode === '3d' && (
                <div className="relative flex flex-col h-full">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md pointer-events-none">
                        <Globe size={14} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D VISUALIZER</span>
                    </div>
                    <div className="flex-1 bg-[#020617]">
                        <Earth3D 
                            satellites={satellites} 
                            groundStations={groundStations} 
                            onSatClick={handleSatClick} 
                        />
                    </div>
                </div>
            )}
            
            {viewMode === '2d' && (
                <div className="relative flex flex-col h-full">
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md pointer-events-none">
                        <MapIcon size={14} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">GROUND TRACK</span>
                    </div>
                    <div className="flex-1 bg-[#020617]">
                        <Map2D 
                            satellites={satellites} 
                            groundStations={groundStations} 
                            onSatClick={handleSatClick} 
                        />
                    </div>
                </div>
            )}
            
            {viewMode === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                    <div className="relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md pointer-events-none">
                            <Globe size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D VISUALIZER</span>
                        </div>
                        <div className="flex-1 bg-[#020617]">
                            <Earth3D 
                                satellites={satellites} 
                                groundStations={groundStations} 
                                onSatClick={handleSatClick} 
                            />
                        </div>
                    </div>
                    <div className="relative flex flex-col">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md pointer-events-none">
                            <MapIcon size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">GROUND TRACK</span>
                        </div>
                        <div className="flex-1 bg-[#020617]">
                            <Map2D 
                                satellites={satellites} 
                                groundStations={groundStations} 
                                onSatClick={handleSatClick} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  
  // Time Simulation State
  const [simTime, setSimTime] = useState(new Date());
  const [timeRate, setTimeRate] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const lastRafTime = useRef(Date.now());

  // View Mode State
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');

  // Ground Stations State
  const [stations, setStations] = useState<GroundStation[]>([
      { id: 'gs-1', name: 'Shanghai', lat: 31.2304, lon: 121.4737, color: '#10b981' },
      { id: 'gs-2', name: 'London', lat: 51.5074, lon: -0.1278, color: '#f59e0b' }
  ]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchSatelliteGroups();
      setGroups(data);
      if (data.length > 0) setActiveGroups([data[0].id]);
      setLoading(false);
    };
    load();
  }, []);

  // Simulation Loop
  useEffect(() => {
      let handle: number;
      const loop = () => {
          const now = Date.now();
          const dt = now - lastRafTime.current;
          lastRafTime.current = now;

          if (!isPaused) {
              setSimTime(prev => new Date(prev.getTime() + dt * timeRate));
          }
          handle = requestAnimationFrame(loop);
      };
      handle = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(handle);
  }, [isPaused, timeRate]);

  const handleAddStation = (name: string, lat: number, lon: number) => {
      setStations(prev => [...prev, { 
          id: `gs-${Date.now()}`, 
          name, 
          lat, 
          lon, 
          color: '#10b981' 
      }]);
  };

  const handleRemoveStation = (id: string) => {
      setStations(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
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
                    Global Satellite Tracking
                </div>
            </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-4">
             <TimeControls 
                time={simTime} 
                rate={timeRate} 
                paused={isPaused}
                onTogglePause={() => setIsPaused(!isPaused)}
                onChangeRate={setTimeRate}
                onReset={() => { setSimTime(new Date()); setTimeRate(1); setIsPaused(false); }}
             />
             <ViewToggle mode={viewMode} onChange={setViewMode} />
             <StationPanel 
                stations={stations} 
                onAdd={handleAddStation} 
                onRemove={handleRemoveStation} 
             />
        </div>
        
        {/* Group Toggles */}
        <div className="flex items-center gap-2">
             {groups.map(g => (
                 <button 
                    key={g.id}
                    onClick={() => {
                        // Simple toggle logic
                        setActiveGroups(prev => prev.includes(g.id) ? prev.filter(id => id !== g.id) : [...prev, g.id]);
                    }}
                    className={clsx(
                        "px-3 py-1.5 text-[10px] font-bold rounded transition-all border uppercase tracking-wider",
                        activeGroups.includes(g.id) 
                        ? "bg-cyan-950 text-cyan-400 border-cyan-500/50" 
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    )}
                 >
                    {g.name}
                 </button>
             ))}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {loading ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
                <RefreshCw className="animate-spin text-cyan-400" size={32} />
                <div className="text-xs font-mono text-cyan-500/80">INITIALIZING ORBITAL DYNAMICS...</div>
            </div>
        ) : (
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
                             />
                         </div>
                     );
                 })}
                 {activeGroups.length === 0 && (
                     <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-sm">
                         NO ACTIVE FEEDS SELECTED
                     </div>
                 )}
            </div>
        )}
      </main>
    </div>
  );
}
