export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  satId: string;
}

export interface SatellitePos {
  id: string;
  name: string;
  x: number; // ECEF X
  y: number; // ECEF Y (Three.js Z or Y depending on up-axis)
  z: number; // ECEF Z
  lat: number;
  lon: number;
  alt: number; // km
  velocity: number; // km/s
  orbitPath?: {x: number, y: number, z: number}[];
}

export interface OrbitalPlaneGroup {
  id: string;
  name: string;
  description: string;
  tles: TLEData[];
}

export interface TrackerSettings {
  showOrbits: boolean;
  showLabels: boolean;
  showTerminator: boolean;
}
