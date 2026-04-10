
// @ts-nocheck
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import React, { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { type GroundStation, type SatellitePos } from '../types';
import { calculateSunPosition, latLonToScene } from '../utils/satMath';
import { ArcConnections3D } from './arc/ArcConnections3D';
import { calculateArcConnections3D } from '../utils/arcVisualization';
import type { ArcSegment, ArcVisualizationConfig } from '../types/arc.types';
import { ChinaBorder3D, SAABoundary3D } from './geographic';
import type { GeographicBoundary, SAABoundary } from '../types/geographic.types';
import { SatelliteLabelContainer } from './labels';
import type { SatelliteLabelConfig } from '../types/label.types';

// Earth Radius in scene units
const R = 1;

interface earthprops {
  satellites: SatellitePos[];
  groundStations: GroundStation[];
  onSatClick?: (sat: SatellitePos) => void;
  simulatedTime?: Date;
  isTracking?: boolean;
  trackedSatellite?: SatellitePos | null;
  arcs?: ArcSegment[];
  arcVisualizationConfig?: ArcVisualizationConfig;
  // 地理图层相关props
  chinaBorder?: GeographicBoundary | null;
  saaBoundary?: SAABoundary | null;
  showChinaBorder?: boolean;
  showSAA?: boolean;
  // 相机控制相关props
  cameraRotateWithEarth?: boolean;
  // 标签配置
  labelConfig?: SatelliteLabelConfig;
}

const Atmosphere = () => {
  return (
    <mesh scale={[1.02, 1.02, 1.02]}>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhongMaterial
        color="#87CEEB"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
};

// 晨昏线组件
const Terminator = ({ sunPosition }: { sunPosition: { x: number, y: number, z: number } }) => {
  // Create a custom shader material for the terminator effect
  const terminatorMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: {
        value: new THREE.Vector3(sunPosition.x, sunPosition.y, sunPosition.z).normalize()
      }
    },
    vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform vec3 sunDirection;
            varying vec3 vNormal;
            
            void main() {
                float intensity = dot(vNormal, sunDirection);
                
                // Create a smooth transition between day and night
                float alpha = 0.0;
                if (intensity < 0.0) {
                    // Night side - fully transparent
                    alpha = 0.0;
                } else if (intensity < 0.1) {
                    // Transition zone - smooth fade
                    alpha = 1.0 - (intensity / 0.1);
                } else {
                    // Day side - fully opaque
                    alpha = 0.0;
                }
                
                gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * 0.8);
            }
        `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.MultiplyBlending
  });

  return (
    <mesh scale={[1.001, 1.001, 1.001]} material={terminatorMaterial}>
      <sphereGeometry args={[R, 64, 64]} />
    </mesh>
  );
};

const Earthmesh = ({ sunPosition }: { sunPosition: { x: number, y: number, z: number } }) => {
  const { gl } = useThree();

  // Standard Three.js texture loader with basic caching - using local files
  const [colorMap, normalMap, specularMap, nightLightsMap] = useLoader(THREE.TextureLoader, [
    '/data/earth_atmos_2048.jpg',
    '/data/earth_normal_2048.jpg',
    '/data/earth_specular_2048.jpg',
    '/data/earth_lights_2048.png'
  ]);

  useMemo(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    if (colorMap) colorMap.anisotropy = maxAnisotropy;
    if (normalMap) normalMap.anisotropy = maxAnisotropy;
    if (specularMap) specularMap.anisotropy = maxAnisotropy;
    if (nightLightsMap) nightLightsMap.anisotropy = maxAnisotropy;
  }, [colorMap, normalMap, specularMap, nightLightsMap, gl]);

  // Calculate night lights intensity based on sun position
  const nightLightsIntensity = useMemo(() => {
    // Calculate the dot product between sun direction and surface normal (up vector)
    // This gives us a value between -1 (night) and 1 (day)
    // sunPosition.z represents the sun's position along the Greenwich meridian
    // When sunPosition.z > 0, sun is in the Greenwich direction (day for that hemisphere)
    // When sunPosition.z < 0, sun is opposite to Greenwich direction (night for that hemisphere)

    // For a more realistic day/night cycle, we need to consider the sun's position relative to each point on Earth
    // Here we use a simplified approach based on the sun's position along the Greenwich meridian

    // Calculate a day/night factor based on the sun's position
    // Lights are brightest at night (sunPosition.z < 0) and fade out during the day (sunPosition.z > 0)
    const dayNightFactor = Math.max(0, -sunPosition.z);

    // Map from [0, 1] to [0, 1] for night lights intensity
    // Lights are brightest at night (dayNightFactor = 1) and fade out during the day
    return dayNightFactor * 0.8;
  }, [sunPosition]);

  return (
    <group>
      {/* Align Texture with ECEF (+Z = Greenwich). 
            Standard Sphere: +X is Greenwich. 
            Our Math: +Z is Greenwich.
            Rotate Y by -90 deg to bring +X to +Z.
        */}
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          specularMap={specularMap}
          specular={new THREE.Color(0x333333)}
          shininess={5}
        />
      </mesh>

      {/* Night Lights Layer */}
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[R, 64, 64]} />
        <meshBasicMaterial
          map={nightLightsMap}
          transparent
          opacity={nightLightsIntensity * 0.8}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <Atmosphere />
      <Terminator sunPosition={sunPosition} />
    </group>
  );
};

interface hoverdata {
  id: string;
  name: string;
  type: 'SAT' | 'STATION';
  x: number;
  y: number;
  data?: any;
}

const SatelliteInstances = ({
  satellites,
  onHover,
  onClick
}: {
  satellites: SatellitePos[],
  onHover: (data: hoverdata | null) => void,
  onClick?: (sat: SatellitePos) => void
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();
  const { camera } = useThree();

  const satelliteTexture = useLoader(THREE.TextureLoader, '/data/stallite.jpg');

  useFrame(() => {
    if (!meshRef.current || !camera) return;
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.x, sat.y, sat.z);
      const scale = 0.04;
      tempObject.scale.set(scale, scale, scale);

      // 让卫星图标始终面朝相机
      tempObject.lookAt(camera.position);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  const handlepointermove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && satellites[instanceId]) {
      onHover({
        id: satellites[instanceId].id,
        name: satellites[instanceId].displayName || satellites[instanceId].name,
        type: 'SAT',
        data: satellites[instanceId],
        x: e.clientX,
        y: e.clientY
      });
      document.body.style.cursor = 'crosshair';
    }
  };

  const handlepointerout = () => {
    onHover(null);
    document.body.style.cursor = 'default';
  };

  const handlepointerdown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && satellites[instanceId] && onClick) {
      onClick(satellites[instanceId]);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, satellites.length]}
      onPointerMove={handlepointermove}
      onPointerOut={handlepointerout}
      onPointerDown={handlepointerdown}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial  
        map={satelliteTexture}      // 应用你的卫星图标
        transparent={true} 
        alphaTest={0.1} 
        side={THREE.DoubleSide}
        toneMapped={false} 
      />
    </instancedMesh>
  );
};

const GroundStationMarker = ({ station, onHover }: { station: GroundStation, onHover: (data: hoverdata | null) => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groundStationTexture = useLoader(THREE.TextureLoader, '/data/GroundStation.jpg');

  const pos = latLonToScene(station.lat, station.lon, R);
  const scale = 0.04;

  // 创建一个临时对象来计算正确的朝向
  const tempObject = new THREE.Object3D();
  tempObject.position.set(pos.x, pos.y, pos.z);

  // 让图标面朝该位置的上方向（垂直于地球表面）
  // 先看向地球中心，然后反转180度，这样图标就是正的且平行于地球表面
  tempObject.lookAt(0, 0, 0);  // 看向地心
  tempObject.rotateY(Math.PI);   // 旋转180度，让图标正面朝外

  // 沿法线方向向外偏移，避免图标一半陷在地球里
  const normal = new THREE.Vector3(pos.x, pos.y, pos.z).normalize();
  const offset = 0.002;  // 稍微浮在地球表面上方
  const adjustedPos = {
    x: pos.x + normal.x * offset,
    y: pos.y + normal.y * offset,
    z: pos.z + normal.z * offset
  };

  tempObject.position.set(adjustedPos.x, adjustedPos.y, adjustedPos.z);

  return (
    <mesh
      ref={meshRef}
      position={tempObject.position}
      scale={[scale, scale, scale]}
      quaternion={tempObject.quaternion}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover({ id: station.id, name: station.name, type: 'STATION', x: e.clientX, y: e.clientY });
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={groundStationTexture}
        transparent={true}
        alphaTest={0.1}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
};

const GroundStationMarkers = ({ stations, onHover }: { stations: GroundStation[], onHover: (data: hoverdata | null) => void }) => {
  return (
    <group>
      {stations.map(station => (
        <GroundStationMarker key={station.id} station={station} onHover={onHover} />
      ))}
    </group>
  );
}

// 创建轨道线路组件 - 使用 React Three Fiber 声明式 API
const OrbitLine: React.FC<{ path: { x: number, y: number, z: number }[] }> = ({ path }) => {
  // 创建缓冲区几何
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(path.length * 3);

  // 填充位置数据
  for (let i = 0; i < path.length; i++) {
    positions[i * 3] = path[i].x;
    positions[i * 3 + 1] = path[i].y;
    positions[i * 3 + 2] = path[i].z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial
        color="#10b981"
        opacity={0.6}
        transparent
        depthWrite={false}
        linewidth={2}
      />
    </line>
  );
};

const Earth3D: React.FC<earthprops> = ({
  satellites,
  groundStations,
  onSatClick,
  simulatedTime = new Date(),
  isTracking = false,
  trackedSatellite = null,
  arcs = [],
  arcVisualizationConfig,
  // 地理图层相关
  chinaBorder = null,
  saaBoundary = null,
  showChinaBorder = true,
  showSAA = true,
  // 相机控制相关
  cameraRotateWithEarth = false,
  // 标签配置
  labelConfig
}) => {
  const [hoverData, setHoverData] = useState<hoverdata | null>(null);

  // Calculate sun position based on simulated time
  const sunPosition = useMemo(() => {
    const result = calculateSunPosition(simulatedTime);
    return result.scene;  // 提取场景坐标用于3D渲染
  }, [simulatedTime]);

  // 默认弧段可视化配置
  const defaultArcConfig: ArcVisualizationConfig = {
    enabled: true,
    showActiveOnly: false,
    activeColor: '#3b82f6',  // 蓝色（入境中）
    upcomingColor: 'rgba(6, 182, 212, 0.5)',
    preApproachColor: 'rgba(128, 128, 128, 0.5)',
    postExitColor: 'rgba(128, 128, 128, 0.5)',
    lineWidth: 3.0,  // 增加宽度以提高可见度
    animate: true,
    pulseSpeed: 1,
    dashEnabled: true,
    dashSize: 0.5,
    gapSize: 0.5,
    flowSpeed: 2.0
  };

  // 计算弧段连线
  const arcConnections = useMemo(() => {
    if (!arcs || arcs.length === 0 || !arcVisualizationConfig?.enabled) {
      return [];
    }
    const config = arcVisualizationConfig || defaultArcConfig;
    return calculateArcConnections3D(
      arcs,
      satellites,
      groundStations,
      simulatedTime,
      config
    );
  }, [arcs, satellites, groundStations, simulatedTime, arcVisualizationConfig, defaultArcConfig]);

  // Camera follow component - must be inside Canvas
  const CameraFollow = () => {
    const { camera } = useThree();

    useFrame(() => {
      try {
        // 相机跟随地球自转功能现在由 RotatingGroup 组件负责
        // CameraFollow 只负责卫星跟踪功能
        if (isTracking && trackedSatellite && camera) {
          // Comprehensive check for valid trackedSatellite object
          if (!trackedSatellite || typeof trackedSatellite !== 'object') {
            return;
          }

          // Check if trackedSatellite has required position properties
          if (typeof trackedSatellite.x !== 'number' || typeof trackedSatellite.y !== 'number' || typeof trackedSatellite.z !== 'number') {
            return;
          }

          // Check if trackedSatellite has valid position data
          if (isNaN(trackedSatellite.x) || isNaN(trackedSatellite.y) || isNaN(trackedSatellite.z)) {
            return;
          }

          // Check if position values are within reasonable bounds
          const maxPosition = 10; // Arbitrary reasonable bound
          if (Math.abs(trackedSatellite.x) > maxPosition ||
            Math.abs(trackedSatellite.y) > maxPosition ||
            Math.abs(trackedSatellite.z) > maxPosition) {
            return;
          }

          // Calculate target position - keep camera at a fixed distance from the satellite
          const targetPosition = new THREE.Vector3(trackedSatellite.x, trackedSatellite.y, trackedSatellite.z);
          const cameraOffset = new THREE.Vector3(0, 0, 1.5); // Fixed distance behind the satellite

          // Calculate final camera target position
          const finalTargetPosition = targetPosition.clone().add(cameraOffset);

          // Ensure final target position is valid
          if (isNaN(finalTargetPosition.x) || isNaN(finalTargetPosition.y) || isNaN(finalTargetPosition.z)) {
            return;
          }

          // Smoothly interpolate camera position
          camera.position.lerp(finalTargetPosition, 0.1);

          // Ensure camera position remains valid
          if (isNaN(camera.position.x) || isNaN(camera.position.y) || isNaN(camera.position.z)) {
            // Reset camera position if it becomes invalid
            camera.position.set(0, 0, 2.5);
            return;
          }

          // Make camera look at the satellite
          camera.lookAt(targetPosition);
        }
      } catch (error) {
        console.warn('Camera follow error:', error);
        // Reset tracking state if an error occurs
        if (isTracking) {
          // Note: We can't directly call setIsTracking here since it's from the parent component
          // Instead, we'll just stop the camera follow logic for this frame
        }
      }
    });

    return null;
  };

  return (
    <div className="w-full h-full relative">
      {hoverData && (
        <div
          className="fixed z-50 pointer-events-none p-2 bg-black/80 border border-slate-700 rounded text-xs font-mono text-white shadow-xl backdrop-blur"
          style={{ left: hoverData.x + 20, top: hoverData.y }}
        >
          <div className="font-bold text-cyan-400 text-zh">{hoverData.name}</div>
          <div className="text-[10px] text-slate-400 text-zh">{hoverData.type}</div>
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} dpr={[1, 2]} shadows>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[sunPosition.x * 5, sunPosition.y * 5, sunPosition.z * 5]}
          intensity={2.5}
          castShadow
        />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          <Earthmesh sunPosition={sunPosition} />
        </Suspense>

        {/* 地理图层 */}
        {chinaBorder && showChinaBorder && (
          <ChinaBorder3D boundary={chinaBorder} visible={showChinaBorder} />
        )}

        {saaBoundary && showSAA && (
          <SAABoundary3D saaBoundary={saaBoundary} visible={showSAA} />
        )}

        <SatelliteInstances
          satellites={satellites}
          onHover={setHoverData}
          onClick={onSatClick}
        />

        <GroundStationMarkers stations={groundStations} onHover={setHoverData} />

        {/* 弧段连线 */}
        {arcConnections.length > 0 && arcVisualizationConfig?.enabled && (
          <ArcConnections3D
            connections={arcConnections}
            lineWidth={arcVisualizationConfig.lineWidth}
          />
        )}

        {(() => {
            // 收集唯一的轨道线，避免重复渲染
            // 同一轨道面的卫星共享相同的 orbitPath 引用
            const uniqueOrbits = new Map<object, { path: typeof satellites[0]['orbitPath'], color: string }>();

            for (const sat of satellites) {
              if (sat.orbitPath && sat.orbitPath.length > 0) {
                // 使用 orbitPath 对象引用作为唯一标识
                if (!uniqueOrbits.has(sat.orbitPath)) {
                  uniqueOrbits.set(sat.orbitPath, {
                    path: sat.orbitPath,
                    color: sat.color || '#ffffff'
                  });
                }
              }
            }

            // 渲染唯一轨道线（ECEF坐标系，固定不动）
            return Array.from(uniqueOrbits.values()).map((orbit, index) => (
              <OrbitLine
                key={`orbit-${index}`}
                path={orbit.path!}
              />
            ));
          })()}

        {/* 卫星标签 */}
        {labelConfig?.enabled && (
          <SatelliteLabelContainer
            satellites={satellites}
            config={labelConfig}
          />
        )}

        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={8}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />

        {/* Camera follow component - must be inside Canvas */}
        <CameraFollow />
      </Canvas>
    </div>
  );
};

export default Earth3D;
