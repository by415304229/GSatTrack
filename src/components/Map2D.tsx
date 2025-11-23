
import React, { useEffect, useRef, useState } from 'react';
import { type SatellitePos, type GroundStation } from '../types';

interface map2dprops {
  satellites: SatellitePos[];
  groundStations: GroundStation[];
  onSatClick?: (sat: SatellitePos) => void;
}

interface hoverdata {
    id: string;
    name: string;
    type: 'SAT' | 'STATION';
    data: any;
    x: number;
    y: number;
}

const Tooltip = ({ data }: { data: hoverdata }) => {
    return (
        <div 
            className="fixed z-50 pointer-events-none p-3 bg-slate-950/90 border border-cyan-500/50 rounded backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col gap-2 min-w-[180px]"
            style={{ 
                left: data.x + 15, 
                top: data.y + 15 
            }}
        >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                <span className="text-cyan-400 font-bold font-mono text-xs tracking-wider">{data.name}</span>
                {data.type === 'SAT' && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
            </div>
            
            {data.type === 'SAT' && (
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[10px] font-mono text-slate-300">
                    <span className="text-slate-500 text-zh">高度</span>
                    <span className="text-right font-bold">{data.data.alt.toFixed(1)} KM</span>
                     
                    <span className="text-slate-500 text-zh">速度</span>
                    <span className="text-right font-bold">{data.data.velocity.toFixed(2)} KM/S</span>
                     
                    <span className="text-slate-500 text-zh">纬度</span>
                    <span className="text-right font-bold">{data.data.lat.toFixed(2)}°</span>
                     
                    <span className="text-slate-500 text-zh">经度</span>
                    <span className="text-right font-bold">{data.data.lon.toFixed(2)}°</span>
                </div>
            )}
            {data.type === 'STATION' && (
                <div className="text-[10px] font-mono text-slate-300">
                    <span className="text-zh">地面站上行链路激活</span>
                </div>
            )}
        </div>
    )
}

const Map2D: React.FC<map2dprops> = ({ satellites, groundStations, onSatClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [hoverData, setHoverData] = useState<hoverdata | null>(null);
  
  // Load Earth Map Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = '/data/earth_atmos_2048.jpg'; // Using local file
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const displayWidth = container.clientWidth;
      const displayHeight = container.clientHeight;

      if (displayWidth === 0 || displayHeight === 0) {
          animationFrameId = requestAnimationFrame(render);
          return;
      }

      const dpr = window.devicePixelRatio || 1;
      const requiredWidth = Math.floor(displayWidth * dpr);
      const requiredHeight = Math.floor(displayHeight * dpr);

      if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
          canvas.width = requiredWidth;
          canvas.height = requiredHeight;
          ctx.scale(dpr, dpr);
      }

      const w = displayWidth;
      const h = displayHeight;

      // Draw
      ctx.clearRect(0, 0, w, h);

      // Background
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#101827';
        ctx.fillRect(0, 0, w, h);
      }

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<=w; x+=w/12) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for(let y=0; y<=h; y+=h/6) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Orbits
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.5;
      satellites.forEach(sat => {
        if (!sat.orbitPath || sat.orbitPath.length === 0) return;
        
        const color = sat.color || '#06b6d4';
        ctx.strokeStyle = color;
        
        ctx.beginPath();
        let firstPoint = true;
        let prevX = 0;

        sat.orbitPath.forEach((p) => {
            const x = ((p.lon + 180) / 360) * w;
            const y = ((90 - p.lat) / 180) * h;

            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                const dist = Math.abs(x - prevX);
                if (dist > w * 0.5) {
                    ctx.moveTo(x, y); 
                } else {
                    ctx.lineTo(x, y);
                }
            }
            prevX = x;
        });
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

      // Ground Stations
      groundStations.forEach(station => {
          const x = ((station.lon + 180) / 360) * w;
          const y = ((90 - station.lat) / 180) * h;
          
          ctx.fillStyle = station.color;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 4, y - 8);
          ctx.lineTo(x + 4, y - 8);
          ctx.fill();

          ctx.font = '9px monospace';
          ctx.fillStyle = 'white';
          ctx.fillText(station.name.substring(0, 3).toUpperCase(), x + 6, y - 4);
      });

      // Satellites
      satellites.forEach(sat => {
        const x = ((sat.lon + 180) / 360) * w;
        const y = ((90 - sat.lat) / 180) * h;
        const color = sat.color || '#ffffff';
        
        const isHovered = hoverData && hoverData.type === 'SAT' && hoverData.id === sat.id;
        
        ctx.fillStyle = isHovered ? '#fff' : color; 
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = isHovered ? '#06b6d4' : color;
        ctx.shadowBlur = isHovered ? 15 : 5;
        ctx.strokeStyle = isHovered ? '#06b6d4' : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 8 : 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [satellites, groundStations, hoverData]);

  // Interaction
  const findObjectAtPos = (clientX: number, clientY: number): hoverdata | null => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      
      // Check Satellites
      for (const sat of satellites) {
          const satX = ((sat.lon + 180) / 360) * w;
          const satY = ((90 - sat.lat) / 180) * h;
          const dist = Math.sqrt(Math.pow(x - satX, 2) + Math.pow(y - satY, 2));
          if (dist < 10) return { id: sat.id, name: sat.name, type: 'SAT', data: sat, x: clientX, y: clientY };
      }
      
      // Check Stations
      for (const st of groundStations) {
          const stX = ((st.lon + 180) / 360) * w;
          const stY = ((90 - st.lat) / 180) * h;
          const dist = Math.sqrt(Math.pow(x - stX, 2) + Math.pow(y - stY, 2));
          if (dist < 10) return { id: st.id, name: st.name, type: 'STATION', data: st, x: clientX, y: clientY };
      }

      return null;
  }

  const handlemousemove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const found = findObjectAtPos(e.clientX, e.clientY);
      setHoverData(found);
      if (canvasRef.current) canvasRef.current.style.cursor = found ? 'pointer' : 'default';
  };
  
  const handleclick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const found = findObjectAtPos(e.clientX, e.clientY);
      if (found && found.type === 'SAT' && onSatClick) {
          onSatClick(found.data);
      }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full rounded bg-[#0f172a] border border-slate-800 shadow-inner cursor-crosshair absolute inset-0"
          style={{ width: '100%', height: '100%' }}
          onMouseMove={handlemousemove}
          onMouseLeave={() => setHoverData(null)}
          onClick={handleclick}
        />
        {hoverData && <Tooltip data={hoverData} />}
    </div>
  );
};

export default Map2D;
