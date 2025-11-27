import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { determineUploadIntent, fetchSatelliteGroups, isSatelliteGroupExists, updateSatelliteGroup } from '../../src/services/satelliteService';
import type { TLEData } from '../../src/types';

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
} as any;

// Mock fetch
global.fetch = jest.fn();

describe('satelliteService', () => {
  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks();
  });

  describe('determineUploadIntent', () => {
    it('should return "add" when all satellites are new', () => {
      const existingTles: TLEData[] = [
        { name: 'SAT-01', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      const newTles: TLEData[] = [
        { name: 'SAT-02', line1: '1 67890U ...', line2: '2 67890 ...', satId: '67890' }
      ];

      const result = determineUploadIntent(newTles, existingTles);
      expect(result).toBe('add');
    });

    it('should return "update" when all satellites already exist', () => {
      const existingTles: TLEData[] = [
        { name: 'SAT-01', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      const newTles: TLEData[] = [
        { name: 'SAT-01-UPDATED', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      const result = determineUploadIntent(newTles, existingTles);
      expect(result).toBe('update');
    });

    it('should return "mixed" when some satellites are new and some already exist', () => {
      const existingTles: TLEData[] = [
        { name: 'SAT-01', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      const newTles: TLEData[] = [
        { name: 'SAT-01-UPDATED', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' },
        { name: 'SAT-02', line1: '1 67890U ...', line2: '2 67890 ...', satId: '67890' }
      ];

      const result = determineUploadIntent(newTles, existingTles);
      expect(result).toBe('mixed');
    });

    it('should return "add" when no existing satellites', () => {
      const existingTles: TLEData[] = [];
      const newTles: TLEData[] = [
        { name: 'SAT-01', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      const result = determineUploadIntent(newTles, existingTles);
      expect(result).toBe('add');
    });
  });

  describe('isSatelliteGroupExists', () => {
    it('should return true for allowed group IDs', async () => {
      const result1 = await isSatelliteGroupExists('qianfan');
      const result2 = await isSatelliteGroupExists('stations');
      const result3 = await isSatelliteGroupExists('starlink');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
    });

    it('should return false for disallowed group IDs', async () => {
      const result = await isSatelliteGroupExists('custom-group');
      expect(result).toBe(false);
    });
  });

  describe('updateSatelliteGroup', () => {
    it('should throw error for disallowed group IDs', async () => {
      const tles: TLEData[] = [
        { name: 'SAT-01', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
      ];

      await expect(updateSatelliteGroup({ groupId: 'custom-group', tles })).rejects.toThrow('只允许更新默认的卫星组，不允许创建新组');
    });

    it('should update satellite group with merge mode', async () => {
      // Mock fetchSatelliteGroups to return a mock group
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('')
      });

      // Mock localStorage.getItem to return a mock group
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify([
        { id: 'qianfan', name: '千帆卫星', tles: [] }
      ]));

      const tles: TLEData[] = [
        { name: 'QIANFAN-01', line1: '1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995', line2: '2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193', satId: '58765' }
      ];

      const result = await updateSatelliteGroup({ groupId: 'qianfan', tles, merge: true });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('qianfan');
      expect(result[0].tles).toHaveLength(1);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should update satellite group with replace mode', async () => {
      // Mock fetchSatelliteGroups to return a mock group
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('')
      });

      // Mock localStorage.getItem to return a mock group with existing TLEs
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify([
        {
          id: 'qianfan', name: '千帆卫星', tles: [
            { name: 'QIANFAN-OLD', line1: '1 12345U ...', line2: '2 12345 ...', satId: '12345' }
          ]
        }
      ]));

      const tles: TLEData[] = [
        { name: 'QIANFAN-NEW', line1: '1 58765U 23123A   25320.51167824  .00010000  00000-0  21825-3 0  9995', line2: '2 58765  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193', satId: '58765' }
      ];

      const result = await updateSatelliteGroup({ groupId: 'qianfan', tles, merge: false });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('qianfan');
      expect(result[0].tles).toHaveLength(1);
      expect(result[0].tles[0].name).toBe('QIANFAN-NEW');
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('fetchSatelliteGroups', () => {
    it('should return satellite groups from localStorage when available', async () => {
      // Mock localStorage.getItem to return a mock group
      const mockGroups = [
        { id: 'qianfan', name: '千帆卫星', tles: [] },
        { id: 'stations', name: '空间站', tles: [] },
        { id: 'starlink', name: 'Starlink', tles: [] }
      ];
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockGroups));
      
      const result = await fetchSatelliteGroups();
      
      // 验证返回的卫星组数量和ID是否正确
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('qianfan');
      expect(result[1].id).toBe('stations');
      expect(result[2].id).toBe('starlink');
      
      // 验证卫星组名称是否被更新为最新的中文名称
      expect(result[0].name).toBe('千帆卫星（G60）');
      expect(result[1].name).toBe('空间站');
      expect(result[2].name).toBe('Starlink');
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch satellite groups from API when localStorage is empty', async () => {
      // Mock localStorage.getItem to return null
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      // Mock fetch to return empty responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('')
      });

      const result = await fetchSatelliteGroups();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
