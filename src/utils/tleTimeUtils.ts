// TLE时间戳处理工具函数

// 从TLE第一行提取历元时间
export const extractTLEEpoch = (tleLine1: string): Date => {
  if (!tleLine1 || !tleLine1.startsWith('1 ')) {
    return new Date();
  }

  try {
    // TLE第一行格式：1 NNNNNC SSSSS YYYY.MMDDDDDD +.EEEEEEEE +EEEEEEEE 0 00000-0 00000-0 0 PPPPP
    // 历元时间位于第4个字段，格式为YYYY.MMDDDDDD
    const fields = tleLine1.split(/\s+/).filter(field => field.length > 0);
    if (fields.length < 4) {
      return new Date();
    }

    const epochStr = fields[3];

    // 解析年份和年积日
    const yearPart = epochStr.substring(0, 2);
    const dayPart = epochStr.substring(3);

    // 转换为完整年份（两位数年份：00-50 -> 2000-2050，51-99 -> 1951-1999）
    const year = parseInt(yearPart, 10);
    const fullYear = year < 50 ? 2000 + year : 1900 + year;

    // 转换为年积日（包括小数部分）
    const dayOfYear = parseFloat(dayPart);

    // 创建日期对象
    const date = new Date(fullYear, 0, 0); // 从1月1日开始
    const timeInMs = date.getTime() + dayOfYear * 24 * 60 * 60 * 1000;

    return new Date(timeInMs);
  } catch (error) {
    console.error('Failed to extract TLE epoch:', error);
    return new Date();
  }
};

// 比较两个TLE的时间戳
// 返回值：
// -1: tle1的时间戳早于tle2
//  0: 两个时间戳相同
//  1: tle1的时间戳晚于tle2
export const compareTLETimeStamps = (tleLine1: string, tleLine2: string): number => {
  const date1 = extractTLEEpoch(tleLine1);
  const date2 = extractTLEEpoch(tleLine2);

  if (date1 < date2) {
    return -1;
  } else if (date1 > date2) {
    return 1;
  } else {
    return 0;
  }
};

// 格式化TLE历元时间为可读格式
export const formatTLEEpoch = (tleLine1: string): string => {
  const date = extractTLEEpoch(tleLine1);
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

// 计算两个TLE时间戳之间的天数差
export const getTLEDaysDifference = (tleLine1: string, tleLine2: string): number => {
  const date1 = extractTLEEpoch(tleLine1);
  const date2 = extractTLEEpoch(tleLine2);

  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  return diffMs / (1000 * 60 * 60 * 24);
};
