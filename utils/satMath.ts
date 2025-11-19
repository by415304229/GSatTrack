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
  // This allows us to keep the Earth texture static in the 3D scene
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
    velocity: v
  };
};

export const calculateOrbitPath = (tle: TLEData, steps: number = 180): {x:number, y:number, z:number}[] => {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const points: {x:number, y:number, z:number}[] = [];
    const now = new Date();
    // Use fixed GMST for the entire orbit path to create an instantaneous orbital ring 
    // that is valid for the current Earth rotation frame (ECEF)
    const gmstNow = satellite.gstime(now);
    
    const meanMotion = satrec.no * 1440 / (2 * Math.PI); // revs/day
    const periodMinutes = 1440 / meanMotion;
    const scale = 1 / EARTH_RADIUS_KM;

    // Calculate one full orbit
    for (let i = 0; i <= steps; i++) {
        // Propagate time forward to trace the ellipse
        const t = new Date(now.getTime() + (i * periodMinutes / steps) * 60000);
        const pv = satellite.propagate(satrec, t);
        
        if (pv.position && typeof pv.position !== 'boolean') {
             const pEci = pv.position as satellite.EciVec3<number>;
             
             // Convert ECI to ECEF using CURRENT GMST (Snapshot approach)
             // This draws the orbital plane as it exists right now relative to the Earth
             const pEcf = satellite.eciToEcf(pEci, gmstNow);
             
             points.push({
                 x: pEcf.x * scale,
                 y: pEcf.z * scale,
                 z: -pEcf.y * scale
             });
        }
    }
    
    // Ensure the loop is visually closed
    if (points.length > 0) {
        points.push(points[0]);
    }

    return points;
}