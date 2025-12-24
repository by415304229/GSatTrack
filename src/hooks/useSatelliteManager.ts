import { useEffect, useRef, useState } from 'react';
import { getSatelliteDisplayName, updateMapping } from '../services/NamingMappingService';
import { fetchSatelliteGroups } from '../services/satelliteService';

interface TLE {
  name: string;
  satId: string;
  line1: string;
  line2: string;
  displayName?: string;
}

interface OrbitalPlaneGroup {
  id: string;
  name: string;
  description?: string;
  tles: TLE[];
}

interface SatelliteManagerResult {
  groups: OrbitalPlaneGroup[];
  selectedSatellites: Set<string>;
  loading: boolean;
  toggleSatellite: (satId: string) => void;
  onSatellitePropertyChange: (satId: string, property: string, value: any) => void;
  refreshGroups: () => Promise<void>;
}

const useSatelliteManager = (): SatelliteManagerResult => {
  const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());
  const displayNameCache = useRef<Map<string, string>>(new Map());

  // 加载卫星组数据
  const loadGroups = async () => {
    setLoading(true);
    try {
      // 1. 先获取API卫星数据和映射关系
      const { default: satelliteMappingService } = await import('../services/satelliteMappingService');
      const apiSatellites = await satelliteMappingService.fetchAndMapSatellites();
      const mappedNoradIds = new Set(satelliteMappingService.getMappedNoradIds());

      console.log('[useSatelliteManager] API返回卫星数量:', mappedNoradIds.size);

      // 2. 获取本地卫星组数据
      const data = await fetchSatelliteGroups();

      // 3. 过滤卫星：只保留API中存在的卫星
      const filteredGroups = data.map(group => ({
        ...group,
        tles: group.tles.filter(tle => mappedNoradIds.has(tle.satId))
      })).filter(group => group.tles.length > 0); // 过滤掉空组

      console.log('[useSatelliteManager] 过滤后卫星组数量:', filteredGroups.length);

      // 4. 为每个卫星设置显示名称（使用API的sateliteName）
      const groupsWithDisplayNames = await Promise.all(
        filteredGroups.map(async (group) => {
          const tlesWithDisplayNames = await Promise.all(
            group.tles.map(async (tle) => {
              // 从API数据获取显示名称
              const apiSat = satelliteMappingService.findByNoradId(tle.satId);
              const displayName = apiSat?.sateliteName || tle.name;

              // 更新缓存
              displayNameCache.current.set(tle.satId, displayName);

              return {
                ...tle,
                displayName
              };
            })
          );

          return {
            ...group,
            tles: tlesWithDisplayNames
          };
        })
      );

      setGroups(groupsWithDisplayNames);

      // 初始化选中所有卫星
      const allSatIds = new Set<string>();
      groupsWithDisplayNames.forEach(group => {
        group.tles.forEach(tle => {
          allSatIds.add(tle.satId);
        });
      });
      setSelectedSatellites(allSatIds);

      console.log('[useSatelliteManager] 卫星加载完成，总数:', allSatIds.size);
    } catch (error) {
      console.error('加载卫星组失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadGroups();
  }, []);

  // 切换卫星选择状态
  const toggleSatellite = (satId: string) => {
    setSelectedSatellites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(satId)) {
        newSet.delete(satId);
      } else {
        newSet.add(satId);
      }
      return newSet;
    });
  };

  // 处理卫星属性变更
  const onSatellitePropertyChange = async (satId: string, property: string, value: any) => {
    if (property === 'displayName') {
      // 更新命名映射
      await updateMapping(satId, value, '');

      // 更新缓存
      displayNameCache.current.set(satId, value);

      // 更新组数据中的显示名称
      setGroups(prev => prev.map(group => ({
        ...group,
        tles: group.tles.map(tle => {
          if (tle.satId === satId) {
            return {
              ...tle,
              displayName: value
            };
          }
          return tle;
        })
      })));
    }
  };



  // 刷新卫星组
  const refreshGroups = async () => {
    await loadGroups();
  };

  return {
    groups,
    selectedSatellites,
    loading,
    toggleSatellite,
    onSatellitePropertyChange,
    refreshGroups
  };
};

export default useSatelliteManager;
