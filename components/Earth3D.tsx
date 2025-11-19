import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
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
  color: string;
}

const EarthMesh = () => {
  const earthTexture = useMemo(() => new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'), []);
  
  return (
    <mesh>
      <sphereGeometry args={[R, 64, 64]} />
      <meshPhongMaterial 
        map={earthTexture} 
        specular={new THREE.Color('grey')} 
        shininess={10}
      />
    </mesh>
  );
};

const SatelliteInstances = ({ satellites, color }: { satellites: SatellitePos[], color: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();

  useFrame(() => {
    if (!meshRef.current) return;
    
    satellites.forEach((sat, i) => {
      tempObject.position.set(sat.x, sat.y, sat.z);
      // Scale down the satellite marker
      const scale = 0.015;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, satellites.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} />
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
          <lineBasicMaterial color={color} opacity={0.35} transparent />
      </threeLine>
  );
};

const Orbits = ({ satellites, color }: { satellites: SatellitePos[], color: string }) => {
    return (
        <group>
            {satellites.map((sat, idx) => {
                if (!sat.orbitPath || sat.orbitPath.length === 0) return null;
                // Render complete orbital lines for all calculated paths
                return <OrbitLine key={`orbit-${sat.id}`} path={sat.orbitPath} color={color} />;
            })}
        </group>
    )
}

const Earth3D: React.FC<EarthProps> = ({ satellites, color }) => {
  return (
    <div className="w-full h-full bg-black rounded border border-slate-700 relative">
        <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Stars radius={300} depth={60} count={1000} factor={7} saturation={0} fade speed={1} />
          
          <EarthMesh />
          <SatelliteInstances satellites={satellites} color={color} />
          <Orbits satellites={satellites} color={color} />
          
          <OrbitControls enablePan={false} minDistance={1.5} maxDistance={10} />
        </Canvas>
        
        {/* Overlay Stats */}
        <div className="absolute top-2 left-2 bg-slate-900/80 p-2 rounded text-xs font-mono text-cyan-400 pointer-events-none">
            <div>ACTIVE SATS: {satellites.length}</div>
            <div>VIEW: ECEF</div>
        </div>
    </div>
  );
};

export default Earth3D;