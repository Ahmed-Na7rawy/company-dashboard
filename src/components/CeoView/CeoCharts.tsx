import React, { useRef, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Area, Line, PieChart, Pie, Cell
} from 'recharts';
import { CustomTooltip } from '../CustomTooltip';
import Plotly from 'plotly.js-dist-min';

interface CeoChartsProps {
  darkMode: boolean;
  language: 'en' | 'ar';
  scaleMode: string;
  chartDisplayMode: 'count' | 'percent';
  chartMetric: 'revenue' | 'volume';
  setChartMetric: (metric: 'revenue' | 'volume') => void;
  timelineCompare: boolean;
  setTimelineCompare: (compare: boolean) => void;
  tq1Num: number;
  setTq1Num: (num: number) => void;
  tq1Year: number;
  setTq1Year: (year: number) => void;
  tq2Num: number;
  setTq2Num: (num: number) => void;
  tq2Year: number;
  setTq2Year: (year: number) => void;
  timelineCompareData: any[];
  timelineData: any[];
  segmentCompare: boolean;
  setSegmentCompare: (compare: boolean) => void;
  sq1Num: number;
  setSq1Num: (num: number) => void;
  sq1Year: number;
  setSq1Year: (year: number) => void;
  sq2Num: number;
  setSq2Num: (num: number) => void;
  sq2Year: number;
  setSq2Year: (year: number) => void;
  segmentCompareData: any[];
  segmentData: any[];
  flowVisualizer: {
    leftNodes: any[];
    rightNodes: any[];
    paths: any[];
  };
}

export const CeoCharts: React.FC<CeoChartsProps> = ({
  darkMode,
  language,
  scaleMode,
  chartDisplayMode,
  chartMetric,
  setChartMetric,
  timelineCompare,
  setTimelineCompare,
  tq1Num,
  setTq1Num,
  tq1Year,
  setTq1Year,
  tq2Num,
  setTq2Num,
  tq2Year,
  setTq2Year,
  timelineCompareData,
  timelineData,
  segmentCompare,
  setSegmentCompare,
  sq1Num,
  setSq1Num,
  sq1Year,
  setSq1Year,
  sq2Num,
  setSq2Num,
  sq2Year,
  setSq2Year,
  segmentCompareData,
  segmentData,
  flowVisualizer
}) => {
  const sankeyChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sankeyChartRef.current) return;

    const leftLabels = flowVisualizer.leftNodes.map(n => n.label);
    const rightLabels = flowVisualizer.rightNodes.map(n => n.label);
    const allLabels = [...leftLabels, ...rightLabels];

    const sourceIndices: number[] = [];
    const targetIndices: number[] = [];
    const flowValues: number[] = [];

    flowVisualizer.paths.forEach((p: any) => {
      if (!p) return;
      const srcIdx = allLabels.indexOf(p.source);
      const tgtIdx = allLabels.indexOf(p.target);
      if (srcIdx !== -1 && tgtIdx !== -1) {
        sourceIndices.push(srcIdx);
        targetIndices.push(tgtIdx);
        flowValues.push(p.value);
      }
    });

    const data = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 18,
          line: { color: darkMode ? '#334155' : '#cbd5e1', width: 1 },
          label: allLabels,
          color: allLabels.map((_, idx) => idx < leftLabels.length ? '#10b981' : '#0284c7'),
          font: { color: darkMode ? '#f8fafc' : '#0f172a', size: 9, family: 'Outfit, sans-serif' }
        },
        link: {
          source: sourceIndices,
          target: targetIndices,
          value: flowValues,
          color: darkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)'
        }
      }
    ];

    const layout = {
      margin: { t: 15, r: 15, b: 15, l: 15 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };

    if (Plotly && Plotly.react) {
      Plotly.react(sankeyChartRef.current, data, layout, { responsive: true, displayModeBar: false });
    }
  }, [flowVisualizer, darkMode]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Historical Sales & Returns Timeline' : 'الجدول الزمني التاريخي للمبيعات والمرتجعات'}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTimelineCompare(!timelineCompare)}
                className={`px-3 py-1 rounded-lg transition-all text-[10px] font-bold border ${
                  timelineCompare
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                    : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
              >
                📊 {language === 'en' ? 'Compare Quarters' : 'مقارنة ربع سنوية'}
              </button>
              <div className="flex border border-slate-200 dark:border-slate-800/60 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetric === 'revenue'
                      ? (darkMode ? 'bg-[#191342] text-white shadow' : 'bg-white text-[#191342] shadow border border-slate-200/60')
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {language === 'en' ? 'Net Revenue (EGP)' : 'صافي الإيرادات (جنيه)'}
                </button>
                <button
                  onClick={() => setChartMetric('volume')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetric === 'volume'
                      ? (darkMode ? 'bg-[#191342] text-white shadow' : 'bg-white text-[#191342] shadow border border-slate-200/60')
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {language === 'en' ? 'Sales Volume (Qty)' : 'حجم المبيعات (كمية)'}
                </button>
              </div>
            </div>
          </div>

          {timelineCompare && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Base:' : 'الأساس:'}
                </span>
                <select
                  value={tq1Num}
                  onChange={(e) => setTq1Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select
                  value={tq1Year}
                  onChange={(e) => setTq1Year(Number(e.target.value))}
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
                  value={tq2Num}
                  onChange={(e) => setTq2Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select
                  value={tq2Year}
                  onChange={(e) => setTq2Year(Number(e.target.value))}
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {timelineCompare ? (
                <BarChart data={timelineCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip darkMode={darkMode} />}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      const labelSuffix = chartMetric === 'revenue' ? ' EGP' : ` ${language === 'en' ? 'Units' : 'وحدة'}`;
                      return [`${Math.round(num / factor)}${suffix}${labelSuffix}`, ''];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="q1Value"
                    name={language === 'en' ? `Base: Q${tq1Num} ${tq1Year}` : `الأساس: ربع ${tq1Num} ${tq1Year}`}
                    fill="#128d46"
                    radius={[3, 3, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="q2Value"
                    name={language === 'en' ? `Compare: Q${tq2Num} ${tq2Year}` : `المقارن: ربع ${tq2Num} ${tq2Year}`}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              ) : (
                <ComposedChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={darkMode ? '#334155' : '#cbd5e1'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={darkMode ? '#334155' : '#cbd5e1'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip darkMode={darkMode} />}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      const labelSuffix = chartMetric === 'revenue' ? ' EGP' : ` ${language === 'en' ? 'Units' : 'وحدة'}`;
                      return [`${Math.round(num / factor)}${suffix}${labelSuffix}`, ''];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'revenue' ? 'grossRev' : 'grossVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Gross Revenue' : 'Gross Volume') : (chartMetric === 'revenue' ? 'إجمالي الإيرادات' : 'إجمالي الحجم')}
                    fill="url(#colorGross)"
                    stroke={darkMode ? '#475569' : '#cbd5e1'}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'returnsRev' : 'returnsVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Returns Value' : 'Returns Volume') : (chartMetric === 'revenue' ? 'قيمة المرتجعات' : 'حجم المرتجعات')}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                    barSize={12}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric === 'revenue' ? 'netRev' : 'netVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Net Revenue' : 'Net Volume') : (chartMetric === 'revenue' ? 'صافي الإيرادات' : 'صافي الحجم')}
                    stroke="#128d46"
                    strokeWidth={3}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Unit Share */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Business Unit Volume Share' : 'حصة حجم مبيعات قطاعات الشركة'}
            </h3>
            <button
              onClick={() => setSegmentCompare(!segmentCompare)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                segmentCompare ? 'bg-indigo-500 text-white border-indigo-500 shadow' : 'text-slate-400'
              }`}
            >
              📊 {language === 'en' ? 'Compare' : 'مقارنة'}
            </button>
          </div>

          {segmentCompare && (
            <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[9px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Base:' : 'الأساس:'}
                </span>
                <div className="flex gap-1">
                  <select
                    value={sq1Num}
                    onChange={(e) => setSq1Num(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={sq1Year}
                    onChange={(e) => setSq1Year(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={2022}>2022</option>
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[9px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Compare:' : 'المقارن:'}
                </span>
                <div className="flex gap-1">
                  <select
                    value={sq2Num}
                    onChange={(e) => setSq2Num(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={sq2Year}
                    onChange={(e) => setSq2Year(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={2022}>2022</option>
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="h-64 flex flex-col justify-center items-center">
            {segmentCompare ? (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={segmentCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={9}
                    tickFormatter={(val) => {
                      if (chartDisplayMode === 'percent') return `${val}%`;
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip darkMode={darkMode} />}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      if (chartDisplayMode === 'percent') return [`${val}%`, ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return [`${Math.round(num / factor)}${suffix} ${language === 'en' ? 'Units' : 'وحدة'}`, ''];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q1Value" name={language === 'en' ? `Base: Q${sq1Num} ${sq1Year}` : `الأساس: ربع ${sq1Num} ${sq1Year}`} fill="#128d46" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="q2Value" name={language === 'en' ? `Compare: Q${sq2Num} ${sq2Year}` : `المقارن: ربع ${sq2Num} ${sq2Year}`} fill="#e97025" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip darkMode={darkMode} />}
                      formatter={(val: unknown) => {
                        if (typeof val !== 'number') return ['', ''];
                        if (chartDisplayMode === 'percent') {
                          const total = segmentData.reduce((acc, curr) => acc + curr.value, 0);
                          const pct = total > 0 ? ((Number(val) / total) * 100).toFixed(1) : '0.0';
                          return [`${pct}%`, language === 'en' ? 'Share' : 'الحصة'];
                        }
                        const factor = scaleMode === 'millions' ? 1000000 : 1000;
                        const suffix = scaleMode === 'millions' ? 'M' : 'K';
                        return [`${Math.round(Number(val) / factor)}${suffix} ${language === 'en' ? 'Units' : 'وحدة'}`, ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-bold">
                  {segmentData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Segment Flow Visualizer (Sankey Flow) */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Revenue Source-to-Product Group Flow (Sankey)' : 'تدفق الإيرادات من قنوات البيع إلى مجموعات المنتجات'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en'
                ? 'Visualizes active sales value flowing from Sales Channels to top Product categories. Width of bezier curves indicates flow volume.'
                : 'توضيح قيم المبيعات النشطة المتدفقة من قنوات البيع إلى مجموعات المنتجات الرئيسية. عرض الخط يمثل حجم التدفق.'}
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-4 bg-transparent rounded-xl">
          <div className="w-full max-w-lg h-72">
            <div ref={sankeyChartRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </>
  );
};
