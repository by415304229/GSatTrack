import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { SatellitePos } from '../types';

// Extend Three.js Line as 'ThreeLine' to avoid conflict with SVG <line> element in JSX
extend({ ThreeLine: THREE.Line });

// Add missing type declarations for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      sphereGeometry: any;
      meshPhongMaterial: any;
      meshStandardMaterial: any;
      instancedMesh: any;
      meshBasicMaterial: any;
      group: any;
      line: any;
      threeLine: any;
      bufferGeometry: any;
      lineBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      primitive: any;
    }
  }
}

// Earth Radius in scene units
const R = 1; 

interface EarthProps {
  satellites: SatellitePos[];
}

const Atmosphere = () => {
    return (
        <mesh scale={[1.02, 1.02, 1.02]}>
            <sphereGeometry args={[R, 64, 64]} />
            <meshBasicMaterial 
                color="#4f46e5" 
                transparent 
                opacity={0.15} 
                side={THREE.BackSide} 
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    )
}

const EarthMesh = () => {
  // Use "Black Marble" / Earth at Night texture
  const earthTexture = useMemo(() => new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/The_earth_at_night.jpg/1024px-The_earth_at_night.jpg'), []);
  
  return (
    <group>
        <mesh>
        <sphereGeometry args={[R, 64, 64]} />
        <meshStandardMaterial 
            map={earthTexture} 
            roughness={0.5}
            metalness={0.1}
            emissive={new THREE.Color("#333333")} // Higher base emissive
            emissiveMap={earthTexture}
            emissiveIntensity={1.5} // High brightness for visibility
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
      // Slightly larger scale for visibility against dark background
      const scale = 0.02;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      // Set individual color if available, else white
      meshRef.current!.setColorAt(i, tempColor.set(sat.color || '#ffffff'));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, satellites.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// Individual Orbit Line component to memoize geometry
const OrbitLine = ({ path, color }: { path: {x:number, y:number, z:number}[], color: string }) => {
  const geometry = useMemo(() => {
      const points = path.map(p => new THREE.Vector3(p.x, p.y, p.z));
      return new THREE.BufferGeometry().setFromPoints(points);
  }, [path]);

  return (
      <threeLine geometry={geometry}>
          <lineBasicMaterial color={color} opacity={0.8} transparent blending={THREE.AdditiveBlending} linewidth={2} />
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none z-0"></div>
        <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} gl={{ antialias: true }}>
          {/* Significantly increased lighting for brightness */}
          <ambientLight intensity={2.0} /> 
          <pointLight position={[10, 10, 10]} intensity={2.0} color="#ffffff" />
          <pointLight position={[-10, -5, -10]} intensity={1.5} color="#ffffff" />
          
          <Stars radius={300} depth={60} count={2000} factor={6} saturation={0} fade speed={0.5} />
          
          <EarthMesh />
          <SatelliteInstances satellites={satellites} />
          <Orbits satellites={satellites} />
          
          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={8} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
        
        {/* Overlay Stats */}
        <div className="absolute bottom-4 left-4 bg-black/80 border border-slate-800 p-3 rounded text-xs font-mono text-cyan-400 pointer-events-none backdrop-blur-md">
            <div className="text-white font-bold mb-1">QIANFAN CONSTELLATION</div>
            <div>ACTIVE: {satellites.length}</div>
            <div>MODE: ECEF/INERTIAL</div>
        </div>
    </div>
  );
};

export default Earth3D;