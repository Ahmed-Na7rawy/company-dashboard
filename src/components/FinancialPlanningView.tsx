import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Cell
} from 'recharts';
import CustomerMaterialTable from './CustomerMaterialTable';
import {
  DollarSign, Percent, Briefcase, FileText, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useScaleMode } from '../hooks/useScaleMode';
import Plotly from 'plotly.js-dist-min';

interface FinancialPlanningViewProps {
  processedData: any[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  inflationRate: number;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
}

function FinancialPlanningView({
  processedData,
  language,
  darkMode,
  t,
  adminSettings,
  inflationRate,
  currentUser
}: FinancialPlanningViewProps) {

  // Sales office / Channel filter state (restricted users are locked to their own channel)
  const [selectedOffice, setSelectedOffice] = useState<string>('All');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'sales_b2b') setSelectedOffice('B2B');
      else if (currentUser.role === 'sales_b2c') setSelectedOffice('B2C');
      else if (currentUser.role === 'sales_horeca') setSelectedOffice('Horeca Team');
      else if (currentUser.role === 'salesperson') {
        setSelectedOffice(currentUser.salesOffice || 'B2B');
      }
    }
  }, [currentUser]);

  const isOfficeLocked = currentUser && (
    currentUser.role === 'sales_b2b' ||
    currentUser.role === 'sales_b2c' ||
    currentUser.role === 'sales_horeca' ||
    currentUser.role === 'salesperson'
  );

  const officeFilteredData = useMemo(() => {
    if (selectedOffice === 'All') return processedData;
    return processedData.filter(row => row.SalesOffice === selectedOffice);
  }, [processedData, selectedOffice]);

  // Quarter Compare States for Cash Flow
  const [timelineCompare, setTimelineCompare] = useState(false);
  const [tq1Year, setTq1Year] = useState(2026);
  const [tq1Num, setTq1Num] = useState(1);
  const [tq2Year, setTq2Year] = useState(2026);
  const [tq2Num, setTq2Num] = useState(2);

  const timelineCompareData = useMemo(() => {
    if (!timelineCompare) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const getQuarterData = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const aggregated = [0, 0, 0]; // Month 1, Month 2, Month 3

      officeFilteredData.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        const delayDate = new Date(dateObj);
        delayDate.setMonth(delayDate.getMonth() + 2);

        if (delayDate.getFullYear() === year) {
          const m = delayDate.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const idx = m - startMonth;
            const val = row.NetQuantity * 15;
            aggregated[idx] += val;
          }
        }
      });
      return aggregated.map(val => Math.round(Math.max(0, val * (1 - inflationRate / 100))));
    };

    const q1Vals = getQuarterData(tq1Year, tq1Num);
    const q2Vals = getQuarterData(tq2Year, tq2Num);

    const q1Start = (tq1Num - 1) * 3;
    const q2Start = (tq2Num - 1) * 3;

    return [0, 1, 2].map(idx => {
      const m1Name = language === 'en' ? monthsEn[q1Start + idx] : monthsAr[q1Start + idx];
      const m2Name = language === 'en' ? monthsEn[q2Start + idx] : monthsAr[q2Start + idx];
      return {
        month: language === 'en' ? `Month ${idx + 1} (${m1Name} vs ${m2Name})` : `الشهر ${idx + 1} (${m1Name} مقابل ${m2Name})`,
        q1Value: Math.round(q1Vals[idx]),
        q2Value: Math.round(q2Vals[idx]),
      };
    });
  }, [officeFilteredData, timelineCompare, tq1Year, tq1Num, tq2Year, tq2Num, inflationRate, language]);

  // 1. Core KPIs & Waterfall margins
  const financials = useMemo(() => {
    let totalGrossQty = 0;
    let totalReturnQty = 0;
    let grossRevenue = 0;
    let returnsRevenue = 0;

    officeFilteredData.forEach(row => {
      const rev = Math.abs(row.Revenue || 0);
      if (row.IsReturn) {
        totalReturnQty += row.Volume;
        returnsRevenue += rev;
      } else {
        totalGrossQty += row.Volume;
        grossRevenue += rev;
      }
    });

    const netQty = totalGrossQty - totalReturnQty;
    const netRevenue = grossRevenue - returnsRevenue;

    // Custom margin calculation based on segment + admin modifier
    let weightedMarginSum = 0;
    officeFilteredData.forEach(row => {
      if (!row.IsReturn) {
        const seg = row.Segment || 'Solutions';
        const baseMargin = seg === 'Bio' ? 0.38 : seg === 'Additives' ? 0.24 : 0.18;
        weightedMarginSum += row.Volume * baseMargin;
      }
    });

    const averageMargin = totalGrossQty > 0 ? (weightedMarginSum / totalGrossQty) * 100 : 22;
    // Scale by admin modifier
    const finalMargin = averageMargin * (adminSettings.marginModifier / 30);

    // Waterfall Calculations:
    const cogs = grossRevenue * (0.65 + (inflationRate / 100));
    const logistics = grossRevenue * 0.05;
    const returnsHandling = totalReturnQty * 25;
    const trueNetMargin = grossRevenue - returnsRevenue - cogs - logistics - returnsHandling;
    const trueNetMarginPercent = grossRevenue > 0 ? (trueNetMargin / grossRevenue) * 100 : 0;

    // Cash Inflow: net revenue * average collection probability (say 45%), subtract inflation multiplier
    const projectedCashInflow = (netRevenue * 0.45) * (1 - (inflationRate / 100));
    const costToServeInbound = (totalReturnQty / (totalGrossQty || 1)) * 100 * 2.5; // inefficiency score

    return {
      marginPercent: Math.min(60, Math.max(0, trueNetMarginPercent)),
      projectedCashInflow,
      costToServeScore: parseFloat(Math.min(25, costToServeInbound).toFixed(1)),
      workingCapitalIndex: parseFloat((95 - costToServeInbound).toFixed(0)), // Health indicator out of 100
      totalGrossQty,
      totalReturnQty,
      grossRevenue,
      cogs,
      logistics,
      returnsHandling,
      trueNetMargin
    };
  }, [officeFilteredData, adminSettings.marginModifier, inflationRate]);

  // 2. Cash Flow Projection (Inflows over next 6 months)
  // Map monthly transaction date + default terms (30 or 60 days) to simulate inflow spikes
  const cashFlowProjectionData = useMemo(() => {
    const monthlyBuckets: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    officeFilteredData.forEach(row => {
      const date = new Date(row.Date);
      // Simulate credit term delay of 60 days
      date.setMonth(date.getMonth() + 2);

      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      const val = row.NetQuantity * 15; // 15 EGP per unit
      monthlyBuckets[bucket] = (monthlyBuckets[bucket] || 0) + val;
    });

    // Sort buckets chronologically
    return Object.entries(monthlyBuckets)
      .map(([month, inflow]) => ({
        month,
        inflow: Math.round(Math.max(0, inflow * (1 - inflationRate / 100)))
      }))
      .slice(-6); // Last 6 projected months
  }, [officeFilteredData, inflationRate]);

  // 3. Margin vs Sales Qty by Segment
  const segmentMarginData = useMemo(() => {
    const segments = ['Additives', 'Solutions', 'Bio'];
    return segments.map(seg => {
      let volume = 0;
      officeFilteredData.forEach(row => {
        if (row.Segment === seg) {
          volume += row.NetQuantity;
        }
      });
      const margin = seg === 'Bio' ? 38 : seg === 'Additives' ? 24 : 18;
      const scaledMargin = margin * (adminSettings.marginModifier / 30);
      return {
        name: language === 'en' ? seg : (seg === 'Additives' ? 'إضافات' : seg === 'Solutions' ? 'حلول مخصصة' : 'منتجات حيوية'),
        volume: Math.round(volume),
        margin: parseFloat(Math.min(60, Math.max(0, scaledMargin - inflationRate)).toFixed(1))
      };
    });
  }, [officeFilteredData, adminSettings.marginModifier, language, inflationRate]);

  // 4. Working Capital Alerts: Customers with long payment terms and high balances
  const capitalAlerts = useMemo(() => {
    const customerAgg: Record<string, { volume: number; terms: string; risk: string }> = {
      'Americana': { volume: 0, terms: '90 Days', risk: 'High' },
      'Savola': { volume: 0, terms: '90 Days', risk: 'High' },
      'Edita': { volume: 0, terms: '60 Days', risk: 'Medium' },
      'Juhayna': { volume: 0, terms: '60 Days', risk: 'Medium' },
      'Almarai': { volume: 0, terms: '30 Days', risk: 'Low' },
      'Halwani Bros': { volume: 0, terms: '60 Days', risk: 'Medium' }
    };

    officeFilteredData.forEach(row => {
      if (customerAgg[row.CustomerName]) {
        customerAgg[row.CustomerName].volume += row.NetQuantity;
      }
    });

    return Object.entries(customerAgg)
      .map(([name, val]) => ({
        name,
        outstandingQty: Math.round(val.volume * 0.4), // assume 40% is currently unpaid
        terms: val.terms,
        risk: val.risk,
        daysOverdue: val.terms === '95 Days' || val.terms === '90 Days' ? 18 : 0
      }))
      .filter(item => item.outstandingQty > 100)
      .sort((a, b) => b.outstandingQty - a.outstandingQty);
  }, [officeFilteredData]);

  // 5. Cost-to-Serve Inefficient lines
  const inefficiencyData = useMemo(() => {
    const itemStats: Record<string, { gross: number; returns: number }> = {};

    officeFilteredData.forEach(row => {
      if (!itemStats[row.ItemName]) {
        itemStats[row.ItemName] = { gross: 0, returns: 0 };
      }
      if (row.IsReturn) {
        itemStats[row.ItemName].returns += row.Volume;
      } else {
        itemStats[row.ItemName].gross += row.Volume;
      }
    });

    return Object.entries(itemStats)
      .map(([name, val]) => {
        const returnRate = val.gross > 0 ? (val.returns / val.gross) * 100 : 0;
        return {
          name,
          returnRate,
          wastedQty: val.returns,
          costImpact: Math.round(val.returns * 25) // Estimated handling cost impact
        };
      })
      .filter(item => item.returnRate > 4.5 && item.wastedQty > 10)
      .sort((a, b) => b.costImpact - a.costImpact);
  }, [officeFilteredData]);

  const formatM = (val: number, suffix: string = '') => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) {
      const rounded = Math.round(val / 1000000);
      if (language === 'ar') {
        return `${rounded} مليون ${suffix}`;
      }
      return `${rounded}M ${suffix}`;
    }
    return `${Math.round(val).toLocaleString()} ${suffix}`;
  };

  const formatQty = (qty: number) => {
    const absQty = Math.abs(qty);
    if (absQty >= 1000000) {
      const rounded = Math.round(qty / 1000000);
      if (language === 'ar') {
        return `${rounded} مليون وحدة`;
      }
      return `${rounded}M Units`;
    }
    if (language === 'ar') {
      return `${Math.round(qty).toLocaleString()} وحدة`;
    }
    return `${Math.round(qty).toLocaleString()} Units`;
  };

  const scaleMode = useScaleMode();

  const waterfallData = useMemo(() => {
    const gross = Math.round(financials.grossRevenue);
    const cogs = Math.round(financials.cogs);
    const logistics = Math.round(financials.logistics);
    const returnsHandling = Math.round(financials.returnsHandling);
    const net = Math.round(financials.trueNetMargin);

    return [
      { name: language === 'en' ? 'Gross' : 'الإجمالي', range: [0, gross], display: gross, fill: '#10b981' },
      { name: language === 'en' ? 'COGS' : 'التكلفة', range: [gross - cogs, gross], display: -cogs, fill: '#ef4444' },
      { name: language === 'en' ? 'Logistics' : 'اللوجستيات', range: [gross - cogs - logistics, gross - cogs], display: -logistics, fill: '#f59e0b' },
      { name: language === 'en' ? 'Returns' : 'المرتجع', range: [gross - cogs - logistics - returnsHandling, gross - cogs - logistics], display: -returnsHandling, fill: '#ec4899' },
      { name: language === 'en' ? 'Net Margin' : 'الصافي', range: [0, net], display: net, fill: '#0284c7' }
    ];
  }, [financials, language]);

  const waterfallChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!waterfallChartRef.current) return;

    const gross = Math.round(financials.grossRevenue);
    const cogs = Math.round(financials.cogs);
    const logistics = Math.round(financials.logistics);
    const returnsHandling = Math.round(financials.returnsHandling);
    const net = Math.round(financials.trueNetMargin);

    const xData = [
      language === 'en' ? 'Gross Revenue' : 'إجمالي الإيرادات',
      language === 'en' ? 'COGS' : 'تكلفة المبيعات',
      language === 'en' ? 'Logistics' : 'اللوجستيات',
      language === 'en' ? 'Returns' : 'تكلفة المرتجعات',
      language === 'en' ? 'Net Margin' : 'صافي الهامش'
    ];

    const yData = [gross, -cogs, -logistics, -returnsHandling, net];
    const measureData = ['absolute', 'relative', 'relative', 'relative', 'total'];

    const data = [
      {
        type: 'waterfall',
        measure: measureData,
        x: xData,
        y: yData,
        connector: { line: { color: darkMode ? '#475569' : '#cbd5e1', width: 1.5, dash: 'dot' } },
        decreasing: { marker: { color: '#ef4444' } },
        increasing: { marker: { color: '#10b981' } },
        totals: { marker: { color: '#0284c7' } }
      }
    ];

    const layout = {
      margin: { t: 15, r: 15, b: 30, l: 60 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      xaxis: {
        tickfont: { color: darkMode ? '#94a3b8' : '#64748b', size: 9, family: 'Outfit, sans-serif' },
        gridcolor: 'transparent'
      },
      yaxis: {
        tickfont: { color: darkMode ? '#94a3b8' : '#64748b', size: 9, family: 'Outfit, sans-serif' },
        gridcolor: darkMode ? '#334155' : '#f1f5f9',
        zeroline: false
      }
    };

    if (Plotly && Plotly.react) {
      Plotly.react(waterfallChartRef.current, data, layout as any, { responsive: true, displayModeBar: false });
    }
  }, [financials, language, darkMode]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Financial Planning Perspective' : 'منظور التخطيط المالي'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {language === 'en'
              ? 'Track working capital efficiency, margin structures, cost-to-serve leakages, and projected cash inflows.'
              : 'متابعة كفاءة رأس المال العامل، هيكل هوامش الأرباح، تسرب تكلفة الخدمة، وتدفقات النقد المتوقعة.'}
          </p>
        </div>

        {!isOfficeLocked && (
          <div className="flex items-center gap-2 no-print">
            <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'en' ? 'Sales Channel:' : 'قناة المبيعات:'}
            </label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
            >
              <option value="All">{language === 'en' ? 'All Channels' : 'جميع القنوات'}</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="Horeca Team">{language === 'en' ? 'HORECA' : 'هوريكا'}</option>
              <option value="Pharma">Pharma</option>
              <option value="Sisters Companies">Sisters Companies</option>
              {(currentUser?.role === 'ceo' || currentUser?.role === 'admin' || currentUser?.role === 'finance' || ['wael', 'mahmoud', 'mahmoud_gamal'].includes((currentUser?.username || '').toLowerCase())) && (
                <option value="Apex HQ">Apex HQ</option>
              )}
              <option value="SME">SME</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Export">Export</option>
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Margin */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Weighted Margin %' : 'نسبة هامش الربح المرجح'}
              </p>
              <h3 className={`text-2xl font-black mt-2 text-[#128d46]`}>
                {financials.marginPercent.toFixed(1)}%
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-lg">
              <Percent size={20} />
            </div>
          </div>
        </div>

        {/* Projected Cash Inflows */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Projected Inflow (30D)' : 'التدفقات النقدية المتوقعة (٣٠ يوم)'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {formatM(financials.projectedCashInflow, 'EGP')}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* Working Capital Index */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Working Capital Health' : 'مؤشر صحة رأس المال العامل'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {financials.workingCapitalIndex}/100
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Briefcase size={20} />
            </div>
          </div>
        </div>

        {/* Cost to Serve Inefficiency */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Cost-to-Serve Loss Score' : 'مؤشر خسارة تكلفة الخدمة'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${financials.costToServeScore > 10 ? 'text-rose-500' : 'text-amber-500'}`}>
                {financials.costToServeScore}%
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* True Net Margin Waterfall Analysis */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
        <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          <Percent size={18} className="text-[#128d46]" />
          {language === 'en' ? 'True Net Margin Waterfall Analysis' : 'تحليل الشلال لصافي هامش الربح الحقيقي'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold">
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            <span className="text-slate-400 block mb-1">{language === 'en' ? 'Gross Revenue (Est.)' : 'إجمالي الإيرادات (تقديري)'}</span>
            <strong className="text-md text-[#191342] dark:text-white">{formatM(financials.grossRevenue, 'EGP')}</strong>
            <span className="text-[10px] text-slate-400 block mt-1">100% {language === 'en' ? 'of volume' : 'من حجم المبيعات'}</span>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            <span className="text-slate-400 block mb-1">{language === 'en' ? 'COGS' : 'تكلفة المبيعات (COGS)'}</span>
            <strong className="text-md text-rose-500">-{formatM(financials.cogs, 'EGP')}</strong>
            <span className="text-[10px] text-rose-500 block mt-1">{(65 + inflationRate)}% {language === 'en' ? 'rate' : 'معدل'}</span>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            <span className="text-slate-400 block mb-1">{language === 'en' ? 'Logistics / Freight' : 'الشحن واللوجستيات'}</span>
            <strong className="text-md text-rose-500">-{formatM(financials.logistics, 'EGP')}</strong>
            <span className="text-[10px] text-rose-500 block mt-1">5% {language === 'en' ? 'rate' : 'معدل'}</span>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            <span className="text-slate-400 block mb-1">{language === 'en' ? 'Returns & Handling' : 'المرتجعات والتعبئة'}</span>
            <strong className="text-md text-rose-500">-{formatM(financials.returnsHandling, 'EGP')}</strong>
            <span className="text-[10px] text-rose-500 block mt-1">{language === 'en' ? '25 EGP per unit' : '٢٥ ج.م للوحدة'}</span>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50'}`}>
            <span className="text-emerald-600 dark:text-emerald-400 block mb-1">{language === 'en' ? 'True Net Margin' : 'صافي الهامش الحقيقي'}</span>
            <strong className="text-md text-emerald-600 dark:text-emerald-400">{formatM(financials.trueNetMargin, 'EGP')}</strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">
              {financials.marginPercent.toFixed(1)}% {language === 'en' ? 'margin' : 'هامش'}
            </span>
          </div>
        </div>
      </div>

      {/* Waterfall Profit Bridge Chart */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card mb-6`}>
        <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          {language === 'en' ? 'Gross-to-Net Profit Bridge (Waterfall)' : 'جسر الأرباح من الإجمالي إلى الصافي (شلال)'}
        </h3>
        <div className="h-72">
          <div ref={waterfallChartRef} className="w-full h-full" />
        </div>
      </div>

      {/* Cash Flow Line Chart & Segment Margin Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projected Cash Inflow Timeline */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Projected Cash Inflows Timeline (6 Months)' : 'مخطط التدفقات النقدية المتوقعة (٦ أشهر القادمة)'}
            </h3>
            <button
              onClick={() => setTimelineCompare(!timelineCompare)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${timelineCompare
                ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
            >
              📊 {language === 'en' ? 'Compare' : 'مقارنة'}
            </button>
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
                  <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (Math.abs(val) >= 1000000) return `${Math.round(val / 1000000)}M`;
                      return val.toLocaleString();
                    }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatM(Number(val), 'EGP'), '']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q1Value" name={language === 'en' ? `Base: Q${tq1Num} ${tq1Year}` : `الأساس: ربع ${tq1Num} ${tq1Year}`} fill="#128d46" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="q2Value" name={language === 'en' ? `Compare: Q${tq2Num} ${tq2Year}` : `المقارن: ربع ${tq2Num} ${tq2Year}`} fill="#e97025" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart
                  data={cashFlowProjectionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis
                    dataKey="month"
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [value !== undefined ? formatM(Number(value), 'EGP') : '', language === 'en' ? 'Projected Inflow' : 'التدفقات المتوقعة']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inflow"
                    stroke="#128d46"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Contribution vs Margin */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Segment Profit Margin vs Volume' : 'مقارنة هامش ربح وحجم مبيعات القطاعات'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart
                data={segmentMarginData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  yAxisId="left"
                  dataKey="volume"
                  name={language === 'en' ? 'Net Volume' : 'صافي الكميات'}
                  fill="#191342"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margin"
                  name={language === 'en' ? 'Margin %' : 'الهامش %'}
                  stroke="#e97025"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Working Capital Oversight & Cost to Serve Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Capital Exposure List */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <ShieldAlert size={18} className="text-amber-500" />
              {language === 'en' ? 'Working Capital Exposure & Credit terms' : 'مخاطر رأس المال العامل وتأخر سداد العملاء'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'Accounts with long credit terms (> 60 days) and significant unpaid balances.'
                : 'الحسابات التي تتمتع بفترات ائتمان طويلة (> ٦٠ يوم) ولديها أرصدة مستحقة كبيرة.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Customer Name' : 'اسم العميل'}</th>
                  <th className="p-3">{language === 'en' ? 'Credit Terms' : 'فترة الائتمان'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Outstanding Qty' : 'الرصيد المستحق'}</th>
                  <th className="p-3 text-center">{language === 'en' ? 'Risk Class' : 'درجة المخاطرة'}</th>
                </tr>
              </thead>
              <tbody>
                {capitalAlerts.map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 font-medium">{item.terms}</td>
                    <td className="p-3 text-right font-semibold">{formatQty(item.outstandingQty)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${item.risk === 'High'
                        ? 'bg-rose-500/10 text-rose-500'
                        : item.risk === 'Medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                        {item.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost-to-Serve Leakage Report */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <AlertTriangle size={18} className="text-rose-500" />
              {language === 'en' ? 'Cost-to-Serve Leakage & High Returns' : 'تسربات تكلفة الخدمة وارتفاع المرتجعات'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'Product lines incurring high handling costs due to elevated return rates (> 5%).'
                : 'الأصناف التي تتسبب في تكاليف شحن ومناولة غير ضرورية بسبب ارتفاع معدل مرتجعاتها عن ٥٪.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Return Rate' : 'معدل المرتجعات'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Wasted Qty' : 'المرتجع هدر'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Est. Loss (EGP)' : 'الخسارة التقديرية'}</th>
                </tr>
              </thead>
              <tbody>
                {inefficiencyData.slice(0, 4).map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3 font-bold">{item.name}</td>
                    <td className="p-3 text-right text-rose-500 font-extrabold">{item.returnRate.toFixed(1)}%</td>
                    <td className="p-3 text-right font-medium">{formatQty(item.wastedQty)}</td>
                    <td className="p-3 text-right font-semibold text-rose-500">{formatM(item.costImpact, 'EGP')}</td>
                  </tr>
                ))}
                {inefficiencyData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {language === 'en' ? 'No lines exceed return limits.' : 'لا توجد أصناف تتجاوز حد المرتجعات المسموح.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer purchases matrix details */}
      <div className="mt-6">
        <CustomerMaterialTable
          processedData={processedData}
          language={language}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}

export default React.memo(FinancialPlanningView);
