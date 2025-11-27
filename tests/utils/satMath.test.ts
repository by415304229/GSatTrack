import { describe, expect, it } from '@jest/globals';
import type { TLEData } from '../../src/types';
import { calculateOrbitPath, calculateSunPosition, calculateTerminatorCoordinates, getSatellitePosition, latLonToScene } from '../../src/utils/satMath';

describe('satMath', () => {
  describe('latLonToScene', () => {
    it('should convert equator and prime meridian to correct scene coordinates', () => {
      const result = latLonToScene(0, 0, 1);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(1);
    });

    it('should convert North Pole to correct scene coordinates', () => {
      const result = latLonToScene(90, 0, 1);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(1);
      expect(result.z).toBeCloseTo(0);
    });

    it('should convert South Pole to correct scene coordinates', () => {
      const result = latLonToScene(-90, 0, 1);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-1);
      expect(result.z).toBeCloseTo(0);
    });

    it('should convert 90E longitude to correct scene coordinates', () => {
      const result = latLonToScene(0, 90, 1);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
      expect(result.z).toBeCloseTo(0);
    });

    it('should handle different radii correctly', () => {
      const result1 = latLonToScene(0, 0, 1);
      const result2 = latLonToScene(0, 0, 2);

      expect(result2.x).toBeCloseTo(result1.x * 2);
      expect(result2.y).toBeCloseTo(result1.y * 2);
      expect(result2.z).toBeCloseTo(result1.z * 2);
    });
  });

  describe('calculateSunPosition', () => {
    it('should return a normalized direction vector', () => {
      const time = new Date('2023-01-01T12:00:00Z');
      const result = calculateSunPosition(time);

      // 验证结果是一个归一化向量
      const magnitude = Math.sqrt(result.x * result.x + result.y * result.y + result.z * result.z);
      expect(magnitude).toBeCloseTo(1);
    });

    it('should return different positions for different times', () => {
      const time1 = new Date('2023-01-01T00:00:00Z');
      const time2 = new Date('2023-01-01T12:00:00Z');

      const result1 = calculateSunPosition(time1);
      const result2 = calculateSunPosition(time2);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('calculateTerminatorCoordinates', () => {
    it('should return an array of points', () => {
      const time = new Date('2023-01-01T12:00:00Z');
      const result = calculateTerminatorCoordinates(time, 1000, 500);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // 验证每个点都有x和y属性
      result.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
      });
    });

    it('should return different coordinates for different times', () => {
      const time1 = new Date('2023-01-01T00:00:00Z');
      const time2 = new Date('2023-01-01T12:00:00Z');

      const result1 = calculateTerminatorCoordinates(time1, 1000, 500);
      const result2 = calculateTerminatorCoordinates(time2, 1000, 500);

      expect(result1).not.toEqual(result2);
    });

    it('should return different coordinates for different map dimensions', () => {
      const time = new Date('2023-01-01T12:00:00Z');

      const result1 = calculateTerminatorCoordinates(time, 1000, 500);
      const result2 = calculateTerminatorCoordinates(time, 2000, 1000);

      expect(result1).not.toEqual(result2);
    });
  });

  describe('getSatellitePosition', () => {
    it('should return null for invalid TLE data', () => {
      const invalidTLE: TLEData = {
        name: 'Invalid Satellite',
        line1: 'Invalid line 1',
        line2: 'Invalid line 2',
        satId: 'INVALID'
      };

      const time = new Date();
      const result = getSatellitePosition(invalidTLE, time);

      expect(result).toBeNull();
    });

    it('should return satellite position for valid TLE data', () => {
      const validTLE: TLEData = {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
        line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
        satId: '25544'
      };

      const time = new Date();
      const result = getSatellitePosition(validTLE, time);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.id).toBe('25544');
        expect(result.name).toBe('ISS (ZARYA)');
        expect(result).toHaveProperty('x');
        expect(result).toHaveProperty('y');
        expect(result).toHaveProperty('z');
        expect(result).toHaveProperty('lat');
        expect(result).toHaveProperty('lon');
        expect(result).toHaveProperty('alt');
        expect(result).toHaveProperty('velocity');
      }
    });

    it('should return different positions for different times', () => {
      const validTLE: TLEData = {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
        line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
        satId: '25544'
      };

      const time1 = new Date('2023-01-01T00:00:00Z');
      const time2 = new Date('2023-01-01T12:00:00Z');

      const result1 = getSatellitePosition(validTLE, time1);
      const result2 = getSatellitePosition(validTLE, time2);

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();

      if (result1 && result2) {
        expect(result1.x).not.toEqual(result2.x);
        expect(result1.y).not.toEqual(result2.y);
        expect(result1.z).not.toEqual(result2.z);
      }
    });
  });

  describe('calculateOrbitPath', () => {
    it('should return empty array for invalid TLE data', () => {
      const invalidTLE: TLEData = {
        name: 'Invalid Satellite',
        line1: 'Invalid line 1',
        line2: 'Invalid line 2',
        satId: 'INVALID'
      };

      const time = new Date();
      const result = calculateOrbitPath(invalidTLE, time);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should return orbit path for valid TLE data', () => {
      const validTLE: TLEData = {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
        line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
        satId: '25544'
      };

      const time = new Date();
      const result = calculateOrbitPath(validTLE, time);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      // 验证每个点都有正确的属性
      result.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('z');
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lon');
      });
    });

    it('should return different paths for different times', () => {
      const validTLE: TLEData = {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
        line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
        satId: '25544'
      };

      const time1 = new Date('2023-01-01T00:00:00Z');
      const time2 = new Date('2023-01-01T12:00:00Z');

      const result1 = calculateOrbitPath(validTLE, time1);
      const result2 = calculateOrbitPath(validTLE, time2);

      expect(result1).not.toEqual(result2);
    });

    it('should return different paths for different orbit windows', () => {
      const validTLE: TLEData = {
        name: 'ISS (ZARYA)',
        line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
        line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
        satId: '25544'
      };

      const time = new Date();
      const result1 = calculateOrbitPath(validTLE, time, 10); // 10分钟
      const result2 = calculateOrbitPath(validTLE, time, 30); // 30分钟

      expect(result1).not.toEqual(result2);
    });
  });
});
