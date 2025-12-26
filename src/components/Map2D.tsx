
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { type GroundStation, type SatellitePos } from '../types';
import { calculateTerminatorCoordinates } from '../utils/satMath';
import { calculateArcConnections2D } from '../utils/arcVisualization';
import type { ArcVisualizationConfig } from '../types/arc.types';
import type { ArcSegment } from '../services/types/api.types';
import {
    calculateArcAnimationState,
    calculateSegmentEndpoints,
    AnimationDirection,
    type ArcAnimationConfig
} from '../utils/arcAnimationUtils';
import { ChinaBorder2D, SAABoundary2D } from './geographic';
import type { GeographicBoundary, SAABoundary } from '../types/geographic.types';

interface map2dprops {
    satellites: SatellitePos[];
    groundStations: GroundStation[];
    onSatClick?: (sat: SatellitePos) => void;
    simulatedTime: Date;
    arcs?: ArcSegment[];
    arcVisualizationConfig?: ArcVisualizationConfig;
    // 地理图层相关props
    chinaBorder?: GeographicBoundary | null;
    saaBoundary?: SAABoundary | null;
    showChinaBorder?: boolean;
    showSAA?: boolean;
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
    arcVisualizationConfig,
    // 地理图层相关
    chinaBorder = null,
    saaBoundary = null,
    showChinaBorder = true,
    showSAA = true
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const lightsImageRef = useRef<HTMLImageElement | null>(null);
    const [hoverData, setHoverData] = useState<hoverdata | null>(null);

    // 弧段动画时间引用
    const arcAnimationTimeRef = useRef(0);

    // 默认动画配置
    const defaultAnimationConfig: ArcAnimationConfig = useMemo(() => ({
        segmentCount: 3,
        segmentLength: 0.2,
        cycleDuration: 2.0,
        extensionFactor: 1.3  // 扩展系数，让线段能完全移出目标位置
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
            const { points: terminatorPoints, subsolarLon } = terminatorResult;

            if (terminatorPoints.length > 0) {
                // 计算太阳直射点和反太阳点索引
                const sunIndex = Math.round(subsolarLon) + 180;
                const clampedSunIndex = Math.max(0, Math.min(360, sunIndex));
                const antiSunIndex = (clampedSunIndex + 180) % 361;

                // 辅助函数：计算点到反太阳点的距离平方
                const distToAntiSun = (i: number) => {
                    const dx = terminatorPoints[i].x - terminatorPoints[antiSunIndex].x;
                    const dy = terminatorPoints[i].y - terminatorPoints[antiSunIndex].y;
                    return dx * dx + dy * dy;
                };

                // 追踪晨昏线上属于黑夜一侧的弧段
                // 从反太阳点两侧开始，选择离反太阳点更远的相邻点
                const nightArcIndices: number[] = [antiSunIndex];

                // 向左追踪
                let currentIdx = antiSunIndex;
                for (let i = 0; i < 180; i++) {
                    const nextIdx = (currentIdx - 1 + 361) % 361;
                    const prevIdx = (currentIdx + 1) % 361;

                    // 选择离反太阳点更远的点
                    if (distToAntiSun(nextIdx) > distToAntiSun(prevIdx)) {
                        nightArcIndices.unshift(nextIdx);
                        currentIdx = nextIdx;
                    } else {
                        break;
                    }
                }

                // 向右追踪
                currentIdx = antiSunIndex;
                for (let i = 0; i < 180; i++) {
                    const nextIdx = (currentIdx + 1) % 361;
                    const prevIdx = (currentIdx - 1 + 361) % 361;

                    if (distToAntiSun(nextIdx) > distToAntiSun(prevIdx)) {
                        nightArcIndices.push(nextIdx);
                        currentIdx = nextIdx;
                    } else {
                        break;
                    }
                }

                // 绘制黑夜区域的辅助函数
                const drawNightRegion = (withLights: boolean = false) => {
                    ctx.beginPath();

                    // 沿晨昏线黑夜弧段绘制
                    const firstIdx = nightArcIndices[0];
                    ctx.moveTo(terminatorPoints[firstIdx].x, terminatorPoints[firstIdx].y);

                    for (let i = 1; i < nightArcIndices.length; i++) {
                        const idx = nightArcIndices[i];
                        ctx.lineTo(terminatorPoints[idx].x, terminatorPoints[idx].y);
                    }

                    // 沿地图边缘闭合路径
                    const lastIdx = nightArcIndices[nightArcIndices.length - 1];
                    const lastPoint = terminatorPoints[lastIdx];
                    const firstPoint = terminatorPoints[firstIdx];

                    // 根据弧段位置选择边缘路径
                    if (firstPoint.x < lastPoint.x) {
                        // 弧段偏左，沿地图边缘绕行
                        ctx.lineTo(0, h);
                        ctx.lineTo(0, 0);
                        ctx.lineTo(w, 0);
                        ctx.lineTo(w, h);
                    } else {
                        // 弧段偏右
                        ctx.lineTo(w, h);
                        ctx.lineTo(0, h);
                        ctx.lineTo(0, 0);
                        ctx.lineTo(w, 0);
                    }

                    ctx.closePath();

                    if (withLights && lightsImageRef.current) {
                        ctx.save();
                        ctx.clip();
                        ctx.globalAlpha = 0.6;
                        ctx.drawImage(lightsImageRef.current, 0, 0, w, h);
                        ctx.restore();
                    } else {
                        ctx.globalAlpha = 0.7;
                        const centerX = terminatorPoints[antiSunIndex].x;
                        const centerY = terminatorPoints[antiSunIndex].y;
                        const maxRadius = Math.max(w, h) * 0.6;

                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, maxRadius
                        );
                        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');

                        ctx.fillStyle = gradient;
                        ctx.fill();
                        ctx.globalAlpha = 1.0;
                    }
                };

                // 1. 绘制夜间灯光（使用clip）
                if (lightsImageRef.current) {
                    drawNightRegion(true);
                }

                // 2. 绘制夜间覆盖层（带渐变）
                drawNightRegion(false);

                // 3. 绘制晨昏线
                ctx.save();
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.shadowBlur = 10;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();

                ctx.moveTo(terminatorPoints[0].x, terminatorPoints[0].y);
                for (let i = 1; i < terminatorPoints.length; i++) {
                    ctx.lineTo(terminatorPoints[i].x, terminatorPoints[i].y);
                }

                ctx.stroke();
                ctx.restore();
            }

            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x <= w; x += w / 12) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
            for (let y = 0; y <= h; y += h / 6) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
            ctx.stroke();

            // 地理图层：中国国境线
            if (chinaBorder && showChinaBorder) {
                const chinaBorderRenderer = new ChinaBorder2D(chinaBorder);
                chinaBorderRenderer.update(w, h);
                chinaBorderRenderer.draw(ctx);
            }

            // 地理图层：SAA区域
            if (saaBoundary && showSAA) {
                const saaBoundaryRenderer = new SAABoundary2D(saaBoundary);
                saaBoundaryRenderer.update(w, h);
                saaBoundaryRenderer.draw(ctx);
            }

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

                // 更新动画时间（每帧增加0.048秒，约60fps，加快3倍）
                arcAnimationTimeRef.current += 0.024;

                // 计算动画状态
                const animationState = calculateArcAnimationState(arcAnimationTimeRef.current, defaultAnimationConfig);

                connections.forEach(conn => {
                    // 仅对活跃弧段绘制脉冲动画
                    if (!conn.isActive) {
                        // 非活跃弧段绘制灰色虚线
                        ctx.beginPath();
                        ctx.moveTo(conn.satellite.x, conn.satellite.y);
                        ctx.lineTo(conn.station.x, conn.station.y);
                        ctx.setLineDash([4, 4]);
                        ctx.strokeStyle = conn.color.replace(/[\d.]+\)$/, '0.3)');
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.setLineDash([]);
                        return;
                    }

                    // 绘制脉冲线段
                    animationState.segments.forEach(segment => {
                        const isFromSatellite = animationState.direction === AnimationDirection.SATELLITE_TO_STATION;
                        const origin = isFromSatellite ? conn.satellite : conn.station;
                        const target = isFromSatellite ? conn.station : conn.satellite;

                        const [startX, startY, endX, endY] = calculateSegmentEndpoints(
                            origin.x,
                            origin.y,
                            target.x,
                            target.y,
                            segment.startPosition,
                            segment.endPosition
                        );

                        // 绘制线段
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.strokeStyle = conn.color;
                        ctx.lineWidth = arcVisualizationConfig.lineWidth || 2;

                        // 添加发光效果
                        ctx.shadowColor = conn.color;
                        ctx.shadowBlur = 10;

                        ctx.stroke();

                        // 重置阴影
                        ctx.shadowBlur = 0;
                    });
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
    }, [satellites, groundStations, hoverData, simulatedTime, arcs, arcVisualizationConfig, defaultAnimationConfig, chinaBorder, saaBoundary, showChinaBorder, showSAA]);

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
