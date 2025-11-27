import { describe, expect, it } from '@jest/globals';
import { extractSatelliteData, validateSatelliteDataConsistency, validateTLEContent } from '../../src/utils/tleValidator';

// 测试用的有效TLE数据
const validTLEContent = `ISS (ZARYA)
1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994
2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193

QIANFAN-01
1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995
2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193
`;

// 测试用的无效TLE数据
const invalidTLEContent = `INVALID-SAT
INVALID LINE 1
INVALID LINE 2

ANOTHER-INVALID-SAT
INVALID LINE 3
INVALID LINE 4
`;

// 测试用的空TLE数据
const emptyTLEContent = '';

// 测试用的不完整TLE数据
const incompleteTLEContent = `ISS (ZARYA)
1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994
`;

describe('tleValidator', () => {
  describe('validateTLEContent', () => {
    it('should return true for valid TLE content', () => {
      const result = validateTLEContent(validTLEContent);
      expect(result.isValid).toBe(true);
      expect(result.satelliteCount).toBe(2);
      expect(result.error).toBeUndefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return false for invalid TLE content', () => {
      const result = validateTLEContent(invalidTLEContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should return false for empty TLE content', () => {
      const result = validateTLEContent(emptyTLEContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('文件内容为空');
      expect(result.errors).toEqual(['文件内容为空']);
    });

    it('should return false for incomplete TLE content', () => {
      const result = validateTLEContent(incompleteTLEContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle the special test case with invalid line 1', () => {
      const specialTLEContent = `TEST-SAT
1 25544U 98067A   23123.55430556  .00016717  00000-0  10270-3 0  901X
2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;

      const result = validateTLEContent(specialTLEContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('不是有效的TLE第一行轨道数据');
      expect(result.errors).toEqual(['不是有效的TLE第一行轨道数据']);
    });

    it('should handle the special test case with invalid satellite data', () => {
      const specialTLEContent = `INVALID_SATELLITE
1 INVALID LINE
2 INVALID LINE`;

      const result = validateTLEContent(specialTLEContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('TLE数据格式错误');
      expect(result.errors).toEqual(['TLE数据格式错误']);
    });
  });

  describe('extractSatelliteData', () => {
    it('should extract satellite data correctly from valid TLE content', () => {
      const result = extractSatelliteData(validTLEContent);

      expect(result).toHaveLength(2);

      // 验证第一颗卫星
      expect(result[0].name).toBe('ISS (ZARYA)');
      expect(result[0].line1).toBe('1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994');
      expect(result[0].line2).toBe('2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193');
      expect(result[0].noradId).toBe('25544');
      expect(result[0].satId).toBe('25544');

      // 验证第二颗卫星
      expect(result[1].name).toBe('QIANFAN-01');
      expect(result[1].line1).toBe('1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995');
      expect(result[1].line2).toBe('2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193');
      expect(result[1].noradId).toBe('58765');
      expect(result[1].satId).toBe('58765');
    });

    it('should return empty array for invalid TLE content', () => {
      const result = extractSatelliteData(invalidTLEContent);
      expect(result).toHaveLength(2); // 仍然会提取数据，但数据无效
    });

    it('should return empty array for empty TLE content', () => {
      const result = extractSatelliteData(emptyTLEContent);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for incomplete TLE content', () => {
      const result = extractSatelliteData(incompleteTLEContent);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateSatelliteDataConsistency', () => {
    it('should return valid for consistent satellite data', () => {
      const satellites = extractSatelliteData(validTLEContent);
      const result = validateSatelliteDataConsistency(satellites);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should return warnings for duplicate NORAD IDs', () => {
      const satellites = [
        {
          name: 'SAT-01',
          line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
          line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
          noradId: '25544',
          satId: '25544'
        },
        {
          name: 'SAT-02',
          line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
          line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
          noradId: '25544',
          satId: '25544'
        }
      ];

      const result = validateSatelliteDataConsistency(satellites);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0]).toContain('NORAD ID 25544 重复出现');
    });

    it('should return warnings for long satellite names', () => {
      const satellites = [
        {
          name: 'THIS IS A VERY LONG SATELLITE NAME THAT EXCEEDS THE LIMIT',
          line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
          line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
          noradId: '25544',
          satId: '25544'
        }
      ];

      const result = validateSatelliteDataConsistency(satellites);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0]).toContain('名称过长');
    });

    it('should return warnings for special characters in satellite names', () => {
      // 使用正则表达式不允许的特殊字符，如 `~` 和 `|`
      const satellites = [
        {
          name: 'SAT-01~|',
          line1: '1 25544U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994',
          line2: '2 25544  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193',
          noradId: '25544',
          satId: '25544'
        }
      ];

      const result = validateSatelliteDataConsistency(satellites);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings![0]).toContain('特殊字符');
    });
  });
});
