import { TLEData, OrbitalPlaneGroup } from '../types';

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
  }
  return tles;
};

export const fetchSatelliteGroups = async (): Promise<OrbitalPlaneGroup[]> => {
  const groups: OrbitalPlaneGroup[] = [];

  // Primary Source: Active Satellites containing Qianfan
  // URL provided by user for active group
  const sources = [
    { 
      id: 'qianfan', 
      name: 'Qianfan (G60)', 
      description: 'Thousand Sails Constellation', 
      url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle'
    }
  ];

  try {
    for (const source of sources) {
        const response = await fetch(source.url);
        if (!response.ok) throw new Error(`Failed to fetch ${source.name}`);
        const text = await response.text();
        let tles = parseTLE(text);
        
        // Filter specifically for Qianfan satellites
        if (source.id === 'qianfan') {
            tles = tles.filter(tle => 
                tle.name.toUpperCase().includes('QIANFAN') || 
                tle.name.toUpperCase().includes('THOUSAND SAILS')
            );
        }
        
        // Fallback mock data if fetch returns empty (e.g. if constellation name changes or strictly filtering yields 0)
        if (tles.length === 0) {
            console.warn('No Qianfan satellites found in active list, using mock simulation data');
             // Create some dummy TLEs orbiting in a train for demo purposes
             const baseId = 90000;
             for(let i=0; i<50; i++) {
                 tles.push({
                     name: `QIANFAN-${i+1} (SIM)`,
                     satId: (baseId + i).toString(),
                     // Mock TLE for a polar orbit typical of this constellation
                     line1: `1 ${baseId+i}U 24001A   24200.00000000  .00000000  00000-0  00000-0 0  9991`,
                     line2: `2 ${baseId+i}  89.0000 120.0000 0010000   0.0000 ${((i*7.2)%360).toFixed(4)} 15.00000000    11`
                 })
             }
        }

        groups.push({
            id: source.id,
            name: source.name,
            description: source.description,
            tles: tles
        });
    }
  } catch (err) {
    console.error("Error fetching satellite data:", err);
    // Fallback if offline/error
    groups.push({
        id: 'qianfan',
        name: 'Qianfan (G60) [OFFLINE]',
        description: 'Thousand Sails Constellation',
        tles: [
            {
                name: "QIANFAN-DEMO-1",
                line1: "1 57000U 23001A   24001.00000000  .00000000  00000-0  00000-0 0  9999",
                line2: "2 57000  89.0000 150.0000 0010000  10.0000  20.0000 15.00000000    11",
                satId: "57000"
            },
             {
                name: "QIANFAN-DEMO-2",
                line1: "1 57001U 23001A   24001.00000000  .00000000  00000-0  00000-0 0  9999",
                line2: "2 57001  89.0000 160.0000 0010000  10.0000  20.0000 15.00000000    11",
                satId: "57001"
            }
        ]
    });
  }

  return groups;
};