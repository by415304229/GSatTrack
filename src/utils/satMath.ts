import * as satellite from 'satellite.js';
import { type TLEData } from '../types';

const EARTH_RADIUS_KM = 6371;

// Coordinate Mapping Helper
// Maps standard ECEF (X=Greenwich, Z=North) to Three.js Scene (Z=Front/Greenwich, Y=Up/North)
const mapEcefToScene = (ecf: { x: number, y: number, z: number }, scale: number) => {
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

// Calculates sun position based on time
// Returns normalized direction vector in scene coordinates
export const calculateSunPosition = (time: Date): { x: number, y: number, z: number } => {
  // Get hours since midnight
  const hours = time.getUTCHours() + time.getUTCMinutes() / 60 + time.getUTCSeconds() / 3600;

  // Calculate rotation angle based on time (24 hours = 360 degrees)
  // This simulates Earth's rotation relative to the sun
  const rotationAngle = (hours / 24) * 2 * Math.PI;

  // Earth's axial tilt (obliquity of the ecliptic) in radians (~23.5 degrees)
  const axialTilt = 23.5 * Math.PI / 180;

  // Sun position in equatorial coordinate system
  // Consider Earth's axial tilt for more accurate sun position
  const sunEcefX = Math.cos(rotationAngle);
  const sunEcefY = Math.sin(rotationAngle);
  const sunEcefZ = Math.sin(axialTilt); // Account for Earth's axial tilt

  // Normalize the sun position vector
  const magnitude = Math.sqrt(sunEcefX * sunEcefX + sunEcefY * sunEcefY + sunEcefZ * sunEcefZ);
  const normalizedX = sunEcefX / magnitude;
  const normalizedY = sunEcefY / magnitude;
  const normalizedZ = sunEcefZ / magnitude;

  // Apply our scene mapping (ECEF X->Z, Y->X, Z->Y)
  // Scene X = ECEF Y
  // Scene Y = ECEF Z
  // Scene Z = ECEF X
  return {
    x: normalizedY,
    y: normalizedZ,
    z: normalizedX
  };
};

// Calculates the terminator line coordinates for a given time and map dimensions
export const calculateTerminatorCoordinates = (time: Date, width: number, height: number) => {
  // Get sun position
  const sunPos = calculateSunPosition(time);

  // Calculate the subsolar point (point on Earth directly under the sun)
  const subsolarLat = Math.asin(sunPos.y) * 180 / Math.PI;
  const hours = time.getUTCHours() + time.getUTCMinutes() / 60 + time.getUTCSeconds() / 3600;
  const subsolarLon = (hours / 24) * 360 - 180;

  // Generate points for the terminator line
  const points: { x: number, y: number }[] = [];

  // Generate points every 1 degree of longitude for a smooth terminator line
  for (let lon = -180; lon <= 180; lon += 1) {
    // Calculate the latitude of the terminator at this longitude
    // Using the formula: tan(lat) = -cos(lon - subsolarLon) / tan(subsolarLat)
    const lonDiff = (lon - subsolarLon) * Math.PI / 180;
    const subsolarLatRad = subsolarLat * Math.PI / 180;

    // Calculate the terminator latitude
    let lat: number;
    if (Math.abs(subsolarLat) === 90) {
      // Special case: sun is at one of the poles
      lat = subsolarLat > 0 ? 90 - Math.abs(lonDiff) * 180 / Math.PI : -90 + Math.abs(lonDiff) * 180 / Math.PI;
    } else {
      const tanLat = -Math.cos(lonDiff) / Math.tan(subsolarLatRad);
      lat = Math.atan(tanLat) * 180 / Math.PI;
    }

    // Convert lat/lon to screen coordinates
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;

    points.push({ x, y });
  }

  return points;
};


export const getSatellitePosition = (tle: TLEData, date: Date): { id: string; name: string; x: number; y: number; z: number; lat: number; lon: number; alt: number; velocity: number; orbitPath?: { x: number, y: number, z: number, lat: number, lon: number }[]; color?: string; tle?: TLEData } | null => {
  try {
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

    const v = Math.sqrt(velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2);

    // Check if any of the critical values are NaN
    if (isNaN(scenePos.x) || isNaN(scenePos.y) || isNaN(scenePos.z) ||
      isNaN(latitude) || isNaN(longitude) || isNaN(height)) {
      return null;
    }

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
  } catch (error) {
    return null;
  }
};

// Calculates the Ground Track (ECEF path accounting for Earth rotation)
export const calculateOrbitPath = (tle: TLEData, startTime: Date = new Date(), orbitWindowMinutes: number = 24): { x: number, y: number, z: number, lat: number, lon: number }[] => {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const points: { x: number, y: number, z: number, lat: number, lon: number }[] = [];

    // Check if satrec is valid
    if (!satrec || !satrec.no || isNaN(satrec.no)) {
      return [];
    }

    const scale = 1 / EARTH_RADIUS_KM;

    // 1. Calculate Exact Period
    let periodMinutes = 95;
    if (satrec.no > 0) {
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

        // Check if the calculated position is valid (not NaN)
        if (!isNaN(scenePos.x) && !isNaN(scenePos.y) && !isNaN(scenePos.z) &&
          !isNaN(pGd.latitude) && !isNaN(pGd.longitude)) {
          points.push({
            x: scenePos.x,
            y: scenePos.y,
            z: scenePos.z,
            lat: satellite.degreesLat(pGd.latitude),
            lon: satellite.degreesLong(pGd.longitude)
          });
        }
      }
    }

    return points;
  } catch (error) {
    return [];
  }
}