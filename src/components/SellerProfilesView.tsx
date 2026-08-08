import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts';
import { 
  Users, TrendingUp, Percent
} from 'lucide-react';

interface SellerProfilesViewProps {
  processedData: any[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  sellerTargets: Record<string, number>;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  globalChartMetric: 'revenue' | 'volume';
}

function SellerProfilesView({
  processedData,
  language,
  darkMode,
  t,
  sellerTargets,
  currentUser,
  globalChartMetric
}: SellerProfilesViewProps) {

  const isRep = currentUser?.role === 'salesperson';

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
    if (selectedOffice === 'B2C') {
      return processedData.filter(row => 
        ['B2C', 'Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce'].includes(row.SalesOffice || '')
      );
    }
    return processedData.filter(row => row.SalesOffice === selectedOffice);
  }, [processedData, selectedOffice]);

  // Extract list of all sellers based on selected channel
  const sellers = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.SalesmanName) list.add(row.SalesmanName);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  // Default selected seller
  const [selectedSeller, setSelectedSeller] = useState<string>('Hassan Atya');

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (isRep && currentUser?.salesmanName) {
      setSelectedSeller(currentUser.salesmanName);
    }
  }, [currentUser, isRep]);

  // Keep selected seller in sync with list of sellers
  React.useEffect(() => {
    if (sellers.length > 0 && !sellers.includes(selectedSeller)) {
      setSelectedSeller(sellers[0]);
    }
  }, [sellers, selectedSeller]);

  // Seller Notes / Field Feedback State with localStorage persistence
  const [sellerNotes, setSellerNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('apex_seller_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [editingNote, setEditingNote] = useState<string>('');

  React.useEffect(() => {
    if (selectedSeller) {
      setEditingNote(sellerNotes[selectedSeller] || '');
    }
  }, [selectedSeller]);

  const handleNoteChange = (text: string) => {
    setEditingNote(text);
    if (selectedSeller) {
      setSellerNotes(prev => {
        const updated = { ...prev, [selectedSeller]: text };
        localStorage.setItem('apex_seller_notes', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // 1. Calculations for selected seller
  const stats = useMemo(() => {
    let grossVol = 0;
    let returnsVol = 0;
    let grossRev = 0;
    let returnsRev = 0;
    const customers = new Set<string>();
    const monthlySales: Record<string, { grossVol: number; returnsVol: number; grossRev: number; returnsRev: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    officeFilteredData.forEach(row => {
      if (row.SalesmanName === selectedSeller) {
        if (row.CustomerName) customers.add(row.CustomerName);
        const rev = Math.abs(row.Revenue || 0);
        const vol = row.Volume || 0;

        if (row.IsReturn) {
          returnsVol += vol;
          returnsRev += rev;
        } else {
          grossVol += vol;
          grossRev += rev;
        }

        const date = new Date(row.Date);
        const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
        if (!monthlySales[bucket]) {
          monthlySales[bucket] = { grossVol: 0, returnsVol: 0, grossRev: 0, returnsRev: 0 };
        }
        if (row.IsReturn) {
          monthlySales[bucket].returnsVol += vol;
          monthlySales[bucket].returnsRev += rev;
        } else {
          monthlySales[bucket].grossVol += vol;
          monthlySales[bucket].grossRev += rev;
        }
      }
    });

    const netVol = grossVol - returnsVol;
    const netRev = grossRev - returnsRev;
    const returnRateVol = grossVol > 0 ? (returnsVol / grossVol) * 100 : 0;
    const returnRateRev = grossRev > 0 ? (returnsRev / grossRev) * 100 : 0;

    const chartData = Object.entries(monthlySales)
      .map(([month, val]) => ({
        month,
        sales: globalChartMetric === 'revenue' ? val.grossRev : val.grossVol,
        returns: globalChartMetric === 'revenue' ? val.returnsRev : val.returnsVol
      }))
      .slice(-6);

    return {
      netVol,
      netRev,
      customersCount: customers.size,
      returnRateVol: parseFloat(returnRateVol.toFixed(1)),
      returnRateRev: parseFloat(returnRateRev.toFixed(1)),
      chartData
    };
  }, [officeFilteredData, selectedSeller, globalChartMetric]);

  const sellerOffice = useMemo(() => {
    const row = processedData.find(r => r.SalesmanName === selectedSeller);
    return row ? row.SalesOffice : '';
  }, [processedData, selectedSeller]);

  // 2. Customer portfolio table for selected seller
  const portfolio = useMemo(() => {
    const custAgg: Record<string, { gross: number; returns: number; lastDate: Date }> = {};
    
    officeFilteredData.forEach(row => {
      if (row.SalesmanName === selectedSeller) {
        if (!custAgg[row.CustomerName]) {
          custAgg[row.CustomerName] = { gross: 0, returns: 0, lastDate: new Date(row.Date) };
        }
        if (row.IsReturn) {
          custAgg[row.CustomerName].returns += row.Volume;
        } else {
          custAgg[row.CustomerName].gross += row.Volume;
        }
        const date = new Date(row.Date);
        if (date > custAgg[row.CustomerName].lastDate) {
          custAgg[row.CustomerName].lastDate = date;
        }
      }
    });

    return Object.entries(custAgg)
      .map(([name, val]) => {
        let customerCode = 'N/A';
        officeFilteredData.forEach(r => {
          if (r.CustomerName === name && r.CustomerCode) {
            customerCode = r.CustomerCode;
          }
        });
        const returnRate = val.gross > 0 ? (val.returns / val.gross) * 100 : 0;
        return {
          name,
          customerCode,
          netVolume: val.gross - val.returns,
          returnRate: parseFloat(returnRate.toFixed(1)),
          lastPurchase: val.lastDate.toISOString().split('T')[0]
        };
      })
      .sort((a, b) => b.netVolume - a.netVolume);
  }, [officeFilteredData, selectedSeller]);

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
      {/* View Header with Selector */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {isRep
                ? `${selectedSeller} - ${language === 'en' ? 'Performance Summary' : 'ملخص أدائي الشخصي'}`
                : (language === 'en' ? 'Seller Profile Analysis' : 'تحليل ملف مسؤول المبيعات')}
            </h2>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
              {isRep
                ? (language === 'en' ? 'Track sales volumes, customer pull rates, and client portfolio performance.' : 'متابعة سحب العملاء، حجم المبيعات، ومحفظة العملاء الفردية.')
                : (language === 'en'
                  ? 'Select a sales representative to review monthly growth and customer portfolios.'
                  : 'اختر ممثل مبيعات لمراجعة النمو الشهري ومحفظة العملاء.')}
              </p>
              {sellerOffice && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  🏢 {language === 'en' ? `Office: ${sellerOffice}` : `المكتب: ${sellerOffice}`}
                </span>
              )}
          </div>

          {/* Dropdown - Hidden for field reps */}
          {!isRep && (
            <div className="flex flex-wrap items-center gap-4 no-print">
              {!isOfficeLocked && (
                <div className="flex items-center gap-2">
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
                    <optgroup label={language === 'en' ? 'B2C Sub-Offices' : 'مكاتب B2C الفرعية'}>
                      <option value="Modern Trade">Modern Trade</option>
                      <option value="Alex Office">Alex Office</option>
                      <option value="Dist. Office">Dist. Office</option>
                      <option value="LG Office">LG Office</option>
                      <option value="E-Commerce">E-Commerce</option>
                    </optgroup>
                    <option value="Horeca Team">{language === 'en' ? 'HORECA' : 'هوريكا'}</option>
                    <option value="Pharma">Pharma</option>
                    <option value="Sisters Companies">Sisters Companies</option>
                    {(currentUser?.role === 'ceo' || currentUser?.role === 'admin' || currentUser?.role === 'finance') && (
                      <option value="Apex HQ">Apex HQ</option>
                    )}
                    <option value="SME">SME</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Export">Export</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'en' ? 'Select Seller:' : 'اختر المندوب:'}
                </label>
                <select
                  value={selectedSeller}
                  onChange={(e) => setSelectedSeller(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                >
                  {sellers.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Revenue/Volume Toggle */}
              <div className="flex items-center gap-2">
                <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'en' ? 'Chart Metric:' : 'مقياس الرسم:'}
                </label>
                <div className="flex gap-1 p-0.5 rounded-lg border" style={{ background: darkMode ? '#1e293b' : '#f1f5f9', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => {}}
                    className={`px-2.5 py-1 rounded transition-all font-bold text-[10px] ${
                      globalChartMetric === 'revenue' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
                    }`}
                  >
                    {language === 'en' ? 'Revenue' : 'إيرادات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className={`px-2.5 py-1 rounded transition-all font-bold text-[10px] ${
                      globalChartMetric === 'volume' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'
                    }`}
                  >
                    {language === 'en' ? 'Volume (UoM)' : 'الكمية (وحدة القياس)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Revenue */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Seller Net Revenue' : 'صافي إيرادات المندوب'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {formatQty(stats.netRev)}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{language === 'en' ? 'Volume: ' : 'الحجم: '}{formatQty(stats.netVol)}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        {/* Customer Count */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Assigned Clients' : 'العملاء المسندين'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {stats.customersCount}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Return Rate */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Seller Return Rate' : 'معدل مرتجعات المندوب'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${stats.returnRateVol > 5 ? 'text-rose-500' : 'text-amber-500'}`}>
                {stats.returnRateVol}%
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{language === 'en' ? 'Revenue: ' : 'إيرادات: '}{stats.returnRateRev}%</p>
            </div>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
              <Percent size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Seller Feedback & Field Notes Component */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-500">💬</span>
            <span className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Interactive Seller Feedback & Field Notes' : 'ملاحظات أداء مسؤول المبيعات وتغذية الميدان الراجعة'}
            </span>
          </div>
          <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md animate-pulse">
            {language === 'en' ? 'Auto-Saved' : 'تم الحفظ تلقائياً'}
          </span>
        </div>
        <textarea
          value={editingNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={language === 'en' ? 'Type field feedback, coaching notes, or seller performance observations...' : 'اكتب الملاحظات الميدانية وتقييم الأداء أو التوصيات الخاصة بمسؤول المبيعات هنا...'}
          className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none h-20 outline-none ${
            darkMode 
              ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-indigo-500' 
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
          }`}
        />
      </div>

      {/* Seller Performance Trend & Client Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Monthly Sales vs Returns' : 'المبيعات الشهرية مقابل المرتجعات للمندوب'}
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={stats.chartData}
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
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a' 
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  name={language === 'en' ? 'Sales Qty' : 'حجم المبيعات'} 
                  stroke="#128d46" 
                  strokeWidth={3} 
                />
                <Line 
                  type="monotone" 
                  dataKey="returns" 
                  name={language === 'en' ? 'Returns Qty' : 'حجم المرتجعات'} 
                  stroke="#e97025" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Portfolio */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Client Portfolio & Performance' : 'محفظة عملاء المندوب ومعدلات سحبهم'}
          </h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Customer Name' : 'اسم العميل'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Net Vol (UoM)' : 'صافي الكميات (وحدة القياس)'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Return Rate' : 'معدل المرتجعات'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Last Purchase' : 'آخر شراء'}</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3 font-bold">
                      <div>{item.name}</div>
                      {item.customerCode && item.customerCode !== 'N/A' && (
                        <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                          Code: {item.customerCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">{formatQty(item.netVolume)}</td>
                    <td className={`p-3 text-right font-bold ${item.returnRate > 5 ? 'text-rose-500' : 'text-slate-400'}`}>{item.returnRate}%</td>
                    <td className="p-3 text-right text-slate-400">{item.lastPurchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SellerProfilesView);
