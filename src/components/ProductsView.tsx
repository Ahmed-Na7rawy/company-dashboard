import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, Cell, Legend 
} from 'recharts';
import { 
  Boxes, Users, ShoppingBag, FileText, TrendingUp, AlertTriangle, CheckCircle2 
} from 'lucide-react';

interface Transaction {
  Date: string;
  CustomerName: string;
  CustomerCode?: string;
  Segment: string;
  ItemName: string;
  MaterialCode?: string;
  Quantity: number;
  NetQuantity: number;
  BillType: string;
  SalesmanName?: string;
  ItemGroup?: string;
  SalesOffice?: string;
  Revenue: number;
  UoM?: string;
}

interface ProcessedRow extends Transaction {
  DateObj: Date;
  Volume: number;
  IsReturn: boolean;
}

interface ProductsViewProps {
  processedData: ProcessedRow[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  globalChartMetric: 'revenue' | 'volume';
}

const COLORS = ['#128d46', '#191342', '#e97025', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

function ProductsView({
  processedData,
  language,
  darkMode,
  t,
  currentUser,
  globalChartMetric
}: ProductsViewProps) {

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

  // 1. Extract Item Groups
  const itemGroups = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.ItemGroup) list.add(row.ItemGroup);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  const [selectedGroup, setSelectedGroup] = useState(itemGroups[0] || 'Non-Starch');

  // 2. Extract unique products in the selected Group
  const products = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.ItemGroup === selectedGroup && row.ItemName) {
        list.add(row.ItemName);
      }
    });
    return Array.from(list).sort();
  }, [officeFilteredData, selectedGroup]);

  const [selectedProduct, setSelectedProduct] = useState(products[0] || '');

  // Quarter Compare States for Monthly sales trend
  const [timelineCompare, setTimelineCompare] = useState(false);
  const [tq1Year, setTq1Year] = useState(2026);
  const [tq1Num, setTq1Num] = useState(1);
  const [tq2Year, setTq2Year] = useState(2026);
  const [tq2Num, setTq2Num] = useState(2);

  // Reset selected product when item group changes
  React.useEffect(() => {
    if (products.length > 0) {
      setSelectedProduct(products[0]);
    } else {
      setSelectedProduct('');
    }
  }, [products]);

  // Product Intelligence Notes / Quality Feedback State
  const [productNotes, setProductNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('apex_product_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [editingNote, setEditingNote] = useState<string>('');

  React.useEffect(() => {
    const activeKey = selectedProduct || selectedGroup;
    if (activeKey) {
      setEditingNote(productNotes[activeKey] || '');
    }
  }, [selectedProduct, selectedGroup]);

  const handleNoteChange = (text: string) => {
    const activeKey = selectedProduct || selectedGroup;
    setEditingNote(text);
    if (activeKey) {
      setProductNotes(prev => {
        const updated = { ...prev, [activeKey]: text };
        localStorage.setItem('apex_product_notes', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Find max date in the database to calculate recency accurately
  const databaseMaxDate = useMemo(() => {
    let max = new Date('2024-01-01');
    officeFilteredData.forEach(row => {
      const d = new Date(row.Date);
      if (d > max) max = d;
    });
    return max;
  }, [officeFilteredData]);

  // 3. Compute Product-Level Stats
  const productStats = useMemo(() => {
    if (!selectedProduct) return null;

    let grossVolume = 0;
    let returnVolume = 0;
    let grossRevenue = 0;
    let returnRevenue = 0;
    const salesmanSales: Record<string, { volume: number; revenue: number }> = {};
    const customerOrders: Record<string, { lastDate: Date; volume: number; revenue: number }> = {};
    const monthlyTrend: Record<string, { volume: number; revenue: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    officeFilteredData.forEach(row => {
      if (row.ItemName === selectedProduct) {
        const vol = row.Volume;
        const rev = Math.abs(row.Revenue || 0);
        const isReturn = row.IsReturn;

        if (isReturn) {
          returnVolume += vol;
          returnRevenue += rev;
        } else {
          grossVolume += vol;
          grossRevenue += rev;

          // Salesman placement
          if (row.SalesmanName) {
            if (!salesmanSales[row.SalesmanName]) {
              salesmanSales[row.SalesmanName] = { volume: 0, revenue: 0 };
            }
            salesmanSales[row.SalesmanName].volume += vol;
            salesmanSales[row.SalesmanName].revenue += rev;
          }

          // Customer activity mapping
          if (row.CustomerName) {
            const orderDate = new Date(row.Date);
            if (!customerOrders[row.CustomerName]) {
              customerOrders[row.CustomerName] = { lastDate: orderDate, volume: vol, revenue: rev };
            } else {
              customerOrders[row.CustomerName].volume += vol;
              customerOrders[row.CustomerName].revenue += rev;
              if (orderDate > customerOrders[row.CustomerName].lastDate) {
                customerOrders[row.CustomerName].lastDate = orderDate;
              }
            }
          }
        }

        // Monthly trend (Net Volume & Revenue)
        const date = new Date(row.Date);
        const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
        const netVol = row.NetQuantity;
        const netRev = row.IsReturn ? -Math.abs(row.Revenue || 0) : rev;
        if (!monthlyTrend[bucket]) {
          monthlyTrend[bucket] = { volume: 0, revenue: 0 };
        }
        monthlyTrend[bucket].volume += netVol;
        monthlyTrend[bucket].revenue += netRev;
      }
    });

    const netVolume = grossVolume - returnVolume;
    const netRevenue = grossRevenue - returnRevenue;
    const returnRate = grossVolume > 0 ? (returnVolume / grossVolume) * 100 : 0;

    // Partition clients into Active vs Stopped
    const activeClients: any[] = [];
    const stoppedClients: any[] = [];
    const thresholdDays = 180; // 6 months

    Object.entries(customerOrders).forEach(([name, data]) => {
      const diffTime = Math.abs(databaseMaxDate.getTime() - data.lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let customerCode = 'N/A';
      officeFilteredData.forEach(r => {
        if (r.CustomerName === name && r.CustomerCode) {
          customerCode = r.CustomerCode;
        }
      });

      const info = {
        name,
        customerCode,
        volume: data.volume,
        revenue: data.revenue,
        lastOrder: data.lastDate.toISOString().split('T')[0]
      };

      if (diffDays > thresholdDays) {
        stoppedClients.push(info);
      } else {
        activeClients.push(info);
      }
    });

    // Salesmen chart data - include both volume and revenue
    const repsData = Object.entries(salesmanSales)
      .map(([name, vals]) => ({
        name,
        volume: vals.volume,
        revenue: vals.revenue
      }))
      .sort((a, b) => (globalChartMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume));

    // Timeline trend data - include both volume and revenue
    const timelineData = Object.entries(monthlyTrend)
      .map(([month, vals]) => ({
        month,
        volume: Math.max(0, vals.volume),
        revenue: Math.max(0, vals.revenue)
      }))
      .slice(-6); // Last 6 months

    let detectedUom = '';
    let materialCode = 'N/A';
    officeFilteredData.forEach(row => {
      if (row.ItemName === selectedProduct) {
        if (row.UoM && row.UoM !== 'Units') {
          detectedUom = row.UoM;
        }
        if (row.MaterialCode) {
          materialCode = row.MaterialCode;
        }
      }
    });

    return {
      grossVolume,
      netVolume,
      grossRevenue,
      netRevenue,
      materialCode,
      returnRate: returnRate.toFixed(1),
      repsData,
      timelineData,
      uom: detectedUom || (language === 'ar' ? 'كرتونة' : 'Cartons'),
      activeClients: activeClients.sort((a, b) => b.volume - a.volume),
      stoppedClients: stoppedClients.sort((a, b) => b.volume - a.volume)
    };
  }, [officeFilteredData, selectedProduct, databaseMaxDate, language]);

  const timelineCompareData = useMemo(() => {
    if (!timelineCompare || !selectedProduct) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const getQuarterData = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const aggregated = [0, 0, 0]; // Month 1, Month 2, Month 3

      officeFilteredData.forEach(row => {
        if (row.ItemName === selectedProduct) {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const idx = m - startMonth;
              const value = row.IsReturn ? -row.Volume : row.Volume;
              aggregated[idx] += value;
            }
          }
        }
      });
      return aggregated;
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
        q1Value: Math.round(Math.max(0, q1Vals[idx])),
        q2Value: Math.round(Math.max(0, q2Vals[idx])),
      };
    });
  }, [officeFilteredData, selectedProduct, timelineCompare, tq1Year, tq1Num, tq2Year, tq2Num, language]);

  const formatQty = (qty: number, customUom?: string) => {
    const rawUom = customUom && customUom !== 'UoM' ? customUom : productStats?.uom;
    const unitLabel = rawUom && rawUom !== 'UoM' ? rawUom : (language === 'ar' ? 'وحدة' : 'Units');
    const absQty = Math.abs(qty);
    if (absQty >= 1000000) {
      const rounded = Math.round(qty / 1000000);
      if (language === 'ar') {
        return `${rounded} مليون ${unitLabel}`;
      }
      return `${rounded}M ${unitLabel}`;
    }
    return `${Math.round(qty).toLocaleString()} ${unitLabel}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header with Selector Dropdowns */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Products Intelligence Dashboard' : 'منصة تحليلات ومؤشرات المنتجات'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {language === 'en' 
              ? 'Analyze sales placements, active clients, and stopped/dropped customer flags for each SKU.' 
              : 'تحليل توزيع مبيعات المندوبين، العملاء النشطين، ومؤشرات تراجع سحب المنتجات.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Sales Office / Channel Selector */}
          {!isOfficeLocked && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'en' ? 'Sales Channel:' : 'قناة المبيعات:'}
              </span>
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'} outline-none`}
              >
                <option value="All">{language === 'en' ? 'All Channels' : 'جميع القنوات'}</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
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

          {/* Category Selector */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'en' ? 'Product Category:' : 'مجموعة المنتجات:'}
            </span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'} outline-none`}
            >
              {itemGroups.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Product Selector */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'en' ? 'Product / SKU:' : 'الصنف / المنتج:'}
            </span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={products.length === 0}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-700'} outline-none`}
            >
              {products.length === 0 ? (
                <option>{language === 'en' ? 'No Products' : 'لا توجد منتجات'}</option>
              ) : (
                products.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {selectedProduct && productStats ? (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Material Code & UoM */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'SKU Code & Unit' : 'كود الصنف ووحدة القياس'}</p>
              <h3 className="text-sm font-black mt-2 text-indigo-500 font-mono flex items-center gap-2">
                <span>Code: {productStats.materialCode}</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-sans font-bold">UoM: {productStats.uom}</span>
              </h3>
            </div>

            {/* Total Net Volume */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Net Volume Sold' : 'صافي الكميات المباعة'}</p>
              <h3 className="text-xl font-black mt-2 text-[#128d46]">{formatQty(productStats.netVolume)}</h3>
            </div>

            {/* Return Rate */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'SKU Return Rate' : 'معدل مرتجعات المنتج'}</p>
              <h3 className={`text-xl font-black mt-2 ${parseFloat(productStats.returnRate) > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{productStats.returnRate}%</h3>
            </div>

            {/* Active Buyers */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Active Buyers Ledger' : 'العملاء النشطين حالياً'}</p>
              <h3 className="text-xl font-black mt-2 text-indigo-500">{productStats.activeClients.length} Accounts</h3>
            </div>
          </div>

          {/* Interactive Product Intelligence Feedback & Quality Notes Component */}
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-500">💬</span>
                <span className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-[#191342]'}`}>
                  {language === 'en' 
                    ? `Interactive Product Intelligence Feedback (${selectedProduct || selectedGroup})` 
                    : `ملاحظات جودة المنتج وانطباعات السوق الراجعة (${selectedProduct || selectedGroup})`}
                </span>
              </div>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md animate-pulse">
                {language === 'en' ? 'Auto-Saved' : 'تم الحفظ تلقائياً'}
              </span>
            </div>
            <textarea
              value={editingNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={language === 'en' ? 'Type product feedback, market positioning notes, formula/packaging comments, or quality notes...' : 'اكتب ملاحظات جودة المنتج وانطباعات العملاء أو التعليقات الفنية والتسويقية هنا...'}
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-all resize-none h-20 outline-none ${
                darkMode 
                  ? 'bg-slate-900/80 border-slate-700 text-slate-100 focus:border-indigo-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Charts: Salesperson Placements & Quantities Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Rep Placement Chart */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-6 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                <Users size={16} className="text-[#128d46]" />
                {language === 'en' ? 'Sales Representative Placements' : 'مبيعات الصنف لكل مندوب'}
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={productStats.repsData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        const numValue = typeof value === 'number' ? value : 0;
                        const isRevenue = globalChartMetric === 'revenue';
                        const label = name === 'volume' ? (language === 'en' ? 'Volume' : 'الحجم') : (language === 'en' ? 'Revenue' : 'إيرادات');
                        const formatted = isRevenue
                          ? new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(numValue)
                          : numValue.toLocaleString();
                        return [formatted, label];
                      }}
                    />
                    <Legend />
                    <Bar dataKey={globalChartMetric === 'revenue' ? 'revenue' : 'volume'} name={language === 'en' ? (globalChartMetric === 'revenue' ? 'Revenue' : 'Volume') : (globalChartMetric === 'revenue' ? 'إيرادات' : 'الحجم')} fill="#191342" radius={[4, 4, 0, 0]}>
                      {productStats.repsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SKU Quantity Timeline */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  <TrendingUp size={16} className="text-[#e97025]" />
                  {language === 'en' ? 'Fulfillment Net Volume Timeline (6 Months)' : 'الخط الزمني لصافي سحب الصنف (٦ أشهر)'}
                </h3>
                <button
                  onClick={() => setTimelineCompare(!timelineCompare)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    timelineCompare
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

              <div className="h-60">
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
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ${language === 'en' ? 'Units' : 'وحدة'}`, '']}
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
                    <LineChart data={productStats.timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          const numValue = typeof value === 'number' ? value : 0;
                          const isRevenue = globalChartMetric === 'revenue';
                          const label = isRevenue ? (language === 'en' ? 'Revenue' : 'إيرادات') : (language === 'en' ? 'Net Volume' : 'صافي الكمية');
                          const formatted = isRevenue
                            ? new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(numValue)
                            : numValue.toLocaleString();
                          return [formatted, label];
                        }}
                      />
                      <Line type="monotone" dataKey={globalChartMetric === 'revenue' ? 'revenue' : 'volume'} name={language === 'en' ? (globalChartMetric === 'revenue' ? 'Revenue' : 'Net Volume') : (globalChartMetric === 'revenue' ? 'إيرادات' : 'صافي الكمية')} stroke="#128d46" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tables: Active Buyers Ledger & Stopped Buyers Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Active Buyers Table */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="mb-4">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {language === 'en' ? 'Active Buying Client Ledger' : 'قائمة العملاء النشطين الذين يشترون الصنف'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'en' ? 'Client accounts with purchases registered within the last 180 days.' : 'حسابات العملاء التي سجلت حركات شراء للمنتج خلال آخر ١٨٠ يوم.'}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold sticky top-0`}>
                      <th className="p-3">{language === 'en' ? 'Customer Account' : 'حساب العميل'}</th>
                      <th className="p-3 text-right">{language === 'en' ? 'Last Order Date' : 'تاريخ آخر طلبية'}</th>
                      <th className="p-3 text-right">{language === 'en' ? 'Total Purchased' : 'إجمالي المشتريات'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productStats.activeClients.map((c, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50 dark:hover:bg-slate-800/30`}>
                        <td className="p-3 font-bold">
                          <div>{c.name}</div>
                          {c.customerCode && c.customerCode !== 'N/A' && (
                            <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                              Code: {c.customerCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-500">{c.lastOrder}</td>
                        <td className="p-3 text-right font-semibold">{formatQty(c.volume)}</td>
                      </tr>
                    ))}
                    {productStats.activeClients.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                          {language === 'en' ? 'No active buyers.' : 'لا يوجد عملاء نشطين حالياً.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dropped Buyers Table */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="mb-4">
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
                  {language === 'en' ? 'Stopped Buying Client Ledger (Attrition)' : 'قائمة العملاء المتوقفين عن شراء هذا الصنف'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'en' ? 'Client accounts with NO purchases registered for over 180 days.' : 'حسابات العملاء التي لم تسجل أي حركة شراء للمنتج لأكثر من ١٨٠ يوم.'}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold sticky top-0`}>
                      <th className="p-3">{language === 'en' ? 'Customer Account' : 'حساب العميل'}</th>
                      <th className="p-3 text-right">{language === 'en' ? 'Last Order Date' : 'تاريخ آخر طلبية'}</th>
                      <th className="p-3 text-right">{language === 'en' ? 'Lost Volume' : 'الحجم المفقود'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productStats.stoppedClients.map((c, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50 dark:hover:bg-slate-800/30`}>
                        <td className="p-3 font-bold">{c.name}</td>
                        <td className="p-3 text-right font-medium text-rose-500">{c.lastOrder}</td>
                        <td className="p-3 text-right font-semibold">{formatQty(c.volume)}</td>
                      </tr>
                    ))}
                    {productStats.stoppedClients.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                          {language === 'en' ? 'No dropped accounts detected.' : 'لا يوجد تراجع أو توقف من العملاء.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400">
          {language === 'en' ? 'Loading product intelligence details...' : 'جاري تحميل تفاصيل ومؤشرات المنتج...'}
        </div>
      )}
    </div>
  );
}

export default React.memo(ProductsView);
