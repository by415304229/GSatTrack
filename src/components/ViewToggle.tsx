import clsx from 'clsx';
import { Activity, Globe, Map as MapIcon } from 'lucide-react';
import React from 'react';

interface ViewToggleProps {
    mode: '3d' | '2d' | 'split';
    onChange: (mode: '3d' | '2d' | 'split') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ mode, onChange }) => {
    return (
        <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
            <button
                onClick={() => onChange('3d')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5 border-r border-slate-800 last:border-0",
                    mode === '3d' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <Globe size={12} />
                3D
            </button>
            <button
                onClick={() => onChange('2d')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5 border-r border-slate-800 last:border-0",
                    mode === '2d' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <MapIcon size={12} />
                2D
            </button>
            <button
                onClick={() => onChange('split')}
                className={clsx(
                    "px-3 py-1.5 text-[10px] font-bold transition-colors flex items-center gap-1.5",
                    mode === 'split' ? "bg-cyan-900 text-cyan-400" : "text-slate-400 hover:bg-slate-800"
                )}
            >
                <Activity size={12} />
                分屏
            </button>
        </div>
    );
};