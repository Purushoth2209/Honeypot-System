import React from 'react';
import { SEVERITY_COLORS } from '../constants';

interface LiveAttackFeedProps {
  attacks: Array<{
    id: string;
    timestamp: string;
    ip: string;
    attackType: string;
    endpoint: string;
    severity: string;
  }>;
}

const LiveAttackFeed: React.FC<LiveAttackFeedProps> = ({ attacks }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-white">Live Attack Feed</h3>
        <span className="text-xs text-slate-400 ml-auto">Real-time</span>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {attacks.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <p className="text-sm">No live attacks detected</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {attacks.map((attack) => (
              <div key={attack.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200 mono">{attack.ip}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_COLORS[attack.severity]}`}>
                        {attack.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-rose-400">{attack.attackType.replace('_', ' ')}</span>
                      <span>→</span>
                      <span className="mono truncate">{attack.endpoint}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {new Date(attack.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAttackFeed;