import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Percent, ShieldAlert, Award } from 'lucide-react';

interface CeoKpiCardsProps {
  metrics: {
    netRevenue: number;
    netQty: number;
    margin: number;
    activeCustomers: number;
    returnRate: number;
  };
  sparklineData: {
    revenue: { value: number }[];
    margin: { value: number }[];
    accounts: { value: number }[];
    returns: { value: number }[];
  };
  formatM: (val: number) => string;
  formatQty: (qty: number) => string;
  language: 'en' | 'ar';
  darkMode: boolean;
}

export const CeoKpiCards: React.FC<CeoKpiCardsProps> = ({
  metrics,
  sparklineData,
  formatM,
  formatQty,
  language,
  darkMode
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Sales */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${
        darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1.5 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'en' ? 'Global Net Revenue' : 'صافي الإيرادات الشاملة'}
          </p>
          <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            EGP {formatM(metrics.netRevenue)}
          </h3>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            {language === 'en' ? 'Vol: ' : 'الحجم: '}{formatQty(metrics.netQty)} {language === 'en' ? 'Units' : 'وحدة'}
          </p>
        </div>

        <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={sparklineData.revenue}>
              <Line type="monotone" dataKey="value" stroke="#128d46" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-xl shadow-inner">
          <Activity size={18} />
        </div>
      </div>

      {/* Global Margin */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${
        darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1.5 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'en' ? 'Global Margin %' : 'هامش الربح الإجمالي'}
          </p>
          <h3 className="text-xl font-black text-[#128d46]">
            {metrics.margin}%
          </h3>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            {language === 'en' ? 'Weighted Avg' : 'المتوسط المرجح'}
          </p>
        </div>

        <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={sparklineData.margin}>
              <Line type="monotone" dataKey="value" stroke="#128d46" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-xl">
          <Percent size={18} />
        </div>
      </div>

      {/* Customer Count */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${
        darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1.5 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'en' ? 'Active Accounts' : 'حسابات العملاء النشطة'}
          </p>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {metrics.activeCustomers}
          </h3>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            {language === 'en' ? 'B2B Customers' : 'عملاء قطاع الأعمال'}
          </p>
        </div>

        <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={sparklineData.accounts}>
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
          <Award size={18} />
        </div>
      </div>

      {/* Return Rate */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${
        darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="space-y-1.5 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'en' ? 'Logistics Return Rate' : 'معدل المرتجعات اللوجستية'}
          </p>
          <h3 className={`text-xl font-black ${metrics.returnRate > 5 ? 'text-rose-500' : 'text-amber-500'}`}>
            {metrics.returnRate}%
          </h3>
          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            {metrics.returnRate > 5 ? (language === 'en' ? 'Attention required' : 'مطلوب مراجعة') : (language === 'en' ? 'Acceptable' : 'معدل مقبول')}
          </p>
        </div>

        <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={sparklineData.returns}>
              <Line type="monotone" dataKey="value" stroke={metrics.returnRate > 5 ? '#f43f5e' : '#f59e0b'} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`p-2 rounded-xl ${metrics.returnRate > 5 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <ShieldAlert size={18} />
        </div>
      </div>
    </div>
  );
};
