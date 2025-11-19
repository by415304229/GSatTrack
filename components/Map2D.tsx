import React, { useEffect, useRef } from 'react';
import { SatellitePos } from '../types';

interface Map2DProps {
  satellites: SatellitePos[];
}

const Map2D: React.FC<Map2DProps> = ({ satellites }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load Earth Map Image (Night Version)
  useEffect(() => {
    const img = new Image();
    // Black Marble / Earth at Night texture
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1024px-The_earth_at_night.jpg'; 
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
        // Removed dark filter, added slight brightness boost
        ctx.filter = 'brightness(1.2) contrast(1.1)'; 
        ctx.drawImage(imageRef.current, 0, 0, rect.width, rect.height);
        ctx.filter = 'none';
      } else {
        // Fallback grid
        ctx.fillStyle = '#020617';
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
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1.5;

      satellites.forEach(sat => {
        if (!sat.orbitPath || sat.orbitPath.length === 0) return;
        
        // Use satellite specific color
        const color = sat.color || '#06b6d4';
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 3; // Subtle glow

        ctx.beginPath();
        let firstPoint = true;
        let prevX = 0;

        sat.orbitPath.forEach((p) => {
            // Convert Three.js/ECEF coords to Lat/Lon
            const ecefX = p.x;
            const ecefY = -p.z;
            const ecefZ = p.y;

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
                if (Math.abs(x - prevX) > rect.width * 0.5) {
                    ctx.moveTo(x, y); 
                } else {
                    ctx.lineTo(x, y);
                }
            }
            prevX = x;
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow for next
      });

      ctx.globalAlpha = 1.0;

      // Draw Satellites
      satellites.forEach(sat => {
        const x = ((sat.lon + 180) / 360) * rect.width;
        const y = ((90 - sat.lat) / 180) * rect.height;

        // Glow
        const color = sat.color || '#ffffff';
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        
        ctx.fillStyle = '#ffffff'; // Center dot is white
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Colored ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        
        // Label (optional)
        if (satellites.length < 15) {
            ctx.fillStyle = color;
            ctx.font = 'bold 10px monospace';
            ctx.fillText(sat.name, x + 8, y + 3);
        }
      });
    };

    draw();
  }, [satellites]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded bg-[#0b1120] border border-slate-800 shadow-inner"
    />
  );
};

export default Map2D;