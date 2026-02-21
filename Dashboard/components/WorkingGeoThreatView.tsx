import React, { useState, useEffect } from 'react';
import { CountryData, GeoMapData } from '../types';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocketService';

const WorkingGeoThreatView: React.FC = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [geoMap, setGeoMap] = useState<GeoMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeoData = async () => {
    try {
      setError(null);
      console.log('Fetching geo data...');
      const [countriesData, geoMapData] = await Promise.all([
        apiService.getCountries(),
        apiService.getGeoMap()
      ]);
      console.log('Countries data:', countriesData);
      console.log('GeoMap data:', geoMapData);
      setCountries(countriesData);
      setGeoMap(geoMapData);
    } catch (error) {
      console.error('Failed to fetch geo data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch geo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoData();

    // Listen for real-time updates
    const handleStatsUpdate = () => {
      fetchGeoData();
    };

    try {
      websocketService.on('stats_update', handleStatsUpdate);
    } catch (err) {
      console.warn('WebSocket not available for geo updates');
    }
    
    return () => {
      try {
        websocketService.off('stats_update', handleStatsUpdate);
      } catch (err) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const maxCount = Math.max(...countries.map(c => c.count), 1);
  
  const getHeatColor = (intensity: number): string => {
    if (intensity === 0) return '#1e293b';
    if (intensity < 0.3) return '#3b82f6';
    if (intensity < 0.7) return '#f97316';
    return '#ef4444';
  };

  const getCountryIntensity = (countryName: string): number => {
    const country = countries.find(c => 
      c.country.toLowerCase().includes(countryName.toLowerCase()) ||
      countryName.toLowerCase().includes(c.country.toLowerCase())
    );
    return country ? country.count / maxCount : 0;
  };

  // Simple world map representation using CSS and positioning
  const renderSimpleWorldMap = () => {
    return (
      <div className="relative bg-slate-950 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        {/* Background world map pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 1000 500" className="w-full h-full">
            {/* Simplified world continents as basic shapes */}
            <g fill="#374151" stroke="#4b5563" strokeWidth="1">
              {/* North America */}
              <path d="M150 100 L250 80 L280 120 L260 180 L200 200 L150 160 Z" />
              {/* South America */}
              <path d="M200 220 L240 200 L260 280 L240 350 L200 340 L180 280 Z" />
              {/* Europe */}
              <path d="M450 80 L520 70 L540 120 L500 140 L450 120 Z" />
              {/* Africa */}
              <path d="M480 150 L540 140 L560 250 L520 320 L480 300 L460 200 Z" />
              {/* Asia */}
              <path d="M550 60 L750 50 L800 100 L780 180 L720 200 L550 160 Z" />
              {/* Australia */}
              <path d="M700 280 L780 270 L800 310 L760 330 L700 320 Z" />
            </g>
          </svg>
        </div>

        {/* Country heat overlay */}
        <div className="absolute inset-0">
          {countries.map((country, index) => {
            const intensity = country.count / maxCount;
            const color = getHeatColor(intensity);
            
            // Simple positioning based on country name (this is a simplified approach)
            let position = { top: '50%', left: '50%' };
            
            // Basic positioning for common countries
            if (country.country.toLowerCase().includes('united states') || country.country.toLowerCase().includes('usa')) {
              position = { top: '30%', left: '20%' };
            } else if (country.country.toLowerCase().includes('china')) {
              position = { top: '25%', left: '70%' };
            } else if (country.country.toLowerCase().includes('india')) {
              position = { top: '35%', left: '65%' };
            } else if (country.country.toLowerCase().includes('russia')) {
              position = { top: '20%', left: '60%' };
            } else if (country.country.toLowerCase().includes('brazil')) {
              position = { top: '60%', left: '25%' };
            } else if (country.country.toLowerCase().includes('local')) {
              position = { top: '10%', left: '10%' };
            } else {
              // Random positioning for other countries
              position = { 
                top: `${20 + (index * 13) % 60}%`, 
                left: `${20 + (index * 17) % 60}%` 
              };
            }

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={position}
                title={`${country.country}: ${country.count} attacks`}
              >
                <div
                  className="rounded-full border-2 border-white/50 animate-pulse"
                  style={{
                    backgroundColor: color,
                    width: `${Math.max(8, intensity * 30)}px`,
                    height: `${Math.max(8, intensity * 30)}px`,
                  }}
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {country.country}: {country.count}
                </div>
              </div>
            );
          })}
        </div>

        {/* City markers */}
        {geoMap.map((location, index) => {
          // Convert lat/lng to approximate screen position (very simplified)
          const x = ((location.longitude + 180) / 360) * 100;
          const y = ((90 - location.latitude) / 180) * 100;
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ 
                left: `${Math.max(5, Math.min(95, x))}%`, 
                top: `${Math.max(5, Math.min(95, y))}%` 
              }}
              title={`${location.city}, ${location.country}: ${location.count} attacks`}
            >
              <div
                className="rounded-full bg-red-500 border-2 border-white animate-ping"
                style={{
                  width: `${Math.max(6, (location.count / Math.max(...geoMap.map(g => g.count), 1)) * 20)}px`,
                  height: `${Math.max(6, (location.count / Math.max(...geoMap.map(g => g.count), 1)) * 20)}px`,
                }}
              />
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {location.city}, {location.country}: {location.count}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-800/90 rounded-lg p-3">
          <div className="text-xs text-slate-300 mb-2 font-semibold">Attack Intensity</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-400">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-slate-400">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-slate-400">High</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse font-medium">Loading geographic threat intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Geo Data</h3>
          <p className="text-sm text-slate-400">{error}</p>
          <button 
            onClick={fetchGeoData}
            className="mt-4 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Geographic Threat Intelligence</h1>
          <p className="text-slate-400">Global attack patterns and threat distribution analysis.</p>
        </div>
        <button 
          onClick={fetchGeoData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Countries</h3>
              <p className="text-2xl font-bold text-blue-400">{countries.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Unique attacking countries detected</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Cities</h3>
              <p className="text-2xl font-bold text-orange-400">{geoMap.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Attack hotspots identified</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Total Attacks</h3>
              <p className="text-2xl font-bold text-red-400">{countries.reduce((sum, c) => sum + c.count, 0)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Across all geographic locations</p>
        </div>
      </div>

      {/* World Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Global Attack Heatmap</h3>
          <div className="text-xs text-slate-400">
            Hover over markers to see attack details
          </div>
        </div>
        
        {renderSimpleWorldMap()}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacking Countries */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Top Attacking Countries</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {countries.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Country</th>
                    <th className="px-6 py-4">Attacks</th>
                    <th className="px-6 py-4">Intensity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {countries.slice(0, 10).map((country, idx) => {
                    const intensity = country.count / maxCount;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {country.code && (
                              <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                                {country.code}
                              </span>
                            )}
                            <span className="font-medium text-slate-200">{country.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300 font-semibold">{country.count}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-800 rounded-full h-2 max-w-[100px]">
                              <div 
                                className="h-full rounded-full transition-all" 
                                style={{ 
                                  width: `${intensity * 100}%`,
                                  backgroundColor: getHeatColor(intensity)
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-400 min-w-[40px]">
                              {Math.round(intensity * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p>No country data available</p>
                <p className="text-xs mt-1">Geographic data will appear here when attacks are detected</p>
              </div>
            )}
          </div>
        </div>

        {/* City-Level Attacks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Attack Hotspots</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {geoMap.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Attacks</th>
                    <th className="px-6 py-4">Coordinates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {geoMap.slice(0, 10).map((location, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-200">{location.city}</div>
                          <div className="text-xs text-slate-400">{location.country}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 font-semibold">{location.count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-slate-400">
                          {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p>No city-level data available</p>
                <p className="text-xs mt-1">Attack locations will appear here when geographic data is enriched</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingGeoThreatView;