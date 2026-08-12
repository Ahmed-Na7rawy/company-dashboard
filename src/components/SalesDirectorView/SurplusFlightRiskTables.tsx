import React from 'react';
import { Boxes, ShieldAlert } from 'lucide-react';

interface SurplusFlightRiskTablesProps {
  darkMode: boolean;
  language: 'en' | 'ar';
  pushToSellItems: any[];
  flightRiskAlerts: any[];
  pagedFlightAlerts: any[];
  flightRiskFilter: 'All' | 'Critical' | 'Medium';
  setFlightRiskFilter: React.Dispatch<React.SetStateAction<'All' | 'Critical' | 'Medium'>>;
  flightRiskPage: number;
  setFlightRiskPage: React.Dispatch<React.SetStateAction<number>>;
  totalFlightRiskPages: number;
  filteredFlightAlerts: any[];
  showToast: (params: any) => void;
}

export const SurplusFlightRiskTables: React.FC<SurplusFlightRiskTablesProps> = ({
  darkMode,
  language,
  pushToSellItems,
  flightRiskAlerts,
  pagedFlightAlerts,
  flightRiskFilter,
  setFlightRiskFilter,
  flightRiskPage,
  setFlightRiskPage,
  totalFlightRiskPages,
  filteredFlightAlerts,
  showToast
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Push-to-Sell Inventory Opportunities */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="mb-4">
          <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <Boxes size={16} className="text-emerald-500" />
            {language === 'en' ? 'S&OP Push-to-Sell Inventory Opportunities' : 'مؤشرات التصفية وفرص ترويج المخزون الزائد'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {language === 'en' 
              ? 'Excess stock SKUs (> 1.5x safety stock). Suggested margin discounts to accelerate shelf clearing.' 
              : 'الأصناف التي تتجاوز حد الأمان بـ ١.٥ ضعف. التخفيضات المقترحة لتسريع تصريف البضائع.'}
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                <th className="p-3 text-right">{language === 'en' ? 'Excess Qty' : 'حجم الفائض'}</th>
                <th className="p-3 text-center">{language === 'en' ? 'Discount' : 'الخصم المقترح'}</th>
                <th className="p-3 text-center no-print">{language === 'en' ? 'Action' : 'إجراء'}</th>
              </tr>
            </thead>
            <tbody>
              {pushToSellItems.map((item, idx) => (
                <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                  <td className="p-3 font-bold">
                    <div>{item.name}</div>
                    {item.materialCode && item.materialCode !== 'N/A' && (
                      <span className="text-[10px] text-indigo-400 font-mono font-medium block">
                        Code: {item.materialCode} | UoM: {item.uom}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold text-amber-500">{item.excessQty.toLocaleString()}</td>
                  <td className="p-3 text-center font-extrabold text-emerald-500">{item.discount}%</td>
                  <td className="p-3 text-center no-print">
                    <button
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        const text = btn.innerText;
                        btn.innerText = language === 'en' ? 'Pushed ✓' : 'تم الإرسال ✓';
                        btn.disabled = true;
                        showToast({
                          type: 'success',
                          title: language === 'en' ? 'Surplus Clearance Deal Pushed' : 'تم إرسال العرض الترويجي',
                          message: language === 'en' 
                            ? `Deal for ${item.name} dispatched to all sales reps!` 
                            : `تم توزيع عرض صنف ${item.name} لجميع مندوبي المبيعات!`
                        });
                        setTimeout(() => {
                          btn.innerText = text;
                          btn.disabled = false;
                        }, 2000);
                      }}
                      className="px-2 py-0.5 bg-[#128d46] text-white rounded text-[8px] hover:bg-emerald-600 transition-colors uppercase font-bold disabled:opacity-75"
                    >
                      {language === 'en' ? 'Push Deal' : 'إرسال العرض'}
                    </button>
                  </td>
                </tr>
              ))}
              {pushToSellItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    {language === 'en' ? 'No excess stock currently detected.' : 'لا يوجد بضاعة زائدة عن حد الأمان حالياً.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive Flight Risk Alerts */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between`}>
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                <ShieldAlert size={16} className="text-rose-500" />
                {language === 'en' ? 'Predictive Customer Flight Risk Alerts' : 'التنبؤ الذكي بمخاطر فقدان العملاء وتأخر الطلبات'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'en' 
                  ? 'Accounts exceeding 1.5x or 2.5x of their historical order cycle frequency.' 
                  : 'الحسابات التي تتخطى فترات شرائها المعتادة بمقدار ١.٥ ضعف أو ٢.٥ ضعف.'}
              </p>
            </div>

            {/* Severity Filter Tabs */}
            <div className="flex gap-1 no-print select-none text-[9px] font-bold">
              <button
                onClick={() => { setFlightRiskFilter('All'); setFlightRiskPage(0); }}
                className={`px-2 py-0.5 rounded transition-all border ${
                  flightRiskFilter === 'All'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 border-transparent shadow'
                    : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
              >
                {language === 'en' ? 'All' : 'الكل'} ({flightRiskAlerts.length})
              </button>
              <button
                onClick={() => { setFlightRiskFilter('Critical'); setFlightRiskPage(0); }}
                className={`px-2 py-0.5 rounded transition-all border ${
                  flightRiskFilter === 'Critical'
                    ? 'bg-rose-500 text-white border-rose-500 shadow'
                    : 'text-rose-400 border-slate-200 dark:border-slate-800 hover:text-rose-500'
                }`}
              >
                {language === 'en' ? 'Critical' : 'حرجة'} ({flightRiskAlerts.filter(a => a.color === 'rose').length})
              </button>
              <button
                onClick={() => { setFlightRiskFilter('Medium'); setFlightRiskPage(0); }}
                className={`px-2 py-0.5 rounded transition-all border ${
                  flightRiskFilter === 'Medium'
                    ? 'bg-amber-500 text-white border-amber-500 shadow'
                    : 'text-amber-500 border-slate-200 dark:border-slate-800 hover:text-amber-500'
                }`}
              >
                {language === 'en' ? 'Medium' : 'متوسطة'} ({flightRiskAlerts.filter(a => a.color === 'amber').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Customer Account' : 'حساب العميل'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Order Cycle' : 'دورة الطلب المعتادة'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Inactivity' : 'مدة الغياب'}</th>
                  <th className="p-3 text-center">{language === 'en' ? 'Risk Status' : 'مستوى الخطر'}</th>
                  <th className="p-3 text-center no-print">{language === 'en' ? 'Action' : 'إجراء'}</th>
                </tr>
              </thead>
              <tbody>
                {pagedFlightAlerts.map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                    <td className="p-3 font-bold">
                      <div>{item.name}</div>
                      {item.customerCode && item.customerCode !== 'N/A' && (
                        <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                          Code: {item.customerCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">{item.avgCycle} {language === 'en' ? 'Days' : 'أيام'}</td>
                    <td className="p-3 text-right font-semibold text-rose-500">{item.recencyDays} {language === 'en' ? 'Days' : 'يوم'} ({item.multiplier}x)</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        item.color === 'rose' 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {item.risk}
                      </span>
                    </td>
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={(e) => {
                          const btn = e.currentTarget;
                          const text = btn.innerText;
                          btn.innerText = language === 'en' ? 'Scheduled ✓' : 'تم التحديد ✓';
                          btn.disabled = true;
                          showToast({
                            type: 'info',
                            title: language === 'en' ? 'Review Call Scheduled' : 'تم تحديد مكالمة المراجعة',
                            message: language === 'en'
                              ? `Direct review call scheduled for ${item.name}. Rep notified.`
                              : `تم تحديد موعد لمكالمة مراجعة مع ${item.name} وإشعار المندوب.`
                          });
                          setTimeout(() => {
                            btn.innerText = text;
                            btn.disabled = false;
                          }, 2000);
                        }}
                        className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[8px] hover:bg-indigo-600 transition-colors uppercase font-bold disabled:opacity-75"
                      >
                        {language === 'en' ? 'Review' : 'مراجعة'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredFlightAlerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      {language === 'en' ? 'No high flight-risk accounts identified for this filter.' : 'لا توجد حسابات معرضة للفقدان لهذا الفلتر حالياً.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalFlightRiskPages > 1 && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 no-print select-none text-[10px] font-bold text-slate-500">
            <button
              disabled={flightRiskPage === 0}
              onClick={() => setFlightRiskPage(p => Math.max(0, p - 1))}
              className={`px-3 py-1 rounded-lg border transition-all ${
                flightRiskPage === 0
                  ? 'text-slate-300 border-slate-100 dark:text-slate-700 dark:border-slate-800/60 cursor-not-allowed'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-600'
              }`}
            >
              {language === 'en' ? 'Previous' : 'السابق'}
            </button>
            <span>
              {language === 'en'
                ? `Page ${flightRiskPage + 1} of ${totalFlightRiskPages}`
                : `الصفحة ${flightRiskPage + 1} من ${totalFlightRiskPages}`}
            </span>
            <button
              disabled={flightRiskPage >= totalFlightRiskPages - 1}
              onClick={() => setFlightRiskPage(p => Math.min(totalFlightRiskPages - 1, p + 1))}
              className={`px-3 py-1 rounded-lg border transition-all ${
                flightRiskPage >= totalFlightRiskPages - 1
                  ? 'text-slate-300 border-slate-100 dark:text-slate-700 dark:border-slate-800/60 cursor-not-allowed'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-600'
              }`}
            >
              {language === 'en' ? 'Next' : 'التالي'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
