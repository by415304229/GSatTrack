
import React, { useMemo, useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, extend, useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SatellitePos, GroundStation } from '../types';
import { latLonToScene } from '../utils/satMath';

// Extend Three.js components for JSX compatibility
// 使用正确的方式扩展Three.js组件
extend({
  mesh: THREE.Mesh,
  sphereGeometry: THREE.SphereGeometry,
  meshPhongMaterial: THREE.MeshPhongMaterial,
  group: THREE.Group,
  instancedMesh: THREE.InstancedMesh,
  meshBasicMaterial: THREE.MeshBasicMaterial,
  cylinderGeometry: THREE.CylinderGeometry,
  line: THREE.Line,
  lineGeometry: THREE.BufferGeometry,
  lineBasicMaterial: THREE.LineBasicMaterial,
  ambientLight: THREE.AmbientLight,
  directionalLight: THREE.DirectionalLight,
  lineSegments: THREE.LineSegments,
  color: THREE.Color
});

// 为primitive组件创建类型声明
declare global {
  namespace JSX {
    interface IntrinsicElements {
      primitive: {
        object?: any;
        attach?: string;
        children?: React.ReactNode;
        [key: string]: any;
      };
    }
  }
}

// 为JSX中的大写组件名称创建别名
const Mesh = 'mesh' as unknown as React.FC<any>;
const SphereGeometry = 'sphereGeometry' as unknown as React.FC<any>;
const MeshPhongMaterial = 'meshPhongMaterial' as unknown as React.FC<any>;
const Group = 'group' as unknown as React.FC<any>;
const InstancedMesh = 'instancedMesh' as unknown as React.FC<any>;
const MeshBasicMaterial = 'meshBasicMaterial' as unknown as React.FC<any>;
const CylinderGeometry = 'cylinderGeometry' as unknown as React.FC<any>;
const Line = 'line' as unknown as React.FC<any>;
const LineBasicMaterial = 'lineBasicMaterial' as unknown as React.FC<any>;
const AmbientLight = 'ambientLight' as unknown as React.FC<any>;
const DirectionalLight = 'directionalLight' as unknown as React.FC<any>;
const LineSegments = 'lineSegments' as unknown as React.FC<any>;
const Color = 'color' as unknown as React.FC<any>;
const primitive = 'primitive' as unknown as React.FC<any>;

// Earth Radius in scene units
const R = 1; 

interface EarthProps {
  satellites: SatellitePos[];
  groundStations: GroundStation[];
  onSatClick?: (sat: SatellitePos) => void;
}

const Atmosphere = () => {
    return (
        <Mesh scale={[1.02, 1.02, 1.02]}>
            <SphereGeometry args={[R, 64, 64]} />
            <MeshPhongMaterial 
                color="#87CEEB" 
                transparent 
                opacity={0.1} 
                side={THREE.BackSide} 
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </Mesh>
    )
}

const EarthMesh = () => {
  const { gl } = useThree();
  
  // Standard Three.js texture loader with basic caching - using local files
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
      '/data/earth_atmos_2048.jpg',
      '/data/earth_normal_2048.jpg',
      '/data/earth_specular_2048.jpg'
  ]);
  
  useMemo(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    if (colorMap) colorMap.anisotropy = maxAnisotropy;
    if (normalMap) normalMap.anisotropy = maxAnisotropy;
    if (specularMap) specularMap.anisotropy = maxAnisotropy;
  }, [colorMap, normalMap, specularMap, gl]);
  
  return (
    <Group>
        {/* Align Texture with ECEF (+Z = Greenwich). 
            Standard Sphere: +X is Greenwich. 
            Our Math: +Z is Greenwich.
            Rotate Y by -90 deg to bring +X to +Z.
        */}
        <Mesh rotation={[0, -Math.PI / 2, 0]}>
            <SphereGeometry args={[R, 64, 64]} />
            <MeshPhongMaterial 
                map={colorMap} 
                normalMap={normalMap}
                normalScale={new THREE.Vector2(0.5, 0.5)}
                specularMap={specularMap}
                specular={new THREE.Color(0x333333)}
                shininess={5}
            />
        </Mesh>
        <Atmosphere />
    </Group>
  );
};

interface HoverData {
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
    onHover: (data: HoverData | null) => void,
    onClick?: (sat: SatellitePos) => void
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();
  const tempColor = new THREE.Color();

  useFrame(() => {
    if (!meshRef.current) return;
    
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.x, sat.y, sat.z);
      const scale = 0.012;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, tempColor.set(sat.color || '#ffffff'));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId !== undefined && satellites[instanceId]) {
          onHover({
              id: satellites[instanceId].id,
              name: satellites[instanceId].name,
              type: 'SAT',
              data: satellites[instanceId],
              x: e.clientX,
              y: e.clientY
          });
          document.body.style.cursor = 'crosshair';
      }
  };

  const handlePointerOut = () => {
      onHover(null);
      document.body.style.cursor = 'default';
  };
  
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId !== undefined && satellites[instanceId] && onClick) {
          onClick(satellites[instanceId]);
      }
  };

  return (
    <InstancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, satellites.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
    >
      <SphereGeometry args={[1, 8, 8]} />
      <MeshBasicMaterial toneMapped={false} />
    </InstancedMesh>
  );
};

const GroundStationMarkers = ({ stations, onHover }: { stations: GroundStation[], onHover: (data: HoverData | null) => void }) => {
    return (
        <Group>
            {stations.map(station => {
                const pos = latLonToScene(station.lat, station.lon, R);
                return (
                    <Group key={station.id} position={[pos.x, pos.y, pos.z]}>
                        {/* Base */}
                        <Mesh 
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
                            <CylinderGeometry args={[0.005, 0.001, 0.05, 6]} />
                            <MeshBasicMaterial color={station.color} />
                        </Mesh>
                        {/* Pulse */}
                        <Mesh position={[0, 0.025, 0]}>
                             <SphereGeometry args={[0.008, 8, 8]} />
                             <MeshBasicMaterial color={station.color} opacity={0.6} transparent />
                        </Mesh>
                    </Group>
                )
            })}
        </Group>
    )
}

// 创建轨道线路组件 - 简化版本
const OrbitLine: React.FC<{ path: {x:number, y:number, z:number}[], color: string }> = ({ path, color }) => {
  // 在useRef中直接创建和管理THREE.Line
  const lineRef = useRef<THREE.Line | null>(null);
  const { scene } = useThree();
  
  // 当路径或颜色变化时更新线条
  useEffect(() => {
    // 如果已存在线条，先从场景中移除
    if (lineRef.current) {
      scene.remove(lineRef.current);
    }
    
    // 创建新的线条
    const points = path.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
      color, 
      opacity: 0.4, 
      transparent: true, 
      depthWrite: false, 
      linewidth: 1 
    });
    
    lineRef.current = new THREE.Line(geometry, material);
    scene.add(lineRef.current);
    
    // 清理函数
    return () => {
      if (lineRef.current) {
        scene.remove(lineRef.current);
        lineRef.current.geometry.dispose();
        (lineRef.current.material as THREE.Material).dispose();
      }
    };
  }, [path, color, scene]);
  
  // 组件不需要渲染任何内容，因为线条直接添加到场景中
  return null;
};

const Earth3D: React.FC<EarthProps> = ({ satellites, groundStations, onSatClick }) => {
  const [hoverData, setHoverData] = useState<HoverData | null>(null);

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
          <Color attach="background" args={['#000']} />
          <AmbientLight intensity={0.2} />
          <DirectionalLight position={[5, 3, 5]} intensity={2.5} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Group>
            <Suspense fallback={null}>
                <EarthMesh />
            </Suspense>

            <SatelliteInstances 
                satellites={satellites} 
                onHover={setHoverData} 
                onClick={onSatClick}
            />
            
            <GroundStationMarkers stations={groundStations} onHover={setHoverData} />

            {satellites.map(sat => (
               sat.orbitPath && sat.orbitPath.length > 0 && (
                   <OrbitLine key={`orbit-${sat.id}`} path={sat.orbitPath} color={sat.color || '#ffffff'} />
               )
            ))}
          </Group>
          
          <OrbitControls 
             enablePan={false} 
             minDistance={1.2} 
             maxDistance={8} 
             rotateSpeed={0.5} 
             zoomSpeed={0.8}
          />
        </Canvas>
    </div>
  );
};

export default Earth3D;
