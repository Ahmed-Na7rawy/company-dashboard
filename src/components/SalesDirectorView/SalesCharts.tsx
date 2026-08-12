import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Area, Line
} from 'recharts';

interface SalesChartsProps {
  darkMode: boolean;
  language: 'en' | 'ar';
  viewMetric: 'revenue' | 'volume';
  activeUom: string;
  timelineCompare: any;
  timelineCompareData: any[];
  getChartData: (tab: any) => any;
  yearlyTotals: any;
  formatVal: (val: number) => string;
}

export const SalesCharts: React.FC<SalesChartsProps> = ({
  darkMode,
  language,
  viewMetric,
  activeUom,
  timelineCompare,
  timelineCompareData,
  getChartData,
  yearlyTotals,
  formatVal
}) => {
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          {language === 'en' ? 'Historical Sales & Returns Timeline' : 'الجدول الزمني التاريخي للمبيعات والمرتجعات'}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => timelineCompare.toggle()}
            className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold border ${
              timelineCompare.enabled
                ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
            }`}
          >
            📊 {language === 'en' ? 'Compare Quarters' : 'مقارنة ربع سنوية'}
          </button>
        </div>
      </div>

      {timelineCompare.enabled && (
        <div className="flex flex-col gap-3 mb-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold">
          {/* Compare Type Toggle */}
          <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-2 mb-1 gap-2">
            <button
              onClick={() => timelineCompare.setType('quarter')}
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${timelineCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
            >
              {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
            </button>
            <button
              onClick={() => timelineCompare.setType('custom')}
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${timelineCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
            >
              {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
            </button>
          </div>

          {timelineCompare.type === 'custom' ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                  {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                </span>
                <input
                  type="date"
                  value={timelineCompare.custom.baseStart}
                  onChange={(e) => timelineCompare.setCustom('baseStart', e.target.value)}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                />
                <span className="text-slate-400 text-[10px]">{language === 'en' ? 'to' : 'إلى'}</span>
                <input
                  type="date"
                  value={timelineCompare.custom.baseEnd}
                  onChange={(e) => timelineCompare.setCustom('baseEnd', e.target.value)}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                  {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                </span>
                <input
                  type="date"
                  value={timelineCompare.custom.compStart}
                  onChange={(e) => timelineCompare.setCustom('compStart', e.target.value)}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                />
                <span className="text-slate-400 text-[10px]">{language === 'en' ? 'to' : 'إلى'}</span>
                <input
                  type="date"
                  value={timelineCompare.custom.compEnd}
                  onChange={(e) => timelineCompare.setCustom('compEnd', e.target.value)}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Base:' : 'الأساس:'}
                </span>
                <select
                  value={timelineCompare.quarter.q1Num}
                  onChange={(e) => timelineCompare.setQuarter('q1Num', Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select
                  value={timelineCompare.quarter.q1Year}
                  onChange={(e) => timelineCompare.setQuarter('q1Year', Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={2022}>2022</option>
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Compare:' : 'المقارن:'}
                </span>
                <select
                  value={timelineCompare.quarter.q2Num}
                  onChange={(e) => timelineCompare.setQuarter('q2Num', Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select
                  value={timelineCompare.quarter.q2Year}
                  onChange={(e) => timelineCompare.setQuarter('q2Year', Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={2022}>2022</option>
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {timelineCompare.enabled ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={timelineCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis
                stroke={darkMode ? '#94a3b8' : '#64748b'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (Math.abs(val) >= 1000000) return `${Math.round(val / 1000000)}M`;
                  return val.toLocaleString();
                }}
              />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                contentStyle={{
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="q1Value"
                name={timelineCompare.labels.base}
                fill="#128d46"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="q2Value"
                name={timelineCompare.labels.compare}
                fill="#e97025"
                radius={[3, 3, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={getChartData('combined').monthlyReturns} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey={viewMetric === 'revenue' ? 'grossRevenue' : 'grossVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Gross Rev' : 'Gross Vol') : (viewMetric === 'revenue' ? 'إجمالي الإيراد' : 'إجمالي الحجم')} fill={darkMode ? '#1e293b' : '#f1f5f9'} stroke={darkMode ? '#475569' : '#cbd5e1'} />
              <Bar dataKey={viewMetric === 'revenue' ? 'returnsRevenue' : 'returnsVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Returns Rev' : 'Returns Vol') : (viewMetric === 'revenue' ? 'المرتجع المالي' : 'المرتجع الحجم')} fill="#e97025" radius={[3, 3, 0, 0]} barSize={12} />
              <Line type="monotone" dataKey={viewMetric === 'revenue' ? 'netRevenue' : 'netVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Net Rev' : 'Net Vol') : (viewMetric === 'revenue' ? 'صافي الإيراد' : 'صافي الحجم')} stroke="#128d46" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Yearly Totals Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
        {[2022, 2023, 2024, 2025, 2026].map((year) => {
          const isSelected = !timelineCompare.enabled && year === 2026;
          const net = viewMetric === 'revenue' ? yearlyTotals[year]?.netRev || 0 : yearlyTotals[year]?.netVol || 0;
          const ret = viewMetric === 'revenue' ? yearlyTotals[year]?.retRev || 0 : yearlyTotals[year]?.retVol || 0;
          
          const formatValue = (val: number) => {
            if (viewMetric === 'revenue') {
              if (Math.abs(val) >= 1000000) {
                return `${(val / 1000000).toFixed(2)}M EGP`;
              } else if (Math.abs(val) >= 1000) {
                return `${(val / 1000).toFixed(1)}k EGP`;
              }
              return `${val.toLocaleString()} EGP`;
            } else {
              return `${val.toLocaleString()} ${activeUom}`;
            }
          };

          const netText = formatValue(net);
          const retText = formatValue(ret).replace(' EGP', '').replace(` ${activeUom}`, '');

          return (
            <div
              key={year}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm scale-105 animate-pulse'
                  : darkMode
                    ? 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700/80'
                    : 'bg-slate-50/70 border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-black tracking-wider ${isSelected ? 'text-emerald-500 font-extrabold' : 'text-slate-400'}`}>
                  {language === 'en' ? `Year ${year}` : `عام ${year}`}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className={`text-[13px] font-black block ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  {netText}
                </span>
                <span className="text-[9px] font-bold text-slate-400 block">
                  {language === 'en' ? `Returns: ${retText}` : `المرتجع: ${retText}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
