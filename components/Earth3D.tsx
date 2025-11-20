import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, extend, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SatellitePos } from '../types';

// Extend Three.js Line
extend({ ThreeLine: THREE.Line });

// Earth Radius in scene units
const R = 1; 

interface EarthProps {
  satellites: SatellitePos[];
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
  
  // High-resolution textures
  const [colorMap, bumpMap, specularMap] = useLoader(THREE.TextureLoader, [
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      'https://unpkg.com/three-globe/example/img/earth-topology.png',
      'https://unpkg.com/three-globe/example/img/earth-water.png'
  ]);
  
  // Improve texture clarity
  useMemo(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    colorMap.anisotropy = maxAnisotropy;
    bumpMap.anisotropy = maxAnisotropy;
    specularMap.anisotropy = maxAnisotropy;
  }, [colorMap, bumpMap, specularMap, gl]);
  
  return (
    <group>
        <mesh rotation={[0, 0, 0]}>
            <sphereGeometry args={[R, 64, 64]} />
            <meshPhongMaterial 
                map={colorMap} 
                bumpMap={bumpMap}
                bumpScale={0.02}
                specularMap={specularMap}
                specular={new THREE.Color(0x333333)}
                shininess={10}
            />
        </mesh>
        <Atmosphere />
    </group>
  );
};

const SatelliteInstances = ({ satellites }: { satellites: SatellitePos[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();
  const tempColor = new THREE.Color();

  useFrame(() => {
    if (!meshRef.current) return;
    
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.x, sat.y, sat.z);
      // Scale down slightly for realism
      const scale = 0.012;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, tempColor.set(sat.color || '#ffffff'));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, satellites.length]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// Individual Orbit Line component
interface OrbitLineProps {
  path: {x:number, y:number, z:number}[];
  color: string;
}

const OrbitLine: React.FC<OrbitLineProps> = ({ path, color }) => {
  const geometry = useMemo(() => {
      const points = path.map(p => new THREE.Vector3(p.x, p.y, p.z));
      return new THREE.BufferGeometry().setFromPoints(points);
  }, [path]);

  return (
      // @ts-ignore
      <threeLine geometry={geometry}>
          <lineBasicMaterial color={color} opacity={0.4} transparent blending={THREE.AdditiveBlending} linewidth={1} />
      </threeLine>
  );
};

const Orbits = ({ satellites }: { satellites: SatellitePos[] }) => {
    return (
        <group>
            {satellites.map((sat) => {
                if (!sat.orbitPath || sat.orbitPath.length === 0) return null;
                return <OrbitLine key={`orbit-${sat.id}`} path={sat.orbitPath} color={sat.color || '#06b6d4'} />;
            })}
        </group>
    )
}

const Earth3D: React.FC<EarthProps> = ({ satellites }) => {
  return (
    <div className="w-full h-full bg-[#050505] rounded border border-slate-800 relative overflow-hidden shadow-2xl shadow-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/10 via-transparent to-transparent pointer-events-none z-0"></div>
        <Canvas camera={{ position: [0, 2, 3.5], fov: 40 }} gl={{ antialias: true, pixelRatio: window.devicePixelRatio }}>
          {/* Realistic Lighting Setup */}
          <ambientLight intensity={0.6} color="#ffffff" /> 
          <directionalLight position={[5, 3, 5]} intensity={2.0} color="#ffffff" castShadow />
          <directionalLight position={[-5, -3, -2]} intensity={0.5} color="#8899aa" /> {/* Backlight for rim effect */}
          
          <Stars radius={300} depth={60} count={2000} factor={4} saturation={0} fade speed={0.5} />
          
          <EarthMesh />
          <SatelliteInstances satellites={satellites} />
          <Orbits satellites={satellites} />
          
          <OrbitControls 
            enablePan={false} 
            minDistance={1.8} 
            maxDistance={10} 
            autoRotate 
            autoRotateSpeed={0.3} 
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
        
        {/* Overlay Stats */}
        <div className="absolute bottom-4 left-4 bg-black/80 border border-slate-800 p-3 rounded text-xs font-mono text-cyan-400 pointer-events-none backdrop-blur-md">
            <div className="text-white font-bold mb-1">REAL-TIME TRACKING</div>
            <div>OBJECTS: {satellites.length}</div>
            <div>REF: J2000/ECEF</div>
        </div>
    </div>
  );
};

export default Earth3D;