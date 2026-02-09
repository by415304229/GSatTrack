import * as satellite from 'satellite.js';
import { type TLEData } from '../types';

/**
 * 轨道面参数接口
 */
export interface OrbitPlaneParams {
  inclination: number;      // 轨道倾角 (度)
  raan: number;             // 升交点赤经 (度)
  eccentricity: number;     // 偏心率
  meanMotion: number;       // 平均运动 (rev/day)
  period: number;           // 轨道周期 (分钟)
}

/**
 * 从 TLE 数据中提取轨道参数
 */
export const extractOrbitPlaneParams = (tle: TLEData): OrbitPlaneParams | null => {
  try {
    // 防御性检查：确保 TLE 数据存在
    const line1 = tle.line1 || tle.tle1;
    const line2 = tle.line2 || tle.tle2;

    if (!line1 || !line2) {
      return null;
    }

    const satrec = satellite.twoline2satrec(line1, line2);

    if (!satrec) {
      return null;
    }

    // 从 TLE 字符串中直接提取轨道参数
    // TLE Line 1 格式: 1NNNNNU_LLIIII.OOOO_BBB.B_BBNNNNNNNNNNNNNNN
    // 其中:
    //   - LLIIII.OOOO: 倾角 (度)
    //   - BBB.B_BB: RAAN (度)

    // 提取倾角 (位置 8-16, 字符索引 7-16)
    const inclinationStr = line1.substring(8, 16).replace(/\s/g, '');
    const inclination = parseFloat(inclinationStr);

    // 提取 RAAN (位置 17-25, 字符索引 16-25)
    const raanStr = line1.substring(17, 25).replace(/\s/g, '');
    const raan = parseFloat(raanStr);

    // 提取偏心率 (line2 位置 26-33, 字符索引 25-33, 格式 0.0000000)
    const eccentricityStr = '0.' + line2.substring(26, 33).replace(/\s/g, '');
    const eccentricity = parseFloat(eccentricityStr);

    // 平均运动 (从 satrec 获取)
    const meanMotion = satrec.no || 0; // radians/minute

    // 计算轨道周期 (分钟)
    const period = meanMotion > 0 ? (2 * Math.PI) / meanMotion : 0;

    if (isNaN(inclination) || isNaN(raan) || isNaN(eccentricity)) {
      return null;
    }

    return {
      inclination,
      raan,
      eccentricity,
      meanMotion,
      period
    };
  } catch (error) {
    return null;
  }
};

/**
 * 生成轨道面唯一标识
 * 使用倾角和 RAAN 的组合作为轨道面的标识
 *
 * 注意：对于近圆轨道卫星（如千帆、Starlink），偏心率非常小且容易有微小差异，
 * 使用偏心率会导致同一轨道面的卫星被分到不同组。
 *
 * 因此：
 * - 对于近圆轨道（偏心率 < 0.01），只使用倾角+RAAN分组
 * - 对于椭圆轨道（偏心率 >= 0.01），才将偏心率纳入分组依据
 */
export const getOrbitPlaneId = (params: OrbitPlaneParams): string => {
  // 对于近圆轨道，使用非常宽松的精度
  // 容忍±1度的倾角差异和±2度的RAAN差异
  let roundedInclination: number;
  let roundedRaan: number;

  if (params.eccentricity < 0.01) {
    // 近圆轨道：容差更大
    // 倾角：以2度为步长（23-24度都归为24度）
    roundedInclination = Math.floor(params.inclination / 2) * 2;
    // RAAN：以5度为步长（253-257度都归为255度）
    roundedRaan = Math.floor(params.raan / 5) * 5;
    return `inc-${roundedInclination}-raan-${roundedRaan}`;
  } else {
    // 椭圆轨道：保留1位小数精度
    roundedInclination = Math.round(params.inclination * 10) / 10;
    roundedRaan = Math.round(params.raan * 10) / 10;
    // 使用偏心率（保留4位小数精度）
    const roundedEccentricity = Math.round(params.eccentricity * 10000) / 10000;
    return `inc-${roundedInclination}-raan-${roundedRaan}-ecc-${roundedEccentricity}`;
  }
};

/**
 * 检查两个 TLE 是否属于同一轨道面
 * 允许一定的误差范围
 */
export const isSameOrbitPlane = (
  tle1: TLEData,
  tle2: TLEData,
  tolerance: {
    inclination?: number;    // 倾角容差 (度)
    raan?: number;           // RAAN 容差 (度)
    eccentricity?: number;   // 偏心率容差
  } = {}
): boolean => {
  const params1 = extractOrbitPlaneParams(tle1);
  const params2 = extractOrbitPlaneParams(tle2);

  if (!params1 || !params2) {
    return false;
  }

  const inclinationTolerance = tolerance.inclination ?? 0.1;  // 默认 0.1 度
  const raanTolerance = tolerance.raan ?? 1.0;                 // 默认 1 度
  const eccentricityTolerance = tolerance.eccentricity ?? 0.001; // 默认 0.001

  const inclinationDiff = Math.abs(params1.inclination - params2.inclination);
  const raanDiff = Math.abs(params1.raan - params2.raan);
  const eccentricityDiff = Math.abs(params1.eccentricity - params2.eccentricity);

  return (
    inclinationDiff <= inclinationTolerance &&
    raanDiff <= raanTolerance &&
    eccentricityDiff <= eccentricityTolerance
  );
};

/**
 * 将卫星按轨道面分组
 */
export const groupSatellitesByOrbitPlane = (tles: TLEData[]): Map<string, TLEData[]> => {
  const groups = new Map<string, TLEData[]>();

  for (const tle of tles) {
    const params = extractOrbitPlaneParams(tle);
    if (!params) {
      continue;
    }

    const planeId = getOrbitPlaneId(params);

    if (!groups.has(planeId)) {
      groups.set(planeId, []);
    }

    groups.get(planeId)!.push(tle);
  }

  return groups;
};
