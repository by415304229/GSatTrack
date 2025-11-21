
import { TLEData, OrbitalPlaneGroup } from '../types';

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
        satId: lines[i + 1].split(' ')[1].replace('U', '')
      });
    }
    else if (lines.length >= 2 && lines[0].startsWith('1 ') && lines[1].startsWith('2 ')) {
         // Handle direct 2-line blocks if strictly formatted (less common in bulk files which have 3 lines)
    }
  }
  
  // Special parser for the static array or raw 2-line blocks
  if (tles.length === 0 && data.includes('1 ') && data.includes('2 ')) {
      const rawLines = data.split('\n').filter(l => l.trim().length > 0);
      for(let i=0; i<rawLines.length; i++) {
          if (rawLines[i].startsWith('1 ') && rawLines[i+1]?.startsWith('2 ')) {
             // Look backwards for name
             const name = (i > 0 && !rawLines[i-1].startsWith('2 ') && !rawLines[i-1].startsWith('1 ')) ? rawLines[i-1] : 'UNKNOWN SAT';
             tles.push({
                 name: name,
                 line1: rawLines[i],
                 line2: rawLines[i+1],
                 satId: rawLines[i].split(' ')[1].replace('U', '')
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
              console.log("Loaded TLEs from cache");
              return entry.data;
          }
      }
  } catch (e) {
      console.warn("Cache read failed", e);
  }

  const groups: OrbitalPlaneGroup[] = [];
  const sources = [
    { 
      id: 'qianfan', 
      name: 'Qianfan (G60)', 
      description: 'Thousand Sails Constellation', 
      url: '/data/QIANFAN.txt' // Using local TLE file
    },
    {
      id: 'stations',
      name: 'Space Stations',
      description: 'ISS & Tiangong',
      url: '/data/Stations.txt' // Using local TLE file
    },
    {
      id: 'starlink',
      name: 'Starlink',
      description: 'SpaceX Starlink',
      url: '/data/StarLink.txt' // Using local TLE file
    }
  ];

  try {
    for (const source of sources) {
        let text = '';
        let tles: TLEData[] = [];
        
        try {
            // Attempt fetch
            const response = await fetch(source.url);
            if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
            text = await response.text();
            tles = parseTLE(text);
        } catch (netErr) {
            console.warn(`Network error for ${source.id}, using offline data.`);
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
                tles: tles
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
        } catch (e) {
            console.warn("Failed to write to cache", e);
        }
    }

  } catch (err) {
    console.error("Critical Error fetching satellite data:", err);
  }
  

  return groups;
};
