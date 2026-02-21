import React, { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { CountryData, GeoMapData } from '../types';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocketService';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const GeoThreatView: React.FC = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [geoMap, setGeoMap] = useState<GeoMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

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

  const { maxCount, getCountryIntensity, getHeatColor } = useMemo(() => {
    const maxCount = Math.max(...countries.map(c => c.count), 1);
    
    const getCountryIntensity = (countryName: string): number => {
      if (!countryName) return 0;
      const country = countries.find(c => 
        c.country?.toLowerCase() === countryName.toLowerCase() ||
        c.code?.toLowerCase() === countryName.toLowerCase()
      );
      return country ? country.count / maxCount : 0;
    };

    const getHeatColor = (intensity: number): string => {
      if (intensity === 0) return '#1e293b';
      if (intensity < 0.3) return '#3b82f6';
      if (intensity < 0.7) return '#f97316';
      return '#ef4444';
    };

    return { maxCount, getCountryIntensity, getHeatColor };
  }, [countries]);

  const getMarkerSize = (count: number): number => {
    if (geoMap.length === 0) return 4;
    const intensity = count / Math.max(...geoMap.map(g => g.count), 1);
    return Math.max(4, intensity * 20);
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

      {/* World Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Global Attack Heatmap</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-400">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-slate-400">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-400">High</span>
            </div>
          </div>
        </div>
        
        <div className="relative bg-slate-950 rounded-lg p-4" style={{ minHeight: '500px' }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 20]
            }}
            style={{
              width: "100%",
              height: "500px"
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties?.NAME || geo.properties?.name || '';
                  if (!countryName) return null;
                  
                  const intensity = getCountryIntensity(countryName);
                  const country = countries.find(c => 
                    c.country.toLowerCase() === countryName.toLowerCase()
                  );
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getHeatColor(intensity)}
                      stroke="#374151"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { 
                          fill: intensity > 0 ? "#fbbf24" : "#374151",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: { outline: "none" }
                      }}
                      onMouseEnter={() => {
                        if (country) {
                          setHoveredCountry(`${country.country}: ${country.count} attacks`);
                        }
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                    />
                  );
                }).filter(Boolean)
              }
            </Geographies>
            
            {/* City markers */}
            {geoMap.map((location, index) => (
              <Marker
                key={index}
                coordinates={[location.longitude, location.latitude]}
              >
                <circle
                  r={getMarkerSize(location.count)}
                  fill="#ef4444"
                  fillOpacity={0.7}
                  stroke="#ffffff"
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                />
              </Marker>
            ))}
          </ComposableMap>
          
          {/* Tooltip */}
          {hoveredCountry && (
            <div className="absolute top-4 left-4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white shadow-lg">
              {hoveredCountry}
            </div>
          )}
        </div>
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

export default GeoThreatView;