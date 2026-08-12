import React from 'react';
import { BookOpen, Compass, Percent, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, CartesianGrid, Bar } from 'recharts';

interface BrandMarketingProps {
  t: Record<string, string>;
  language: 'en' | 'ar';
  darkMode: boolean;
  brandType: 'nova' | 'zenith';
}

export const BrandMarketing: React.FC<BrandMarketingProps> = ({
  t,
  language,
  darkMode,
  brandType
}) => {
  const isEn = language === 'en';

  if (brandType === 'nova') {
    return (
      <div className="space-y-6">
        {/* Highlights grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
            <div className="text-2xl font-black text-orange-500">0%</div>
            <p className="text-[10px] text-slate-400 mt-1">Nova Smoozy price inflation from retail to Q-commerce delivery apps.</p>
          </div>
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
            <div className="text-2xl font-black text-rose-500">+54%</div>
            <p className="text-[10px] text-slate-400 mt-1">Nescafé Q-commerce markup versus retail store shelf pricing.</p>
          </div>
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
            <div className="text-2xl font-black text-yellow-500">3 / 10</div>
            <p className="text-[10px] text-slate-400 mt-1">Nova traditional/POS ad spend score – the key brand visibility gap.</p>
          </div>
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
            <div className="text-2xl font-black text-emerald-500">18 mo</div>
            <p className="text-[10px] text-slate-400 mt-1">Nova Smoozy dry-sachet shelf life versus Osterberg's perishability.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Executive Summary */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-orange-500" />
              <span>{t.marketingInsights}</span>
            </h3>
            <div className="text-xs leading-relaxed space-y-3 text-slate-400">
              <p>
                Nova Drinks enters an instant café category that Nescafé still dominates by sheer weight of spend, but the underlying data points to an opening rather than a wall. Across seven brands and three formats — instant coffee sachets, frappé mixes, and fruit smoothies — the market splits cleanly into two behaviours: legacy players that pass Q-commerce fees straight onto the consumer, and a smaller group, Nova included, that has chosen to absorb them.
              </p>
              <p>
                On pricing, <strong>Nova Frappit</strong> and <strong>Nova Smoozy</strong> carry the flattest retail-to-Q-commerce curve in the set (4.8% and 0%, respectively), while Nescafé's basket inflates by 54% and Ali Café by 40% the moment a shopper orders through Talabat instead of a supermarket shelf. On format, Nova Smoozy is the only smoothie SKU in a spill-proof, shelf-stable sachet — a direct answer to Osterberg's 1-litre glass bottle, which requires refrigeration and a measuring step. On spend, Nova's digital score (7/10) is competitive, but its traditional/POS score (3/10) trails every major competitor except Osterberg, leaving physical point-of-sale visibility as the primary growth lever.
              </p>
            </div>
          </div>

          {/* Market Overview */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Compass size={16} className="text-orange-500" />
              <span>{language === 'en' ? '2. Market Overview & Consumer Trends' : '٢. نظرة عامة على السوق واتجاهات المستهلك'}</span>
            </h3>
            <div className="text-xs leading-relaxed space-y-3 text-slate-400">
              <p>
                Egypt's instant beverage shelf has quietly split into three tiers. At the base sits the commodity 3-in-1 sachet (Nescafé and Ali Café) built for volume and habit, priced to be impulse-cheap in supermarkets but heavily marked up on delivery apps. Above that sits a café-replication tier (Abu Auf, Hintz, Cilantro) chasing the at-home flat white and frappé occasion with premium profiles, jar formats, and Q-commerce prices north of 30 EGP per serving. Nova Drinks was built to sit inside that second tier on flavour credibility (Pistachio, Spanish Latte, zero-sugar variants) while maintaining the cost structure of the first.
              </p>
              <p>
                In cold beverages, Osterberg's fruit concentrate owns supermarket shelf space, but carries high logistics drag (cold-chain, short shelf-life). Nova Smoozy's dry sachet format sidesteps these constraints and is the only smoothie SKU priced identically across retail and e-commerce channels.
              </p>
            </div>
          </div>
        </div>

        {/* Omnichannel Pricing Matrix */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className="text-xs font-black uppercase tracking-wider mb-1">{t.omnichannelPricing}</h3>
          <p className="text-[9px] text-slate-400 mb-4">{t.pricingSubtitle}</p>
          <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                  <th className="p-3">{t.sku}</th>
                  <th className="p-3">{t.size}</th>
                  <th className="p-3 text-right">{t.retailPrice}</th>
                  <th className="p-3 text-right">{t.qcomPrice}</th>
                  <th className="p-3 text-right">{t.inflation}</th>
                  <th className="p-3 text-right">{t.pricePerGram}</th>
                  <th className="p-3">{t.formatFriction}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Nova Koffi", size: "25g", retail: "18.00 EGP", qcom: "20.95 EGP", inflation: "+16.4%", type: "warning", perG: "0.72 EGP", friction: "None - sachet" },
                  { name: "Nova Frappit", size: "35g", retail: "20.00 EGP", qcom: "20.95 EGP", inflation: "+4.8%", type: "safe", perG: "0.57 EGP", friction: "None - sachet" },
                  { name: "Nova Smoozy", size: "40g", retail: "15.00 EGP", qcom: "15.00 EGP", inflation: "0%", type: "safe", perG: "0.38 EGP", friction: "None - sachet" },
                  { name: "Nescafe 3-in-1", size: "20g", retail: "12.00 EGP", qcom: "18.50 EGP", inflation: "+54.2%", type: "danger", perG: "0.60 EGP", friction: "None - sachet" },
                  { name: "Ali Cafe", size: "20g", retail: "10.00 EGP", qcom: "14.00 EGP", inflation: "+40.0%", type: "danger", perG: "0.50 EGP", friction: "None - sachet" },
                  { name: "Abu Auf Iced Coffee Mix", size: "30g", retail: "25.00 EGP", qcom: "32.00 EGP", inflation: "+28.0%", type: "danger", perG: "0.83 EGP", friction: "None - sachet" },
                  { name: "Hintz Iced Coffee", size: "25g", retail: "35.00 EGP", qcom: "45.00 EGP", inflation: "+28.6%", type: "danger", perG: "1.40 EGP", friction: "Scooping from jar" },
                ].map((row, idx) => {
                  const badge = row.type === 'safe' ? 'text-emerald-500' : row.type === 'warning' ? 'text-amber-500' : 'text-rose-500';
                  const isNova = row.name.startsWith("Nova");
                  return (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} ${isNova ? 'bg-orange-500/5 font-semibold' : ''}`}>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">{row.size}</td>
                      <td className="p-3 text-right">{row.retail}</td>
                      <td className="p-3 text-right">{row.qcom}</td>
                      <td className={`p-3 text-right font-bold ${badge}`}>{row.inflation}</td>
                      <td className="p-3 text-right">{row.perG}</td>
                      <td className="p-3">{row.friction}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sentiment splits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Percent size={16} className="text-orange-500" />
              <span>{language === 'en' ? 'Share of Voice (Egypt Social Media & Search)' : 'حصة التغطية الإعلامية (مواقع التواصل والبحث في مصر)'}</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Nescafé', value: 48, color: '#64748b' },
                      { name: 'Bonjorno', value: 22, color: '#94a3b8' },
                      { name: 'Nova Drinks (Our)', value: 18, color: '#f97316' },
                      { name: 'Abu Auf', value: 12, color: '#cbd5e1' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {[
                      { color: '#64748b' },
                      { color: '#94a3b8' },
                      { color: '#f97316' },
                      { color: '#cbd5e1' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                    itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                    formatter={(value) => [`${value}%`, isEn ? 'Share of Voice' : 'حصة التغطية']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <span>{language === 'en' ? 'Consumer Sentiment Splits (Egypt Market)' : 'تحليل انطباعات المستهلكين (السوق المصري)'}</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={[
                    { name: 'Nova (Our)', Positive: 78, Neutral: 14, Negative: 8 },
                    { name: 'Nescafé', Positive: 55, Neutral: 35, Negative: 10 },
                    { name: 'Bonjorno', Positive: 48, Neutral: 42, Negative: 10 },
                    { name: 'Abu Auf', Positive: 68, Neutral: 22, Negative: 10 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="Positive" stackId="a" fill="#10b981" name={isEn ? 'Positive' : 'إيجابي'} />
                  <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" name={isEn ? 'Neutral' : 'حيادي'} />
                  <Bar dataKey="Negative" stackId="a" fill="#ef4444" name={isEn ? 'Negative' : 'سلبي'} />
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
      {/* Highlights grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
          <div className="text-2xl font-black text-violet-500">0%</div>
          <p className="text-[10px] text-slate-400 mt-1">Zenith Harissa price markup on Q-Commerce platforms vs retail store shelf.</p>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
          <div className="text-2xl font-black text-rose-500">+58%</div>
          <p className="text-[10px] text-slate-400 mt-1">Heinz Harissa markup on delivery apps vs standard retail pricing.</p>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
          <div className="text-2xl font-black text-yellow-500">12g</div>
          <p className="text-[10px] text-slate-400 mt-1">Only sub-150g sachet size offered in the Egyptian garlic market.</p>
        </div>
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
          <div className="text-2xl font-black text-violet-600">4 / 10</div>
          <p className="text-[10px] text-slate-400 mt-1">Zenith traditional/POS ad spend score – the key brand visibility gap.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executive Summary */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={16} className="text-violet-500" />
            <span>{t.marketingInsights}</span>
          </h3>
          <div className="text-xs leading-relaxed space-y-3 text-slate-400">
            <p>
              Zenith Foods enters Egypt's premium culinary paste and condiment category, competing against large international and local legacy players (Heinz, Harvest, Vitrac). The B2C analytics highlight strong performance in niche segments (such as Zenith Harissa and specialty Garlic Pastes), but traditional supermarket shelf presence remains highly contested.
            </p>
            <p>
              By keeping the e-commerce to retail pricing curve flat, Zenith has captured a highly active Q-commerce demographic that relies on rapid delivery apps. To sustain this trajectory, expanding physical distribution networks and point-of-sale visibility is identified as the highest priority growth vector.
            </p>
          </div>
        </div>

        {/* Market Overview */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <Compass size={16} className="text-violet-500" />
            <span>{language === 'en' ? '2. Market Overview & Consumer Trends' : '٢. نظرة عامة على السوق واتجاهات المستهلك'}</span>
          </h3>
          <div className="text-xs leading-relaxed space-y-3 text-slate-400">
            <p>
              Egyptian consumers are increasingly switching from raw, unpackaged ingredients to clean, pre-packaged pastes for convenience. In particular, pre-crushed Garlic pastes and ready-to-use Harissa paste have experienced significant double-digit volume growth in urban governorates.
            </p>
            <p>
              Zenith is uniquely positioned to capture this shift by offering single-use, high-barrier sachet formats (12g-30g) that preserve flavor and freshness without the need for large jar packaging or refrigeration before opening.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
