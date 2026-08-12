import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface LostDecliningTablesProps {
  darkMode: boolean;
  language: 'en' | 'ar';
  healthMatrix: {
    lost: any[];
    declining: any[];
    partialChurn: any[];
  };
}

export const LostDecliningTables: React.FC<LostDecliningTablesProps> = ({
  darkMode,
  language,
  healthMatrix
}) => {
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
      <div className="mb-4">
        <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          <ShieldAlert size={16} className="text-amber-500" />
          {language === 'en' ? 'Customer Health & Attrition Matrix' : 'مصفوفة صحة العملاء وتراجع المبيعات'}
        </h3>
        <p className="text-[10px] text-slate-400 mt-1">
          {language === 'en' ? 'Accounts lost (inactive 180D+) or displaying critical volume decline (>50% last 3 months).' : 'الحسابات المفقودة (غير نشطة +١٨٠ يوم) أو التي تظهر تراجعاً حرجاً (>٥٠٪ في آخر ٣ أشهر).'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lost Accounts */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-rose-500">{language === 'en' ? 'Lost Customer Accounts' : 'حسابات العملاء المفقودة'}</h4>
          <div className="space-y-2">
            {healthMatrix.lost.slice(0, 4).map((c, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-rose-950/15 border-rose-900/40 text-rose-300' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                <div>
                  <span className="font-bold text-xs block">{c.name}</span>
                  {c.customerCode && c.customerCode !== 'N/A' && (
                    <span className="text-[10px] text-rose-500 font-mono font-medium block">
                      Code: {c.customerCode}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Last Purchase:' : 'آخر شراء:'} {c.lastPurchase}</span>
                </div>
                <span className="font-semibold text-xs text-rose-500">{(c.lostValue/1000).toFixed(0)}k Qty</span>
              </div>
            ))}
            {healthMatrix.lost.length === 0 && (
              <p className="text-slate-400 text-xs italic">{language === 'en' ? 'All accounts healthy!' : 'جميع الحسابات نشطة وسليمة!'}</p>
            )}
          </div>
        </div>

        {/* Declining Accounts */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-500">{language === 'en' ? 'Volume Attrition Accounts (>50% Decline)' : 'الحسابات التي تظهر تراجعاً كبيراً (>٥٠٪)'}</h4>
          <div className="space-y-2">
            {healthMatrix.declining.slice(0, 4).map((c, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                <div>
                  <span className="font-bold text-xs block">{c.name}</span>
                  {c.customerCode && c.customerCode !== 'N/A' && (
                    <span className="text-[10px] text-amber-500 font-mono font-medium block">
                      Code: {c.customerCode}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Volume drop:' : 'تراجع الحجم:'} -{c.dropPercent}%</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-xs text-amber-500">{c.recentVol.toLocaleString()} Qty</span>
                </div>
              </div>
            ))}
            {healthMatrix.declining.length === 0 && (
              <p className="text-slate-400 text-xs italic">{language === 'en' ? 'No clients showing volume drop.' : 'لا توجد حسابات تظهر تراجعاً في السحب.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
