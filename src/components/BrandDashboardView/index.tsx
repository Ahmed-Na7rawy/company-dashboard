import React from 'react';
import { Sparkles, Filter, Coffee, BookOpen, Boxes, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CompetitorAnalysisView from '../CompetitorAnalysisView';
import { useScaleMode } from '../../hooks/useScaleMode';
import { translations } from './translations';
import { useBrandDashboard } from './useBrandDashboard';
import { BrandKpis } from './BrandKpis';
import { BrandCharts } from './BrandCharts';
import { BrandChurnRisk } from './BrandChurnRisk';
import { BrandMarketing } from './BrandMarketing';

interface BrandDashboardProps {
  language: 'en' | 'ar';
  darkMode: boolean;
  timePeriod?: string;
  customStartDate?: string;
  customEndDate?: string;
  processedData: any[];
  currentUser?: any;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (q: string) => void;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric?: 'revenue' | 'volume';
  globalCompareMode?: boolean;
}

export default function BrandDashboardView(props: BrandDashboardProps) {
  const { language, darkMode, selectedYear, selectedQuarter, chartDisplayMode } = props;
  const t = translations[language];
  const isEn = language === 'en';
  const scaleMode = useScaleMode();

  const brandHook = useBrandDashboard(props);

  const formatVal = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const scaledVal = val / factor;
    const formattedNum = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(scaledVal);

    return `${formattedNum} ${suffix} ${language === 'en' ? 'EGP' : 'ج.م'}`;
  };

  const formatNum = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const scaledVal = val / factor;
    const formatted = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(scaledVal);
    return `${formatted} ${suffix}`;
  };

  const renderLegendText = (value: string, entry: any) => {
    const isHidden = brandHook.hiddenProducts[entry.dataKey];
    return (
      <span 
        style={{ 
          textDecoration: isHidden ? 'line-through' : 'none', 
          opacity: isHidden ? 0.35 : 0.85,
          cursor: 'pointer',
          userSelect: 'none',
          paddingLeft: '4px',
          paddingRight: '4px'
        }}
      >
        {value}
      </span>
    );
  };

  const activeMetrics = brandHook.activeMetrics;
  if (!activeMetrics) return null;

  return (
    <div className={`space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* Platform Header */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
        <div>
          <h2 className={`text-xl font-extrabold flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <Sparkles size={20} className="text-indigo-500" />
            <span>{t.brandDashboard}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t.brandSubtitle}</p>
        </div>

        {/* Global Filter Summary Banner */}
        <div className={`p-3 px-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
          darkMode ? 'bg-slate-800/40 border-slate-700/55 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <Filter size={13} className="text-indigo-500" />
          <span>
            {language === 'en' ? 'Active Filters:' : 'الفلاتر النشطة:'}{' '}
            <span className="text-indigo-500 font-bold dark:text-indigo-400">
              {language === 'en' ? 'Year:' : 'السنة:'} {selectedYear} | {language === 'en' ? 'Quarter:' : 'الربع:'} {selectedQuarter === 'All' ? (language === 'en' ? 'All' : 'الكل') : `Q${selectedQuarter}`}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 text-xs no-print">
        <button
          onClick={() => brandHook.setActiveTab('nova-sales')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            brandHook.activeTab === 'nova-sales' 
              ? 'border-orange-500 text-orange-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Coffee size={14} />
          {t.novaSales}
        </button>
        <button
          onClick={() => brandHook.setActiveTab('nova-marketing')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            brandHook.activeTab === 'nova-marketing' 
              ? 'border-orange-500 text-orange-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <BookOpen size={14} />
          {t.novaMarketing}
        </button>
        <button
          onClick={() => brandHook.setActiveTab('zenith-sales')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            brandHook.activeTab === 'zenith-sales' 
              ? 'border-violet-500 text-violet-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Boxes size={14} />
          {t.zenithSales}
        </button>
        <button
          onClick={() => brandHook.setActiveTab('zenith-marketing')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            brandHook.activeTab === 'zenith-marketing' 
              ? 'border-violet-500 text-violet-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <BookOpen size={14} />
          {t.zenithMarketing}
        </button>
        <button
          onClick={() => brandHook.setActiveTab('competitor-insights')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            brandHook.activeTab === 'competitor-insights' 
              ? 'border-indigo-500 text-indigo-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <TrendingUp size={14} />
          {language === 'en' ? 'Competitor Insights' : 'تحليلات المنافسين'}
        </button>
      </div>

      {/* Render Active Tab */}
      {brandHook.activeTab === 'nova-sales' && (
        <div className="space-y-6">
          <BrandKpis
            t={t}
            activeMetrics={activeMetrics}
            formatVal={formatVal}
            formatNum={formatNum}
            isEn={isEn}
            darkMode={darkMode}
            brandType="nova"
          />

          <BrandCharts
            t={t}
            language={language}
            darkMode={darkMode}
            chartDisplayMode={chartDisplayMode}
            formatVal={formatVal}
            brandType="nova"
            brandComparisonData={brandHook.brandComparisonData}
            novaQuarterly={brandHook.novaQuarterly}
            novaQuarterlyTotal={brandHook.novaQuarterlyTotal}
            shares={{ yk: brandHook.ykShare, yf: brandHook.yfShare, ys: brandHook.ysShare }}
            trends={{ yk: brandHook.ykTrends, yf: brandHook.yfTrends, ys: brandHook.ysTrends }}
            customers={{ yk: brandHook.ykCustomers, yf: brandHook.yfCustomers, ys: brandHook.ysCustomers }}
            hiddenProducts={brandHook.hiddenProducts}
            setHiddenProducts={brandHook.setHiddenProducts}
            handleLegendClick={brandHook.handleLegendClick}
            renderLegendText={renderLegendText}
          />

          {/* Salesperson Performance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-750 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Users size={15} className="text-orange-500" />
                  <span>{t.salespersonPerformance} ({t.combinedNovaGroup})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-400 font-medium">{t.selectDivision}:</label>
                <select
                  value={brandHook.novaRepSelect}
                  onChange={(e) => brandHook.setNovaRepSelect(e.target.value)}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  } outline-none focus:border-indigo-500`}
                >
                  <option value="nova_combined">{t.combinedNovaGroup}</option>
                  <option value="nova_koffi">{t.novaKoffee}</option>
                  <option value="nova_frappit">{t.novaFrappitt}</option>
                  <option value="nova_smoozy">{t.novaSmoozy}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={brandHook.novaRepsChartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="rgba(249, 115, 22, 0.75)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{language === 'en' ? 'Salesperson' : 'مندوب المبيعات'}</th>
                      <th className="p-2.5 text-right">{t.revenue}</th>
                      <th className="p-2.5 text-right">{t.volumeSold}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandHook.novaRepsData.map((rep: any, idx: number) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-2.5 font-bold">{rep.name}</td>
                        <td className="p-2.5 text-right font-semibold text-orange-500">{formatVal(rep.revenue)}</td>
                        <td className="p-2.5 text-right font-medium">{formatNum(rep.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <BrandChurnRisk
            t={t}
            language={language}
            darkMode={darkMode}
            formatVal={formatVal}
            formatNum={formatNum}
            brandType="nova"
            churnData={brandHook.brandData[brandHook.novaChurnSelect]?.filters[brandHook.filterKey]?.churn}
            churnCount={brandHook.novaChurnCount}
            setChurnCount={brandHook.setNovaChurnCount}
            churnSelect={brandHook.novaChurnSelect}
            setChurnSelect={brandHook.setNovaChurnSelect}
            churnDataSorted={brandHook.novaChurnDataSorted}
            sortField={brandHook.novaSortField}
            sortAsc={brandHook.novaSortAsc}
            handleSort={(field) => {
              if (brandHook.novaSortField === field) {
                brandHook.setNovaSortAsc(!brandHook.novaSortAsc);
              } else {
                brandHook.setNovaSortField(field);
                brandHook.setNovaSortAsc(field === 'customer');
              }
            }}
          />
        </div>
      )}

      {brandHook.activeTab === 'nova-marketing' && (
        <BrandMarketing
          t={t}
          language={language}
          darkMode={darkMode}
          brandType="nova"
        />
      )}

      {brandHook.activeTab === 'zenith-sales' && (
        <div className="space-y-6">
          <BrandKpis
            t={t}
            activeMetrics={activeMetrics}
            formatVal={formatVal}
            formatNum={formatNum}
            isEn={isEn}
            darkMode={darkMode}
            brandType="zenith"
          />

          <BrandCharts
            t={t}
            language={language}
            darkMode={darkMode}
            chartDisplayMode={chartDisplayMode}
            formatVal={formatVal}
            brandType="zenith"
            zenithQuarterly={brandHook.zenithQuarterly}
            zenithQuarterlyTotal={brandHook.zenithQuarterlyTotal}
            shares={{ sq: brandHook.sqShare }}
            trends={{ sq: brandHook.sqTrends }}
            customers={{ sq: brandHook.sqCustomers }}
            hiddenProducts={brandHook.hiddenProducts}
            setHiddenProducts={brandHook.setHiddenProducts}
            handleLegendClick={brandHook.handleLegendClick}
            renderLegendText={renderLegendText}
          />

          {/* Salesperson Performance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="border-b border-slate-750 pb-4 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-violet-500" />
                <span>{t.salespersonPerformance} (Zenith)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={brandHook.zenithRepsChartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="rgba(139, 92, 246, 0.75)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{language === 'en' ? 'Salesperson' : 'مندوب المبيعات'}</th>
                      <th className="p-2.5 text-right">{t.revenue}</th>
                      <th className="p-2.5 text-right">{t.volumeSold}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandHook.zenithRepsData.map((rep: any, idx: number) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-2.5 font-bold">{rep.name}</td>
                        <td className="p-2.5 text-right font-semibold text-violet-500">{formatVal(rep.revenue)}</td>
                        <td className="p-2.5 text-right font-medium">{formatNum(rep.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <BrandChurnRisk
            t={t}
            language={language}
            darkMode={darkMode}
            formatVal={formatVal}
            formatNum={formatNum}
            brandType="zenith"
            churnData={activeMetrics.sq.churn}
            churnCount={brandHook.zenithChurnCount}
            setChurnCount={brandHook.setZenithChurnCount}
            churnDataSorted={brandHook.zenithChurnDataSorted}
            sortField={brandHook.zenithSortField}
            sortAsc={brandHook.zenithSortAsc}
            handleSort={(field) => {
              if (brandHook.zenithSortField === field) {
                brandHook.setZenithSortAsc(!brandHook.zenithSortAsc);
              } else {
                brandHook.setZenithSortField(field);
                brandHook.setZenithSortAsc(field === 'customer');
              }
            }}
          />
        </div>
      )}

      {brandHook.activeTab === 'zenith-marketing' && (
        <BrandMarketing
          t={t}
          language={language}
          darkMode={darkMode}
          brandType="zenith"
        />
      )}

      {brandHook.activeTab === 'competitor-insights' && (
        <CompetitorAnalysisView
          language={language}
          darkMode={darkMode}
          processedData={props.processedData}
        />
      )}
    </div>
  );
}
export { BrandDashboardView };
