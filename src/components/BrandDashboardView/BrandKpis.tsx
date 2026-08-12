import React from 'react';

interface BrandKpisProps {
  t: Record<string, string>;
  activeMetrics: {
    yk: any;
    yf: any;
    ys: any;
    yc: any;
    sq: any;
    sqTopSKU?: string;
    sqTopSKURev?: number;
  };
  formatVal: (val: number) => string;
  formatNum: (val: number) => string;
  isEn: boolean;
  darkMode: boolean;
  brandType: 'nova' | 'zenith';
}

export const BrandKpis: React.FC<BrandKpisProps> = ({
  t,
  activeMetrics,
  formatVal,
  formatNum,
  isEn,
  darkMode,
  brandType
}) => {
  if (brandType === 'nova') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nova Koffee */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/20 border-orange-200'} shadow-sm relative overflow-hidden`}>
          <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block mb-1">{t.novaKoffee}</span>
          <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yk.metrics.revenue)}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yk.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
          <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
            Return: {(activeMetrics.yk.metrics.return_rate * 100).toFixed(1)}%
          </div>
        </div>

        {/* Nova Frappitt */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50/20 border-yellow-200'} shadow-sm relative overflow-hidden`}>
          <span className="text-[10px] uppercase font-bold text-yellow-600 tracking-wider block mb-1">{t.novaFrappitt}</span>
          <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yf.metrics.revenue)}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yf.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
          <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
            Return: {(activeMetrics.yf.metrics.return_rate * 100).toFixed(1)}%
          </div>
        </div>

        {/* Nova Smoozy */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-pink-500/5 border-pink-500/20' : 'bg-pink-50/20 border-pink-200'} shadow-sm relative overflow-hidden`}>
          <span className="text-[10px] uppercase font-bold text-pink-500 tracking-wider block mb-1">{t.novaSmoozy}</span>
          <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.ys.metrics.revenue)}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.ys.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
          <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
            Return: {(activeMetrics.ys.metrics.return_rate * 100).toFixed(1)}%
          </div>
        </div>

        {/* Combined Group */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/20 border-indigo-200'} shadow-sm relative overflow-hidden`}>
          <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.combinedNovaGroup}</span>
          <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yc.metrics.revenue)}</h4>
          <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yc.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
          <div className="absolute right-4 top-4 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
            {t.active}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Zenith Net Revenue */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'} relative overflow-hidden`}>
        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.revenue}</span>
        <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.sq.metrics.revenue)}</h4>
        <div className="absolute right-4 top-4 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
          {t.active}
        </div>
      </div>

      {/* Zenith Volume */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'} relative overflow-hidden`}>
        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.volumeSold}</span>
        <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatNum(activeMetrics.sq.metrics.qty)}</h4>
        <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Units' : 'وحدة'}</p>
      </div>

      {/* Zenith Return Rate */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'} relative overflow-hidden`}>
        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.returnRate}</span>
        <h4 className="text-xl font-black text-rose-500">{(activeMetrics.sq.metrics.return_rate * 100).toFixed(1)}%</h4>
        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{t.returnRate}</p>
      </div>

      {/* Zenith Top Selling SKU */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'} relative overflow-hidden`}>
        <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.topSKU}</span>
        <h4 className={`text-xs font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`} title={activeMetrics.sqTopSKU}>
          {activeMetrics.sqTopSKU}
        </h4>
        <p className="text-[10px] text-slate-400 mt-1">{formatVal(activeMetrics.sqTopSKURev || 0)}</p>
      </div>
    </div>
  );
};
