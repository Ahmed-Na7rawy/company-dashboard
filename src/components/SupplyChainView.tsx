import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, LineChart, Line, Cell 
} from 'recharts';
import { 
  Boxes, Clock, RefreshCcw, AlertOctagon, ShieldAlert, ThermometerSnowflake
} from 'lucide-react';
import demandForecastData from '../data/demand_forecast.json';
import { useToast } from './ToastProvider';

interface SupplyChainViewProps {
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
  customsDelay: number;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
}

function SupplyChainView({ 
  processedData, 
  language, 
  darkMode, 
  t, 
  adminSettings,
  customsDelay,
  currentUser
}: SupplyChainViewProps) {
  const { showToast } = useToast();

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

  // Quarter Compare States for Lead Time
  const [timelineCompare, setTimelineCompare] = useState(false);
  const [tq1Year, setTq1Year] = useState(2026);
  const [tq1Num, setTq1Num] = useState(1);
  const [tq2Year, setTq2Year] = useState(2026);
  const [tq2Num, setTq2Num] = useState(2);

  const timelineCompareData = useMemo(() => {
    if (!timelineCompare) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const getQuarterLeadTime = (year: number, qNum: number, monthIdx: number) => {
      const yearFactor = (year - 2022) * 0.1;
      const qFactor = qNum * 0.15;
      const mFactor = monthIdx * 0.2;
      const base = 4.2 - yearFactor + qFactor + mFactor + customsDelay;
      return parseFloat(Math.max(1.0, base).toFixed(1));
    };

    const q1Start = (tq1Num - 1) * 3;
    const q2Start = (tq2Num - 1) * 3;

    return [0, 1, 2].map(idx => {
      const m1Name = language === 'en' ? monthsEn[q1Start + idx] : monthsAr[q1Start + idx];
      const m2Name = language === 'en' ? monthsEn[q2Start + idx] : monthsAr[q2Start + idx];
      return {
        month: language === 'en' ? `Month ${idx + 1} (${m1Name} vs ${m2Name})` : `الشهر ${idx + 1} (${m1Name} مقابل ${m2Name})`,
        q1Value: getQuarterLeadTime(tq1Year, tq1Num, idx),
        q2Value: getQuarterLeadTime(tq2Year, tq2Num, idx),
      };
    });
  }, [timelineCompare, tq1Year, tq1Num, tq2Year, tq2Num, customsDelay, language]);

  // 1. Calculations for KPIs
  const scMetrics = useMemo(() => {
    let grossQty = 0;
    let returnQty = 0;
    officeFilteredData.forEach(row => {
      if (row.IsReturn) {
        returnQty += row.Volume;
      } else {
        grossQty += row.Volume;
      }
    });

    const returnRate = grossQty > 0 ? (returnQty / grossQty) * 100 : 0;
    // Scale by admin modifier
    const finalReturnRate = returnRate * (adminSettings.returnRateModifier / 8); 

    // Avg Lead Time (simulated around 4.5 days) scaled by customs delay slider
    const baseLeadTime = 4.5;
    const finalLeadTime = parseFloat((baseLeadTime * (1.2 - (adminSettings.stockLevelModifier - 1) * 0.2) + customsDelay).toFixed(1));

    // Stock Health Index (percentage of items above safety stock)
    const stockHealthIndex = Math.min(100, Math.round(78 * adminSettings.stockLevelModifier));
    const deadStockQty = Math.round(14500 * (2.2 - adminSettings.stockLevelModifier));

    return {
      stockHealthIndex,
      avgLeadTime: finalLeadTime,
      returnRate: parseFloat(finalReturnRate.toFixed(1)),
      deadStockQty,
    };
  }, [officeFilteredData, adminSettings, customsDelay]);

  // 2. Inventory Health: Current Stock vs Safety Stock per major SKU
  const inventoryHealthData = useMemo(() => {
    const items = ['Sodium Tripolyphosphate', 'Carrageenan', 'Guar Gum', 'Sodium Nitrite', 'Ascorbic Acid', 'Xanthan Gum', 'Soy Protein', 'Potato Starch'];
    return items.map(itemName => {
      // Find volume of item sold to make stock levels proportional
      let soldVolume = 0;
      officeFilteredData.forEach(row => {
        if (row.ItemName === itemName) {
          soldVolume += row.Volume;
        }
      });

      const baseCurrent = Math.round((soldVolume * 0.6 + 800) * adminSettings.stockLevelModifier);
      const safety = Math.round((soldVolume * 0.35 + 400) * (1 + customsDelay / 15));
      
      return {
        name: itemName.substring(0, 15) + '...',
        currentStock: baseCurrent,
        safetyStock: safety,
        status: baseCurrent < safety ? 'danger' : baseCurrent < safety * 1.3 ? 'warning' : 'safe'
      };
    });
  }, [officeFilteredData, adminSettings.stockLevelModifier, customsDelay]);

  // 3. Lead Time Trend over 6 months
  const leadTimeTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const offsets = [0.1, -0.05, 0.08, -0.12, 0.04, -0.02];
    return months.map((m, idx) => ({
      month: m,
      leadTime: parseFloat((4.8 - idx * 0.15 + offsets[idx]).toFixed(1))
    }));
  }, []);

  // 4. Warehouse Velocity Table (DII - Days in Inventory)
  const warehouseVelocity = useMemo(() => {
    const items = ['Sodium Tripolyphosphate', 'Carrageenan', 'Guar Gum', 'Sodium Nitrite', 'Ascorbic Acid', 'Xanthan Gum', 'Soy Protein', 'Potato Starch'];
    
    return items.map(itemName => {
      let totalSold = 0;
      let materialCode = 'N/A';
      let uom = 'Units';
      officeFilteredData.forEach(row => {
        if (row.ItemName === itemName) {
          if (!row.IsReturn) {
            totalSold += row.Volume;
          }
          if (row.MaterialCode) materialCode = row.MaterialCode;
          if (row.UoM && row.UoM !== 'Units') uom = row.UoM;
        }
      });

      // Days In Inventory (DII) = (Current Stock / Daily Demand)
      // Daily Demand = totalSold / 900 days (approx timeline)
      const dailyDemand = Math.max(1, totalSold / 900);
      const currentStock = Math.round((totalSold * 0.6 + 800) * adminSettings.stockLevelModifier);
      const dii = Math.round(currentStock / dailyDemand);
      const turnoverRate = parseFloat((365 / dii).toFixed(1));

      return {
        name: itemName,
        materialCode,
        uom,
        dii,
        turnoverRate,
        velocity: dii < 45 ? 'High' : dii < 90 ? 'Medium' : 'Low'
      };
    }).sort((a, b) => a.dii - b.dii);
  }, [officeFilteredData, adminSettings.stockLevelModifier]);

  // 5. Projected Demand Shortfalls & ML Forecast comparison
  const projectedShortfalls = useMemo(() => {
    const items = ['Sodium Tripolyphosphate', 'Carrageenan', 'Guar Gum', 'Sodium Nitrite', 'Ascorbic Acid', 'Xanthan Gum', 'Soy Protein', 'Potato Starch'];
    return items.map(itemName => {
      let soldVolume = 0;
      officeFilteredData.forEach(row => {
        if (row.ItemName === itemName) {
          soldVolume += row.Volume;
        }
      });

      const currentStock = Math.round((soldVolume * 0.6 + 800) * adminSettings.stockLevelModifier);
      const forecastInfo = (demandForecastData as any)[itemName] || { forecast90D: 5000, confidence: 'N/A' };
      const forecast90D = forecastInfo.forecast90D;
      const shortfall = forecast90D - currentStock;

      let materialCode = 'N/A';
      let uom = 'Units';
      officeFilteredData.forEach(row => {
        if (row.ItemName === itemName) {
          if (row.MaterialCode) materialCode = row.MaterialCode;
          if (row.UoM && row.UoM !== 'Units') uom = row.UoM;
        }
      });

      return {
        name: itemName,
        materialCode,
        uom,
        currentStock,
        forecast90D,
        shortfall: shortfall > 0 ? shortfall : 0,
        confidence: forecastInfo.confidence,
        status: shortfall > 0 ? 'deficit' : 'healthy'
      };
    });
  }, [officeFilteredData, adminSettings.stockLevelModifier]);

  const formatQty = (qty: number, customUom?: string) => {
    const unitLabel = customUom && customUom !== 'UoM' ? customUom : (language === 'ar' ? 'وحدة' : 'Units');
    const absQty = Math.abs(qty);
    if (absQty >= 1000000) {
      const rounded = Math.round(qty / 1000000);
      if (language === 'ar') {
        return `${rounded} مليون ${unitLabel}`;
      }
      return `${rounded}M ${unitLabel}`;
    }
    if (language === 'ar') {
      return `${Math.round(qty).toLocaleString()} ${unitLabel}`;
    }
    return `${Math.round(qty).toLocaleString()} ${unitLabel}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Supply Chain Perspective' : 'منظور مدير سلاسل التوريد'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {language === 'en' 
              ? 'Monitor stock availability metrics, warehouse velocity, return logistics rates, and lead times.' 
              : 'مراقبة توافر المخزون، وسرعة حركة المستودعات، ومعدلات المرتجعات اللوجستية، وأوقات تلبية الطلبات.'}
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
        {/* Stock Health */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Stock Health Index' : 'مؤشر كفاءة توافر المخزون'}
              </p>
              <h3 className={`text-2xl font-black mt-2 text-[#128d46]`}>
                {scMetrics.stockHealthIndex}%
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-lg">
              <Boxes size={20} />
            </div>
          </div>
        </div>

        {/* Lead Time */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Avg Fulfillment Lead Time' : 'متوسط وقت تلبية الطلب'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {scMetrics.avgLeadTime} {language === 'en' ? 'Days' : 'أيام'}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Return Rate */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Return Logistics Rate' : 'معدل مرتجعات الخدمات اللوجستية'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${scMetrics.returnRate > 5 ? 'text-rose-500' : 'text-amber-500'}`}>
                {scMetrics.returnRate}%
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <RefreshCcw size={20} />
            </div>
          </div>
        </div>

        {/* Dead Stock */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Dead Stock (Qty)' : 'حجم المخزون الراكد'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {formatQty(scMetrics.deadStockQty)}
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <AlertOctagon size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Health Bar Chart & Lead Time Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level vs Safety Stock */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'SKU Inventory Health vs Safety Stock' : 'مستوى توافر مخزون المنتجات مقارنة بحد الأمان'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={inventoryHealthData}
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
                  dataKey="currentStock" 
                  name={language === 'en' ? 'Current Stock' : 'المخزون الحالي'} 
                  fill="#191342" 
                  radius={[4, 4, 0, 0]} 
                >
                  {inventoryHealthData.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={entry.status === 'danger' ? '#ef4444' : entry.status === 'warning' ? '#f59e0b' : '#128d46'} 
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="safetyStock" 
                  name={language === 'en' ? 'Safety Stock Level' : 'حد أمان المخزون'} 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supplier & Logistics Lead Time Status Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {language === 'en' ? 'Supplier Lead Time & Customs Status' : 'حالة وقت التلبية والتأخيرات الجمركية'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                ⏱️ {customsDelay} {language === 'en' ? 'Days Customs Delay' : 'أيام تأخير جمركي'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  {language === 'en' ? 'Fulfillment SLA Limit' : 'حد اتفاقية تلبية الطلب'}
                </span>
                <span className="text-xl font-black text-emerald-500 mt-1 block">4.5 {language === 'en' ? 'Days' : 'أيام'}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Standard Target SLA' : 'الهدف المعياري'}</span>
              </div>
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  {language === 'en' ? 'Current Avg Lead Time' : 'متوسط وقت التلبية الحالي'}
                </span>
                <span className="text-xl font-black text-amber-500 mt-1 block">{(4.8 + customsDelay * 0.2).toFixed(1)} {language === 'en' ? 'Days' : 'أيام'}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Includes clearance & transport' : 'شامل التخليص والنقل'}</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50/60 border-indigo-100 text-indigo-900'}`}>
              <div className="flex items-center gap-2 mb-1 font-bold">
                <Clock size={14} className="text-indigo-400" />
                <span>{language === 'en' ? 'Procurement Strategy' : 'استراتيجية المشتريات'}</span>
              </div>
              <p className="text-[10px] opacity-80 leading-relaxed">
                {language === 'en'
                  ? 'Buffer stock maintained for critical raw materials to protect against port delays.'
                  : 'تم تخصيص مخزون أمان للمواد الخام الحرجة للحماية من تأخير الموانئ.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projected Demand Shortfalls & ML Forecast */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <ShieldAlert size={18} className="text-[#128d46]" />
              {language === 'en' ? 'Projected Demand Shortfalls & ML Demand Forecast (90-Day)' : 'توقعات عجز الطلب المستقبلي والتنبؤ الذكي (٩٠ يوماً)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'Compares simulated current warehouse stock with predicted 90-day demand to identify upcoming deficits.'
                : 'مقارنة مستويات المخزون الحالية بالتوقعات الذكية للطلب في خلال ٩٠ يوماً لتفادي عجز الإمداد.'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                <th className="p-3 text-right">{language === 'en' ? 'Current Stock' : 'المخزون الحالي'}</th>
                <th className="p-3 text-right">{language === 'en' ? '90D ML Forecast' : 'توقع الطلب ٩٠ يوم'}</th>
                <th className="p-3 text-right">{language === 'en' ? 'Projected Deficit' : 'العجز المتوقع'}</th>
                <th className="p-3 text-center">{language === 'en' ? 'ML Confidence' : 'ثقة التوقع'}</th>
                <th className="p-3 text-center no-print">{language === 'en' ? 'Actions' : 'إجراءات'}</th>
              </tr>
            </thead>
            <tbody>
              {projectedShortfalls.map((item, idx) => (
                <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors ${item.shortfall > 0 ? 'bg-rose-500/5' : ''}`}>
                  <td className="p-3 font-bold">
                    <div>{item.name}</div>
                    {item.materialCode && item.materialCode !== 'N/A' && (
                      <span className="text-[10px] text-indigo-400 font-mono font-medium block">
                        Code: {item.materialCode}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">{formatQty(item.currentStock, item.uom)}</td>
                  <td className="p-3 text-right font-medium">{formatQty(item.forecast90D, item.uom)}</td>
                  <td className="p-3 text-right font-extrabold text-rose-500">
                    {item.shortfall > 0 ? formatQty(item.shortfall, item.uom) : '-'}
                  </td>
                  <td className="p-3 text-center font-semibold text-slate-500">{item.confidence}</td>
                  <td className="p-3 text-center no-print">
                    {item.shortfall > 0 ? (
                      <button
                        onClick={(e) => {
                          const btn = e.currentTarget;
                          const text = btn.innerText;
                          btn.innerText = language === 'en' ? 'Sent ✓' : 'تم الإرسال ✓';
                          btn.disabled = true;
                          showToast({
                            type: 'success',
                            title: language === 'en' ? 'Refill Authorization Dispatched' : 'تم إرسال إذن إعادة التوريد',
                            message: language === 'en'
                              ? `Procurement authorization sent for ${item.name}.`
                              : `تم إرسال إذن التوريد بنجاح لمدير المشتريات لصنف ${item.name}.`
                          });
                          setTimeout(() => {
                            btn.innerText = text;
                            btn.disabled = false;
                          }, 2000);
                        }}
                        className="px-2 py-1 bg-emerald-500 text-white rounded text-[9px] font-bold hover:bg-emerald-600 transition-colors uppercase"
                      >
                        {language === 'en' ? 'Refill' : 'أمر توريد'}
                      </button>
                    ) : (
                      <span className="text-emerald-500 font-bold text-[10px]">&#10003; {language === 'en' ? 'Healthy' : 'مستقر'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Turnover Velocity & Logistics Spec Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Velocity Index */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <Boxes size={18} className="text-[#128d46]" />
              {language === 'en' ? 'Warehouse Stock Turnover & Days In Inventory (DII)' : 'سرعة دوران المخزون ومتوسط أيام بقاء البضاعة'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'High velocity (low DII) indicates efficient shelf clearing. Low velocity triggers storage alerts.'
                : 'دوران سريع (أيام أقل) يعني تدفق بضاعة ممتاز. بقاء طويل للبضائع يحذر من التلف والخسارة.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Days In Inventory (DII)' : 'أيام البقاء'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Turnover Rate (yr)' : 'دوران المخزون سنوي'}</th>
                  <th className="p-3 text-center">{language === 'en' ? 'Velocity Level' : 'مستوى الحركة'}</th>
                </tr>
              </thead>
              <tbody>
                {warehouseVelocity.slice(0, 5).map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3 font-bold">
                      <div>{item.name}</div>
                      {item.materialCode && item.materialCode !== 'N/A' && (
                        <span className="text-[10px] text-indigo-400 font-mono font-medium block">
                          Code: {item.materialCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">{item.dii} Days</td>
                    <td className="p-3 text-right font-semibold">{item.turnoverRate}x</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        item.velocity === 'High' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : item.velocity === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {item.velocity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Logistics Compliance */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <ThermometerSnowflake size={18} className="text-blue-500" />
              {language === 'en' ? 'Return Logistics Quality & Temperature Spec Audit' : 'مطابقة جودة النقل اللوجستي وشروط المرتجعات'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'en'
                ? 'Quality assurance alerts flagging logistics breaches, cooling spec faults, or wrong handling.'
                : 'تنبيهات الجودة التي تكشف عن عيوب التبريد، النقل اللوجستي غير المطابق، أو أخطاء التعبئة والتفريغ.'}
            </p>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-rose-950/20 border-rose-800/50 text-rose-300' : 'bg-rose-50/50 border-rose-200 text-rose-800'}`}>
              <div className="text-xs">
                <strong className="block">{language === 'en' ? 'Refrigerated Transport Spec Breach' : 'خلل درجة تبريد الحاويات'}</strong>
                <span className="text-[10px] text-slate-400">{language === 'en' ? 'Carrageenan - Temp exceeded +8°C threshold during transit.' : 'صنف كاراجينان - ارتفعت الحرارة عن ٨ درجات مئوية أثناء الشحن.'}</span>
              </div>
              <span className="text-xs font-bold">{language === 'en' ? 'Active Alert' : 'تنبيه نشط'}</span>
            </div>

            <div className={`p-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-slate-800/30 border-slate-700/40' : 'bg-white border-slate-200'}`}>
              <div className="text-xs">
                <strong className="block">{language === 'en' ? 'Package Seal Integrity Issue' : 'عيوب إحكام إغلاق العبوات'}</strong>
                <span className="text-[10px] text-slate-400">{language === 'en' ? 'Guar Gum - Paper bag puncture during warehouse dispatch.' : 'صنف صمغ الغار - ثقب في الأكياس الورقية أثناء التحميل.'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{language === 'en' ? 'Investigating' : 'قيد المراجعة'}</span>
            </div>

            <div className={`p-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-slate-800/30 border-slate-700/40' : 'bg-white border-slate-200'}`}>
              <div className="text-xs">
                <strong className="block">{language === 'en' ? 'Shelf Life Standard Deficit' : 'فارق تاريخ الصلاحية المطلوب'}</strong>
                <span className="text-[10px] text-slate-400">{language === 'en' ? 'Sodium Nitrite - Customer rejected batch due to < 75% shelf life remaining.' : 'صنف نتريت الصوديوم - رفض العميل الشحنة لبقاء أقل من ٧٥٪ من الصلاحية.'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-400">{language === 'en' ? 'Resolved' : 'تم الحل'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SupplyChainView);
