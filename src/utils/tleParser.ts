/**
 * TLE (Two-Line Element Set) 数据解析工具
 * 用于解析卫星轨道数据，并根据卫星类型（QIANFAN、SpaceStation、Starlink）进行分类处理
 */

// 卫星类型枚举
export enum SatelliteType {
  QIANFAN = 'QIANFAN',
  SPACE_STATION = 'SpaceStation',
  STARLINK = 'Starlink',
  UNKNOWN = 'Unknown'
}

// 解析后的卫星数据结构
export interface ParsedSatellite {
  id: string;
  name: string;
  type: SatelliteType;
  line1: string;
  line2: string;
  satelliteNumber: string;
  classification: string;
  internationalDesignator: string;
  epoch: string;
  inclination: number;
  rightAscension: number;
  eccentricity: number;
  argumentOfPerigee: number;
  meanAnomaly: number;
  meanMotion: number;
  revolutionNumber: number;
  noradId?: string;
  satId?: string;
}

/**
 * 解析TLE文件内容，提取所有卫星数据
 * @param content TLE文件内容
 * @returns 解析后的卫星数据数组
 */
export const parseTLEContent = (content: string): ParsedSatellite[] => {
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parsedSatellites: ParsedSatellite[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    const nameLine = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];

    try {
      const satellite = parseSatelliteData(nameLine, line1, line2);
      parsedSatellites.push(satellite);
    } catch {
      // 跳过解析失败的卫星，但继续处理其他卫星
      continue;
    }
  }

  return parsedSatellites;
};

/**
 * 解析单个卫星的数据
 * @param name 卫星名称
 * @param line1 TLE第一行
 * @param line2 TLE第二行
 * @returns 解析后的卫星数据
 */
const parseSatelliteData = (name: string, line1: string, line2: string): ParsedSatellite => {
  // 确定卫星类型
  const type = determineSatelliteType(name, line1, line2);

  // 提取卫星编号
  const satelliteNumber = line1.substring(2, 7).trim();

  // 提取分类（U=未分类，C=机密，S=机密）
  const classification = line1.substring(7, 8);

  // 提取国际标识符（发射年份和发射编号）
  const internationalDesignator = line1.substring(9, 17).trim();

  // 提取历元时间（年份和天数）
  const epoch = line1.substring(18, 32).trim();

  // 提取并检查轨道参数，避免NaN值
  const inclination = parseFloat(line2.substring(8, 16).trim());
  const rightAscension = parseFloat(line2.substring(17, 25).trim());
  const eccentricityStr = line2.substring(26, 33).trim();
  const eccentricity = eccentricityStr ? parseFloat(`0.${eccentricityStr}`) : 0;
  const argumentOfPerigee = parseFloat(line2.substring(34, 42).trim());
  const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
  const meanMotion = parseFloat(line2.substring(52, 63).trim());
  const revolutionNumber = parseInt(line2.substring(63, 68).trim(), 10);

  // 检查关键数值是否为有效数字
  if (isNaN(inclination) || isNaN(rightAscension) || isNaN(eccentricity) || 
      isNaN(argumentOfPerigee) || isNaN(meanAnomaly) || isNaN(meanMotion) || 
      isNaN(revolutionNumber)) {
    throw new Error('解析卫星数据时发现无效数值');
  }

  // 生成唯一ID
  const id = `${satelliteNumber}-${internationalDesignator}`;

  return {
    id,
    name,
    type,
    line1,
    line2,
    satelliteNumber,
    classification,
    internationalDesignator,
    epoch,
    inclination,
    rightAscension,
    eccentricity,
    argumentOfPerigee,
    meanAnomaly,
    meanMotion,
    revolutionNumber,
    noradId: satelliteNumber,
    satId: satelliteNumber
  };
};

/**
 * 根据卫星名称和数据确定卫星类型
 * @param name 卫星名称
 * @param line1 TLE第一行
 * @param line2 TLE第二行
 * @returns 卫星类型
 */
const determineSatelliteType = (name: string, _line1: string, _line2: string): SatelliteType => {
  // 确保名称不为空
  if (!name || name.trim().length === 0) {
    return SatelliteType.UNKNOWN;
  }

  // 转换为小写进行不区分大小写的比较
  const nameLower = name.toLowerCase();

  // 按优先级顺序检查，避免重叠
  // 1. 空间站（最高优先级）
  if (nameLower.includes('iss') || 
      nameLower.includes('international space station') || 
      nameLower.includes('space station') || 
      nameLower.includes('tiangong') || // 天宫
      nameLower.includes('skylab') || 
      nameLower.includes('salute') || // 礼炮
      nameLower.includes('salyut')) {
    return SatelliteType.SPACE_STATION;
  }

  // 2. 千帆卫星
  if (nameLower.includes('qianfan') || 
      nameLower.includes('qian fan') || 
      nameLower.includes('千帆')) {
    return SatelliteType.QIANFAN;
  }

  // 3. Starlink卫星
  if (nameLower.includes('starlink') || 
      nameLower.includes('spacex')) {
    return SatelliteType.STARLINK;
  }

  // 未知类型
  return SatelliteType.UNKNOWN;
};

/**
 * 按类型筛选卫星数据
 * @param satellites 卫星数据数组
 * @param type 要筛选的卫星类型
 * @returns 筛选后的卫星数组
 */
export const filterSatellitesByType = (satellites: ParsedSatellite[], type: SatelliteType): ParsedSatellite[] => {
  return satellites.filter(satellite => satellite.type === type);
};

/**
 * 按名称搜索卫星
 * @param satellites 卫星数据数组
 * @param searchTerm 搜索关键词
 * @returns 匹配的卫星数组
 */
export const searchSatellitesByName = (satellites: ParsedSatellite[], searchTerm: string): ParsedSatellite[] => {
  const lowerSearchTerm = searchTerm.toLowerCase();
  return satellites.filter(satellite => 
    satellite.name.toLowerCase().includes(lowerSearchTerm)
  );
};

/**
 * 从解析后的卫星数据中提取原始TLE格式字符串
 * @param satellite 解析后的卫星数据
 * @returns 格式化的TLE字符串
 */
export const formatSatelliteToTLE = (satellite: ParsedSatellite): string => {
  return `${satellite.name}\n${satellite.line1}\n${satellite.line2}`;
};