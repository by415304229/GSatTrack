import { MapPin, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { type GroundStation } from '../../types';

interface StationPanelProps {
    stations: GroundStation[];
    onAdd: (name: string, lat: number, lon: number) => void;
    onRemove: (id: string) => void;
}

export const StationPanel: React.FC<StationPanelProps> = ({
    stations,
    onAdd,
    onRemove
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLat, setNewLat] = useState('');
    const [newLon, setNewLon] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && newLat && newLon) {
            onAdd(newName, parseFloat(newLat), parseFloat(newLon));
            setNewName(''); setNewLat(''); setNewLon('');
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0B1120] border border-slate-800 rounded-md hover:border-cyan-500/50 transition-colors"
            >
                <MapPin size={14} className="text-emerald-500" />
                <span className="text-xs font-mono text-zh">地面站 ({stations.length})</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#020617] border border-slate-700 rounded-md shadow-xl z-50 p-4">
                    <h3 className="text-xs font-bold text-white mb-3 flex justify-between text-zh">
                        地面站
                        <button onClick={() => setIsOpen(false)}><Plus size={14} className="rotate-45" /></button>
                    </h3>

                    <div className="space-y-2 max-h-[150px] overflow-y-auto mb-4">
                        {stations.map(st => (
                            <div key={st.id} className="flex justify-between items-center text-[10px] font-mono bg-slate-900 p-2 rounded border border-slate-800">
                                <span className="text-emerald-400">{st.name}</span>
                                <button onClick={() => onRemove(st.id)} className="text-red-400 hover:text-red-300">DEL</button>
                            </div>
                        ))}
                        {stations.length === 0 && <div className="text-[10px] text-slate-600 italic text-zh">无活动地面站</div>}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-2 border-t border-slate-800 pt-3">
                        <input
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                            placeholder="地面站名称"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <input
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                placeholder="纬度"
                                type="number"
                                value={newLat}
                                onChange={e => setNewLat(e.target.value)}
                            />
                            <input
                                className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                placeholder="经度"
                                type="number"
                                value={newLon}
                                onChange={e => setNewLon(e.target.value)}
                            />
                        </div>
                        <button className="w-full py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-bold text-zh">添加地面站</button>
                    </form>
                </div>
            )}
        </div>
    );
};