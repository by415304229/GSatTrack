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
    // 添加一个 useRef 来保存当前的 simulatedTime 值，避免不必要的状态更新
    const currentSimulatedTimeRef = useRef<Date>(initialTime);

    // 时间模拟循环 - 使用requestAnimationFrame实现平滑动画
    useEffect(() => {
        let handle: number;
        const loop = () => {
            const now = Date.now();
            const dt = now - lastRafTime.current;
            lastRafTime.current = now;

            if (!isPaused) {
                // 计算新的时间值
                const newTime = new Date(currentSimulatedTimeRef.current.getTime() + dt * simulationRate);
                // 检查新的时间值是否与当前值不同，只有当不同时才更新状态
                if (newTime.getTime() !== currentSimulatedTimeRef.current.getTime()) {
                    setSimulatedTime(newTime);
                    // 更新 useRef 中的值
                    currentSimulatedTimeRef.current = newTime;
                }
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

    // 重置到实时时间，并更新 useRef
    const resetToRealTime = useCallback(() => {
        const now = new Date();
        setSimulatedTime(now);
        currentSimulatedTimeRef.current = now;
    }, []);

    // 设置模拟速率
    const setRate = useCallback((rate: number) => {
        setSimulationRate(rate);
    }, []);

    // 包装 setSimulatedTime，确保 useRef 也被更新
    const setSimulatedTimeWrapper = useCallback((time: Date) => {
        setSimulatedTime(time);
        currentSimulatedTimeRef.current = time;
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