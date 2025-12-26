/**
 * 弧段连线3D组件（使用圆柱体）
 * 使用CylinderGeometry创建可见的3D连线，支持固定长度线段移动的动画
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Point3D } from '../../utils/arcVisualization';
import {
    calculateArcAnimationState,
    calculate3DSegmentEndpoints,
    AnimationDirection,
    type ArcAnimationConfig
} from '../../utils/arcAnimationUtils';

interface ArcLine3DProps {
    startPoint: Point3D;
    endPoint: Point3D;
    color: string;
    isActive: boolean;
}

/**
 * 默认动画配置
 */
const DEFAULT_ANIMATION_CONFIG: ArcAnimationConfig = {
    segmentCount: 3,
    segmentLength: 0.2,
    cycleDuration: 2.0,
    extensionFactor: 1.3  // 扩展系数，让线段能完全移出目标位置
};

/**
 * 弧段连线3D组件
 * 使用多个圆柱体创建固定长度线段的移动动画
 */
export const ArcLine3D: React.FC<ArcLine3DProps> = ({
    startPoint,
    endPoint,
    color,
    isActive
}) => {
    const timeRef = useRef(0);
    const segmentsRef = useRef<Array<{
        start: Point3D;
        end: Point3D;
        length: number;
    }>>([]);

    // 解析颜色
    const { color: rgbColor, opacity } = useMemo(() => {
        const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
        if (rgbaMatch) {
            const r = parseInt(rgbaMatch[1]);
            const g = parseInt(rgbaMatch[2]);
            const b = parseInt(rgbaMatch[3]);
            const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1.0;
            return {
                color: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`,
                opacity: a * (isActive ? 1.0 : 0.3)
            };
        }
        if (color.startsWith('#')) {
            return { color, opacity: isActive ? 1.0 : 0.3 };
        }
        return { color: '#ffffff', opacity: isActive ? 1.0 : 0.3 };
    }, [color, isActive]);

    // 动画更新 - 计算线段位置
    useFrame(() => {
        if (!isActive) {
            segmentsRef.current = [];
            return;
        }

        timeRef.current += 0.064;  // 加快10倍（原来是0.016）

        const animationState = calculateArcAnimationState(timeRef.current, DEFAULT_ANIMATION_CONFIG);
        const newSegments: Array<{ start: Point3D; end: Point3D; length: number }> = [];

        animationState.segments.forEach(segment => {
            const isFromSatellite = animationState.direction === AnimationDirection.SATELLITE_TO_STATION;
            const origin = isFromSatellite ? startPoint : endPoint;
            const target = isFromSatellite ? endPoint : startPoint;

            const [segStart, segEnd] = calculate3DSegmentEndpoints(
                origin,
                target,
                segment.startPosition,
                segment.endPosition
            );

            // 计算线段在3D空间中的实际长度
            const dx = segEnd.x - segStart.x;
            const dy = segEnd.y - segStart.y;
            const dz = segEnd.z - segStart.z;
            const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

            newSegments.push({
                start: segStart,
                end: segEnd,
                length: segmentLength
            });
        });

        segmentsRef.current = newSegments;
    });

    // 渲染所有线段
    return (
        <>
            {segmentsRef.current.map((segment, index) => {
                // 计算单个线段的几何属性
                const dx = segment.end.x - segment.start.x;
                const dy = segment.end.y - segment.start.y;
                const dz = segment.end.z - segment.start.z;

                const midPos = [
                    (segment.start.x + segment.end.x) / 2,
                    (segment.start.y + segment.end.y) / 2,
                    (segment.start.z + segment.end.z) / 2
                ];

                const direction = new THREE.Vector3(dx, dy, dz).normalize();
                const up = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
                const euler = new THREE.Euler().setFromQuaternion(quaternion);

                const radius = 0.003;

                return (
                    <mesh
                        key={index}
                        position={midPos as [number, number, number]}
                        rotation={[euler.x, euler.y, euler.z] as [number, number, number]}
                    >
                        <cylinderGeometry args={[radius, radius, segment.length, 8]} />
                        <meshBasicMaterial
                            color={rgbColor}
                            transparent
                            opacity={opacity}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}
        </>
    );
};

export default ArcLine3D;
