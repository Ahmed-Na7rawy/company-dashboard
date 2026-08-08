import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  darkMode?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl border backdrop-blur-xl shadow-xl transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-white/80 border-slate-200 text-slate-800'
      }`}>
        <p className="font-extrabold text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-3 text-xs font-bold">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                {entry.name}:
              </span>
              <span>
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
