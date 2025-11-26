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
  activeGroups: string[];
  selectedSatellites: Set<string>;
  loading: boolean;
  setActiveGroups: (groups: string[]) => void;
  toggleSatellite: (satId: string) => void;
  onSatellitePropertyChange: (satId: string, property: string, value: any) => void;
  refreshGroups: () => Promise<void>;
}

const useSatelliteManager = (): SatelliteManagerResult => {
  const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());
  const displayNameCache = useRef<Map<string, string>>(new Map());

  // 加载卫星组数据
  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchSatelliteGroups();

      // 为每个卫星获取显示名称
      const groupsWithDisplayNames = await Promise.all(
        data.map(async (group) => {
          const tlesWithDisplayNames = await Promise.all(
            group.tles.map(async (tle) => {
              // 检查缓存
              if (displayNameCache.current.has(tle.satId)) {
                return {
                  ...tle,
                  displayName: displayNameCache.current.get(tle.satId)
                };
              }

              // 获取显示名称
              const displayName = await getSatelliteDisplayName(tle.satId, tle.name);

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

      if (groupsWithDisplayNames.length > 0 && activeGroups.length === 0) {
        setActiveGroups([groupsWithDisplayNames[0].id]);
      }

      // 初始化选中所有卫星
      const allSatIds = new Set<string>();
      groupsWithDisplayNames.forEach(group => {
        group.tles.forEach(tle => {
          allSatIds.add(tle.satId);
        });
      });
      setSelectedSatellites(allSatIds);
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
    activeGroups,
    selectedSatellites,
    loading,
    setActiveGroups,
    toggleSatellite,
    onSatellitePropertyChange,
    refreshGroups
  };
};

export default useSatelliteManager;
