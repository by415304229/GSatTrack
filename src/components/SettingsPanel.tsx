import { Settings, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orbitWindowMinutes: number;
  onOrbitWindowChange: (minutes: number) => void;
  availableSatellites: Array<{ id: string, name: string }>;
  selectedSatellites: Set<string>;
  onSatelliteToggle: (satId: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    orbitWindowMinutes,
    onOrbitWindowChange,
    selectedSatellites,
    onSatelliteToggle,
    availableSatellites
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
        } else {
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