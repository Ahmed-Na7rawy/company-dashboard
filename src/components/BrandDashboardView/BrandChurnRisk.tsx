import React from 'react';
import { AlertTriangle, ArrowUpDown, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface BrandChurnRiskProps {
  t: Record<string, string>;
  language: 'en' | 'ar';
  darkMode: boolean;
  formatVal: (val: number) => string;
  formatNum: (val: number) => string;
  brandType: 'nova' | 'zenith';
  churnData: {
    summary: {
      revenue_at_risk: number;
      high: number;
      medium: number;
      low: number;
      total_customers: number;
    };
    at_risk: any[];
  } | undefined;
  churnCount: number;
  setChurnCount: (count: number) => void;
  churnSelect?: string;
  setChurnSelect?: (sel: string) => void;
  churnDataSorted: any[];
  sortField: string;
  sortAsc: boolean;
  handleSort: (field: string) => void;
}

export const BrandChurnRisk: React.FC<BrandChurnRiskProps> = ({
  t,
  language,
  darkMode,
  formatVal,
  formatNum,
  brandType,
  churnData,
  churnCount,
  setChurnCount,
  churnSelect,
  setChurnSelect,
  churnDataSorted,
  sortField,
  sortAsc,
  handleSort
}) => {
  if (!churnData) return null;

  const lowPct = ((churnData.summary.low / churnData.summary.total_customers) * 100).toFixed(1);
  const medPct = ((churnData.summary.medium / churnData.summary.total_customers) * 100).toFixed(1);
  const highPct = ((churnData.summary.high / churnData.summary.total_customers) * 100).toFixed(1);

  const distributionPie = [
    { name: t.lowRisk, value: churnData.summary.low, percentage: lowPct, fill: '#10b981' },
    { name: t.mediumRisk, value: churnData.summary.medium, percentage: medPct, fill: '#f59e0b' },
    { name: t.highRisk, value: churnData.summary.high, percentage: highPct, fill: '#ef4444' },
  ];

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
      {/* Methodology Info Footnote Banner */}
      <div className={`p-2.5 px-3 mb-4 rounded-xl border text-[10px] flex items-center justify-between gap-2 ${
        darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
      }`}>
        <span className="flex items-center gap-1.5">
          <Info size={13} className="shrink-0" />
          <span>
            {language === 'en'
              ? 'Methodology Note: Churn probability scores are calculated using a client-side RFM (Recency, Frequency, Monetary) heuristic formula, not a server-trained ML model.'
              : 'ملاحظة المنهجية: يتم حساب احتمالية التوقف باستخدام معادلة RFM (الحداثة، التكرار، القيمة المالية) التوضيحية.'}
          </span>
        </span>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-750 pb-4 mb-5">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-500 animate-pulse" />
            <span>{t.predictiveChurn}</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 p-1 px-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 text-[10px]">{language === 'en' ? 'Show Rows:' : 'عرض الصفوف:'}</span>
            <input 
              type="range" 
              min="5" 
              max={Math.max(10, churnDataSorted.length)} 
              value={churnCount} 
              onChange={(e) => setChurnCount(Number(e.target.value))}
              className="w-16 lg:w-20 accent-indigo-500 h-1 bg-slate-350 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-indigo-500 font-extrabold text-[10px]">{churnCount}</span>
          </div>
          {brandType === 'nova' && setChurnSelect && churnSelect && (
            <>
              <label className="text-slate-400 font-medium">{t.selectDivision}:</label>
              <select
                value={churnSelect}
                onChange={(e) => setChurnSelect(e.target.value)}
                className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                } outline-none focus:border-indigo-500`}
              >
                <option value="nova_koffi">{t.novaKoffee}</option>
                <option value="nova_frappit">{t.novaFrappitt}</option>
                <option value="nova_smoozy">{t.novaSmoozy}</option>
              </select>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/10 border-rose-200'}`}>
            <span className="text-[10px] text-slate-400 block">{t.revenueAtRisk}</span>
            <span className="text-base font-black text-rose-500 block mt-1">{formatVal(churnData.summary.revenue_at_risk)}</span>
          </div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/10 border-amber-200'}`}>
            <span className="text-[10px] text-slate-400 block">{t.atRiskCustomers}</span>
            <span className="text-base font-black text-amber-500 block mt-1">{churnData.summary.high + churnData.summary.medium} {language === 'en' ? 'customers' : 'عملاء'}</span>
          </div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-750' : 'bg-slate-100/50 border-slate-200'}`}>
            <span className="text-[10px] text-slate-400 block">{t.totalCustomers}</span>
            <span className="text-base font-black block mt-1">{formatNum(churnData.summary.total_customers)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segment distribution pie chart */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-750' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between`}>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">{t.riskSegmentDistribution}</h4>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie 
                    data={distributionPie} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={35} 
                    outerRadius={55}
                  >
                    {distributionPie.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} customers`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] space-y-2 mt-2">
              {distributionPie.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                    {entry.name}
                  </span>
                  <span className="font-bold">{entry.value} ({entry.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customers at risk list */}
          <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px] select-none`}>
                  <th className="p-3 cursor-pointer" onClick={() => handleSort('customer')}>
                    <div className="flex items-center gap-1">
                      <span>{t.customer}</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>{t.salesValue}</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('recency')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>{t.recency}</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => handleSort('probability')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>{t.churnProb}</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {churnDataSorted.slice(0, churnCount).map((cust: any, idx: number) => {
                  const badge = cust.risk === "High" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20";
                  return (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">{cust.customer}</td>
                      <td className="p-3 text-right font-semibold">{formatVal(cust.revenue)}</td>
                      <td className="p-3 text-right">{cust.recency} {language === 'en' ? 'days' : 'أيام'}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${badge}`}>
                          {cust.probability}% ({cust.risk})
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
