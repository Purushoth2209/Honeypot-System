
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendColor = 'text-emerald-400' }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg bg-slate-800 ${trendColor}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
        <p className="text-2xl font-bold text-white tracking-tight mono">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
