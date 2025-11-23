import { useState, useEffect, useCallback } from 'react';

interface UseTimeSimulationOptions {
    initialTime?: Date;
    initialRate?: number;
    autoStart?: boolean;
}

interface UseTimeSimulationReturn {
    simulatedTime: Date;
    simulationRate: number;
    isPaused: boolean;
    setSimulatedTime: (time: Date) => void;
    setSimulationRate: (rate: number) => void;
    setIsPaused: (paused: boolean) => void;
    pause: () => void;
    resume: () => void;
    resetToRealTime: () => void;
    setRate: (rate: number) => void;
}

export const useTimeSimulation = (options: UseTimeSimulationOptions = {}): UseTimeSimulationReturn => {
    const {
        initialTime = new Date(),
        initialRate = 1,
        autoStart = true
    } = options;

    const [simulatedTime, setSimulatedTime] = useState<Date>(initialTime);
    const [simulationRate, setSimulationRate] = useState<number>(initialRate);
    const [isPaused, setIsPaused] = useState<boolean>(!autoStart);

    // 时间模拟循环
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setSimulatedTime(prev => new Date(prev.getTime() + simulationRate * 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [simulationRate, isPaused]);

    // 控制函数
    const pause = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
    }, []);

    const resetToRealTime = useCallback(() => {
        setSimulatedTime(new Date());
    }, []);

    const setRate = useCallback((rate: number) => {
        setSimulationRate(rate);
    }, []);

    return {
        simulatedTime,
        simulationRate,
        isPaused,
        setSimulatedTime,
        setSimulationRate,
        setIsPaused,
        pause,
        resume,
        resetToRealTime,
        setRate
    };
};