import { Settings, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { SpeechConfig } from '../types/speech.types';
import type { ArcVisualizationConfig } from '../types/arc.types';
import { ArcVisualization } from './arc/ArcVisualization';

export interface SatelliteProperties {
    id: string;
    name: string;
    displayName?: string;
    [key: string]: any;
}

export interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    orbitWindowMinutes: number;
    onOrbitWindowChange: (minutes: number) => void;
    availableSatellites: SatelliteProperties[];
    selectedSatellites: Set<string>;
    onSatelliteToggle: (satId: string) => void;
    onSatellitePropertyChange: (satId: string, property: string, value: any) => void;
    // 语音播报配置
    speechConfig?: SpeechConfig;
    onSpeechConfigChange?: (config: Partial<SpeechConfig>) => void;
    // 弧段可视化配置
    arcVisualizationConfig?: ArcVisualizationConfig;
    onArcVisualizationConfigChange?: (config: Partial<ArcVisualizationConfig>) => void;
    // 测试语音功能
    onTestSpeech?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen,
    onClose,
    orbitWindowMinutes,
    onOrbitWindowChange,
    selectedSatellites,
    onSatelliteToggle,
    availableSatellites,
    onSatellitePropertyChange,
    speechConfig,
    onSpeechConfigChange,
    arcVisualizationConfig,
    onArcVisualizationConfigChange,
    onTestSpeech
}) => {
    const [windowInput, setWindowInput] = useState(orbitWindowMinutes.toString());
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSatelliteId, setEditingSatelliteId] = useState<string | null>(null);
    const [editingProperty, setEditingProperty] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

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

    // 全选/全不选/反选功能
    const handleSelectAll = () => {
        // 检查当前过滤结果中是否所有卫星都已选中
        const allFilteredSelected = filteredSatellites.every(sat => selectedSatellites.has(sat.id));
        // 检查当前是否有部分卫星被选中
        const hasPartialSelection = filteredSatellites.some(sat => selectedSatellites.has(sat.id)) && !allFilteredSelected;

        if (allFilteredSelected) {
            // 全不选：取消选中所有过滤结果中的卫星
            filteredSatellites.forEach(sat => {
                if (selectedSatellites.has(sat.id)) {
                    onSatelliteToggle(sat.id);
                }
            });
        } else if (hasPartialSelection) {
            // 反选：反转所有过滤结果中的卫星选中状态
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

    // 全选所有可用卫星（包括未过滤的）
    const handleSelectAllAvailable = () => {
        // 检查是否所有可用卫星都已选中
        const allSelected = availableSatellites.every(sat => selectedSatellites.has(sat.id));

        if (allSelected) {
            // 全不选：取消选中所有可用卫星
            availableSatellites.forEach(sat => {
                if (selectedSatellites.has(sat.id)) {
                    onSatelliteToggle(sat.id);
                }
            });
        } else {
            // 全选：选中所有可用卫星
            availableSatellites.forEach(sat => {
                if (!selectedSatellites.has(sat.id)) {
                    onSatelliteToggle(sat.id);
                }
            });
        }
    };

    // 开始编辑卫星属性
    const startEditing = (satId: string, property: string, currentValue: any) => {
        setEditingSatelliteId(satId);
        setEditingProperty(property);
        setEditValue(currentValue || '');
    };

    // 保存卫星属性
    const saveEditing = () => {
        if (editingSatelliteId && editingProperty) {
            onSatellitePropertyChange(editingSatelliteId, editingProperty, editValue);
            setEditingSatelliteId(null);
            setEditingProperty(null);
            setEditValue('');
        }
    };

    // 取消编辑
    const cancelEditing = () => {
        setEditingSatelliteId(null);
        setEditingProperty(null);
        setEditValue('');
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
                                <div key={sat.id} className="p-2 bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
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

                                    {/* 卫星属性编辑 */}
                                    <div className="ml-6 space-y-1">
                                        {/* 显示名称编辑 */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 font-mono w-16">显示名称:</span>
                                            {editingSatelliteId === sat.id && editingProperty === 'displayName' ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                                        onBlur={saveEditing}
                                                        onKeyPress={(e) => e.key === 'Enter' && saveEditing()}
                                                    />
                                                    <button
                                                        onClick={saveEditing}
                                                        className="px-2 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 rounded text-[10px] transition-colors"
                                                    >
                                                        保存
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="px-2 py-1 bg-red-900 hover:bg-red-800 text-red-300 rounded text-[10px] transition-colors"
                                                    >
                                                        取消
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-xs font-mono text-cyan-400">
                                                        {sat.displayName || sat.name}
                                                    </span>
                                                    <button
                                                        onClick={() => startEditing(sat.id, 'displayName', sat.displayName || sat.name)}
                                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                                                    >
                                                        编辑
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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

                    {/* 语音播报设置 */}
                    {speechConfig && onSpeechConfigChange && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide text-zh">语音播报</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-300 text-zh">启用语音播报</span>
                                    <input
                                        type="checkbox"
                                        checked={speechConfig.enabled}
                                        onChange={(e) => onSpeechConfigChange({ enabled: e.target.checked })}
                                        className="rounded text-cyan-600 bg-slate-800 border-slate-600"
                                    />
                                </div>
                                {speechConfig.enabled && (
                                    <>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-[10px] text-slate-400 text-zh">音量</span>
                                                <span className="text-[10px] text-cyan-400">{Math.round((speechConfig.volume || 0.8) * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={speechConfig.volume || 0.8}
                                                onChange={(e) => onSpeechConfigChange({ volume: parseFloat(e.target.value) })}
                                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 text-zh">提前通知</span>
                                            <select
                                                value={speechConfig.advanceNoticeMinutes || 1}
                                                onChange={(e) => onSpeechConfigChange({ advanceNoticeMinutes: parseInt(e.target.value) })}
                                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                            >
                                                <option value="1">1分钟</option>
                                                <option value="5">5分钟</option>
                                                <option value="10">10分钟</option>
                                            </select>
                                        </div>
                                        {onTestSpeech && (
                                            <button
                                                onClick={onTestSpeech}
                                                className="w-full py-1.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-300 rounded text-xs transition-colors"
                                            >
                                                测试语音
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 弧段可视化设置 */}
                    {arcVisualizationConfig && onArcVisualizationConfigChange && (
                        <ArcVisualization
                            config={arcVisualizationConfig}
                            onConfigChange={onArcVisualizationConfigChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};