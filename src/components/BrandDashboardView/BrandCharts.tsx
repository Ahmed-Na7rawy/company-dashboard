import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface BrandChartsProps {
  t: Record<string, string>;
  language: 'en' | 'ar';
  darkMode: boolean;
  chartDisplayMode: 'count' | 'percent';
  formatVal: (val: number) => string;
  brandType: 'nova' | 'zenith';
  brandComparisonData?: any[];
  novaQuarterly?: any[];
  novaQuarterlyTotal?: number;
  zenithQuarterly?: any[];
  zenithQuarterlyTotal?: number;
  shares?: {
    yk?: any[];
    yf?: any[];
    ys?: any[];
    sq?: any[];
  };
  trends?: {
    yk?: any;
    yf?: any;
    ys?: any;
    sq?: any;
  };
  customers?: {
    yk?: any[];
    yf?: any[];
    ys?: any[];
    sq?: any[];
  };
  hiddenProducts: Record<string, boolean>;
  setHiddenProducts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleLegendClick: (o: any) => void;
  renderLegendText: (value: string, entry: any) => React.ReactNode;
}

const multiColors = [
  '#f97316', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6',
  '#eab308', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1',
  '#a855f7', '#ff6b6b', '#4ecdc4', '#ffe66d', '#ff1493'
];

export const BrandCharts: React.FC<BrandChartsProps> = ({
  t,
  language,
  darkMode,
  chartDisplayMode,
  formatVal,
  brandType,
  brandComparisonData = [],
  novaQuarterly = [],
  novaQuarterlyTotal = 0,
  zenithQuarterly = [],
  zenithQuarterlyTotal = 0,
  shares = {},
  trends = {},
  customers = {},
  hiddenProducts,
  setHiddenProducts,
  handleLegendClick,
  renderLegendText
}) => {
  const isEn = language === 'en';

  if (brandType === 'nova') {
    return (
      <div className="space-y-6">
        {/* Core Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.brandRevenueComparison}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={brandComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke={darkMode ? '#94a3b8' : '#64748b'} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => {
                      if (chartDisplayMode === 'percent') return `${v}%`;
                      return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                    }}
                  />
                  <Tooltip 
                    formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                    {brandComparisonData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-1">{t.quarterlySalesComparison}</h3>
            <p className="text-[9px] text-slate-400 mb-4">{t.allTimeNet}: {formatVal(novaQuarterlyTotal)}</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={novaQuarterly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="year" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke={darkMode ? '#94a3b8' : '#64748b'} 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => {
                      if (chartDisplayMode === 'percent') return `${v}%`;
                      return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                    }}
                  />
                  <Tooltip 
                    formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Q1" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Q2" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Q3" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Q4" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Product shares donut grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nova Koffee Share */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.novaKoffee} — {t.productRevenueShare}</h3>
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={shares.yk} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                    {shares.yk?.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#64748b'][idx % 6]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => {
                      if (chartDisplayMode === 'percent') {
                        const total = shares.yk?.reduce((sum, x) => sum + x.value, 0) || 1;
                        return [`${((Number(v) / total) * 100).toFixed(1)}%`, isEn ? 'Share' : 'الحصة'];
                      }
                      return [formatVal(v), ''];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nova Frappitt Share */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.novaFrappitt} — {t.productRevenueShare}</h3>
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={shares.yf} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                    {shares.yf?.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={['#ca8a04', '#eab308', '#fde047', '#fef08a', '#fef9c3', '#64748b'][idx % 6]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => {
                      if (chartDisplayMode === 'percent') {
                        const total = shares.yf?.reduce((sum, x) => sum + x.value, 0) || 1;
                        return [`${((Number(v) / total) * 100).toFixed(1)}%`, isEn ? 'Share' : 'الحصة'];
                      }
                      return [formatVal(v), ''];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nova Smoozy Share */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.novaSmoozy} — {t.productRevenueShare}</h3>
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={shares.ys} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                    {shares.ys?.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={['#db2777', '#ec4899', '#f472b6', '#fbcfe8', '#fdf2f8', '#64748b'][idx % 6]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => {
                      if (chartDisplayMode === 'percent') {
                        const total = shares.ys?.reduce((sum, x) => sum + x.value, 0) || 1;
                        return [`${((Number(v) / total) * 100).toFixed(1)}%`, isEn ? 'Share' : 'الحصة'];
                      }
                      return [formatVal(v), ''];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly line trend charts */}
        <div className="space-y-6">
          {/* Koffee Trend */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider">{t.novaKoffee}: {t.monthlyTrends}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trends.yk?.products.forEach((p: any) => delete updated[p]);
                    setHiddenProducts(updated);
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                >
                  {t.select}
                </button>
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trends.yk?.products.forEach((p: any) => updated[p] = true);
                    setHiddenProducts(updated);
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                >
                  {t.deselect}
                </button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={trends.yk?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v} />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                  {trends.yk?.products.map((prod: string, idx: number) => (
                    <Line
                      key={prod}
                      type="monotone"
                      dataKey={prod}
                      name={prod.split(" - ")[0]}
                      stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                      strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                      strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                      hide={hiddenProducts[prod]}
                      dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                    />
                  ))}
                  <Line type="monotone" dataKey={language === 'en' ? 'Total' : 'الإجمالي'} name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'} stroke={darkMode ? '#38bdf8' : '#0284c7'} strokeWidth={3.5} strokeDasharray="6 4" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frappitt Trend */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider">{t.novaFrappitt}: {t.monthlyTrends}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trends.yf?.products.forEach((p: any) => delete updated[p]);
                    setHiddenProducts(updated);
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                >
                  {t.select}
                </button>
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trends.yf?.products.forEach((p: any) => updated[p] = true);
                    setHiddenProducts(updated);
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                >
                  {t.deselect}
                </button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={trends.yf?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v} />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                  {trends.yf?.products.map((prod: string, idx: number) => (
                    <Line
                      key={prod}
                      type="monotone"
                      dataKey={prod}
                      name={prod.split(" - ")[0]}
                      stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                      strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                      strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                      hide={hiddenProducts[prod]}
                      dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                    />
                  ))}
                  <Line type="monotone" dataKey={language === 'en' ? 'Total' : 'الإجمالي'} name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'} stroke={darkMode ? '#38bdf8' : '#0284c7'} strokeWidth={3.5} strokeDasharray="6 4" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top customers grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.novaKoffee}</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={customers.yk} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.novaFrappitt}</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={customers.yf} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Bar dataKey="value" fill="#eab308" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.novaSmoozy}</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={customers.ys} layout="vertical" margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Brand Type === Zenith
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product share donut */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.productRevenueShare}</h3>
          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie data={shares.sq} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {shares.sq?.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={['#6366f1', '#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#64748b'][idx % 6]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(v: any) => {
                    if (chartDisplayMode === 'percent') {
                      const total = shares.sq?.reduce((sum, x) => sum + x.value, 0) || 1;
                      return [`${((Number(v) / total) * 100).toFixed(1)}%`, isEn ? 'Share' : 'الحصة'];
                    }
                    return [formatVal(v), ''];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly line trend */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider">{t.monthlyTrends}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={trends.sq?.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v} />
                <Tooltip formatter={(v: any) => formatVal(v)} />
                <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 9 }} />
                {trends.sq?.products.map((prod: string, idx: number) => (
                  <Line
                    key={prod}
                    type="monotone"
                    dataKey={prod}
                    name={prod.split(" - ")[0]}
                    stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                    strokeWidth={prod === 'Total Sales' ? 3 : 1.5}
                    strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                    hide={hiddenProducts[prod]}
                    dot={{ r: prod === 'Total Sales' ? 4 : 2 }}
                  />
                ))}
                <Line type="monotone" dataKey={language === 'en' ? 'Total' : 'الإجمالي'} name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'} stroke={darkMode ? '#38bdf8' : '#0284c7'} strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 10 B2C Customers */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={customers.sq} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                <Tooltip formatter={(v: any) => formatVal(v)} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zenith Quarterly Sales Comparison */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-1">{t.quarterlySalesComparison}</h3>
          <p className="text-[9px] text-slate-400 mb-4">{t.allTimeNet}: {formatVal(zenithQuarterlyTotal)}</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={zenithQuarterly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="year" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                <YAxis 
                  stroke={darkMode ? '#94a3b8' : '#64748b'} 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => {
                    if (chartDisplayMode === 'percent') return `${v}%`;
                    return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                  }}
                />
                <Tooltip 
                  formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Q1" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Q2" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Q3" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Q4" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
