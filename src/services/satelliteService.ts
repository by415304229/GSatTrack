
import { type OrbitalPlaneGroup, type SatelliteGroup, type TLEData } from '../types';

// 使用从types.ts导入的TLEData类型，并确保updatedAt字段存在
export type SatelliteTLE = TLEData & { updatedAt?: Date };

// 卫星组更新接口
export interface SatelliteGroupUpdate {
  groupId: string;
  tles: SatelliteTLE[];
  merge?: boolean; // 是否合并（默认为true，false表示完全替换）
}

const CACHE_KEY = 'orbital_ops_tle_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

interface CacheEntry {
  timestamp: number;
  data: OrbitalPlaneGroup[];
}

const parseTLE = (data: string): TLEData[] => {
  const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const tles: TLEData[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      tles.push({
        name: lines[i],
        line1: lines[i + 1],
        line2: lines[i + 2],
        satId: lines[i + 1].split(' ')[1].replace('U', ''),
        updatedAt: new Date()
      });
    }
    else if (lines.length >= 2 && lines[0].startsWith('1 ') && lines[1].startsWith('2 ')) {
      // Handle direct 2-line blocks if strictly formatted (less common in bulk files which have 3 lines)
    }
  }

  // Special parser for the static array or raw 2-line blocks
  if (tles.length === 0 && data.includes('1 ') && data.includes('2 ')) {
    const rawLines = data.split('\n').filter(l => l.trim().length > 0);
    for (let i = 0; i < rawLines.length; i++) {
      if (rawLines[i].startsWith('1 ') && rawLines[i + 1]?.startsWith('2 ')) {
        // Look backwards for name
        const name = (i > 0 && !rawLines[i - 1].startsWith('2 ') && !rawLines[i - 1].startsWith('1 ')) ? rawLines[i - 1] : 'UNKNOWN SAT';
        tles.push({
          name: name,
          line1: rawLines[i],
          line2: rawLines[i + 1],
          satId: rawLines[i].split(' ')[1].replace('U', ''),
          updatedAt: new Date()
        });
        i++;
      }
    }
  }

  return tles;
};

export const fetchSatelliteGroups = async (): Promise<OrbitalPlaneGroup[]> => {
  // 1. Check Local Cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.data;
      }
    }
  } catch {
    // 忽略缓存读取错误
  }

  const groups: OrbitalPlaneGroup[] = [];
  const sources = [
    {
      id: 'qianfan',
      name: 'Qianfan (G60)',
      description: 'Thousand Sails Constellation',
      url: '/data/QIANFAN.txt', // Using local TLE file
      source: 'local_file'
    },
    {
      id: 'stations',
      name: 'Space Stations',
      description: 'ISS & Tiangong',
      url: '/data/Stations.txt', // Using local TLE file
      source: 'local_file'
    },
    {
      id: 'starlink',
      name: 'Starlink',
      description: 'SpaceX Starlink',
      url: '/data/StarLink.txt', // Using local TLE file
      source: 'local_file'
    }];

  const adjustedSources = sources.map(source => ({
    ...source,
    // In Vite, files in public folder are served from root, no need for '/public' prefix
    url: source.url
  }));

  try {
    for (const source of adjustedSources) {
      let text = '';
      let tles: TLEData[] = [];

      try {
        // Attempt fetch
        const response = await fetch(source.url);
        if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
        text = await response.text();
        tles = parseTLE(text);
      } catch {
        // 使用离线数据
      }

      // Post-processing filters for specific groups (especially to limit Starlink count)
      if (source.id === 'qianfan') {
        tles = tles.filter(tle =>
          tle.name.toUpperCase().includes('QIANFAN') ||
          tle.name.toUpperCase().includes('THOUSAND SAILS')
        );
      } else if (source.id === 'starlink') {
        // Limit Starlink to prevent performance death
        tles = tles.filter((_, i) => i % 50 === 0).slice(0, 100);
      }

      if (tles.length > 0) {
        groups.push({
          id: source.id,
          name: source.name,
          description: source.description,
          tles: tles,
          source: source.source || 'remote'
        });
      }
    }

    // Save to cache if we have valid data
    if (groups.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: groups
        } as CacheEntry));
      } catch {
        // 忽略缓存写入错误
      }
    }

  } catch {
    // 忽略关键错误
  }


  return groups;
};

// 更新卫星组数据的函数
export const updateSatelliteGroup = async (update: SatelliteGroupUpdate): Promise<SatelliteGroup[]> => {
  const { groupId, tles, merge = true } = update;

  // 获取当前所有卫星组
  let groups = await fetchSatelliteGroups();

  // 查找目标组
  const targetGroupIndex = groups.findIndex(g => g.id === groupId);

  if (targetGroupIndex !== -1) {
    if (merge) {
      // 合并模式：保留原有数据，更新匹配的卫星，添加新卫星
      const existingTles = groups[targetGroupIndex].tles || [];
      const updatedTlesMap = new Map(existingTles.map(tle => [tle.satId, tle]));

      // 更新或添加新的TLE数据
      tles.forEach(tle => {
        updatedTlesMap.set(tle.satId, {
          ...tle,
          updatedAt: new Date()
        });
      });

      // 更新组数据
      groups[targetGroupIndex] = {
        ...groups[targetGroupIndex],
        tles: Array.from(updatedTlesMap.values()),
        source: groups[targetGroupIndex].source || 'file'
      };
    } else {
      // 替换模式：完全替换组内的TLE数据
      groups[targetGroupIndex] = {
        ...groups[targetGroupIndex],
        tles: tles.map(tle => ({
          ...tle,
          updatedAt: new Date()
        })),
        source: 'file'
      };
    }
  } else {
    // 如果组不存在，则创建新组
    groups.push({
      id: groupId,
      name: `自定义组-${groupId}`,
      description: `自定义组-${groupId} description`,
      tles: tles.map(tle => ({
        ...tle,
        updatedAt: new Date()
      })),
      source: 'file'
    });
  }

  // 更新本地缓存
  try {
    localStorage.setItem('satelliteGroups', JSON.stringify(groups));
  } catch {
    // 忽略缓存更新错误
  }

  return groups;
};

// 创建新的卫星组
export const createSatelliteGroup = async (name: string, tles: SatelliteTLE[]): Promise<SatelliteGroup> => {
  const groupId = `custom-${Date.now()}`;
  const newGroup: SatelliteGroup = {
    id: groupId,
    name,
    description: 'Custom satellite group',
    tles: tles.map(tle => ({
      ...tle,
      updatedAt: new Date()
    })),
    source: 'file'
  };

  // 获取当前所有卫星组并添加新组
  let groups = await fetchSatelliteGroups();
  groups.push(newGroup);

  // 更新本地缓存
  try {
    localStorage.setItem('satelliteGroups', JSON.stringify(groups));
  } catch {
    // 忽略缓存新卫星组错误
  }

  return newGroup;
};

// 检查卫星组是否存在
export const isSatelliteGroupExists = async (groupId: string): Promise<boolean> => {
  const groups = await fetchSatelliteGroups();
  return groups.some(g => g.id === groupId);
};
