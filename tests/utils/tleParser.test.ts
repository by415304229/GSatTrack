import { describe, it, expect } from '@jest/globals';
import { parseTLEContent, filterSatellitesByType, searchSatellitesByName, SatelliteType } from '../../src/utils/tleParser';

// 测试用的TLE数据
const testTLEContent = `ISS (ZARYA)
1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994
2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193

QIANFAN-01
1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995
2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193

STARLINK-1000
1 54321U 20001A   25320.51167824  .00010000  00000-0  21825-3 0  9996
2 54321  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193

UNKNOWN-SAT
1 67890U 21001A   25320.51167824  .00010000  00000-0  21825-3 0  9997
2 67890  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193
`;

describe('tleParser', () => {
  describe('parseTLEContent', () => {
    it('should parse TLE content correctly', () => {
      const result = parseTLEContent(testTLEContent);
      
      // 应该解析出4颗卫星
      expect(result).toHaveLength(4);
      
      // 验证第一颗卫星（ISS）的基本信息
      expect(result[0].name).toBe('ISS (ZARYA)');
      expect(result[0].type).toBe(SatelliteType.SPACE_STATION);
      expect(result[0].satelliteNumber).toBe('25544');
      expect(result[0].classification).toBe('U');
      expect(result[0].inclination).toBeCloseTo(51.6442);
      
      // 验证第二颗卫星（QIANFAN）的基本信息
      expect(result[1].name).toBe('QIANFAN-01');
      expect(result[1].type).toBe(SatelliteType.QIANFAN);
      expect(result[1].satelliteNumber).toBe('58765');
      
      // 验证第三颗卫星（STARLINK）的基本信息
      expect(result[2].name).toBe('STARLINK-1000');
      expect(result[2].type).toBe(SatelliteType.STARLINK);
      expect(result[2].satelliteNumber).toBe('54321');
      
      // 验证第四颗卫星（UNKNOWN）的基本信息
      expect(result[3].name).toBe('UNKNOWN-SAT');
      expect(result[3].type).toBe(SatelliteType.UNKNOWN);
      expect(result[3].satelliteNumber).toBe('67890');
    });
    
    it('should handle invalid TLE content gracefully', () => {
      // 无效的TLE内容（缺少行）
      const invalidTLEContent = `INVALID-SAT
1 12345U 20001A   25320.51167824  .00010000  00000-0  21825-3 0  9996
`;
      
      const result = parseTLEContent(invalidTLEContent);
      expect(result).toHaveLength(0);
    });
    
    it('should handle empty content', () => {
      const result = parseTLEContent('');
      expect(result).toHaveLength(0);
    });
  });
  
  describe('satellite type identification', () => {
    it('should identify space stations correctly', () => {
      const spaceStationTLE = `ISS (ZARYA)
1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994
2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;
      
      const result = parseTLEContent(spaceStationTLE);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(SatelliteType.SPACE_STATION);
    });
    
    it('should identify QIANFAN satellites correctly', () => {
      const qianfanTLE = `QIANFAN-01
1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995
2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;
      
      const result = parseTLEContent(qianfanTLE);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(SatelliteType.QIANFAN);
    });
    
    it('should identify STARLINK satellites correctly', () => {
      const starlinkTLE = `STARLINK-1000
1 54321U 20001A   25320.51167824  .00010000  00000-0  21825-3 0  9996
2 54321  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;
      
      const result = parseTLEContent(starlinkTLE);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(SatelliteType.STARLINK);
    });
    
    it('should return UNKNOWN for unknown satellite types', () => {
      const unknownTLE = `UNKNOWN-SAT
1 67890U 21001A   25320.51167824  .00010000  00000-0  21825-3 0  9997
2 67890  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;
      
      const result = parseTLEContent(unknownTLE);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(SatelliteType.UNKNOWN);
    });
  });
  
  describe('filterSatellitesByType', () => {
    it('should filter satellites by type correctly', () => {
      const satellites = parseTLEContent(testTLEContent);
      
      // 筛选空间站
      const spaceStations = filterSatellitesByType(satellites, SatelliteType.SPACE_STATION);
      expect(spaceStations).toHaveLength(1);
      expect(spaceStations[0].type).toBe(SatelliteType.SPACE_STATION);
      
      // 筛选千帆卫星
      const qianfanSats = filterSatellitesByType(satellites, SatelliteType.QIANFAN);
      expect(qianfanSats).toHaveLength(1);
      expect(qianfanSats[0].type).toBe(SatelliteType.QIANFAN);
      
      // 筛选星链卫星
      const starlinkSats = filterSatellitesByType(satellites, SatelliteType.STARLINK);
      expect(starlinkSats).toHaveLength(1);
      expect(starlinkSats[0].type).toBe(SatelliteType.STARLINK);
      
      // 筛选未知类型卫星
      const unknownSats = filterSatellitesByType(satellites, SatelliteType.UNKNOWN);
      expect(unknownSats).toHaveLength(1);
      expect(unknownSats[0].type).toBe(SatelliteType.UNKNOWN);
    });
    
    it('should return empty array for non-existent satellite type', () => {
      const satellites = parseTLEContent(testTLEContent);
      // @ts-ignore - 测试不存在的卫星类型
      const result = filterSatellitesByType(satellites, 'NON_EXISTENT_TYPE');
      expect(result).toHaveLength(0);
    });
  });
  
  describe('searchSatellitesByName', () => {
    it('should search satellites by name correctly', () => {
      const satellites = parseTLEContent(testTLEContent);
      
      // 搜索ISS
      const result1 = searchSatellitesByName(satellites, 'ISS');
      expect(result1).toHaveLength(1);
      expect(result1[0].name).toContain('ISS');
      
      // 搜索QIANFAN
      const result2 = searchSatellitesByName(satellites, 'QIANFAN');
      expect(result2).toHaveLength(1);
      expect(result2[0].name).toContain('QIANFAN');
      
      // 搜索STARLINK
      const result3 = searchSatellitesByName(satellites, 'STARLINK');
      expect(result3).toHaveLength(1);
      expect(result3[0].name).toContain('STARLINK');
      
      // 搜索不存在的卫星
      const result4 = searchSatellitesByName(satellites, 'NON_EXISTENT_SAT');
      expect(result4).toHaveLength(0);
    });
    
    it('should be case insensitive', () => {
      const satellites = parseTLEContent(testTLEContent);
      
      // 小写搜索
      const result1 = searchSatellitesByName(satellites, 'iss');
      expect(result1).toHaveLength(1);
      
      // 大写搜索
      const result2 = searchSatellitesByName(satellites, 'QIANFAN');
      expect(result2).toHaveLength(1);
      
      // 混合大小写搜索
      const result3 = searchSatellitesByName(satellites, 'StarLink');
      expect(result3).toHaveLength(1);
    });
  });
});
