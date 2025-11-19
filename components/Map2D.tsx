import React, { useEffect, useRef } from 'react';
import { SatellitePos } from '../types';

interface Map2DProps {
  satellites: SatellitePos[];
  color: string;
}

const Map2D: React.FC<Map2DProps> = ({ satellites, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load Earth Map Image
  useEffect(() => {
    const img = new Image();
    // Using a reliable equirectangular earth map
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1024px-Equirectangular_projection_SW.jpg'; 
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
        ctx.globalAlpha = 0.6;
        ctx.drawImage(imageRef.current, 0, 0, rect.width, rect.height);
        ctx.globalAlpha = 1.0;
      } else {
        // Fallback grid
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        for(let i=0; i<rect.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, rect.height); }
        for(let i=0; i<rect.height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(rect.width, i); }
        ctx.stroke();
      }

      // Draw Orbit Lines (Ground Tracks)
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      satellites.forEach(sat => {
        if (!sat.orbitPath || sat.orbitPath.length === 0) return;

        ctx.beginPath();
        let firstPoint = true;
        let prevX = 0;

        sat.orbitPath.forEach((p) => {
            // Convert Three.js/ECEF coords to Lat/Lon
            // Three coordinates from satMath: x=ECEF.x, y=ECEF.z, z=-ECEF.y
            const ecefX = p.x;
            const ecefY = -p.z;
            const ecefZ = p.y;

            // Calculate spherical coordinates (Geocentric)
            const r = Math.sqrt(ecefX * ecefX + ecefY * ecefY + ecefZ * ecefZ);
            if (r === 0) return;

            const latRad = Math.asin(ecefZ / r);
            const lonRad = Math.atan2(ecefY, ecefX);

            const lat = (latRad * 180) / Math.PI;
            const lon = (lonRad * 180) / Math.PI;

            // Project to Map
            // Lon: -180 to 180 -> 0 to width
            // Lat: 90 to -90 -> 0 to height
            const x = ((lon + 180) / 360) * rect.width;
            const y = ((90 - lat) / 180) * rect.height;

            if (firstPoint) {
                ctx.moveTo(x, y);
                firstPoint = false;
            } else {
                // Handle Date Line crossing
                // If distance between points is > 50% of map width, we wrapped
                if (Math.abs(x - prevX) > rect.width * 0.5) {
                    ctx.moveTo(x, y); // Skip the line across screen
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
        // Map lat/lon to x/y
        const x = ((sat.lon + 180) / 360) * rect.width;
        const y = ((90 - sat.lat) / 180) * rect.height;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Label (optional, low opacity)
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '10px monospace';
        if (satellites.length < 20 || Math.random() > 0.95) { // Show some labels
            ctx.fillText(sat.name, x + 5, y);
        }
      });
    };

    draw();
  }, [satellites, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded bg-slate-900 border border-slate-700"
    />
  );
};

export default Map2D;