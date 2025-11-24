export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  satId: string;
  updatedAt?: Date;
  id?: string;
  tle1?: string;
  tle2?: string;
  tle?: string[];
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
  orbitPath?: { x: number, y: number, z: number, lat: number, lon: number }[];
  color?: string; // Display color for orbit and marker
  tle?: TLEData; // Full TLE data for detail view
}

export interface OrbitalPlaneGroup {
  id: string;
  name: string;
  description?: string;
  tles: TLEData[];
  source?: string;
}

export interface SatelliteGroup {
  id: string;
  name: string;
  description?: string;
  tles: TLEData[];
  source?: string;
}

export interface GroundStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
}

export interface TrackerSettings {
  showOrbits: boolean;
  showLabels: boolean;
  showTerminator: boolean;
}

export interface ParsedSatellite {
  name: string;
  line1: string;
  line2: string;
  noradId?: string;
  satId?: string;
}