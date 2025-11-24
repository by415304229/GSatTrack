import { useCallback, useEffect, useRef, useState } from 'react';

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
    const lastRafTime = useRef<number>(Date.now());

    // 时间模拟循环 - 使用requestAnimationFrame实现平滑动画
    useEffect(() => {
        let handle: number;
        const loop = () => {
            const now = Date.now();
            const dt = now - lastRafTime.current;
            lastRafTime.current = now;

            if (!isPaused) {
                setSimulatedTime(prev => new Date(prev.getTime() + dt * simulationRate));
            }

            handle = requestAnimationFrame(loop);
        };

        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    }, [isPaused, simulationRate]);

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