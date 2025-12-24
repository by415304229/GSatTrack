
import { type OrbitalPlaneGroup, type SatelliteGroup, type TLEData } from '../types';

// 使用从types.ts导入的TLEData类型，并确保updatedAt字段存在
export type SatelliteTLE = TLEData & { updatedAt?: Date };

// 卫星组更新接口
export interface SatelliteGroupUpdate {
  groupId: string;
  tles: SatelliteTLE[];
  merge?: boolean; // 是否合并（默认为true，false表示完全替换）
}



// 从TLE行中提取卫星ID
const extractSatId = (line1: string): string => {
  // TLE格式中，卫星ID（NORAD ID）是第2-6个字符
  return line1.substring(2, 7).trim();
};

// 解析3行格式的TLE数据（名称 + 行1 + 行2）
const parseThreeLineTLE = (lines: string[]): TLEData[] => {
  const tles: TLEData[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      tles.push({
        name: lines[i],
        line1: lines[i + 1],
        line2: lines[i + 2],
        satId: extractSatId(lines[i + 1]),
        updatedAt: new Date()
      });
    }
  }

  return tles;
};

// 解析2行格式的TLE数据（行1 + 行2）
const parseTwoLineTLE = (lines: string[]): TLEData[] => {
  const tles: TLEData[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('1 ') && lines[i + 1]?.startsWith('2 ')) {
      // 向前查找名称
      const name = (i > 0 && !lines[i - 1].startsWith('2 ') && !lines[i - 1].startsWith('1 '))
        ? lines[i - 1]
        : 'UNKNOWN SAT';

      tles.push({
        name: name,
        line1: lines[i],
        line2: lines[i + 1],
        satId: extractSatId(lines[i]),
        updatedAt: new Date()
      });

      i++; // 跳过下一行，因为它已经被处理
    }
  }

  return tles;
};

// 主TLE解析函数
const parseTLE = (data: string): TLEData[] => {
  const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 首先尝试解析3行格式
  let tles = parseThreeLineTLE(lines);

  // 如果没有找到3行格式的TLE，尝试解析2行格式
  if (tles.length === 0 && data.includes('1 ') && data.includes('2 ')) {
    tles = parseTwoLineTLE(lines);
  }

  return tles;
};

export const fetchSatelliteGroups = async (): Promise<OrbitalPlaneGroup[]> => {
  // 首先检查localStorage中是否有更新后的卫星组数据
  const localStorageGroups = localStorage.getItem('satelliteGroups');
  if (localStorageGroups) {
    try {
      const groups = JSON.parse(localStorageGroups);
      // 只返回千帆卫星分组
      return groups.filter((group: OrbitalPlaneGroup) => group.id === 'qianfan');
    } catch (error) {
      console.error('Failed to parse satellite groups from localStorage:', error);
    }
  }

  const sources = [
    {
      id: 'qianfan',
      name: '千帆卫星（G60）',
      description: 'Thousand Sails Constellation',
      url: '/data/QIANFAN.txt',
      source: 'local_file'
    }
  ];

  const adjustedSources = sources.map(source => ({
    ...source,
    // In Vite, files in public folder are served from root, no need for '/public' prefix
    url: source.url
  }));

  try {
    // 使用 Promise.all 并行处理所有请求
    const groupPromises = adjustedSources.map(async (source) => {
      let tles: TLEData[] = [];

      try {
        // Attempt fetch
        const response = await fetch(source.url);
        if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
        const text = await response.text();
        tles = parseTLE(text);
      } catch (error) {
        console.error(`Failed to fetch ${source.name}:`, error);
        // 使用空数据继续
      }

      // Post-processing filters for qianfan group
      if (source.id === 'qianfan') {
        tles = tles.filter(tle =>
          tle.name.toUpperCase().includes('QIANFAN') ||
          tle.name.toUpperCase().includes('THOUSAND SAILS')
        );
      }

      return {
        id: source.id,
        name: source.name,
        description: source.description,
        tles: tles,
        source: source.source || 'remote'
      };
    });

    // 并行执行所有请求并等待结果
    const groups = await Promise.all(groupPromises);
    return groups;
  } catch (error) {
    console.error('Error fetching satellite groups:', error);
    return [];
  }
};

// 导入工具函数
import { compareTLETimeStamps } from '../utils/tleTimeUtils';

// 确定上传意图
export const determineUploadIntent = (tleData: TLEData[], existingTles: TLEData[]): 'add' | 'update' | 'mixed' => {
  if (tleData.length === 0) {
    return 'add';
  }

  const existingNoradIds = new Set(existingTles.map(tle => tle.satId));
  const newNoradIds = new Set(tleData.map(tle => tle.satId));

  // 检查是否所有新卫星的NoradID都已存在
  const allExisting = Array.from(newNoradIds).every(id => existingNoradIds.has(id));

  // 检查是否所有新卫星的NoradID都不存在
  const allNew = Array.from(newNoradIds).every(id => !existingNoradIds.has(id));

  if (allExisting) {
    return 'update';
  } else if (allNew) {
    return 'add';
  } else {
    return 'mixed';
  }
};

// 更新卫星组数据的函数
export const updateSatelliteGroup = async (update: SatelliteGroupUpdate): Promise<SatelliteGroup[]> => {
  const { groupId, tles, merge = true } = update;

  // 获取当前所有卫星组
  let groups = await fetchSatelliteGroups();

  // 只允许更新千帆卫星组
  const allowedGroupIds = ['qianfan'];
  if (!allowedGroupIds.includes(groupId)) {
    throw new Error(`只允许更新默认的卫星组，不允许创建新组`);
  }

  // 查找目标组
  const targetGroupIndex = groups.findIndex(g => g.id === groupId);

  if (targetGroupIndex !== -1) {
    if (merge) {
      // 合并模式：保留原有数据，更新匹配的卫星，添加新卫星
      const existingTles = groups[targetGroupIndex].tles || [];
      const updatedTlesMap = new Map(existingTles.map(tle => [tle.satId, tle]));

      // 确定上传意图
      const uploadIntent = determineUploadIntent(tles, existingTles);
      console.log(`Upload intent for group ${groupId}: ${uploadIntent}`);

      // 更新或添加新的TLE数据
      tles.forEach(tle => {
        const existingTle = updatedTlesMap.get(tle.satId);

        if (existingTle) {
          // 卫星已存在，根据时间戳决定是否更新
          const timeCompareResult = compareTLETimeStamps(tle.line1, existingTle.line1);

          if (timeCompareResult > 0) {
            // 新TLE的时间戳更新，执行更新
            console.log(`Updating satellite ${tle.satId}: ${tle.name}`);
            updatedTlesMap.set(tle.satId, {
              ...tle,
              updatedAt: new Date()
            });
          } else {
            console.log(`Skipping satellite ${tle.satId}: existing TLE is newer`);
          }
        } else {
          // 卫星不存在，执行添加
          console.log(`Adding new satellite ${tle.satId}: ${tle.name}`);
          updatedTlesMap.set(tle.satId, {
            ...tle,
            updatedAt: new Date()
          });
        }
      });

      // 更新组数据
      groups[targetGroupIndex] = {
        ...groups[targetGroupIndex],
        tles: Array.from(updatedTlesMap.values()),
        source: groups[targetGroupIndex].source || 'file'
      };
    } else {
      // 替换模式：完全替换组内的TLE数据
      console.log(`Replacing all satellites in group ${groupId}`);
      groups[targetGroupIndex] = {
        ...groups[targetGroupIndex],
        tles: tles.map(tle => ({
          ...tle,
          updatedAt: new Date()
        })),
        source: 'file'
      };
    }
  }

  // 将更新后的卫星组数据保存到localStorage
  localStorage.setItem('satelliteGroups', JSON.stringify(groups));

  return groups;
};

// 检查卫星组是否存在
export const isSatelliteGroupExists = async (groupId: string): Promise<boolean> => {
  const allowedGroupIds = ['qianfan'];
  return allowedGroupIds.includes(groupId);
};
