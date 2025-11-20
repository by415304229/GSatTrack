import React, { useEffect, useRef, useState } from 'react';
import { SatellitePos } from '../types';

interface Map2DProps {
  satellites: SatellitePos[];
  onSatClick?: (sat: SatellitePos) => void;
}

interface HoverData {
    sat: SatellitePos;
    x: number;
    y: number;
}

const Tooltip = ({ data }: { data: HoverData }) => {
    return (
        <div 
            className="fixed z-50 pointer-events-none p-3 bg-slate-950/90 border border-cyan-500/50 rounded backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)] flex flex-col gap-2 min-w-[180px]"
            style={{ 
                left: data.x + 15, 
                top: data.y + 15 
            }}
        >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                <span className="text-cyan-400 font-bold font-mono text-xs tracking-wider">{data.sat.name}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[10px] font-mono text-slate-300">
                <span className="text-slate-500">ALT</span>
                <span className="text-right font-bold">{data.sat.alt.toFixed(1)} KM</span>
                
                <span className="text-slate-500">VEL</span>
                <span className="text-right font-bold">{data.sat.velocity.toFixed(2)} KM/S</span>
                
                <span className="text-slate-500">LAT</span>
                <span className="text-right font-bold">{data.sat.lat.toFixed(2)}°</span>
                
                <span className="text-slate-500">LON</span>
                <span className="text-right font-bold">{data.sat.lon.toFixed(2)}°</span>
            </div>
            <div className="text-[9px] text-cyan-500/50 font-mono pt-1 border-t border-slate-800/50 mt-1">
                ID: {data.sat.id} // CLICK FOR DETAILS
            </div>
        </div>
    )
}

const Map2D: React.FC<Map2DProps> = ({ satellites, onSatClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);

  // Load Earth Map Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'; 
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  // Main Render Loop
  // Handles resizing and drawing in the same frame to prevent sync issues
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // 1. Dynamic Resizing (The "Game Loop" pattern)
      // Check the actual display size of the canvas in CSS pixels
      const displayWidth = container.clientWidth;
      const displayHeight = container.clientHeight;

      if (displayWidth === 0 || displayHeight === 0) {
          // Element is hidden or collapsed
          animationFrameId = requestAnimationFrame(render);
          return;
      }

      // Check device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      
      // Calculate required internal resolution
      const requiredWidth = Math.floor(displayWidth * dpr);
      const requiredHeight = Math.floor(displayHeight * dpr);

      // Only resize if mismatch exists (prevents unnecessary buffer clearing)
      if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
          canvas.width = requiredWidth;
          canvas.height = requiredHeight;
          // Important: Context scale must be reset after resize
          ctx.scale(dpr, dpr);
      }

      // 2. Drawing
      // Use display dimensions for drawing logic
      const w = displayWidth;
      const h = displayHeight;

      // Clear (using logical pixels)
      ctx.clearRect(0, 0, w, h);

      // Draw Background
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#101827';
        ctx.fillRect(0, 0, w, h);
      }

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<=w; x+=w/12) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for(let y=0; y<=h; y+=h/6) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Draw Orbit Lines
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
                // Handle Date Line crossing
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

      // Draw Satellites
      satellites.forEach(sat => {
        const x = ((sat.lon + 180) / 360) * w;
        const y = ((90 - sat.lat) / 180) * h;

        const color = sat.color || '#ffffff';
        
        const isHovered = hoverData && hoverData.sat.id === sat.id;
        
        // Marker
        ctx.fillStyle = isHovered ? '#fff' : color; 
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowColor = isHovered ? '#06b6d4' : color;
        ctx.shadowBlur = isHovered ? 15 : 5;
        ctx.strokeStyle = isHovered ? '#06b6d4' : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 8 : 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Keep looping
      animationFrameId = requestAnimationFrame(render);
    };

    // Start Loop
    render();

    // Cleanup
    return () => {
        cancelAnimationFrame(animationFrameId);
    };
  }, [satellites, hoverData]); // We do NOT depend on dimensions state anymore

  // Interaction Handlers
  const findSatelliteAtPos = (clientX: number, clientY: number): HoverData | null => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return null;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // Use logical dimensions
      const w = rect.width;
      const h = rect.height;
      
      for (const sat of satellites) {
          const satX = ((sat.lon + 180) / 360) * w;
          const satY = ((90 - sat.lat) / 180) * h;
          // Simple Euclidean distance check
          const dist = Math.sqrt(Math.pow(x - satX, 2) + Math.pow(y - satY, 2));
          
          if (dist < 10) {
              return { sat, x: clientX, y: clientY };
          }
      }
      return null;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const found = findSatelliteAtPos(e.clientX, e.clientY);
      setHoverData(found);
      if (canvasRef.current) {
          canvasRef.current.style.cursor = found ? 'pointer' : 'default';
      }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const found = findSatelliteAtPos(e.clientX, e.clientY);
      if (found && onSatClick) {
          onSatClick(found.sat);
      }
  };

  const handleMouseLeave = () => {
      setHoverData(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="block w-full h-full rounded bg-[#0f172a] border border-slate-800 shadow-inner cursor-crosshair absolute inset-0"
          style={{ width: '100%', height: '100%' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {hoverData && <Tooltip data={hoverData} />}
    </div>
  );
};

export default Map2D;