import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { GeoMapData } from '../types';
import { apiService } from '../services/apiService';
import { websocketService } from '../services/websocketService';
import 'leaflet/dist/leaflet.css';

const GeoMap: React.FC = () => {
  const [geoMap, setGeoMap] = useState<GeoMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeoData = async () => {
    try {
      setError(null);
      const geoMapData = await apiService.getGeoMap();
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

  const getMarkerColor = (count: number): string => {
    const maxCount = Math.max(...geoMap.map(g => g.count), 1);
    const intensity = count / maxCount;
    
    if (intensity < 0.3) return '#3b82f6'; // Blue - Low
    if (intensity < 0.7) return '#f97316'; // Orange - Medium
    return '#ef4444'; // Red - High
  };

  const getMarkerRadius = (count: number): number => {
    const maxCount = Math.max(...geoMap.map(g => g.count), 1);
    const intensity = count / maxCount;
    return Math.max(6, intensity * 30);
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
        
        <div className="relative bg-slate-950 rounded-lg overflow-hidden border border-slate-900" style={{ height: '600px' }}>
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%', background: '#020617' }}
            zoomControl={true}
            scrollWheelZoom={true}
            className="leaflet-dark-theme"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              attribution=''
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              attribution=''
            />
            
            {geoMap.map((location, index) => (
              <CircleMarker
                key={index}
                center={[location.latitude, location.longitude]}
                radius={getMarkerRadius(location.count)}
                pathOptions={{
                  fillColor: getMarkerColor(location.count),
                  fillOpacity: 0.8,
                  color: getMarkerColor(location.count),
                  weight: 1,
                  opacity: 0.9
                }}
              >
                <Popup className="custom-popup">
                  <div className="text-sm p-1">
                    <div className="font-bold text-white mb-1">{location.city}</div>
                    <div className="text-slate-400 text-xs mb-2">{location.country}</div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: getMarkerColor(location.count) }}
                      ></div>
                      <span className="text-rose-400 font-semibold">
                        {location.count} attack{location.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

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
                  <th className="px-6 py-4">Threat Level</th>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getMarkerColor(location.count) }}
                        ></div>
                        <span className="text-xs text-slate-400">
                          {getMarkerColor(location.count) === '#3b82f6' ? 'Low' : 
                           getMarkerColor(location.count) === '#f97316' ? 'Medium' : 'High'}
                        </span>
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
  );
};

export default GeoMap;
