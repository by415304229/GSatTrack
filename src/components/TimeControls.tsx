import clsx from 'clsx';
import { Pause, Play } from 'lucide-react';
import React from 'react';

export interface TimeControlsProps {
    time: Date;
    rate: number;
    paused: boolean;
    onPauseToggle: () => void;
    onResetToRealTime: () => void;
    onRateChange: (rate: number) => void;
}

export const TimeControls: React.FC<TimeControlsProps> = ({
    time,
    rate,
    paused,
    onPauseToggle,
    onRateChange,
    onResetToRealTime
}) => {
    // Calculate Beijing time (UTC+8)
    const beijingTime = new Date(time.getTime() + 8 * 60 * 60 * 1000);

    // Format date: YYYY-MM-DD
    const dateStr = beijingTime.toISOString().substring(0, 10);
    // Format time: HH:MM:SS
    const timeStr = beijingTime.toISOString().substring(11, 19);

    return (
        <div className="flex items-center bg-[#0B1120] border border-slate-800 rounded-md px-5 py-2.5">
            <div className="flex items-center gap-3">
                <span className="text-lg text-cyan-400">北京时间</span>
                <span className="font-mono text-lg text-cyan-400">{dateStr}</span>
                <span className="font-mono text-lg text-cyan-400">{timeStr}</span>
            </div>
            <div className="h-5 w-[1px] bg-slate-700 mx-6"></div>
            <div className="flex items-center gap-3">
                <button onClick={onPauseToggle} className="hover:text-cyan-400 transition-colors">
                    {paused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                </button>
                <button onClick={onResetToRealTime} className="text-xs font-bold hover:text-cyan-400 px-3 py-1">实时</button>
                <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
                    {[1, 10, 100, 1000].map(r => (
                        <button
                            key={r}
                            onClick={() => onRateChange(r)}
                            className={clsx(
                                "px-3 py-1 text-xs font-mono border-r border-slate-800 last:border-0 hover:bg-slate-800 transition-colors",
                                rate === r ? "bg-cyan-900 text-cyan-400" : "text-slate-400"
                            )}
                        >
                            {r}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};