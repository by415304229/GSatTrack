
import React, { useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, extend, useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SatellitePos, GroundStation } from '../types';
import { latLonToScene } from '../utils/satMath';

// Extend Three.js Line
extend({ ThreeLine: THREE.Line });

const OrbitLineImpl = 'threeLine' as unknown as React.FC<any>;

// Earth Radius in scene units
const R = 1; 

interface EarthProps {
  satellites: SatellitePos[];
  groundStations: GroundStation[];
  onSatClick?: (sat: SatellitePos) => void;
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
}

const EarthMesh = () => {
  const { gl } = useThree();
  
  // Standard Three.js texture loader with basic caching
  const [colorMap, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
      'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
      'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
      'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'
  ]);
  
  useMemo(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    if (colorMap) colorMap.anisotropy = maxAnisotropy;
    if (normalMap) normalMap.anisotropy = maxAnisotropy;
    if (specularMap) specularMap.anisotropy = maxAnisotropy;
  }, [colorMap, normalMap, specularMap, gl]);
  
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
        <Atmosphere />
    </group>
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
    <instancedMesh 
        ref={meshRef} 
        args={[undefined, undefined, satellites.length]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

const GroundStationMarkers = ({ stations, onHover }: { stations: GroundStation[], onHover: (data: HoverData | null) => void }) => {
    return (
        <group>
            {stations.map(station => {
                const pos = latLonToScene(station.lat, station.lon, R);
                return (
                    <group key={station.id} position={[pos.x, pos.y, pos.z]}>
                        {/* Base */}
                        <mesh 
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
                            <cylinderGeometry args={[0.005, 0.001, 0.05, 6]} />
                            <meshBasicMaterial color={station.color} />
                        </mesh>
                        {/* Pulse */}
                        <mesh position={[0, 0.025, 0]}>
                             <sphereGeometry args={[0.008, 8, 8]} />
                             <meshBasicMaterial color={station.color} opacity={0.6} transparent />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}

const OrbitLine: React.FC<{ path: {x:number, y:number, z:number}[], color: string }> = ({ path, color }) => {
  const geometry = useMemo(() => {
    const points = path.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [path]);

  return (
    <OrbitLineImpl>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial attach="material" color={color} opacity={0.4} transparent depthWrite={false} linewidth={1} />
    </OrbitLineImpl>
  );
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
                <div className="font-bold text-cyan-400">{hoverData.name}</div>
                <div className="text-[10px] text-slate-400">{hoverData.type}</div>
             </div>
        )}

        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} dpr={[1, 2]} shadows>
          <color attach="background" args={['#000']} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 3, 5]} intensity={2.5} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <group>
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
          </group>
          
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
