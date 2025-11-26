// 卫星命名映射服务

// 映射关系接口
export interface SatelliteNamingMapping {
  noradId: string;
  tleName: string;
  displayName: string;
  satelliteType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 本地存储键名
const STORAGE_KEY = 'satellite_naming_mappings';

// 获取所有映射关系
export const getAllMappings = async (): Promise<SatelliteNamingMapping[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const mappings = JSON.parse(stored);
      // 转换日期字符串为Date对象
      return mappings.map((mapping: any) => ({
        ...mapping,
        createdAt: mapping.createdAt ? new Date(mapping.createdAt) : undefined,
        updatedAt: mapping.updatedAt ? new Date(mapping.updatedAt) : undefined
      }));
    }
  } catch (error) {
    console.error('Failed to get mappings from localStorage:', error);
  }
  return [];
};

// 获取卫星显示名称
export const getSatelliteDisplayName = async (noradId: string, tleName: string): Promise<string> => {
  try {
    const mappings = await getAllMappings();
    const mapping = mappings.find(m => m.noradId === noradId);
    return mapping?.displayName || tleName;
  } catch (error) {
    console.error('Failed to get display name:', error);
    return tleName;
  }
};

// 更新单个映射关系
export const updateMapping = async (noradId: string, displayName: string, tleName: string = ''): Promise<void> => {
  try {
    const mappings = await getAllMappings();
    const existingIndex = mappings.findIndex(m => m.noradId === noradId);
    const now = new Date();

    if (existingIndex >= 0) {
      // 更新现有映射
      mappings[existingIndex] = {
        ...mappings[existingIndex],
        displayName,
        updatedAt: now,
        tleName: tleName || mappings[existingIndex].tleName
      };
    } else {
      // 创建新映射
      mappings.push({
        noradId,
        tleName,
        displayName,
        satelliteType: 'QIANFAN',
        createdAt: now,
        updatedAt: now
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to update mapping:', error);
    throw error;
  }
};

// 批量更新映射关系
export const batchUpdateMappings = async (mappings: Array<{ noradId: string; displayName: string; tleName?: string }>): Promise<void> => {
  try {
    const existingMappings = await getAllMappings();
    const updatedMappings = [...existingMappings];
    const now = new Date();

    mappings.forEach(newMapping => {
      const existingIndex = updatedMappings.findIndex(m => m.noradId === newMapping.noradId);

      if (existingIndex >= 0) {
        // 更新现有映射
        updatedMappings[existingIndex] = {
          ...updatedMappings[existingIndex],
          displayName: newMapping.displayName,
          updatedAt: now,
          tleName: newMapping.tleName || updatedMappings[existingIndex].tleName
        };
      } else {
        // 创建新映射
        updatedMappings.push({
          noradId: newMapping.noradId,
          tleName: newMapping.tleName || '',
          displayName: newMapping.displayName,
          satelliteType: 'QIANFAN',
          createdAt: now,
          updatedAt: now
        });
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMappings));
  } catch (error) {
    console.error('Failed to batch update mappings:', error);
    throw error;
  }
};

// 删除映射关系
export const deleteMapping = async (noradId: string): Promise<void> => {
  try {
    const mappings = await getAllMappings();
    const updatedMappings = mappings.filter(m => m.noradId !== noradId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMappings));
  } catch (error) {
    console.error('Failed to delete mapping:', error);
    throw error;
  }
};

// 导出映射关系
export const exportMappings = async (): Promise<string> => {
  try {
    const mappings = await getAllMappings();
    return JSON.stringify(mappings, null, 2);
  } catch (error) {
    console.error('Failed to export mappings:', error);
    throw error;
  }
};

// 导入映射关系
export const importMappings = async (jsonData: string): Promise<void> => {
  try {
    const importedMappings = JSON.parse(jsonData);
    if (!Array.isArray(importedMappings)) {
      throw new Error('Invalid mappings format');
    }

    // 验证导入的数据格式
    importedMappings.forEach(mapping => {
      if (!mapping.noradId || !mapping.displayName) {
        throw new Error('Invalid mapping entry: missing required fields');
      }
    });

    await batchUpdateMappings(importedMappings);
  } catch (error) {
    console.error('Failed to import mappings:', error);
    throw error;
  }
};

// 清空所有映射关系
export const clearAllMappings = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear mappings:', error);
    throw error;
  }
};
