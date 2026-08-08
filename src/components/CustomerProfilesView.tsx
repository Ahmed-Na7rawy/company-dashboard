import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  ShoppingBag, ShieldAlert, Award, FileText, AlertTriangle, RefreshCcw, Tag
} from 'lucide-react';
import { useScaleMode } from '../hooks/useScaleMode';
import Plotly from 'plotly.js-dist-min';

interface CustomerProfilesViewProps {
  processedData: any[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  customerNotes: Record<string, string>;
  setCustomerNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  customerRiskOverride: Record<string, string>;
  inflationRate: number;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  globalChartMetric: 'revenue' | 'volume';
}

function CustomerProfilesView({
  processedData,
  language,
  darkMode,
  t,
  customerNotes,
  setCustomerNotes,
  customerRiskOverride,
  inflationRate,
  currentUser,
  globalChartMetric
}: CustomerProfilesViewProps) {

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

  // Extract unique customer names based on selected channel
  const customers = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.CustomerName) list.add(row.CustomerName);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || 'Almarai');

  const [editingNote, setEditingNote] = useState<string>('');
  const [lastSelectedCust, setLastSelectedCust] = useState<string>('');

  // Keep selected customer and editing notes in sync (only on customer change to avoid cursor jumping)
  React.useEffect(() => {
    if (selectedCustomer) {
      setEditingNote(customerNotes[selectedCustomer] || '');
      setLastSelectedCust(selectedCustomer);
    }
  }, [selectedCustomer]);

  // Keep selected customer in sync with list of customers
  React.useEffect(() => {
    if (customers.length > 0 && !customers.includes(selectedCustomer)) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  const handleNoteChange = (text: string) => {
    setEditingNote(text);
    if (selectedCustomer) {
      setCustomerNotes(prev => ({
        ...prev,
        [selectedCustomer]: text
      }));
    }
  };

  // 1. Core KPIs & Profile Details
  const profileDetails = useMemo(() => {
    let gross = 0;
    let returns = 0;
    let segment = 'Solutions';
    let salesman = 'SME';
    let lastDate = new Date('2024-01-01');

    officeFilteredData.forEach(row => {
      if (row.CustomerName === selectedCustomer) {
        if (row.IsReturn) {
          returns += row.Volume;
        } else {
          gross += row.Volume;
        }
        if (row.Segment) segment = row.Segment;
        if (row.SalesmanName) salesman = row.SalesmanName;

        const date = new Date(row.Date);
        if (date > lastDate) lastDate = date;
      }
    });

    const net = gross - returns;
    const returnRate = gross > 0 ? (returns / gross) * 100 : 0;
    
    // RFM Score (Recency, Frequency, Monetary)
    // Recency: Months since last purchase
    let maxDbDate = new Date('2022-01-01');
    officeFilteredData.forEach(row => {
      if (row.DateObj && row.DateObj > maxDbDate) maxDbDate = row.DateObj;
    });
    const today = maxDbDate;
    const recencyMonths = (today.getFullYear() - lastDate.getFullYear()) * 12 + today.getMonth() - lastDate.getMonth();
    
    let rfmSegment = 'Champions';
    let rfmColor = '#128d46';
    
    if (recencyMonths > 6) {
      rfmSegment = language === 'en' ? 'Lost Customer' : 'عميل مفقود';
      rfmColor = '#ef4444';
    } else if (recencyMonths > 3) {
      rfmSegment = language === 'en' ? 'At Risk' : 'معرض للفقدان';
      rfmColor = '#f59e0b';
    } else if (net < 5000) {
      rfmSegment = language === 'en' ? 'New Customer' : 'عميل جديد';
      rfmColor = '#3b82f6';
    } else if (net > 20000) {
      rfmSegment = language === 'en' ? 'Champion' : 'عميل قيادي';
      rfmColor = '#128d46';
    } else {
      rfmSegment = language === 'en' ? 'Loyal' : 'عميل وفي';
      rfmColor = '#191342';
    }

    // Override risk status if defined in admin
    const customRisk = customerRiskOverride[selectedCustomer];
    if (customRisk && customRisk !== 'Auto') {
      rfmSegment = customRisk;
      rfmColor = customRisk === 'Lost' || customRisk === 'High Risk' ? '#ef4444' : customRisk === 'Medium Risk' ? '#f59e0b' : '#128d46';
    }

    // Default terms based on customer name
    const terms = selectedCustomer === 'Americana' || selectedCustomer === 'Savola' ? '90 Days' : '60 Days';
    const limit = selectedCustomer === 'Almarai' || selectedCustomer === 'Americana' ? '1,500,000 EGP' : '500,000 EGP';

    // Waterfall calculations for selected client:
    const unitPrice = 15;
    const grossRevenue = gross * unitPrice;
    const cogs = grossRevenue * (0.65 + (inflationRate / 100));
    const logistics = grossRevenue * 0.05;
    const returnsHandling = returns * 25;
    const trueNetMargin = grossRevenue - cogs - logistics - returnsHandling;
    const trueNetMarginPercent = grossRevenue > 0 ? (trueNetMargin / grossRevenue) * 100 : 0;

    let safetyColor = '#ef4444'; // Red
    let safetyLabel = language === 'en' ? 'Critical Margin' : 'هامش حرج';
    if (trueNetMarginPercent > 20) {
      safetyColor = '#128d46'; // Green
      safetyLabel = language === 'en' ? 'Healthy Margin' : 'هامش آمن';
    } else if (trueNetMarginPercent > 10) {
      safetyColor = '#f59e0b'; // Amber
      safetyLabel = language === 'en' ? 'At Risk Margin' : 'هامش متوسط';
    }

    let customerCode = 'N/A';
    officeFilteredData.forEach(row => {
      if (row.CustomerName === selectedCustomer && row.CustomerCode) {
        customerCode = row.CustomerCode;
      }
    });

    return {
      net,
      customerCode,
      returnRate: parseFloat(returnRate.toFixed(1)),
      segment,
      salesman,
      lastPurchase: lastDate.toISOString().split('T')[0],
      rfmSegment,
      rfmColor,
      terms,
      limit,
      notes: customerNotes[selectedCustomer] || (language === 'en' ? 'No operational comments logged.' : 'لا توجد ملاحظات تشغيلية مسجلة.'),
      grossRevenue,
      cogs,
      logistics,
      returnsHandling,
      trueNetMargin,
      trueNetMarginPercent,
      safetyColor,
      safetyLabel,
      grossVolume: gross,
      returnsVolume: returns
    };
  }, [officeFilteredData, selectedCustomer, customerNotes, customerRiskOverride, language, inflationRate]);

  // 2. Product Purchase Distribution
  const productDistribution = useMemo(() => {
    const prods: Record<string, number> = {};
    officeFilteredData.forEach(row => {
      if (row.CustomerName === selectedCustomer && !row.IsReturn) {
        prods[row.ItemName] = (prods[row.ItemName] || 0) + row.Volume;
      }
    });

    return Object.entries(prods)
      .map(([name, value]) => ({
        name: name.substring(0, 18) + '...',
        volume: value
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5); // Top 5 products
  }, [officeFilteredData, selectedCustomer]);

  const droppedProducts = useMemo(() => {
    const itemDates: Record<string, { lastDate: Date; volume: number; materialCode: string; uom: string }> = {};
    let maxDbDate = new Date('2022-01-01');
    officeFilteredData.forEach(row => {
      if (row.DateObj && row.DateObj > maxDbDate) maxDbDate = row.DateObj;
    });
    const sixMonthsAgo = new Date(maxDbDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    officeFilteredData.forEach(row => {
      if (row.CustomerName === selectedCustomer && !row.IsReturn) {
        const date = new Date(row.Date);
        if (!itemDates[row.ItemName]) {
          itemDates[row.ItemName] = { 
            lastDate: date, 
            volume: 0, 
            materialCode: row.MaterialCode || 'N/A', 
            uom: row.UoM || 'Units' 
          };
        } else {
          if (date > itemDates[row.ItemName].lastDate) {
            itemDates[row.ItemName].lastDate = date;
          }
        }
        itemDates[row.ItemName].volume += row.Volume;
      }
    });

    return Object.entries(itemDates)
      .map(([name, val]) => ({
        name,
        materialCode: val.materialCode,
        uom: val.uom,
        lastDate: val.lastDate,
        volume: val.volume,
        isDropped: val.lastDate < sixMonthsAgo
      }))
      .filter(item => item.isDropped && item.volume > 100) // stopped purchasing and had meaningful quantity
      .sort((a, b) => b.volume - a.volume);
  }, [officeFilteredData, selectedCustomer]);

  // 4. Next Best Action (Wallet Share Gap Analysis)
  const nextBestActions = useMemo(() => {
    if (!selectedCustomer) return [];

    const customerSegment = profileDetails.segment;
    
    // Find what items the selected customer has purchased
    const customerPurchasedItems = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.CustomerName === selectedCustomer && !row.IsReturn) {
        if (row.ItemName) customerPurchasedItems.add(row.ItemName);
      }
    });

    // Find popular items in the same segment
    const segmentItemVolumes: Record<string, number> = {};
    officeFilteredData.forEach(row => {
      if (row.Segment === customerSegment && !row.IsReturn && row.CustomerName !== selectedCustomer) {
        if (row.ItemName) {
          segmentItemVolumes[row.ItemName] = (segmentItemVolumes[row.ItemName] || 0) + row.Volume;
        }
      }
    });

    // Sort popular items in segment that customer has NOT purchased
    const recommendations = Object.entries(segmentItemVolumes)
      .filter(([itemName]) => !customerPurchasedItems.has(itemName))
      .map(([itemName, segmentVol]) => {
        const potentialRevenue = Math.round((segmentVol / 5) * 15); // assume we can capture 20% of segment average volume
        const roundedVol = Math.round(segmentVol / 5);
        const volTextEn = roundedVol >= 1000000 ? `${Math.round(roundedVol / 1000000)}M Units` : `${roundedVol.toLocaleString()} Units`;
        const volTextAr = roundedVol >= 1000000 ? `${Math.round(roundedVol / 1000000)} مليون وحدة` : `${roundedVol.toLocaleString()} وحدة`;
        return {
          itemName,
          potentialRevenue,
          reasonEn: `High adoption within ${customerSegment} segment. Typical volume capture potential of ${volTextEn}.`,
          reasonAr: `طلب مرتفع في قطاع ${customerSegment === 'Additives' ? 'الإضافات' : customerSegment === 'Solutions' ? 'الحلول' : 'المنتجات الحيوية'}. قدرة سحب تقديرية تبلغ ${volTextAr}.`
        };
      })
      .sort((a, b) => b.potentialRevenue - a.potentialRevenue)
      .slice(0, 2); // Top 2 cross-sell items

    return recommendations;
  }, [officeFilteredData, selectedCustomer, profileDetails.segment]);

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
  const scaleMode = useScaleMode();
  const bubbleChartRef = useRef<HTMLDivElement>(null);

  const scatterData = useMemo(() => {
    const custMap: Record<string, { revenue: number; grossVolume: number; returnedVolume: number }> = {};
    
    officeFilteredData.forEach(row => {
      const name = row.CustomerName || 'Other';
      if (!custMap[name]) {
        custMap[name] = { revenue: 0, grossVolume: 0, returnedVolume: 0 };
      }
      
      const rev = Math.abs(row.Revenue || 0);
      const vol = Math.abs(row.Volume || 0);
      
      if (row.IsReturn) {
        custMap[name].revenue -= rev;
        custMap[name].returnedVolume += vol;
      } else {
        custMap[name].revenue += rev;
        custMap[name].grossVolume += vol;
      }
    });

    const healthy: any[] = [];
    const warning: any[] = [];
    const critical: any[] = [];

    Object.entries(custMap).forEach(([name, metrics]) => {
      if (metrics.revenue <= 0 && metrics.grossVolume === 0) return;
      
      const totalVolume = metrics.grossVolume + metrics.returnedVolume;
      const returnRate = totalVolume > 0 ? (metrics.returnedVolume / totalVolume) * 100 : 0;
      
      const item = {
        name,
        revenue: Math.max(0, Math.round(metrics.revenue)),
        returnRate: Math.max(0, returnRate),
        volume: metrics.grossVolume - metrics.returnedVolume,
      };

      if (returnRate > 7.5) {
        critical.push({ ...item, color: '#ef4444', status: language === 'en' ? 'Critical' : 'حرج' });
      } else if (returnRate > 3) {
        warning.push({ ...item, color: '#f59e0b', status: language === 'en' ? 'At Risk' : 'مخاطرة متوسطة' });
      } else {
        healthy.push({ ...item, color: '#10b981', status: language === 'en' ? 'Healthy' : 'سليم' });
      }
    });

    return { healthy, warning, critical };
  }, [officeFilteredData, language]);

  useEffect(() => {
    if (!bubbleChartRef.current) return;

    const healthyX = scatterData.healthy.map(d => d.returnRate);
    const healthyY = scatterData.healthy.map(d => d.revenue);
    const healthySize = scatterData.healthy.map(d => Math.max(8, Math.min(45, d.volume / 100)));
    const healthyText = scatterData.healthy.map(d => {
      const valText = scaleMode === 'millions' ? `${(d.revenue / 1000000).toFixed(2)}M EGP` : `${(d.revenue / 1000).toFixed(0)}K EGP`;
      return `${d.name}<br>Revenue: ${valText}<br>Return: ${d.returnRate.toFixed(1)}%<br>Volume: ${d.volume.toLocaleString()}`;
    });

    const warningX = scatterData.warning.map(d => d.returnRate);
    const warningY = scatterData.warning.map(d => d.revenue);
    const warningSize = scatterData.warning.map(d => Math.max(8, Math.min(45, d.volume / 100)));
    const warningText = scatterData.warning.map(d => {
      const valText = scaleMode === 'millions' ? `${(d.revenue / 1000000).toFixed(2)}M EGP` : `${(d.revenue / 1000).toFixed(0)}K EGP`;
      return `${d.name}<br>Revenue: ${valText}<br>Return: ${d.returnRate.toFixed(1)}%<br>Volume: ${d.volume.toLocaleString()}`;
    });

    const criticalX = scatterData.critical.map(d => d.returnRate);
    const criticalY = scatterData.critical.map(d => d.revenue);
    const criticalSize = scatterData.critical.map(d => Math.max(8, Math.min(45, d.volume / 100)));
    const criticalText = scatterData.critical.map(d => {
      const valText = scaleMode === 'millions' ? `${(d.revenue / 1000000).toFixed(2)}M EGP` : `${(d.revenue / 1000).toFixed(0)}K EGP`;
      return `${d.name}<br>Revenue: ${valText}<br>Return: ${d.returnRate.toFixed(1)}%<br>Volume: ${d.volume.toLocaleString()}`;
    });

    const data = [
      {
        type: 'scattergl',
        x: healthyX,
        y: healthyY,
        mode: 'markers',
        name: language === 'en' ? 'Healthy (< 3%)' : 'سليم (< ٣٪)',
        text: healthyText,
        hoverinfo: 'text',
        marker: {
          color: '#10b981',
          size: healthySize,
          line: { color: darkMode ? '#1e293b' : '#ffffff', width: 1.5 }
        }
      },
      {
        type: 'scattergl',
        x: warningX,
        y: warningY,
        mode: 'markers',
        name: language === 'en' ? 'Warning (3% - 7.5%)' : 'تنبيه (٣٪ - ٧.٥٪)',
        text: warningText,
        hoverinfo: 'text',
        marker: {
          color: '#f59e0b',
          size: warningSize,
          line: { color: darkMode ? '#1e293b' : '#ffffff', width: 1.5 }
        }
      },
      {
        type: 'scattergl',
        x: criticalX,
        y: criticalY,
        mode: 'markers',
        name: language === 'en' ? 'Critical (> 7.5%)' : 'حرج (> ٧.٥٪)',
        text: criticalText,
        hoverinfo: 'text',
        marker: {
          color: '#ef4444',
          size: criticalSize,
          line: { color: darkMode ? '#1e293b' : '#ffffff', width: 1.5 }
        }
      }
    ];

    const layout = {
      margin: { t: 15, r: 15, b: 40, l: 60 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: true,
      legend: {
        orientation: 'h',
        y: -0.22,
        font: { color: darkMode ? '#94a3b8' : '#64748b', size: 9, family: 'Outfit, sans-serif' }
      },
      xaxis: {
        title: { text: language === 'en' ? 'Return Rate (%)' : 'معدل المرتجع (٪)', font: { size: 10, color: darkMode ? '#94a3b8' : '#64748b', family: 'Outfit, sans-serif' } },
        gridcolor: darkMode ? '#334155' : '#f1f5f9',
        tickfont: { color: darkMode ? '#94a3b8' : '#64748b', size: 9, family: 'Outfit, sans-serif' },
        zeroline: false
      },
      yaxis: {
        title: { text: language === 'en' ? 'Net Revenue (EGP)' : 'صافي الإيرادات (ج.م)', font: { size: 10, color: darkMode ? '#94a3b8' : '#64748b', family: 'Outfit, sans-serif' } },
        gridcolor: darkMode ? '#334155' : '#f1f5f9',
        tickfont: { color: darkMode ? '#94a3b8' : '#64748b', size: 9, family: 'Outfit, sans-serif' },
        zeroline: false,
        tickformatter: '$,.0f'
      }
    };

    if (Plotly && Plotly.react) {
      Plotly.react(bubbleChartRef.current, data, layout as any, { responsive: true, displayModeBar: false });
    }
  }, [scatterData, language, darkMode, scaleMode]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header with Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Customer Profile Intelligence' : 'تحليل ملف العميل وتفاصيل النشاط'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {language === 'en' 
              ? 'Analyze individual buyer portfolios, credit parameters, RFM segmentation, and dropped lines.' 
              : 'تحليل سلوكيات الشراء للعملاء الفرديين، شروط الائتمان، تصنيف RFM، والمنتجات المتوقفة.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
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

          {/* Revenue/Volume Toggle */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'en' ? 'Chart Metric:' : 'مقياس الرسم:'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {}}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-extrabold ${
                  globalChartMetric === 'revenue'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'hover:bg-slate-250/50 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'en' ? 'Revenue' : 'إيرادات'}
              </button>
              <button
                type="button"
                onClick={() => {}}
                className={`px-3 py-1.5 rounded-lg transition-all text-[10px] font-extrabold ${
                  globalChartMetric === 'volume'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'hover:bg-slate-250/50 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'en' ? 'Volume (UoM)' : 'الكمية (وحدة القياس)'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'en' ? 'Select Customer:' : 'اختر العميل:'}
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
            >
              {customers.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Health & Risk Matrix Bubble Chart */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/40 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Customer Health & Risk Matrix' : 'مصفوفة صحة ومخاطر محفظة العملاء'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en'
                ? 'Bubble size represents active volume sold. X-Axis: Return Rate (%). Y-Axis: Net Revenue (EGP).'
                : 'حجم الفقاعة يمثل حجم المبيعات الفعلي. المحور الأفقي: نسبة المرتجع (٪). المحور الرأسي: صافي الإيرادات.'}
            </p>
          </div>
        </div>
        <div className="h-64">
          <div ref={bubbleChartRef} className="w-full h-full" />
        </div>
      </div>

      {/* Profile Details Panel & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Specs */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div>
            <h3 className={`text-sm font-bold border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-3 mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <Tag size={16} />
              {language === 'en' ? 'Account Profile Details' : 'تفاصيل ملف الحساب'}
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Customer Code' : 'كود العميل:'}</span>
                <span className="font-mono font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{profileDetails.customerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Assigned Salesperson' : 'مسؤول المبيعات:'}</span>
                <span className="font-bold">{profileDetails.salesman}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Company Segment' : 'قطاع الشركة:'}</span>
                <span className="font-bold">{profileDetails.segment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Payment Terms' : 'فترة السداد:'}</span>
                <span className="font-bold">{profileDetails.terms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Credit Limit' : 'الحد الائتماني:'}</span>
                <span className="font-bold">{profileDetails.limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{language === 'en' ? 'Last Purchase Date' : 'تاريخ آخر شراء:'}</span>
                <span className="font-bold text-indigo-500">{profileDetails.lastPurchase}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                {language === 'en' ? 'Interactive Customer Feedback & Notes:' : 'ملاحظات وتغذية رجعية تفاعلية للعميل:'}
              </span>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                ✓ {language === 'en' ? 'Autosaved' : 'حُفظ تلقائياً'}
              </span>
            </div>
            <textarea
              value={editingNote}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={language === 'en' ? 'Type customer comments, requirements, or feedback...' : 'اكتب ملاحظات العميل، المتطلبات، أو التغذية الرجعية هنا...'}
              className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none transition-all resize-none h-20 outline-none ${
                darkMode 
                  ? 'bg-slate-900/60 border-slate-700/60 text-slate-200 focus:border-emerald-500/50' 
                  : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-emerald-500/50'
              }`}
            />
          </div>
        </div>

        {/* Purchase Stats Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Total Purchased' : 'إجمالي المشتريات'}
              </p>
              <h4 className="text-xl font-black mt-1">{formatQty(profileDetails.net)}</h4>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Return Rate' : 'معدل المرتجعات'}
              </p>
              <h4 className={`text-xl font-black mt-1 ${profileDetails.returnRate > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{profileDetails.returnRate}%</h4>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'RFM Status' : 'حالة رتبة RFM'}
              </p>
              <span 
                className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black text-white"
                style={{ backgroundColor: profileDetails.rfmColor }}
              >
                {profileDetails.rfmSegment}
              </span>
            </div>
          </div>

          {/* Product Distribution chart */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Top SKU Purchase Distribution' : 'توزيع مبيعات المنتجات الرئيسية للعميل'}
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={productDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} width={100} />
                  <Tooltip />
                  <Bar dataKey="volume" name={language === 'en' ? 'Quantity (UoM)' : 'الكمية (حسب وحدة القياس)'} fill="#128d46" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Partial Churn & Dropped Products Warn */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="mb-4">
          <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
            {language === 'en' ? 'Dropped Products Alert (Partial Churn)' : 'تنبيه المنتجات المتوقفة (التراجع الجزئي)'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'en'
              ? 'Specific product lines previously bought in high volumes, but not purchased in the last 6 months.'
              : 'منتجات معينة كان يشتريها العميل بكميات كبيرة وتوقف تماماً عن طلبها في آخر ٦ أشهر.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {droppedProducts.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-rose-950/15 border-rose-900/40 text-rose-300' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
              <div>
                <strong className="block text-xs font-bold">{item.name}</strong>
                {item.materialCode && item.materialCode !== 'N/A' && (
                  <span className="text-[10px] text-indigo-400 font-mono font-medium block mt-0.5">
                    Code: {item.materialCode}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">
                  {language === 'en' ? 'Last Ordered:' : 'آخر طلبية:'} {item.lastDate.toISOString().split('T')[0]}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs block font-bold">{formatQty(item.volume, item.uom)}</span>
                <span className="text-[9px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">
                  {language === 'en' ? 'Dropped' : 'تراجع'}
                </span>
              </div>
            </div>
          ))}
          {droppedProducts.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs w-full col-span-2">
              {language === 'en' ? 'No partial churn detected for this account.' : 'لم يتم كشف أي تراجع جزئي في المنتجات لهذا الحساب.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(CustomerProfilesView);
