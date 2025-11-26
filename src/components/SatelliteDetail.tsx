import { Activity, Clock, Globe, Radio, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getSatelliteDisplayName } from '../services/NamingMappingService';
import { type SatellitePos } from '../types';

interface satellitedetailprops {
    sat: SatellitePos;
    onClose: () => void;
    isTracking?: boolean;
    onTrackToggle?: () => void;
}

const SatelliteDetail: React.FC<satellitedetailprops> = ({ sat, onClose, isTracking = false, onTrackToggle }) => {
    // Parse some additional orbital info from TLE line 2 if available
    // Line 2: 2 nnnnn iiii.iiii rrr.rrrr eeeeeee aaaaa.aaaa mmmm.mmmm nn.nnnnnnnnrrrrr
    let inclination = 'N/A';
    let period = 'N/A';
    const [displayName, setDisplayName] = useState<string>(sat.name);
    const [isUsingMapping, setIsUsingMapping] = useState<boolean>(false);

    // 获取显示名称
    useEffect(() => {
        const fetchDisplayName = async () => {
            if (sat.tle && sat.tle.satId) {
                const name = await getSatelliteDisplayName(sat.tle.satId, sat.name);
                setDisplayName(name);
                setIsUsingMapping(name !== sat.name);
            }
        };
        fetchDisplayName();
    }, [sat]);

    if (sat.tle && sat.tle.line2) {
        const line2 = sat.tle.line2;
        if (line2.length >= 63) {
            try {
                const incStr = line2.substring(8, 16).trim();
                const meanMotionStr = line2.substring(52, 63).trim();

                if (incStr) inclination = parseFloat(incStr).toFixed(2) + '°';

                const meanMotion = parseFloat(meanMotionStr);
                if (!isNaN(meanMotion) && meanMotion > 0) {
                    const pMinutes = 1440 / meanMotion;
                    period = pMinutes.toFixed(1) + ' MIN';
                }
            }

            catch {
                // 忽略解析错误
            }
        }
    }

    return (
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#050914]/95 border-l border-slate-800 backdrop-blur-xl z-50 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#020617]/80 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded border border-cyan-500/30">
                        <Radio size={20} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest text-zh">目标锁定</div>
                        <h2 className="text-white font-bold font-mono text-lg leading-none truncate max-w-[200px]">{displayName}</h2>
                        {isUsingMapping && (
                            <div className="text-[8px] text-slate-500 font-mono mt-1">
                                <span className="text-cyan-500">映射名称</span> | 原始名称: {sat.name}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Status Banner */}
                <div className="flex items-center gap-4 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <div>
                        <div className="text-emerald-400 font-bold font-mono text-sm text-zh">系统最佳</div>
                        <div className="text-emerald-600 text-[10px] font-mono text-zh">遥测数据流激活</div>
                    </div>
                    <div className="ml-auto text-emerald-500 font-mono font-bold text-xl">100%</div>
                </div>

                {/* Telemetry Grid */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                        <Activity size={12} /> <span className="text-zh">实时遥测</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-mono mb-1 text-zh">高度</div>
                            <div className="text-2xl font-mono text-white">{sat.alt.toFixed(1)} <span className="text-xs text-slate-500">KM</span></div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-mono mb-1 text-zh">速度</div>
                            <div className="text-2xl font-mono text-white">{sat.velocity.toFixed(2)} <span className="text-xs text-slate-500">KM/S</span></div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-mono mb-1 text-zh">纬度</div>
                            <div className="text-xl font-mono text-white">{sat.lat.toFixed(4)}°</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 font-mono mb-1 text-zh">经度</div>
                            <div className="text-xl font-mono text-white">{sat.lon.toFixed(4)}°</div>
                        </div>
                    </div>
                </div>

                {/* Orbital Parameters */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                        <Globe size={12} /> <span className="text-zh">轨道参数</span>
                    </h3>
                    <div className="bg-slate-900/30 rounded border border-slate-800 divide-y divide-slate-800/50">
                        <div className="p-3 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-mono text-zh">倾角</span>
                            <span className="text-sm text-cyan-400 font-mono">{inclination}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-mono text-zh">轨道周期</span>
                            <span className="text-sm text-cyan-400 font-mono">{period}</span>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-mono">NORAD ID</span>
                            <span className="text-sm text-cyan-400 font-mono">{sat.id}</span>
                        </div>
                    </div>
                </div>

                {/* Raw TLE */}
                {sat.tle && (
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                            <Clock size={12} /> <span className="text-zh">两行轨道根数</span>
                        </h3>
                        <div className="bg-black p-3 rounded border border-slate-800 font-mono text-[10px] text-emerald-500/80 break-all leading-relaxed">
                            <div>{sat.tle.line1}</div>
                            <div className="mt-1">{sat.tle.line2}</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#020617]">
                <button 
                    className={`w-full py-3 font-bold font-mono text-xs rounded tracking-widest transition-colors flex items-center justify-center gap-2 ${isTracking ? 'bg-red-600 hover:bg-red-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white`}
                    onClick={onTrackToggle}
                >
                    <span className="text-zh">{isTracking ? '停止跟踪锁定' : '开始跟踪锁定'}</span>
                </button>
            </div>
        </div>
    );
};

export default SatelliteDetail;
