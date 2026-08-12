import React from 'react';
import { Brain, BriefcaseBusiness, Megaphone, BarChart3, FileSearch, Flame, ChevronRight, Info } from 'lucide-react';
import opportunityAlerts from '../../data/opportunity_alerts.json';

interface OpportunityRadarProps {
  darkMode: boolean;
  language: 'en' | 'ar';
  radarTab: 'all' | 'high' | 'market' | 'hiring';
  setRadarTab: (tab: 'all' | 'high' | 'market' | 'hiring') => void;
  totalEstValue: number;
}

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({
  darkMode,
  language,
  radarTab,
  setRadarTab,
  totalEstValue
}) => {
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
      {/* Heuristic Methodology Banner */}
      <div className={`p-2.5 px-3 mb-4 rounded-xl border text-[10px] flex items-center gap-2 ${
        darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
      }`}>
        <Info size={13} className="shrink-0" />
        <span>
          {language === 'en'
            ? 'Methodology Note: Opportunity confidence scores use an explainable heuristic (growth rate + category co-purchase frequency) evaluated on synthetic ledgers.'
            : 'ملاحظة المنهجية: تعتمد درجات ثقة الفرص على معادلة توضيحية تقارن معدل النمو والتكرار المشترك للمشتريات.'}
        </span>
      </div>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-4 mb-5`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Brain size={18} className="text-emerald-500" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'AI Growth & Cross-Selling Opportunity Radar' : 'رادار الفرص ومؤشرات النمو الذكي'}
            </h3>
            <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'en'
                ? `${opportunityAlerts.length} active intelligence signals · Powered by Apex AI Engine`
                : `${opportunityAlerts.length} إشارة استخباراتية نشطة · مدعوم بمحرك الذكاء الاصطناعي Apex`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/20">
            ● {language === 'en' ? 'Live Signals' : 'إشارات حية'}
          </span>
          <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border ${
            darkMode ? 'border-slate-700 text-slate-400 bg-slate-900/40' : 'border-slate-200 text-slate-500 bg-slate-50'
          }`}>
            {language === 'en' ? 'Updated: Today' : 'آخر تحديث: اليوم'}
          </span>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: language === 'en' ? 'High Priority' : 'أولوية عالية',
            value: opportunityAlerts.filter((a: any) => a.priority === 'High' || a.status === 'Urgent').length,
            color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20'
          },
          {
            label: language === 'en' ? 'Medium Priority' : 'أولوية متوسطة',
            value: opportunityAlerts.filter((a: any) => a.priority === 'Medium').length,
            color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20'
          },
          {
            label: language === 'en' ? 'Total Est. Value' : 'إجمالي القيمة المتوقعة',
            value: `EGP ${(totalEstValue / 1000000).toFixed(1)}M`,
            color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20'
          },
          {
            label: language === 'en' ? 'Avg. Confidence' : 'متوسط الثقة',
            value: `${Math.round(opportunityAlerts.reduce((s: number, a: any) => s + a.confidence, 0) / opportunityAlerts.length)}%`,
            color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20'
          }
        ].map((stat, i) => (
          <div key={i} className={`p-3 rounded-xl border ${stat.bg} ${darkMode ? 'border-opacity-30' : ''}`}>
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className={`flex gap-1 mb-5 p-1 rounded-xl border w-fit ${
        darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
      }`}>
        {([
          { key: 'all', label: language === 'en' ? 'All Signals' : 'الكل' },
          { key: 'high', label: language === 'en' ? 'High Priority' : 'أولوية عالية' },
          { key: 'hiring', label: language === 'en' ? 'Hiring Signals' : 'توظيف' },
          { key: 'market', label: language === 'en' ? 'Market Intel' : 'استخبارات السوق' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setRadarTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              radarTab === tab.key
                ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-[#191342] text-white shadow')
                : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Signal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {opportunityAlerts
          .filter((alert: any) => {
            if (radarTab === 'high') return alert.priority === 'High' || alert.status === 'Urgent';
            if (radarTab === 'hiring') return alert.sourceType === 'hiring';
            if (radarTab === 'market') return alert.sourceType === 'market' || alert.sourceType === 'announcement' || alert.sourceType === 'tender';
            return true;
          })
          .map((alert: any) => {
            const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
              High: { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' },
              Medium: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-500' },
              Low: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/25', dot: 'bg-slate-400' },
            };
            const urgentConfig = { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' };
            const pc = alert.status === 'Urgent' ? urgentConfig : (priorityConfig[alert.priority || 'Low'] || priorityConfig['Low']);

            const sourceIconMap: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; style: string }> = {
              hiring: { icon: BriefcaseBusiness, label: 'Career Board', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
              announcement: { icon: Megaphone, label: 'PR News Feed', style: 'bg-amber-500/10 text-amber-500 border-amber-500/25' },
              market: { icon: BarChart3, label: 'Industry Report', style: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
              tender: { icon: FileSearch, label: 'Ministry Tender', style: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
            };
            const srcKey = alert.sourceType || 'market';
            const src = sourceIconMap[srcKey] || sourceIconMap['market'];
            const SrcIcon = src.icon;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  darkMode ? 'bg-slate-900/50 border-slate-800 hover:border-slate-600' : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold rounded-md border ${src.style}`}>
                      <SrcIcon size={9} />{src.label}
                    </span>
                    {alert.status === 'Urgent' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-[8px] font-black rounded-md bg-rose-500 text-white animate-pulse">
                        <Flame size={8} /> URGENT
                      </span>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-black rounded-full border ${pc.bg} ${pc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                    {alert.priority}
                  </span>
                </div>

                {/* Company + Title */}
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {alert.company}
                  </p>
                  <h4 className={`text-xs font-bold leading-snug ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {alert.title}
                  </h4>
                </div>

                {/* Description */}
                <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {alert.desc}
                </p>

                {/* Suggested Products */}
                <div className="flex flex-wrap gap-1.5">
                  {alert.suggestedProducts?.map((product: string, pi: number) => (
                    <span key={pi} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-bold">
                      {product}
                    </span>
                  ))}
                </div>

                {/* Footer: Est. Value + Confidence + Date */}
                <div className={`flex justify-between items-center pt-2 border-t ${
                  darkMode ? 'border-slate-700/60' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {language === 'en' ? 'Est. Value' : 'القيمة المتوقعة'}
                      </p>
                      <p className={`text-[10px] font-black ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                        {alert.estimatedValue}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {language === 'en' ? 'AI Confidence' : 'ثقة الذكاء'}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className={`w-16 h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${alert.confidence}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-emerald-500">{alert.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[8px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{alert.date}</p>
                    <button className="flex items-center gap-0.5 text-[9px] font-black text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-wider mt-0.5">
                      {language === 'en' ? 'Pitch' : 'عرض'} <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
