import { Globe, Map as MapIcon, RotateCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { type GroundStation, type OrbitalPlaneGroup, type SatellitePos, type TLEData } from '../types';
import { calculateCompleteOrbitPath, getSatellitePosition } from '../utils/satMath';
import { extractOrbitPlaneParams, getOrbitPlaneId, groupSatellitesByOrbitPlane } from '../utils/orbitPlaneUtils';
import Earth3D from './Earth3D';
import Map2D from './Map2D';
import SatelliteDetail from './SatelliteDetail';
import type { ArcSegment, ArcVisualizationConfig } from '../types/arc.types';
import type { GeographicBoundary, SAABoundary } from '../types/geographic.types';

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
    // 弧段数据
    arcs?: ArcSegment[];
    arcVisualizationConfig?: ArcVisualizationConfig;
    // 地理图层数据
    chinaBorder?: GeographicBoundary | null;
    saaBoundary?: SAABoundary | null;
    showChinaBorder?: boolean;
    showSAA?: boolean;
}

export const PlaneMonitor: React.FC<PlaneMonitorProps> = ({
    group,
    active,
    simulatedTime,
    groundStations,
    viewMode = 'split',
    orbitWindowMinutes,
    selectedSatellites,
    timeRate = 1,
    arcs,
    arcVisualizationConfig,
    chinaBorder,
    saaBoundary,
    showChinaBorder,
    showSAA
}) => {
    const [satellites, setSatellites] = useState<SatellitePos[]>([]);
    const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState<boolean>(false);
    const [trackedSatId, setTrackedSatId] = useState<string | null>(null);
    const [cameraRotateWithEarth, setCameraRotateWithEarth] = useState<boolean>(false);

    // Cache for orbit paths by orbit plane (instead of by satellite)
    const orbitCacheRef = useRef<Record<string, {
        ecef: { x: number, y: number, z: number, lat: number, lon: number }[];
        lastUpdated: number;
    }>>({});
    // Cache for current satellite positions to avoid unnecessary re-renders
    const currentSatellitesRef = useRef<SatellitePos[]>([]);

    // Update Loop - 根据时间倍速动态调整轨道缓存时间
    useEffect(() => {
        if (!active) return;

        // 按轨道面对 TLE 进行分组
        const filteredTles = group.tles.filter(tle =>
            selectedSatellites.size === 0 || selectedSatellites.has(tle.satId)
        );

        const planeGroups = groupSatellitesByOrbitPlane(filteredTles);

        // 预先为所有轨道面计算（或从缓存获取）完整闭合轨道线
        const baseCacheTime = 5000;
        const cacheTime = Math.max(1000, Math.min(10000, baseCacheTime / Math.max(1, timeRate || 1)));
        const timeMs = simulatedTime.getTime();

        // 存储每个轨道面的轨道路径（确保同一轨道面的所有卫星共享同一个数组引用）
        const orbitPathsByPlane = new Map<string, {
            ecef: { x: number, y: number, z: number, lat: number, lon: number }[];
        }>();

        for (const [planeId, tles] of planeGroups.entries()) {
            const cache = orbitCacheRef.current[planeId];

            // 检查缓存是否过期
            if (!cache || Math.abs(timeMs - cache.lastUpdated) > cacheTime) {
                // 缓存过期，使用代表卫星重新计算完整轨道
                const representativeTle = tles[0];
                const orbitData = calculateCompleteOrbitPath(representativeTle, simulatedTime);
                orbitCacheRef.current[planeId] = { ...orbitData, lastUpdated: timeMs };
                orbitPathsByPlane.set(planeId, orbitData);
            } else {
                // 使用缓存的轨道
                orbitPathsByPlane.set(planeId, { ecef: cache.ecef });
            }
        }

        const positions: SatellitePos[] = [];

        // 遍历每个轨道面
        let planeIndex = 0;
        for (const [planeId, tles] of planeGroups.entries()) {
            const orbitPath = orbitPathsByPlane.get(planeId)?.ecef;
            const planeColor = ORBIT_COLORS[planeIndex % ORBIT_COLORS.length];

            // 为该轨道面的每颗卫星分配位置和轨道
            for (const tle of tles) {
                const pos = getSatellitePosition(tle, simulatedTime);
                if (pos) {
                    pos.orbitPath = orbitPath || [];
                    pos.color = planeColor;
                    positions.push(pos);
                }
            }
            planeIndex++;
        }

        // Only update state if satellites have changed significantly
        // 动态计算位置变化阈值 - 倍速越低，阈值越小，确保平滑更新
        const baseThreshold = 0.001;
        const minThreshold = 0.0001;
        const maxThreshold = 0.005;
        const threshold = Math.max(minThreshold, Math.min(maxThreshold, baseThreshold / Math.max(1, timeRate || 1)));

        const hasChanged = positions.length !== currentSatellitesRef.current.length ||
            positions.some((sat, idx) => {
                const currentSat = currentSatellitesRef.current[idx];
                if (!currentSat) return true;
                // Check if position has changed significantly
                const posDiff = Math.abs(sat.x - currentSat.x) + Math.abs(sat.y - currentSat.y) + Math.abs(sat.z - currentSat.z);
                return posDiff > threshold;
            });

        if (hasChanged) {
            currentSatellitesRef.current = positions;
            setSatellites(positions);
        }

    }, [group, active, simulatedTime, selectedSatellites, orbitWindowMinutes, timeRate]);

    const handleSatClick = (sat: SatellitePos) => {
        setSelectedSatId(sat.id);
    };

    const handleTrackToggle = () => {
        if (isTracking) {
            // Stop tracking
            setIsTracking(false);
            setTrackedSatId(null);
        } else if (selectedSatId) {
            // Start tracking
            setIsTracking(true);
            setTrackedSatId(selectedSatId);
        }
    };

    // Keyboard event listener for ESC key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isTracking) {
                setIsTracking(false);
                setTrackedSatId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTracking]);

    const selectedSat = satellites.find(s => s.id === selectedSatId);
    const trackedSat = satellites.find(s => s.id === trackedSatId);

    if (!active) return null;

    return (
        <div className="flex flex-col h-full bg-[#020617] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            {selectedSat && (
                <SatelliteDetail
                    sat={selectedSat}
                    onClose={() => setSelectedSatId(null)}
                    isTracking={isTracking && trackedSatId === selectedSat.id}
                    onTrackToggle={handleTrackToggle}
                />
            )}

            {/* Views */}
            <div className="flex-1 min-h-0">
                {viewMode === '3d' && (
                    <div className="relative flex flex-col h-full">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                            <Globe size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D 可视化</span>
                            {/* 相机跟随地球自转开关 */}
                            <button
                                onClick={() => setCameraRotateWithEarth(!cameraRotateWithEarth)}
                                className={`ml-2 flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${
                                    cameraRotateWithEarth
                                        ? 'bg-cyan-900/50 border-cyan-700 text-cyan-400'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                                }`}
                                title={cameraRotateWithEarth ? "关闭相机跟随地球自转" : "开启相机跟随地球自转"}
                            >
                                <RotateCw size={12} className={cameraRotateWithEarth ? "animate-[spin_10s_linear_infinite]" : ""} />
                                <span className="text-[10px] font-mono">
                                    {cameraRotateWithEarth ? "跟随地球" : "固定视角"}
                                </span>
                            </button>
                        </div>
                        <div className="flex-1 bg-[#020617]">
                            <Earth3D
                                satellites={satellites}
                                groundStations={groundStations}
                                onSatClick={handleSatClick}
                                simulatedTime={simulatedTime}
                                isTracking={isTracking}
                                trackedSatellite={trackedSat}
                                arcs={arcs}
                                arcVisualizationConfig={arcVisualizationConfig}
                                chinaBorder={chinaBorder}
                                saaBoundary={saaBoundary}
                                showChinaBorder={showChinaBorder}
                                showSAA={showSAA}
                                cameraRotateWithEarth={cameraRotateWithEarth}
                            />
                        </div>
                    </div>
                )}

                {viewMode === '2d' && (
                    <div className="relative flex flex-col h-full">
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                            <MapIcon size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">地面轨迹</span>
                        </div>
                        <div className="flex-1 bg-[#020617]">
                            <Map2D
                                satellites={satellites}
                                groundStations={groundStations}
                                onSatClick={handleSatClick}
                                simulatedTime={simulatedTime}
                                arcs={arcs}
                                arcVisualizationConfig={arcVisualizationConfig}
                                chinaBorder={chinaBorder}
                                saaBoundary={saaBoundary}
                                showChinaBorder={showChinaBorder}
                                showSAA={showSAA}
                            />
                        </div>
                    </div>
                )}

                {viewMode === 'split' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
                        <div className="relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                                <Globe size={14} className="text-cyan-400" />
                                <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">3D VISUALIZER</span>
                                {/* 相机跟随地球自转开关 */}
                                <button
                                    onClick={() => setCameraRotateWithEarth(!cameraRotateWithEarth)}
                                    className={`ml-2 flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-all ${
                                        cameraRotateWithEarth
                                            ? 'bg-cyan-900/50 border-cyan-700 text-cyan-400'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                                    title={cameraRotateWithEarth ? "关闭相机跟随地球自转" : "开启相机跟随地球自转"}
                                >
                                    <RotateCw size={12} className={cameraRotateWithEarth ? "animate-[spin_10s_linear_infinite]" : ""} />
                                    <span className="text-[10px] font-mono">
                                        {cameraRotateWithEarth ? "跟随地球" : "固定视角"}
                                    </span>
                                </button>
                            </div>
                            <div className="flex-1 bg-[#020617]">
                                <Earth3D
                                    satellites={satellites}
                                    groundStations={groundStations}
                                    onSatClick={handleSatClick}
                                    simulatedTime={simulatedTime}
                                    isTracking={isTracking}
                                    trackedSatellite={trackedSat}
                                    arcs={arcs}
                                    arcVisualizationConfig={arcVisualizationConfig}
                                    chinaBorder={chinaBorder}
                                    saaBoundary={saaBoundary}
                                    showChinaBorder={showChinaBorder}
                                    showSAA={showSAA}
                                    cameraRotateWithEarth={cameraRotateWithEarth}
                                />
                            </div>
                        </div>
                        <div className="relative flex flex-col">
                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 border border-slate-800 px-3 py-1 rounded-sm backdrop-blur-md">
                                <MapIcon size={14} className="text-cyan-400" />
                                <span className="text-[10px] font-bold text-slate-200 tracking-widest font-mono">GROUND TRACK</span>
                            </div>
                            <div className="flex-1 bg-[#020617]">
                                <Map2D
                                    satellites={satellites}
                                    groundStations={groundStations}
                                    onSatClick={handleSatClick}
                                    simulatedTime={simulatedTime}
                                    arcs={arcs}
                                    arcVisualizationConfig={arcVisualizationConfig}
                                    chinaBorder={chinaBorder}
                                    saaBoundary={saaBoundary}
                                    showChinaBorder={showChinaBorder}
                                    showSAA={showSAA}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};