
import React from 'react';
import { ViewMode } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: Icons.Dashboard },
    { id: ViewMode.DETECTIONS, label: 'Detections', icon: Icons.Shield },
    { id: ViewMode.ATTACKERS, label: 'Top Attackers', icon: Icons.Users },
    { id: ViewMode.LOGS, label: 'Raw Logs', icon: Icons.Logs },
    { id: ViewMode.GEO_THREAT, label: 'Geo Intelligence', icon: Icons.Globe },
    { id: ViewMode.AI_ANALYST, label: 'AI Analyst', icon: Icons.Brain },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-rose-500 mb-8">
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <Icons.Shield />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">Guardian</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-100'}`}>
                  <Icon />
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Live</span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">v4.2.0-stable</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
