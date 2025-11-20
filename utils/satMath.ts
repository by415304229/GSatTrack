import * as satellite from 'satellite.js';
import { TLEData, SatellitePos } from '../types';

const EARTH_RADIUS_KM = 6371;

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

  // Coordinate conversion for Three.js (Y-up)
  // ECEF X -> Three X
  // ECEF Z -> Three Y (North)
  // ECEF Y -> Three Z
  const scale = 1 / EARTH_RADIUS_KM; 
  
  const x = positionEcf.x * scale;
  const y = positionEcf.z * scale; 
  const z = -positionEcf.y * scale; 

  const longitude = satellite.degreesLong(positionGd.longitude);
  const latitude = satellite.degreesLat(positionGd.latitude);
  const height = positionGd.height;
  
  const v = Math.sqrt(velocityEci.x**2 + velocityEci.y**2 + velocityEci.z**2);

  return {
    id: tle.satId,
    name: tle.name,
    x,
    y,
    z,
    lat: latitude,
    lon: longitude,
    alt: height,
    velocity: v,
    tle: tle // Pass full TLE for details
  };
};

// Calculates the Ground Track (ECEF path accounting for Earth rotation)
// Now includes Geodetic Lat/Lon for precise 2D plotting
export const calculateOrbitPath = (tle: TLEData, startTime: Date = new Date(), steps: number = 360): {x:number, y:number, z:number, lat:number, lon:number}[] => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const points: {x:number, y:number, z:number, lat:number, lon:number}[] = [];
    
    const meanMotion = satrec.no * 1440 / (2 * Math.PI); // revs/day
    if (meanMotion === 0) return [];

    const periodMinutes = 1440 / meanMotion;
    const scale = 1 / EARTH_RADIUS_KM;

    // Calculate points for slightly more than one period to show connectivity
    // We calculate the GROUND TRACK, so we must use the specific GMST for each time step.
    for (let i = 0; i <= steps; i++) {
        const timeOffset = (i * periodMinutes / steps) * 60000; // ms
        const t = new Date(startTime.getTime() + timeOffset);
        
        const pv = satellite.propagate(satrec, t);
        
        if (pv.position && typeof pv.position !== 'boolean') {
             const pEci = pv.position as satellite.EciVec3<number>;
             
             // CRITICAL: Use GMST at time `t`
             const gmstAtTime = satellite.gstime(t);
             
             // 1. ECEF for 3D
             const pEcf = satellite.eciToEcf(pEci, gmstAtTime);
             
             // 2. Geodetic for 2D (Matches satellite marker projection exactly)
             const pGd = satellite.eciToGeodetic(pEci, gmstAtTime);
             
             points.push({
                 x: pEcf.x * scale,
                 y: pEcf.z * scale,
                 z: -pEcf.y * scale,
                 lat: satellite.degreesLat(pGd.latitude),
                 lon: satellite.degreesLong(pGd.longitude)
             });
        }
    }
    
    return points;
}