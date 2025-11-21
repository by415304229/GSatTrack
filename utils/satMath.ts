
import * as satellite from 'satellite.js';
import { TLEData, SatellitePos } from '../types';

const EARTH_RADIUS_KM = 6371;

// Coordinate Mapping Helper
// Maps standard ECEF (X=Greenwich, Z=North) to Three.js Scene (Z=Front/Greenwich, Y=Up/North)
const mapEcefToScene = (ecf: {x: number, y: number, z: number}, scale: number) => {
    return {
        x: ecf.y * scale, // ECEF Y (90E) -> Scene X (Right)
        y: ecf.z * scale, // ECEF Z (North) -> Scene Y (Up)
        z: ecf.x * scale  // ECEF X (Greenwich) -> Scene Z (Front)
    };
};

// Helper to convert Lat/Lon to 3D Scene Coordinates (on surface of Earth sphere radius 1)
export const latLonToScene = (lat: number, lon: number, radius: number = 1) => {
    const r = radius;
    // Convert degrees to radians
    const latRad = lat * (Math.PI / 180);
    const lonRad = lon * (Math.PI / 180);

    // Calculate ECEF Cartesian coordinates on unit sphere
    // x = r * cos(lat) * cos(lon)  (Points to Greenwich)
    // y = r * cos(lat) * sin(lon)  (Points to 90E)
    // z = r * sin(lat)             (Points North)
    const x = r * Math.cos(latRad) * Math.cos(lonRad);
    const y = r * Math.cos(latRad) * Math.sin(lonRad);
    const z = r * Math.sin(latRad);
    
    // Apply our scene mapping (ECEF X->Z, Y->X, Z->Y)
    // Scene X = ECEF Y
    // Scene Y = ECEF Z
    // Scene Z = ECEF X
    return {
        x: y,
        y: z,
        z: x
    };
};


export const getSatellitePosition = (tle: TLEData, date: Date): SatellitePos | null => {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  
  // Propagate
  const positionAndVelocity = satellite.propagate(satrec, date);
  
  if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
    return null;
  }

  const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
  const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;

  // GMST for coordinate conversion
  const gmst = satellite.gstime(date);
  
  // ECI -> ECEF (Earth Centered, Earth Fixed)
  const positionEcf = satellite.eciToEcf(positionEci, gmst);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);

  const scale = 1 / EARTH_RADIUS_KM; 
  
  // Apply Coordinate Mapping
  const scenePos = mapEcefToScene(positionEcf, scale);

  const longitude = satellite.degreesLong(positionGd.longitude);
  const latitude = satellite.degreesLat(positionGd.latitude);
  const height = positionGd.height;
  
  const v = Math.sqrt(velocityEci.x**2 + velocityEci.y**2 + velocityEci.z**2);

  return {
    id: tle.satId,
    name: tle.name,
    x: scenePos.x,
    y: scenePos.y,
    z: scenePos.z,
    lat: latitude,
    lon: longitude,
    alt: height,
    velocity: v,
    tle: tle
  };
};

// Calculates the Ground Track (ECEF path accounting for Earth rotation)
export const calculateOrbitPath = (tle: TLEData, startTime: Date = new Date(), orbitWindowMinutes: number = 24): {x:number, y:number, z:number, lat:number, lon:number}[] => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const points: {x:number, y:number, z:number, lat:number, lon:number}[] = [];
    
    const scale = 1 / EARTH_RADIUS_KM;

    // 1. Calculate Exact Period
    let periodMinutes = 95; 
    if (satrec.no && satrec.no > 0) {
        periodMinutes = (2 * Math.PI) / satrec.no;
    }

    // 2. Start from current time
    // Use the specified orbit window time instead of fixed 1/4 period
    const startOffsetMinutes = 0;
    const totalMinutes = Math.min(orbitWindowMinutes, periodMinutes / 2); // Limit to half orbit max

    // Calculate steps based on orbit window (more steps for longer windows)
    const steps = Math.max(180, Math.min(360, Math.floor(totalMinutes * 15))); // ~15 steps per minute
    
    for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;
        const minutesFromCenter = startOffsetMinutes + (fraction * totalMinutes);
        const timeOffsetMs = minutesFromCenter * 60000;
        
        const t = new Date(startTime.getTime() + timeOffsetMs);
        
        const pv = satellite.propagate(satrec, t);
        
        if (pv.position && typeof pv.position !== 'boolean') {
             const pEci = pv.position as satellite.EciVec3<number>;
             
             const gmstAtTime = satellite.gstime(t);
             
             // 1. ECEF for 3D
             const pEcf = satellite.eciToEcf(pEci, gmstAtTime);
             const scenePos = mapEcefToScene(pEcf, scale);
             
             // 2. Geodetic for 2D
             const pGd = satellite.eciToGeodetic(pEci, gmstAtTime);
             
             points.push({
                 x: scenePos.x,
                 y: scenePos.y,
                 z: scenePos.z,
                 lat: satellite.degreesLat(pGd.latitude),
                 lon: satellite.degreesLong(pGd.longitude)
             });
        }
    }
    
    return points;
}
