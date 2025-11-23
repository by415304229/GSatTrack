import { useState, useEffect } from 'react';
import { fetchSatelliteGroups } from '../services/satelliteService';

interface TLE {
  name: string;
  satId: string;
  line1: string;
  line2: string;
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
  importSatelliteGroup: (file: File, content: string, parsedSatellites: any[]) => void;
  refreshGroups: () => Promise<void>;
}

const useSatelliteManager = (): SatelliteManagerResult => {
  const [groups, setGroups] = useState<OrbitalPlaneGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [selectedSatellites, setSelectedSatellites] = useState<Set<string>>(new Set());

  // 加载卫星组数据
  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchSatelliteGroups();
      setGroups(data);
      if (data.length > 0 && activeGroups.length === 0) {
        setActiveGroups([data[0].id]);
      }
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

  // 导入卫星组
  const importSatelliteGroup = (file: File, content: string, parsedSatellites: any[]) => {
    if (!parsedSatellites || parsedSatellites.length === 0) {
      return;
    }

    const groupName = file.name.replace('.txt', '').replace('.tle', '');
    const newGroupId = `imported-${Date.now()}`;

    const newGroup: OrbitalPlaneGroup = {
      id: newGroupId,
      name: groupName || '导入卫星组',
      description: `导入的卫星组 - ${groupName || '未命名组'}`,
      tles: parsedSatellites.map(sat => ({
        name: sat.name,
        satId: sat.satId,
        line1: sat.line1,
        line2: sat.line2
      }))
    };

    setGroups(prev => [...prev, newGroup]);
    setActiveGroups([newGroupId]);
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
    importSatelliteGroup,
    refreshGroups
  };
};

export default useSatelliteManager;