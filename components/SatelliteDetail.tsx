import React from 'react';
import { SatellitePos } from '../types';
import { X, Radio, ShieldCheck, Activity, Clock, Globe } from 'lucide-react';

interface SatelliteDetailProps {
  sat: SatellitePos;
  onClose: () => void;
}

const SatelliteDetail: React.FC<SatelliteDetailProps> = ({ sat, onClose }) => {
  // Parse some additional orbital info from TLE line 2 if available
  // Line 2: 2 NNNNN IIII.IIII RRR.RRRR EEEEEEE AAAAA.AAAA MMMM.MMMM NN.NNNNNNNNRRRRR
  let inclination = 'N/A';
  let period = 'N/A';
  
  if (sat.tle && sat.tle.line2) {
      const line2 = sat.tle.line2;
      if (line2.length >= 63) {
          try {
            const incStr = line2.substring(8, 16).trim();
            const meanMotionStr = line2.substring(52, 63).trim();
            
            if (incStr) inclination = parseFloat(incStr).toFixed(2) + '°';
            
            const meanMotion = parseFloat(meanMotionStr);
            if (!isNaN(meanMotion) && meanMotion > 0) {
                const pMinutes = 1440 / meanMotion;
                period = pMinutes.toFixed(1) + ' MIN';
            }
          } catch (e) {
              console.warn("Error parsing TLE details", e);
          }
      }
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[#050914]/95 border-l border-slate-800 backdrop-blur-xl z-50 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#020617]/80 shrink-0">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-cyan-500/20 rounded border border-cyan-500/30">
                <Radio size={20} className="text-cyan-400 animate-pulse" />
             </div>
             <div>
                 <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Target Lock</div>
                 <h2 className="text-white font-bold font-mono text-lg leading-none truncate max-w-[200px]">{sat.name}</h2>
             </div>
        </div>
        <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
            <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Banner */}
          <div className="flex items-center gap-4 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded">
              <ShieldCheck className="text-emerald-500" size={24} />
              <div>
                  <div className="text-emerald-400 font-bold font-mono text-sm">SYSTEM OPTIMAL</div>
                  <div className="text-emerald-600 text-[10px] font-mono">Telemetry Stream Active</div>
              </div>
              <div className="ml-auto text-emerald-500 font-mono font-bold text-xl">100%</div>
          </div>

          {/* Telemetry Grid */}
          <div>
              <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                  <Activity size={12} /> LIVE TELEMETRY
              </h3>
              <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono mb-1">ALTITUDE</div>
                      <div className="text-2xl font-mono text-white">{sat.alt.toFixed(1)} <span className="text-xs text-slate-500">KM</span></div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono mb-1">VELOCITY</div>
                      <div className="text-2xl font-mono text-white">{sat.velocity.toFixed(2)} <span className="text-xs text-slate-500">KM/S</span></div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono mb-1">LATITUDE</div>
                      <div className="text-xl font-mono text-white">{sat.lat.toFixed(4)}°</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 font-mono mb-1">LONGITUDE</div>
                      <div className="text-xl font-mono text-white">{sat.lon.toFixed(4)}°</div>
                  </div>
              </div>
          </div>

          {/* Orbital Parameters */}
          <div>
              <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                  <Globe size={12} /> ORBITAL PARAMETERS
              </h3>
              <div className="bg-slate-900/30 rounded border border-slate-800 divide-y divide-slate-800/50">
                   <div className="p-3 flex justify-between items-center">
                       <span className="text-xs text-slate-400 font-mono">INCLINATION</span>
                       <span className="text-sm text-cyan-400 font-mono">{inclination}</span>
                   </div>
                   <div className="p-3 flex justify-between items-center">
                       <span className="text-xs text-slate-400 font-mono">ORBITAL PERIOD</span>
                       <span className="text-sm text-cyan-400 font-mono">{period}</span>
                   </div>
                   <div className="p-3 flex justify-between items-center">
                       <span className="text-xs text-slate-400 font-mono">NORAD ID</span>
                       <span className="text-sm text-cyan-400 font-mono">{sat.id}</span>
                   </div>
              </div>
          </div>

          {/* Raw TLE */}
          {sat.tle && (
              <div>
                  <h3 className="text-xs font-bold text-slate-500 font-mono mb-3 flex items-center gap-2">
                      <Clock size={12} /> TWO-LINE ELEMENT SET
                  </h3>
                  <div className="bg-black p-3 rounded border border-slate-800 font-mono text-[10px] text-emerald-500/80 break-all leading-relaxed">
                      <div>{sat.tle.line1}</div>
                      <div className="mt-1">{sat.tle.line2}</div>
                  </div>
              </div>
          )}
      </div>
      
      <div className="p-4 border-t border-slate-800 bg-[#020617]">
          <button className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs rounded tracking-widest transition-colors flex items-center justify-center gap-2">
              INITIATE TRACKING LOCK
          </button>
      </div>
    </div>
  );
};

export default SatelliteDetail;