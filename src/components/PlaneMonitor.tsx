import { Activity, Globe, Map } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { type GroundStation, type OrbitalPlaneGroup, type SatellitePos } from '../types';
import { calculateOrbitPath, getSatellitePosition } from '../utils/satMath';
import Earth3D from './Earth3D';
import Map2D from './Map2D';
import SatelliteDetail from './SatelliteDetail';

const ORBIT_COLORS = ['#06b6d4', '#3b82f6'];

interface PlaneMonitorProps {
    group: OrbitalPlaneGroup;
    active: boolean;
    simulatedTime: Date;
    groundStations: GroundStation[];
    viewMode?: '3d' | '2d' | 'split';
    orbitWindowMinutes: number;
    selectedSatellites: Set<string>;
    timeRate?: number;
}

export const PlaneMonitor: React.FC<PlaneMonitorProps> = ({
    group,
    active,
    simulatedTime,
    groundStations,
    viewMode = 'split',
    orbitWindowMinutes,
    selectedSatellites,
    timeRate = 1
}) => {
    const [satellites, setSatellites] = useState<SatellitePos[]>([]);
    const [selectedSatId, setSelectedSatId] = useState<string | null>(null);

    // Cache for orbit paths (recalculated less frequently than position)
    const orbitCacheRef = useRef<Record<string, { path: { x: number, y: number, z: number, lat: number, lon: number }[], lastUpdated: number }>>({});

    // Update Loop - 根据时间倍速动态调整轨道缓存时间
    useEffect(() => {
        if (!active) return;

        const positions = group.tles
            .filter(tle => selectedSatellites.size === 0 || selectedSatellites.has(tle.satId)) // 过滤选中的卫星
            .map((tle, idx) => {
                // Use simulatedTime instead of new Date()
                const pos = getSatellitePosition({ line1: tle.line1!, line2: tle.line2!, satId: tle.satId!, name: tle.name, updatedAt: new Date() }, simulatedTime);
                if (pos) {
                    // 所有卫星都计算轨道，不再限制数量
                    const satId = tle.satId;
                    const cache = orbitCacheRef.current[satId];

                    // 根据时间倍速动态调整缓存时间 - 倍速越高，缓存时间越短
                    // 基础缓存时间5秒，根据倍速调整，最小1秒，最大10秒
                    const baseCacheTime = 5000; // 5秒基础缓存时间
                    const cacheTime = Math.max(1000, Math.min(10000, baseCacheTime / Math.max(1, timeRate || 1)));

                    // Recalculate orbit if cache expired or time jumped significantly
                    const timeMs = simulatedTime.getTime();
                    if (!cache || Math.abs(timeMs - cache.lastUpdated) > cacheTime) {
                        // Pass simulatedTime to orbit calculator with orbit window
                        const path = calculateOrbitPath({ line1: tle.line1!, line2: tle.line2!, satId: tle.satId!, name: tle.name, updatedAt: new Date() }, simulatedTime, orbitWindowMinutes);
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

    }, [group, active, simulatedTime, selectedSatellites, orbitWindowMinutes, timeRate]);

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
                            <Map size={14} className="text-cyan-400" />
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
                                <Map size={14} className="text-cyan-400" />
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