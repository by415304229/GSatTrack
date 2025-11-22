/**
 * TLE文件导入功能测试
 * 测试各个组件的功能和边界条件
 */

import {
  validateTLEContent
} from '../utils/tleValidator';

import {
  parseTLEContent,
  SatelliteType,
  filterSatellitesByType
} from '../utils/tleParser';

import {
  createError,
  validateFile,
  TLEImportErrorType
} from '../utils/errorHandler';

// Mock File object for testing
class MockFile extends File {
  constructor(content: string, filename: string, options?: { type?: string; lastModified?: number }) {
    super([content], filename, options);
  }
}

// 有效的TLE数据样本
const validTLEData = `ISS (ZARYA)
1 25544U 98067A   23123.55430556  .00016717  00000-0  10270-3 0  9016
2 25544  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062
Starlink-1000
1 5eed78 65432A   23123.55430556  .00016717  00000-0  10270-3 0  9017
2 5eed78  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062
QIANFAN-1
1 99999U 22001A   23123.55430556  .00016717  00000-0  10270-3 0  9018
2 99999  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062`;

// 无效的TLE数据（缺少校验和）
const invalidTLEData = `ISS (ZARYA)
1 25544U 98067A   23123.55430556  .00016717  00000-0  10270-3 0  901X
2 25544  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062`;

// 行数不正确的TLE数据
const incorrectLinesTLEData = `ISS (ZARYA)
1 25544U 98067A   23123.55430556  .00016717  00000-0  10270-3 0  9016`;

describe('TLE Validator Tests', () => {
  test('应正确验证有效的TLE数据', () => {
    const result = validateTLEContent(validTLEData);
    expect(result.isValid).toBe(true);
    expect(result.satelliteCount).toBe(3);
    expect(result.error).toBeUndefined();
  });

  test('应拒绝校验和错误的TLE数据', () => {
    const result = validateTLEContent(invalidTLEData);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('不是有效的TLE第一行轨道数据');
  });

  test('应拒绝行数不正确的TLE数据', () => {
    const result = validateTLEContent(incorrectLinesTLEData);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('文件行数必须是3的倍数');
  });

  test('应拒绝空文件内容', () => {
    const result = validateTLEContent('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('文件内容为空');
  });

  test('应拒绝只有空白字符的文件内容', () => {
    const result = validateTLEContent('   \n\t   \n   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('文件内容为空');
  });
});

describe('TLE Parser Tests', () => {
  test('应正确解析有效的TLE数据', () => {
    const satellites = parseTLEContent(validTLEData);
    expect(satellites).toHaveLength(3);
    expect(satellites[0].name).toBe('ISS (ZARYA)');
    expect(satellites[0].type).toBe(SatelliteType.SPACE_STATION);
    expect(satellites[1].name).toBe('Starlink-1000');
    expect(satellites[1].type).toBe(SatelliteType.STARLINK);
    expect(satellites[2].name).toBe('QIANFAN-1');
    expect(satellites[2].type).toBe(SatelliteType.QIANFAN);
  });

  test('应正确按类型筛选卫星', () => {
    const allSatellites = parseTLEContent(validTLEData);
    
    const starlinkSatellites = filterSatellitesByType(allSatellites, SatelliteType.STARLINK);
    expect(starlinkSatellites).toHaveLength(1);
    expect(starlinkSatellites[0].name).toBe('Starlink-1000');
    
    const spaceStationSatellites = filterSatellitesByType(allSatellites, SatelliteType.SPACE_STATION);
    expect(spaceStationSatellites).toHaveLength(1);
    expect(spaceStationSatellites[0].name).toBe('ISS (ZARYA)');
    
    const qianfanSatellites = filterSatellitesByType(allSatellites, SatelliteType.QIANFAN);
    expect(qianfanSatellites).toHaveLength(1);
    expect(qianfanSatellites[0].name).toBe('QIANFAN-1');
  });

  test('应正确提取轨道参数', () => {
    const satellites = parseTLEContent(validTLEData);
    const iss = satellites[0];
    
    expect(iss.inclination).toBeCloseTo(51.6432);
    expect(iss.rightAscension).toBeCloseTo(342.5792);
    expect(iss.eccentricity).toBeCloseTo(0.0006733);
    expect(iss.meanMotion).toBeCloseTo(15.49549334);
  });
});

describe('Error Handler Tests', () => {
  test('应正确验证文件类型', () => {
    // 有效的.tle文件
    const validTleFile = new MockFile('test', 'satellites.tle');
    const tleValidation = validateFile(validTleFile);
    expect(tleValidation).toBeNull();
    
    // 有效的.txt文件
    const validTxtFile = new MockFile('test', 'satellites.txt');
    const txtValidation = validateFile(validTxtFile);
    expect(txtValidation).toBeNull();
    
    // 无效的文件类型
    const invalidFile = new MockFile('test', 'satellites.csv');
    const invalidValidation = validateFile(invalidFile);
    expect(invalidValidation).not.toBeNull();
    expect(invalidValidation?.type).toBe(TLEImportErrorType.FILE_TYPE_ERROR);
  });

  test('应正确验证文件大小', () => {
    // 正常大小的文件
    const smallContent = 'x'.repeat(1024); // 1KB
    const smallFile = new MockFile(smallContent, 'small.tle');
    const smallValidation = validateFile(smallFile);
    expect(smallValidation).toBeNull();
    
    // 超大文件（超过10MB限制）
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const largeFile = new MockFile(largeContent, 'large.tle');
    const largeValidation = validateFile(largeFile);
    expect(largeValidation).not.toBeNull();
    expect(largeValidation?.type).toBe(TLEImportErrorType.FILE_SIZE_ERROR);
  });

  test('应正确验证空文件', () => {
    const emptyFile = new MockFile('', 'empty.tle');
    const emptyValidation = validateFile(emptyFile);
    expect(emptyValidation).not.toBeNull();
    expect(emptyValidation?.type).toBe(TLEImportErrorType.FILE_EMPTY_ERROR);
  });

  test('应正确创建标准化错误对象', () => {
    const error = createError(TLEImportErrorType.FILE_TYPE_ERROR);
    
    expect(error.type).toBe(TLEImportErrorType.FILE_TYPE_ERROR);
    expect(error.message).toBeDefined();
    expect(error.severity).toBeDefined();
    expect(error.timestamp).toBeInstanceOf(Date);
    
    // 测试自定义错误消息
    const customError = createError(TLEImportErrorType.FILE_TYPE_ERROR, '自定义错误消息', '详细信息');
    expect(customError.message).toBe('自定义错误消息');
    expect(customError.details).toBe('详细信息');
  });
});

describe('边界条件测试', () => {
  test('应处理特殊字符在卫星名称中', () => {
    const specialNameTLE = `SPECIAL_NAME-123!@#
1 99999U 22001A   23123.55430556  .00016717  00000-0  10270-3 0  9018
2 99999  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062`;
    
    const result = validateTLEContent(specialNameTLE);
    expect(result.isValid).toBe(true);
    expect(result.satelliteCount).toBe(1);
    
    const satellites = parseTLEContent(specialNameTLE);
    expect(satellites[0].name).toBe('SPECIAL_NAME-123!@#');
  });

  test('应处理多个空行的TLE文件', () => {
    const tleWithEmptyLines = `ISS (ZARYA)

1 25544U 98067A   23123.55430556  .00016717  00000-0  10270-3 0  9016

2 25544  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062
`;
    
    const result = validateTLEContent(tleWithEmptyLines);
    expect(result.isValid).toBe(true);
    expect(result.satelliteCount).toBe(1);
  });

  test('应优雅处理解析异常', () => {
    // 模拟一个会导致解析异常的情况
    const problematicTLE = `INVALID_SATELLITE
1 INVALID LINE
2 INVALID LINE`;
    
    // 验证器应该捕获并报告格式错误
    const validationResult = validateTLEContent(problematicTLE);
    expect(validationResult.isValid).toBe(false);
    
    // 解析器应该尝试解析但可能返回空数组或部分结果
    const parsedSatellites = parseTLEContent(problematicTLE);
    // 由于验证失败，解析可能不会成功，但应该不会抛出异常
    expect(Array.isArray(parsedSatellites)).toBe(true);
  });
});