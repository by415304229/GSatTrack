import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Activity, FileText, Globe, Map as MapIcon, MapPin, Pause, Play, Plus, RefreshCw, Satellite, Settings, X } from 'lucide-react';
import { PlaneMonitor } from '../components/PlaneMonitor';
import { TimeControls } from '../components/TimeControls';
import { StationPanel } from '../components/StationPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { ViewToggle } from '../components/ViewToggle';
import TLEFileUpload from '../components/TLEFileUpload';
import { type GroundStation, type OrbitalPlaneGroup } from '../types';
import { fetchSatelliteGroups } from '../services/satelliteService';
import { parseTLEContent } from '../utils/tleParser';

const HomePage: React.FC = () => {
    // 状态管理
    const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeGroups, setActiveGroups] = useState<string[]>([]);
    const lastRafTime = useRef(Date.now());
    const [stations, setStations] = useState<GroundStation[]>([{
        id: 'gs-1',
        name: 'Shanghai',
        lat: 31.2304,
        lon: 121.4737,
        color: '#10b981'
      },
      {
        id: 'gs-2',
        name: 'London',
        lat: 51.5074,
        lon: -0.1278,
        color: '#f59e0b'
      }]);
    const [simTime, setSimTime] = useState<Date>(new Date());
    const [timeRate, setTimeRate] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [orbitWindowMinutes, setOrbitWindowMinutes] = useState(24); // 1/4 period ~24 minutes
    const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());
    const [showTLEImport, setShowTLEImport] = useState(false);

    // 数据加载
    useEffect(() => {
        const load = async () => {
            const data = await fetchSatelliteGroups();
            setGroups(data);
            if (data.length > 0) setActiveGroups([data[0].id]);
            setLoading(false);
        };
        load();
    }, []);

    // 模拟时间 - 使用requestAnimationFrame实现平滑动画
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

    // 事件处理函数
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
            description: `导入的卫星组 - ${groupName || '未命名组'}`,
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

    const handleSatelliteGroupUpdated = (groupId: string, satelliteCount: number) => {
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
                        onPauseToggle={() => setIsPaused(!isPaused)}
                        onRateChange={setTimeRate}
                        onResetToRealTime={() => { setSimTime(new Date()); setTimeRate(1); setIsPaused(false); }}
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
                availableSatellites={groups.flatMap(group => group.tles || []).map(tle => ({ id: tle.satId, name: tle.name }))}
                onSatelliteToggle={(satId) => {
                    const newSelection = new Set(selectedSatellites);
                    if (newSelection.has(satId)) {
                        newSelection.delete(satId);
                    } else {
                        newSelection.add(satId);
                    }
                    setSelectedSatellites(newSelection);
                }}
            />

            {/* TLE File Import Modal */}
            {showTLEImport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-[#020617] border border-slate-700 rounded-md shadow-2xl w-[90%] max-w-2xl max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <FileText size={16} className="text-cyan-400" />
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
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;