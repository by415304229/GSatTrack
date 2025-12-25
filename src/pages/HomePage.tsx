import React, { useState, useEffect, useRef } from 'react';
import useSatelliteManager from '../hooks/useSatelliteManager';
import { useTimeSimulation } from '../hooks/useTimeSimulation';
import useArcMonitor from '../hooks/useArcMonitor';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import speechNotificationService from '../services/speechNotificationService';
import { loadArcVisibilityConfig } from '../utils/storage';
import type { ArcVisualizationConfig } from '../types/arc.types';

import Header from '../components/Header';
import MainContent from '../components/MainContent';
import { SettingsPanel } from '../components/SettingsPanel';
import TLEImportModal from '../components/TLEImportModal';
import { ArcForecastBanner } from '../components/arc/ArcForecastBanner';

const HomePage: React.FC = () => {
    // 状态管理
    const {
        groups,
        selectedSatellites,
        loading,
        toggleSatellite,
        refreshGroups,
        onSatellitePropertyChange
    } = useSatelliteManager();

    // 弧段监控
    const arcMonitor = useArcMonitor({ lookAheadHours: 24, maxDisplayCount: 4, enabled: true });

    // 语音播报
    const speech = useSpeechSynthesis();

    // 弧段可视化配置
    const [arcVisualizationConfig, setArcVisualizationConfig] = useState<ArcVisualizationConfig>(() => {
        const saved = loadArcVisibilityConfig() as ArcVisualizationConfig | null;
        return saved || {
            enabled: true,
            showActiveOnly: false,
            activeColor: '#10b981',
            upcomingColor: '#06b6d4',
            lineWidth: 1.5,
            animate: true,
            pulseSpeed: 1
        };
    });

    const [stations, setStations] = useState<Array<{
        id: string;
        name: string;
        lat: number;
        lon: number;
        color: string;
    }>>([
        {
            id: 'gs-korla',
            name: '库尔勒',
            lat: 41.549000,
            lon: 86.233000,
            color: '#10b981'
        },
        {
            id: 'gs-shanghai',
            name: '上海',
            lat: 30.968500,
            lon: 121.247000,
            color: '#f59e0b'
        },
        {
            id: 'gs-fuyuan',
            name: '抚远',
            lat: 47.997000,
            lon: 134.055000,
            color: '#8b5cf6'
        },
        {
            id: 'gs-kl',
            name: '吉隆坡',
            lat: 2.610214,
            lon: 101.956915,
            color: '#ec4899'
        }
    ]);

    // 使用自定义时间模拟钩子
    const {
        simulatedTime: simTime,
        simulationRate: timeRate,
        isPaused,
        setSimulatedTime,
        setSimulationRate,
        setIsPaused,
        pause,
        resume,
        resetToRealTime
    } = useTimeSimulation({
        initialTime: new Date(),
        initialRate: 1,
        autoStart: true
    });

    const [viewMode, setViewMode] = useState<'3d' | '2d' | 'split'>('3d');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [orbitWindowMinutes, setOrbitWindowMinutes] = useState(24); // 1/4 period ~24 minutes
    const [showTLEImport, setShowTLEImport] = useState(false);

    // 数据加载已在 useSatelliteManager 中处理

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
        // TLEFileUpload已经处理了卫星组的更新，这里只需要关闭模态框
        setShowTLEImport(false);
    };

    const handleSatelliteGroupUpdated = (groupId: string, satelliteCount: number) => {
        // 无论卫星组是否活动，都刷新卫星组数据，确保界面更新
        refreshGroups();
    };

    // 语音通知检查 - 每5秒检查一次
    // 使用 useRef 存储 arcMonitor 和 speech，避免依赖项频繁变化
    const arcMonitorRef = useRef(arcMonitor);
    const speechRef = useRef(speech);

    // 更新 ref 值
    useEffect(() => {
        arcMonitorRef.current = arcMonitor;
        speechRef.current = speech;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            speechNotificationService.checkAndNotify(
                arcMonitorRef.current.displayArcs,
                speechRef.current.config
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []); // 空依赖数组，定时器只设置一次

    // 弧段可视化配置变更处理
    const handleArcVisualizationConfigChange = (config: Partial<ArcVisualizationConfig>) => {
        setArcVisualizationConfig(prev => {
            const updated = { ...prev, ...config };
            // 保存到本地存储
            localStorage.setItem('gsat_arc_visibility_config', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
            <Header
                simTime={simTime}
                timeRate={timeRate}
                isPaused={isPaused}
                onPauseToggle={() => isPaused ? resume() : pause()}
                onRateChange={setSimulationRate}
                onResetToRealTime={resetToRealTime}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                stations={stations}
                onAddStation={handleAddStation}
                onRemoveStation={handleRemoveStation}
                onSettingsOpen={() => setSettingsOpen(true)}
                onTLEImportOpen={() => setShowTLEImport(true)}
            />

            <MainContent
                loading={loading}
                group={groups[0]}
                simTime={simTime}
                stations={stations}
                viewMode={viewMode}
                orbitWindowMinutes={orbitWindowMinutes}
                selectedSatellites={selectedSatellites}
                timeRate={timeRate}
                arcs={arcMonitor.displayArcs}
                arcVisualizationConfig={arcVisualizationConfig}
            />

            {/* 弧段预报横幅 */}
            <ArcForecastBanner
                arcs={arcMonitor.displayArcs}
                isLoading={arcMonitor.isLoading}
                isRefreshing={arcMonitor.isRefreshing}
                error={arcMonitor.error}
            />

            <SettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                orbitWindowMinutes={orbitWindowMinutes}
                onOrbitWindowChange={setOrbitWindowMinutes}
                selectedSatellites={selectedSatellites}
                availableSatellites={groups.flatMap(group => group.tles || []).map(tle => ({
                    id: tle.satId,
                    name: tle.name,
                    displayName: tle.displayName
                }))}
                onSatelliteToggle={(satId) => {
                    const newSelection = new Set(selectedSatellites);
                    if (newSelection.has(satId)) {
                        newSelection.delete(satId);
                    } else {
                        newSelection.add(satId);
                    }
                    // 使用toggleSatellite方法替代直接设置
                    toggleSatellite(satId);
                }}
                onSatellitePropertyChange={onSatellitePropertyChange}
                speechConfig={speech.config}
                onSpeechConfigChange={speech.updateConfig}
                onTestSpeech={speech.testSpeech}
                arcVisualizationConfig={arcVisualizationConfig}
                onArcVisualizationConfigChange={handleArcVisualizationConfigChange}
            />

            <TLEImportModal
                isOpen={showTLEImport}
                onClose={() => setShowTLEImport(false)}
                onFileUpload={handleTLEImport}
                onSatelliteGroupUpdated={handleSatelliteGroupUpdated}
            />
        </div>
    );
};

export default HomePage;