import React, { useEffect, useRef } from 'react';
import { SatellitePos } from '../types';

interface Map2DProps {
  satellites: SatellitePos[];
}

const Map2D: React.FC<Map2DProps> = ({ satellites }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load Earth Map Image (High Res Blue Marble to match 3D)
  useEffect(() => {
    const img = new Image();
    img.src = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'; 
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw Background
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, rect.width, rect.height);
      } else {
        // Fallback
        ctx.fillStyle = '#101827';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let x=0; x<=rect.width; x+=rect.width/12) { ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); }
      for(let y=0; y<=rect.height; y+=rect.height/6) { ctx.moveTo(0, y); ctx.lineTo(rect.width, y); }
      ctx.stroke();

      // Draw Orbit Lines (Ground Tracks)
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
            // Coordinate Conversion:
            // 3D View Mapping: x=EcefX, y=EcefZ(North), z=-EcefY(West)
            // Inverse Mapping for Calculation:
            const ecefX = p.x;
            const ecefZ = p.y; // Three Y is North (Z in ECEF)
            const ecefY = -p.z; // Three Z is -East (Y in ECEF)

            const r = Math.sqrt(ecefX * ecefX + ecefY * ecefY + ecefZ * ecefZ);
            if (r === 0) return;

            const latRad = Math.asin(ecefZ / r);
            const lonRad = Math.atan2(ecefY, ecefX);

            const lat = (latRad * 180) / Math.PI;
            const lon = (lonRad * 180) / Math.PI;

            const x = ((lon + 180) / 360) * rect.width;
            const y = ((90 - lat) / 180) * rect.height;

            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                // Handle Date Line crossing
                const dist = Math.abs(x - prevX);
                if (dist > rect.width * 0.5) {
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
        const x = ((sat.lon + 180) / 360) * rect.width;
        const y = ((90 - sat.lat) / 180) * rect.height;

        const color = sat.color || '#ffffff';
        
        // Marker
        ctx.fillStyle = color; 
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    };

    requestAnimationFrame(draw);
  }, [satellites]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded bg-[#0f172a] border border-slate-800 shadow-inner"
    />
  );
};

export default Map2D;