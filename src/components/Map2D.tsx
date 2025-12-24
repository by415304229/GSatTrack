
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { type GroundStation, type SatellitePos } from '../types';
import { calculateTerminatorCoordinates } from '../utils/satMath';
import { calculateArcConnections2D } from '../utils/arcVisualization';
import type { ArcSegment, ArcVisualizationConfig } from '../types/arc.types';

interface map2dprops {
    satellites: SatellitePos[];
    groundStations: GroundStation[];
    onSatClick?: (sat: SatellitePos) => void;
    simulatedTime: Date;
    arcs?: ArcSegment[];
    arcVisualizationConfig?: ArcVisualizationConfig;
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



const Map2D: React.FC<map2dprops> = ({
    satellites,
    groundStations,
    onSatClick,
    simulatedTime,
    arcs = [],
    arcVisualizationConfig
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const lightsImageRef = useRef<HTMLImageElement | null>(null);
    const [hoverData, setHoverData] = useState<hoverdata | null>(null);

    // 默认弧段可视化配置
    const defaultArcConfig: ArcVisualizationConfig = useMemo(() => ({
        enabled: true,
        showActiveOnly: false,
        activeColor: '#10b981',
        upcomingColor: 'rgba(6, 182, 212, 0.5)',
        lineWidth: 1.5,
        animate: true,
        pulseSpeed: 1
    }), []);

    // Load Earth Map Images
    useEffect(() => {
        // Load main Earth image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = '/data/earth_atmos_2048.jpg'; // Using local file
        img.onload = () => {
            imageRef.current = img;
        };
        img.onerror = (error) => {
            console.error('Failed to load Earth map image:', error);
            // 图片加载失败时，imageRef.current 保持为 null，渲染时会使用备用方案
        };

        // Load lights image for night effects
        const lightsImg = new Image();
        lightsImg.crossOrigin = "anonymous";
        lightsImg.src = '/data/earth_lights_2048.png'; // Using local lights file
        lightsImg.onload = () => {
            lightsImageRef.current = lightsImg;
        };
        lightsImg.onerror = (error) => {
            console.error('Failed to load Earth lights image:', error);
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

            // Calculate and draw terminator line (day/night boundary)
            const terminatorResult = calculateTerminatorCoordinates(simulatedTime, w, h);
            const { points: terminatorPoints, isNorthPolarDay, isSouthPolarDay } = terminatorResult;

            if (terminatorPoints.length > 0) {
                // 1. 绘制夜间区域的灯光贴图
                if (lightsImageRef.current) {
                    // 创建裁剪路径，只显示夜间区域的灯光
                    ctx.save();

                    // 绘制完整的夜间区域路径
                    ctx.beginPath();

                    // 处理北极极夜情况
                    if (!isNorthPolarDay) {
                        // 从地图左上角(0,0)开始
                        ctx.moveTo(0, 0);
                        // 沿顶端直线到右上角(w,0)
                        ctx.lineTo(w, 0);
                        // 移动到晨昏线的最东端
                        ctx.lineTo(terminatorPoints[terminatorPoints.length - 1].x, terminatorPoints[terminatorPoints.length - 1].y);
                        // 严格按照terminatorPoints的逆序绘制
                        for (let i = terminatorPoints.length - 2; i >= 0; i--) {
                            ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                        }
                        // 闭合路径回到左上角
                        ctx.closePath();
                    }

                    // 处理南极极夜情况
                    if (!isSouthPolarDay) {
                        ctx.beginPath();
                        // 从地图左下角(0,h)开始
                        ctx.moveTo(0, h);
                        // 沿底端直线到右下角(w,h)
                        ctx.lineTo(w, h);
                        // 移动到晨昏线的最西端
                        ctx.lineTo(terminatorPoints[0].x, terminatorPoints[0].y);
                        // 严格按照terminatorPoints的顺序绘制
                        for (let i = 1; i < terminatorPoints.length; i++) {
                            ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                        }
                        // 闭合路径回到左下角
                        ctx.closePath();
                    }

                    // 设置裁剪区域
                    ctx.clip();

                    // 绘制灯光贴图，使用较低的透明度
                    ctx.globalAlpha = 0.6;
                    ctx.drawImage(lightsImageRef.current, 0, 0, w, h);
                    ctx.restore();
                }

                // 2. 绘制夜间覆盖层，使用渐变效果增强真实感
                ctx.globalAlpha = 0.8;

                // 处理北极极夜情况
                if (!isNorthPolarDay) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(w, 0);
                    ctx.lineTo(terminatorPoints[terminatorPoints.length - 1].x, terminatorPoints[terminatorPoints.length - 1].y);
                    for (let i = terminatorPoints.length - 2; i >= 0; i--) {
                        ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                    }
                    ctx.closePath();

                    // 添加从晨昏线到黑夜中心的渐变效果
                    const northGradient = ctx.createLinearGradient(w / 2, 0, w / 2, h / 2);
                    northGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)'); // 靠近顶端的较浅黑色
                    northGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)'); // 靠近中心的较深黑色
                    ctx.fillStyle = northGradient;
                    ctx.fill();
                }

                // 处理南极极夜情况
                if (!isSouthPolarDay) {
                    ctx.beginPath();
                    ctx.moveTo(0, h);
                    ctx.lineTo(w, h);
                    ctx.lineTo(terminatorPoints[0].x, terminatorPoints[0].y);
                    for (let i = 1; i < terminatorPoints.length; i++) {
                        ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                    }
                    ctx.closePath();

                    // 添加从晨昏线到黑夜中心的渐变效果
                    const southGradient = ctx.createLinearGradient(w / 2, h, w / 2, h / 2);
                    southGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)'); // 靠近底端的较浅黑色
                    southGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)'); // 靠近中心的较深黑色
                    ctx.fillStyle = southGradient;
                    ctx.fill();
                }

                ctx.globalAlpha = 1.0;

                // 3. 绘制晨昏线
                ctx.save();

                // Add glow effect
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 10;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();

                // 严格按照terminatorPoints的顺序绘制完整的晨昏线
                ctx.moveTo(terminatorPoints[0].x, terminatorPoints[0].y);
                for (let i = 1; i < terminatorPoints.length; i++) {
                    ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                }

                ctx.stroke();

                // Reset shadow
                ctx.restore();
            }

            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= w; x += w / 12) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
            for (let y = 0; y <= h; y += h / 6) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
            ctx.stroke();

            // Arc Connections (弧段连线)
            if (arcs && arcVisualizationConfig?.enabled) {
                const connections = calculateArcConnections2D(
                    arcs,
                    satellites,
                    groundStations,
                    simulatedTime,
                    w,
                    h,
                    arcVisualizationConfig
                );

                connections.forEach(conn => {
                    ctx.beginPath();
                    ctx.moveTo(conn.satellite.x, conn.satellite.y);
                    ctx.lineTo(conn.station.x, conn.station.y);

                    // 设置样式
                    const color = conn.isActive ? conn.color : conn.color.replace(/[\d.]+\)$/, '0.3)');
                    ctx.strokeStyle = color;
                    ctx.lineWidth = conn.isActive ? (arcVisualizationConfig.lineWidth || 1.5) : 1;

                    // 添加发光效果
                    if (conn.isActive) {
                        ctx.shadowColor = conn.color;
                        ctx.shadowBlur = 10;
                    }

                    ctx.stroke();

                    // 重置shadow
                    ctx.shadowBlur = 0;
                });
            }

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
    }, [satellites, groundStations, hoverData, simulatedTime, arcs, arcVisualizationConfig, defaultArcConfig]);

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
            if (dist < 10) return { id: sat.id, name: sat.displayName || sat.name, type: 'SAT', data: sat, x: clientX, y: clientY };
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
