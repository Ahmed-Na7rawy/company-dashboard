import React from 'react';

interface KpiCardsProps {
  viewMetric: 'revenue' | 'volume';
  language: 'en' | 'ar';
  darkMode: boolean;
  chartsCombined: any;
  filteredData: any[];
  officeType: string;
  pushToSellItems: any[];
  formatVal: (val: number) => string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  viewMetric,
  language,
  darkMode,
  chartsCombined,
  filteredData,
  officeType,
  pushToSellItems,
  formatVal
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Net Sales */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {viewMetric === 'revenue' 
            ? (language === 'en' ? 'Net Revenue' : 'صافي الإيرادات')
            : (language === 'en' ? 'Net Sales Vol' : 'صافي حجم المبيعات')}
        </p>
        <h3 className="text-xl font-black mt-2 text-[#128d46]">
          {viewMetric === 'revenue' 
            ? formatVal(chartsCombined.totalNetRevenue)
            : chartsCombined.totalNetVolume.toLocaleString()}
        </h3>
      </div>

      {/* Gross Sales */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {viewMetric === 'revenue'
            ? (language === 'en' ? 'Gross Revenue' : 'إجمالي الإيرادات')
            : (language === 'en' ? 'Gross Sales Vol' : 'إجمالي المبيعات')}
        </p>
        <h3 className="text-xl font-black mt-2">
          {viewMetric === 'revenue'
            ? formatVal(chartsCombined.totalGrossRevenue)
            : chartsCombined.totalGrossVolume.toLocaleString()}
        </h3>
      </div>

      {/* Return Rate */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Return Rate %' : 'معدل المرتجعات %'}</p>
        <h3 className={`text-xl font-black mt-2 ${
          parseFloat(viewMetric === 'revenue' ? chartsCombined.overallReturnRateRevenue : chartsCombined.overallReturnRate) > 5 
            ? 'text-rose-500' 
            : 'text-emerald-500'
        }`}>{viewMetric === 'revenue' ? chartsCombined.overallReturnRateRevenue : chartsCombined.overallReturnRate}%</h3>
      </div>

      {/* Active Clients */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Active Accounts' : 'الحسابات النشطة'}</p>
        <h3 className="text-xl font-black mt-2">{new Set(filteredData.map(r => r.CustomerName)).size}</h3>
      </div>

      {/* Concentration Risk OR Surplus SKUs */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm col-span-2 md:col-span-1`}>
        {officeType === 'B2C' || officeType === 'Horeca Team' ? (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Surplus SKUs' : 'أصناف فائضة'}</p>
            <h3 className="text-xl font-black mt-2 text-[#e97025]">{pushToSellItems.length}</h3>
          </>
        ) : (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Concentration Risk' : 'مخاطر التركيز'}</p>
            <h3 className="text-xl font-black mt-2 text-indigo-500">{chartsCombined.riskMatrix.filter((p: any) => p.isHighRisk).length}</h3>
          </>
        )}
      </div>
    </div>
  );
};
