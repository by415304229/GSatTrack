
import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import React, { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { type GroundStation, type SatellitePos } from '../types';
import { calculateSunPosition, latLonToScene } from '../utils/satMath';

// Earth Radius in scene units
const R = 1;

interface earthprops {
  satellites: SatellitePos[];
  groundStations: GroundStation[];
  onSatClick?: (sat: SatellitePos) => void;
  simulatedTime?: Date;
}

const Atmosphere = () => {
  return (
    <primitive
      object={new THREE.Mesh(
        new THREE.SphereGeometry(R, 64, 64),
        new THREE.MeshPhongMaterial({
          color: "#87CEEB",
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      )}
      scale={[1.02, 1.02, 1.02]}
    />
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
    <primitive
      object={new THREE.Mesh(
        new THREE.SphereGeometry(R, 64, 64),
        terminatorMaterial
      )}
      scale={[1.001, 1.001, 1.001]}
    />
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
    const sunDot = sunPosition.y; // Simplified: using Y component as a proxy for day/night

    // Map from [-1, 1] to [1, 0] for night lights intensity
    // Lights are brightest at night (sunDot = -1) and fade out during the day
    return Math.max(0, (1 - sunDot) / 2);
  }, [sunPosition]);

  // Create main earth mesh
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshPhongMaterial({
      map: colorMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      specularMap: specularMap,
      specular: new THREE.Color(0x333333),
      shininess: 5
    })
  );
  earthMesh.rotation.set(0, -Math.PI / 2, 0);

  // Create night lights mesh
  const nightLightsMesh = new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 64),
    new THREE.MeshBasicMaterial({
      map: nightLightsMap,
      transparent: true,
      opacity: nightLightsIntensity * 0.8,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    })
  );
  nightLightsMesh.rotation.set(0, -Math.PI / 2, 0);

  // Create group to hold all earth-related meshes
  const earthGroup = new THREE.Group();
  earthGroup.add(earthMesh);
  earthGroup.add(nightLightsMesh);

  return (
    <primitive object={earthGroup}>
      <Atmosphere />
      <Terminator sunPosition={sunPosition} />
    </primitive>
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

  // Create instanced mesh geometry and material
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const material = new THREE.MeshBasicMaterial({ toneMapped: false });

  // Create instanced mesh
  const instancedMesh = new THREE.InstancedMesh(geometry, material, satellites.length);

  // Set up event listeners
  instancedMesh.addEventListener('pointermove', handlepointermove as any);
  instancedMesh.addEventListener('pointerout', handlepointerout as any);
  instancedMesh.addEventListener('pointerdown', handlepointerdown as any);

  // Store reference to the instanced mesh
  meshRef.current = instancedMesh;

  return (
    <primitive object={instancedMesh} />
  );
};

const GroundStationMarkers = ({ stations, onHover }: { stations: GroundStation[], onHover: (data: hoverdata | null) => void }) => {
  // Create a group to hold all ground station markers
  const group = new THREE.Group();

  stations.forEach(station => {
    const pos = latLonToScene(station.lat, station.lon, R);

    // Create station group
    const stationGroup = new THREE.Group();
    stationGroup.position.set(pos.x, pos.y, pos.z);

    // Create base cylinder
    const baseGeometry = new THREE.CylinderGeometry(0.005, 0.001, 0.05, 6);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: station.color });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);

    // Add event listeners
    baseMesh.addEventListener('pointerover', (e: any) => {
      e.stopPropagation();
      onHover({ id: station.id, name: station.name, type: 'STATION', x: e.clientX, y: e.clientY });
      document.body.style.cursor = 'pointer';
    } as any);

    baseMesh.addEventListener('pointerout', () => {
      onHover(null);
      document.body.style.cursor = 'default';
    } as any);

    // Create pulse sphere
    const pulseGeometry = new THREE.SphereGeometry(0.008, 8, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: station.color, opacity: 0.6, transparent: true });
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    pulseMesh.position.set(0, 0.025, 0);

    // Add to station group
    stationGroup.add(baseMesh);
    stationGroup.add(pulseMesh);

    // Add to main group
    group.add(stationGroup);
  });

  return (
    <primitive object={group} />
  )
}

// 创建轨道线路组件 - 使用 React Three Fiber 声明式 API
const OrbitLine: React.FC<{ path: { x: number, y: number, z: number }[], color: string }> = ({ path, color }) => {
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
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color,
      opacity: 0.4,
      transparent: true,
      depthWrite: false,
      linewidth: 1
    }))} />
  );
};

const Earth3D: React.FC<earthprops> = ({ satellites, groundStations, onSatClick, simulatedTime = new Date() }) => {
  const [hoverData, setHoverData] = useState<hoverdata | null>(null);

  // Calculate sun position based on simulated time
  const sunPosition = useMemo(() => {
    return calculateSunPosition(simulatedTime);
  }, [simulatedTime]);

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
        <primitive object={new THREE.Color('#000')} attach="background" />
        <primitive object={new THREE.AmbientLight(0xffffff, 0.2)} />
        <primitive object={new THREE.DirectionalLight(0xffffff, 2.5)} position={[sunPosition.x * 5, sunPosition.y * 5, sunPosition.z * 5]} castShadow />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <primitive object={new THREE.Group()}>
          <Suspense fallback={null}>
            <Earthmesh sunPosition={sunPosition} />
          </Suspense>

          <SatelliteInstances
            satellites={satellites}
            onHover={setHoverData}
            onClick={onSatClick}
          />

          <GroundStationMarkers stations={groundStations} onHover={setHoverData} />

          {satellites.map((sat, index) => (
            sat.orbitPath && sat.orbitPath.length > 0 && (
              <OrbitLine key={`orbit-${sat.id || index}`} path={sat.orbitPath} color={sat.color || '#ffffff'} />
            )
          ))}
        </primitive>

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
