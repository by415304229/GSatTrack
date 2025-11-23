
import clsx from 'clsx';
import { Activity, FileDown, FileText, Globe, Map as MapIcon, MapPin, Pause, Play, Plus, RefreshCw, Satellite, Settings, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Earth3D from './src/components/Earth3D';
import Map2D from './src/components/Map2D';
import SatelliteDetail from './src/components/SatelliteDetail';
import TLEFileUpload from './src/components/TLEFileUpload';
import { fetchSatelliteGroups } from './src/services/satelliteService';
import { type GroundStation, type OrbitalPlaneGroup, type SatellitePos } from './src/types';
import { calculateOrbitPath, getSatellitePosition } from './src/utils/satMath';

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
  // Calculate local time (UTC+8 for Shanghai)
  const shanghaiTime = new Date(time.getTime() + 8 * 60 * 60 * 1000);

  return (
    <div className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 rounded-md px-3 py-1.5">
      <div className="font-mono text-xs text-cyan-400">
        <div>UTC时间: {time.toISOString().replace('T', ' ').substring(0, 19)}</div>
        <div className="text-emerald-400 text-[10px]">本地时间: {shanghaiTime.toISOString().replace('T', ' ').substring(0, 19)}</div>
      </div>
      <div className="h-4 w-[1px] bg-slate-700"></div>
      <button onClick={onTogglePause} className="hover:text-cyan-400 transition-colors">
        {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
      </button>
      <button onClick={onReset} className="text-[10px] font-bold hover:text-cyan-400 px-2">实时</button>
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
        <span className="text-xs font-mono text-zh">地面站 ({stations.length})</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#020617] border border-slate-700 rounded-md shadow-xl z-50 p-4">
          <h3 className="text-xs font-bold text-white mb-3 flex justify-between text-zh">
            地面站
            <button onClick={() => setIsOpen(false)}><Plus size={14} className="rotate-45" /></button>
          </h3>

          <div className="space-y-2 max-h-[150px] overflow-y-auto mb-4">
            {stations.map(st => (
              <div key={st.id} className="flex justify-between items-center text-[10px] font-mono bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-emerald-400">{st.name}</span>
                <button onClick={() => onRemove(st.id)} className="text-red-400 hover:text-red-300">DEL</button>
              </div>
            ))}
            {stations.length === 0 && <div className="text-[10px] text-slate-600 italic text-zh">无活动地面站</div>}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-800 pt-3">
            <input
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
              placeholder="地面站名称"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                placeholder="纬度"
                type="number"
                value={newLat}
                onChange={e => setNewLat(e.target.value)}
              />
              <input
                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                placeholder="经度"
                type="number"
                value={newLon}
                onChange={e => setNewLon(e.target.value)}
              />
            </div>
            <button className="w-full py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-bold text-zh">添加地面站</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- Settings Panel ---
const SettingsPanel = ({
  isOpen,
  onClose,
  orbitWindowMinutes,
  onOrbitWindowChange,
  selectedSatellites,
  onSatelliteToggle,
  availableSatellites
}: {
  isOpen: boolean;
  onClose: () => void;
  orbitWindowMinutes: number;
  onOrbitWindowChange: (minutes: number) => void;
  selectedSatellites: Set<string>;
  onSatelliteToggle: (satId: string) => void;
  availableSatellites: Array<{ id: string, name: string }>;
}) => {
  const [windowInput, setWindowInput] = useState(orbitWindowMinutes.toString());
  const [searchTerm, setSearchTerm] = useState('');

  // 实时更新轨道窗口时间
  useEffect(() => {
    const minutes = parseFloat(windowInput);
    if (minutes > 0 && minutes <= 120 && minutes !== orbitWindowMinutes) {
      onOrbitWindowChange(minutes);
    }
  }, [windowInput, orbitWindowMinutes, onOrbitWindowChange]);

  // 过滤卫星
  const filteredSatellites = availableSatellites.filter(sat =>
    sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sat.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 全选/全不选功能
  const handleSelectAll = () => {
    // 检查当前过滤结果中是否所有卫星都已选中
    const allFilteredSelected = filteredSatellites.every(sat => selectedSatellites.has(sat.id));
    // 检查是否有部分选中
    const hasPartialSelection = filteredSatellites.some(sat => selectedSatellites.has(sat.id)) && !allFilteredSelected;

    if (allFilteredSelected) {
      // 全不选：取消选中所有过滤结果中的卫星
      filteredSatellites.forEach(sat => {
        if (selectedSatellites.has(sat.id)) {
          onSatelliteToggle(sat.id);
        }
      });
    } else if (hasPartialSelection) {
      // 反选：取消选中的改为选中，选中的改为取消选中
      filteredSatellites.forEach(sat => {
        onSatelliteToggle(sat.id);
      });
    }

    else {
      // 全选：选中所有过滤结果中的卫星
      filteredSatellites.forEach(sat => {
        if (!selectedSatellites.has(sat.id)) {
          onSatelliteToggle(sat.id);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#020617] border border-slate-700 rounded-md shadow-2xl w-[500px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings size={16} className="text-cyan-400" />
            <span className="text-zh">设置</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Orbit Window Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide text-zh">轨道窗口</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={windowInput}
                  onChange={(e) => setWindowInput(e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  min="1"
                  max="120"
                  step="0.1"
                />
                <span className="text-xs text-slate-400 text-zh">分钟</span>
              </div>
              <div className="text-[10px] text-slate-500 text-zh">
                当前: {orbitWindowMinutes} 分钟 | 范围: 1-120 分钟
              </div>
            </div>
          </div>

          {/* Satellite Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide text-zh">卫星跟踪</h3>
            {/* 查找框 */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="搜索卫星名称或ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-900 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* 全选/全不选按钮 */}
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-[10px] bg-cyan-900 hover:bg-cyan-800 text-cyan-300 rounded-md transition-colors text-zh">
                {(() => {
                  const allFilteredSelected = filteredSatellites.every(sat => selectedSatellites.has(sat.id));
                  const hasPartialSelection = filteredSatellites.some(sat => selectedSatellites.has(sat.id)) && !allFilteredSelected;

                  if (allFilteredSelected) return '取消全选';
                  if (hasPartialSelection) return '反选';
                  return '全选';
                })()}
              </button>
              <span className="text-[10px] text-slate-500 text-zh">
                已选择: {selectedSatellites.size}/{filteredSatellites.length}
              </span>
            </div>

            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {filteredSatellites.map((sat) => (
                <div key={sat.id} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedSatellites.has(sat.id)}
                      onChange={() => onSatelliteToggle(sat.id)}
                      className="rounded text-cyan-600 bg-slate-800 border-slate-600 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-mono text-slate-300">{sat.name}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">{sat.id}</span>
                </div>
              ))}
              {filteredSatellites.length === 0 && (
                <div className="text-[10px] text-slate-600 italic p-2">没有匹配的卫星</div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 text-zh">
              已选择: {selectedSatellites.size} / {availableSatellites.length} 颗卫星
            </div>
          </div>
        </div>
      </div>
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
        分屏
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
  viewMode = 'split',
  orbitWindowMinutes,
  selectedSatellites
}: {
  group: OrbitalPlaneGroup;
  active: boolean;
  simulatedTime: Date;
  groundStations: GroundStation[];
  viewMode?: '3d' | '2d' | 'split';
  orbitWindowMinutes: number;
  selectedSatellites: Set<string>;
}) => {
  const [satellites, setSatellites] = useState<SatellitePos[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);

  // Cache for orbit paths (recalculated less frequently than position)
  const orbitCacheRef = useRef<Record<string, { path: { x: number, y: number, z: number, lat: number, lon: number }[], lastUpdated: number }>>({});

  // Update Loop
  useEffect(() => {
    if (!active) return;

    const positions = group.tles
      .filter(tle => selectedSatellites.size === 0 || selectedSatellites.has(tle.satId)) // 过滤选中的卫星
      .map((tle, idx) => {
        // Use simulatedTime instead of new Date()
        const pos = getSatellitePosition(tle, simulatedTime);
        if (pos) {
          // 所有卫星都计算轨道，不再限制数量
          const satId = tle.satId;
          const cache = orbitCacheRef.current[satId];

          // Recalculate orbit if cache expired (10s) or time jumped significantly
          const timeMs = simulatedTime.getTime();
          if (!cache || Math.abs(timeMs - cache.lastUpdated) > 10000) {
            // Pass simulatedTime to orbit calculator with orbit window
            const path = calculateOrbitPath(tle, simulatedTime, orbitWindowMinutes);
            orbitCacheRef.current[satId] = { path, lastUpdated: timeMs };
            pos.orbitPath = path;
          } else {
            pos.orbitPath = cache.path;
          }
          pos.color = ORBIT_COLORS[idx % ORBIT_COLORS.length];
        }
        return pos;
      }).filter(p => p !== null) as SatellitePos[];

    setSatellites(positions);

  }, [group, active, simulatedTime, selectedSatellites, orbitWindowMinutes]);

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
              <span>跟踪数量: {satellites.length}</span>
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-mono text-slate-400">平均高度</div>
          <div className="text-lg font-mono font-bold text-white leading-none">~{satellites[0]?.alt.toFixed(0) || 0}<span className="text-xs text-slate-500 ml-1">KM</span></div>
        </div>
      </div>

      {/* Views */}
      <div className="flex-1 min-h-0">
        {viewMode === '3d' && (
          <div className="relative flex flex-col h-full">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md pointer-events-none">
              <Globe size={14} className="text-cyan-400" />
              <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D 可视化</span>
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
              <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">地面轨迹</span>
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
  const [showTLEImport, setShowTLEImport] = useState(false);
  // Time Simulation State
  const [simTime, setSimTime] = useState(new Date());
  const [timeRate, setTimeRate] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const lastRafTime = useRef(Date.now());
  // View Mode State
  const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
  // Settings State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orbitWindowMinutes, setOrbitWindowMinutes] = useState(24); // 1/4 period ~24 minutes
  const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());
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

  // 处理TLE文件导入
  const handleTLEImport = (file: File, content: string, parsedSatellites: any[]) => {
    // 确保导入的卫星数据有效
    if (!parsedSatellites || parsedSatellites.length === 0) {
      return;
    }

    // 创建新的轨道平面组
    const groupName = file.name.replace('.txt', '').replace('.tle', '');
    const newgroupid = `imported-${Date.now()}`;

    const newGroup: OrbitalPlaneGroup = {
      id: newgroupid,
      name: groupName || `导入卫星组`,
      description: `导入的卫星组 - ${groupName || '未命名组'}

`,
      tles: parsedSatellites.map(sat => ({
        name: sat.name,
        satId: sat.satId,
        line1: sat.line1,
        line2: sat.line2
      }))
    };

    // 更新组列表
    setGroups(prev => [...prev, newGroup]);
    // 激活新导入的组
    setActiveGroups([newgroupid]);
    // 关闭导入界面
    setShowTLEImport(false);
  };

  const handleSatelliteGroupUpdated = (groupId: string, _satelliteCount: number) => {
    // 如果当前正在查看的卫星组就是更新的组，刷新数据
    if (activeGroups.includes(groupId)) {
      // 重新获取卫星组数据
      const loadGroups = async () => {
        const data = await fetchSatelliteGroups();
        setGroups(data);
      };
      loadGroups();
    }
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
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1.5"
          >
            <Settings size={12} />
            SETTINGS
          </button>
          <button
            onClick={() => setShowTLEImport(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-[10px] font-bold transition-colors flex items-center gap-1.5"
          >
            <FileText size={12} />
            导入TLE
          </button>
        </div>

        {/* 组切换 */}
        <div className="flex items-center gap-2">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => {
                // 互斥切换逻辑：点击已激活的组不做操作，点击新组则只激活该组
                if (!activeGroups.includes(g.id)) {
                  setActiveGroups([g.id]);
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

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <RefreshCw className="animate-spin text-cyan-400" size={32} />
            <div className="text-xs font-mono text-cyan-500/80">初始化轨道动力学系统...</div>
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
        )}
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        orbitWindowMinutes={orbitWindowMinutes}
        onOrbitWindowChange={setOrbitWindowMinutes}
        selectedSatellites={selectedSatellites}
        onSatelliteToggle={(satId) => {
          setSelectedSatellites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(satId)) {
              newSet.delete(satId);
            } else {
              newSet.add(satId);
            }
            return newSet;
          });
        }}
        availableSatellites={groups.flatMap(g => g.tles || []).map(tle => ({ id: tle.satId, name: tle.name }))}
      />

      {/* TLE File Import Modal */}
      {showTLEImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#020617] border border-slate-700 rounded-md shadow-2xl w-[90%] max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileDown size={16} className="text-cyan-400" />
                <span>TLE文件导入</span>
              </h2>
              <button
                onClick={() => setShowTLEImport(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <TLEFileUpload
                onFileUpload={handleTLEImport}
                onSatelliteGroupUpdated={handleSatelliteGroupUpdated}
              // TLEFileUpload组件没有onClose属性，通过其他方式控制显示/隐藏
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
