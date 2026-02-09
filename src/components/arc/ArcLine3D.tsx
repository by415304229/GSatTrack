/**
 * 弧段连线3D组件（虚线版本）
 * 使用多个圆柱体片段创建虚线效果的3D连线
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Point3D } from '../../utils/arcVisualization';

interface ArcLine3DProps {
    startPoint: Point3D;
    endPoint: Point3D;
    color: string;
    isActive: boolean;
}

/**
 * 单个虚线段组件
 */
interface DashSegmentProps {
    position: [number, number, number];
    rotation: [number, number, number];
    length: number;
    color: string;
    opacity: number;
}

const DashSegment: React.FC<DashSegmentProps> = ({
    position,
    rotation,
    length,
    color,
    opacity
}) => {
    // 虚线宽度（加宽）
    const radius = 0.003;

    return (
        <mesh position={position} rotation={rotation}>
            <cylinderGeometry args={[radius, radius, length, 8]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </mesh>
    );
};

/**
 * 弧段连线3D组件（虚线）
 * 将连续的圆柱体改为多个片段，形成虚线效果
 */
export const ArcLine3D: React.FC<ArcLine3DProps> = ({
    startPoint,
    endPoint,
    color,
    isActive
}) => {
    // 直接使用黄色（与左侧"即将入境"面板一致）
    const displayColor = '#fbbf24'; // amber-400
    const opacity = isActive ? 1.0 : 0.3;

    // 计算连线的几何属性
    const dashSegments = useMemo(() => {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const dz = endPoint.z - startPoint.z;

        const totalLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // 虚线参数
        const segmentCount = 20; // 总段数（增加密度）
        const segmentLength = totalLength / segmentCount;
        const dashLength = segmentLength * 0.6; // 实线部分占60%

        const direction = new THREE.Vector3(dx, dy, dz).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
        const euler = new THREE.Euler().setFromQuaternion(quaternion);

        const segments: Array<{
            position: [number, number, number];
            rotation: [number, number, number];
            length: number;
        }> = [];

        // 创建虚线段（只在偶数位置创建，形成虚线效果）
        for (let i = 0; i < segmentCount; i++) {
            // 只在偶数段创建实线段（0, 2, 4...）
            if (i % 2 === 0) {
                // 计算该段的中心位置
                const segmentStartOffset = i * segmentLength;
                const segmentCenterOffset = segmentStartOffset + dashLength / 2;

                // 从起点沿着方向向量移动到段中心
                const segmentCenter = new THREE.Vector3(
                    startPoint.x + direction.x * segmentCenterOffset,
                    startPoint.y + direction.y * segmentCenterOffset,
                    startPoint.z + direction.z * segmentCenterOffset
                );

                segments.push({
                    position: [segmentCenter.x, segmentCenter.y, segmentCenter.z],
                    rotation: [euler.x, euler.y, euler.z] as [number, number, number],
                    length: dashLength
                });
            }
        }

        return segments;
    }, [startPoint, endPoint]);

    // 不显示未激活的连线
    if (!isActive) {
        return null;
    }

    // 渲染所有虚线段
    return (
        <>
            {dashSegments.map((segment, index) => (
                <DashSegment
                    key={`dash-${index}`}
                    position={segment.position}
                    rotation={segment.rotation}
                    length={segment.length}
                    color={displayColor}
                    opacity={opacity}
                />
            ))}
        </>
    );
};

export default ArcLine3D;
