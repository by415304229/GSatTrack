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

    // 使用更稳定的时间计算方式，避免时间漂移
    const startTimeRef = useRef<number>(Date.now());
    const lastRealTimeRef = useRef<number>(Date.now());
    const lastSimulatedTimeRef = useRef<Date>(initialTime);
    const isPausedRef = useRef<boolean>(!autoStart);
    const simulationRateRef = useRef<number>(initialRate);

    // 同步状态到 ref，避免闭包问题
    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        simulationRateRef.current = simulationRate;
    }, [simulationRate]);

    // 时间模拟循环 - 使用requestAnimationFrame实现平滑动画
    useEffect(() => {
        let handle: number;
        const loop = () => {
            const now = Date.now();
            const dt = now - lastRealTimeRef.current;
            lastRealTimeRef.current = now;

            if (!isPausedRef.current) {
                // 计算经过的模拟时间
                const simulatedDt = dt * simulationRateRef.current;

                // 计算新的模拟时间
                const newTime = new Date(lastSimulatedTimeRef.current.getTime() + simulatedDt);

                // 只有当时间确实变化时才更新状态
                if (newTime.getTime() !== lastSimulatedTimeRef.current.getTime()) {
                    setSimulatedTime(newTime);
                    lastSimulatedTimeRef.current = newTime;
                }
            }

            handle = requestAnimationFrame(loop);
        };

        handle = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(handle);
    }, []);

    // 控制函数
    const pause = useCallback(() => {
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        setIsPaused(false);
        // 重置lastRealTimeRef，避免暂停期间的时间累积
        lastRealTimeRef.current = Date.now();
    }, []);

    // 重置到实时时间
    const resetToRealTime = useCallback(() => {
        const now = new Date();
        setSimulatedTime(now);
        lastSimulatedTimeRef.current = now;
        // 重置lastRealTimeRef
        lastRealTimeRef.current = Date.now();
    }, []);

    // 设置模拟速率
    const setRate = useCallback((rate: number) => {
        setSimulationRate(rate);
    }, []);

    // 直接设置模拟时间
    const setSimulatedTimeWrapper = useCallback((time: Date) => {
        setSimulatedTime(time);
        lastSimulatedTimeRef.current = time;
        // 重置lastRealTimeRef
        lastRealTimeRef.current = Date.now();
    }, []);

    return {
        simulatedTime,
        simulationRate,
        isPaused,
        setSimulatedTime: setSimulatedTimeWrapper,
        setSimulationRate,
        setIsPaused,
        pause,
        resume,
        resetToRealTime,
        setRate
    };
};