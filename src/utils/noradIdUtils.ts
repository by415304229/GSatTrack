// NoradID提取与验证工具函数

// 从TLE第一行提取NoradID
export const extractNoradIdFromTLE = (tleLine1: string): string | null => {
  if (!tleLine1 || !tleLine1.startsWith('1 ')) {
    return null;
  }

  try {
    // TLE第一行格式：1 NNNNNC SSSSS YYYY.MMDDDDDD +.EEEEEEEE +EEEEEEEE 0 00000-0 00000-0 0 PPPPP
    // NoradID位于第2个字段，格式为5位数字
    const fields = tleLine1.split(/\s+/).filter(field => field.length > 0);
    if (fields.length < 2) {
      return null;
    }

    // 第2个字段是卫星编号，格式为NNNNNC，其中NNNNN是NoradID，C是分类码
    const satNumberField = fields[1];
    // 提取前5位数字作为NoradID
    const noradId = satNumberField.substring(0, 5);

    // 验证是否为数字
    if (/^\d{5}$/.test(noradId)) {
      return noradId;
    }

    return null;
  } catch (error) {
    console.error('Failed to extract NoradID from TLE:', error);
    return null;
  }
};

// 验证NoradID格式
export const validateNoradId = (noradId: string): boolean => {
  // NoradID必须是5位数字
  return /^\d{5}$/.test(noradId);
};

// 比较两个NoradID是否相同
export const compareNoradIds = (id1: string, id2: string): boolean => {
  // 去除可能的前导零并比较数值
  const num1 = parseInt(id1, 10);
  const num2 = parseInt(id2, 10);
  return !isNaN(num1) && !isNaN(num2) && num1 === num2;
};

// 格式化NoradID，确保是5位数字
export const formatNoradId = (noradId: string): string => {
  const num = parseInt(noradId, 10);
  if (isNaN(num)) {
    return '00000';
  }
  // 转换为5位数字，前导补零
  return num.toString().padStart(5, '0');
};

// 从TLE数据中提取所有NoradID
export const extractNoradIdsFromTLEs = (tles: Array<{ line1: string }>): string[] => {
  const noradIds: string[] = [];

  tles.forEach(tle => {
    const noradId = extractNoradIdFromTLE(tle.line1);
    if (noradId) {
      noradIds.push(noradId);
    }
  });

  return noradIds;
};
