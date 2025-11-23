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
    // Calculate local time (UTC+8 for Shanghai)
    const shanghaiTime = new Date(time.getTime() + 8 * 60 * 60 * 1000);

    return (
        <div className="flex items-center gap-4 bg-[#0B1120] border border-slate-800 rounded-md px-3 py-1.5">
            <div className="font-mono text-xs text-cyan-400">
                <div>UTC时间: {time.toISOString().replace('T', ' ').substring(0, 19)}</div>
                <div className="text-emerald-400 text-[10px]">本地时间: {shanghaiTime.toISOString().replace('T', ' ').substring(0, 19)}</div>
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <button onClick={onPauseToggle} className="hover:text-cyan-400 transition-colors">
                {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>
            <button onClick={onResetToRealTime} className="text-[10px] font-bold hover:text-cyan-400 px-2">实时</button>
            <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
                {[1, 10, 100, 1000].map(r => (
                    <button
                        key={r}
                        onClick={() => onRateChange(r)}
                        className={clsx(
                            "px-2 py-0.5 text-[10px] font-mono border-r border-slate-800 last:border-0 hover:bg-slate-800 transition-colors",
                            rate === r ? "bg-cyan-900 text-cyan-400" : "text-slate-400"
                        )}
                    >
                        {r}x
                    </button>
                ))}
            </div>
        </div>
    );
};