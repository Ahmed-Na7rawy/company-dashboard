import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { 
  Target, Users, ShoppingBag, DollarSign, TrendingUp, Award, Activity, Lightbulb
} from 'lucide-react';

interface ProcessedRow {
  Date: string;
  CustomerName: string;
  Segment: string;
  ItemName: string;
  Quantity: number;
  NetQuantity: number;
  BillType: string;
  SalesmanName?: string;
  ItemGroup?: string;
  SalesOffice?: string;
  Revenue: number;
  Volume: number;
  IsReturn: boolean;
  DateObj: Date;
}

interface MarketingViewProps {
  processedData: ProcessedRow[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
}

const COLORS = ['#128d46', '#191342', '#e97025', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];

const getSegmentColor = (name: string, darkMode: boolean) => {
  const norm = name.toLowerCase();
  if (norm.includes('solutions') || norm.includes('الحلول')) {
    return '#128d46'; // Green
  }
  if (norm.includes('additives') || norm.includes('الإضافات')) {
    return darkMode ? '#818cf8' : '#6366f1'; // Indigo-400 in dark mode, Indigo-500 in light mode
  }
  if (norm.includes('bio') || norm.includes('الحيوية')) {
    return '#e97025'; // Orange
  }
  return '#3b82f6';
};


function MarketingView({ processedData: rawProcessedData, language, darkMode, t, currentUser }: MarketingViewProps) {
  const isEn = language === 'en';

  // Channel filtering
  const defaultOffice = currentUser?.salesOffice || 'All';
  const [selectedOffice, setSelectedOffice] = useState<string>(defaultOffice);
  const isChannelRestricted = !!currentUser?.salesOffice;

  const processedData = useMemo(() => {
    if (selectedOffice === 'All') return rawProcessedData;
    return rawProcessedData.filter(r => r.SalesOffice === selectedOffice);
  }, [rawProcessedData, selectedOffice]);

  // Quarter Compare States for Sales Channel Contribution
  const [channelCompare, setChannelCompare] = useState(false);
  const [cq1Year, setCq1Year] = useState(2026);
  const [cq1Num, setCq1Num] = useState(1);
  const [cq2Year, setCq2Year] = useState(2026);
  const [cq2Num, setCq2Num] = useState(2);

  // Quarter Compare States for Customer Acquisition Onboarding
  const [acquisitionCompare, setAcquisitionCompare] = useState(false);
  const [aq1Year, setAq1Year] = useState(2026);
  const [aq1Num, setAq1Num] = useState(1);
  const [aq2Year, setAq2Year] = useState(2026);
  const [aq2Num, setAq2Num] = useState(2);

  // Marketing ROI & CAC Simulator States
  const [simBudget, setSimBudget] = useState<number>(50000);
  const [simReach, setSimReach] = useState<number>(2000);
  const [simConv, setSimConv] = useState<number>(2.0);

  // Campaign Performance Tracker state (mock database)
  const [campaignsList, setCampaignsList] = useState([
    { name: 'Food Ingredients Expo 2026', budget: 120000, leads: 350, deals: 14, revenue: 840000, status: 'Active' },
    { name: 'SME Outbound Email Outreach', budget: 30000, leads: 120, deals: 5, revenue: 180000, status: 'Active' },
    { name: 'Digital Catalog Retargeting', budget: 45000, leads: 280, deals: 11, revenue: 385000, status: 'Active' },
    { name: 'HORECA Direct Sampling Demo', budget: 60000, leads: 180, deals: 8, revenue: 240000, status: 'Completed' }
  ]);

  const channelCompareData = useMemo(() => {
    if (!channelCompare) return [];

    const getQuarterChannels = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const sums: Record<string, number> = {};
      processedData.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj.getFullYear() === year) {
          const m = dateObj.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const office = row.SalesOffice || 'General';
            sums[office] = (sums[office] || 0) + (row.Revenue || 0);
          }
        }
      });
      return sums;
    };

    const q1Sums = getQuarterChannels(cq1Year, cq1Num);
    const q2Sums = getQuarterChannels(cq2Year, cq2Num);

    const allKeys = Array.from(new Set([...Object.keys(q1Sums), ...Object.keys(q2Sums)]));

    return allKeys.map(key => ({
      name: isEn ? key : (
        key === 'Digital Marketing' ? 'التسويق الرقمي' :
        key === 'Horeca Team' ? 'فريق الهوريكا' :
        key === 'Sisters Companies' ? 'الشركات الشقيقة' :
        key === 'SME' ? 'المشاريع الصغيرة' :
        key === 'Export' ? 'التصدير' : key
      ),
      q1Value: Math.round(q1Sums[key] || 0),
      q2Value: Math.round(q2Sums[key] || 0)
    })).sort((a, b) => b.q1Value - a.q1Value);
  }, [processedData, channelCompare, cq1Year, cq1Num, cq2Year, cq2Num, isEn]);

  const acquisitionCompareData = useMemo(() => {
    if (!acquisitionCompare) return [];

    const customerFirstDate: Record<string, Date> = {};
    processedData.forEach(row => {
      const cust = row.CustomerName;
      const date = row.DateObj;
      if (cust && date) {
        if (!customerFirstDate[cust] || date < customerFirstDate[cust]) {
          customerFirstDate[cust] = date;
        }
      }
    });

    const getQuarterAcquisitions = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const aggregated = [0, 0, 0]; // Month 1, Month 2, Month 3

      Object.values(customerFirstDate).forEach(date => {
        if (date.getFullYear() === year) {
          const m = date.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const idx = m - startMonth;
            aggregated[idx] += 1;
          }
        }
      });
      return aggregated;
    };

    const q1Vals = getQuarterAcquisitions(aq1Year, aq1Num);
    const q2Vals = getQuarterAcquisitions(aq2Year, aq2Num);

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const q1Start = (aq1Num - 1) * 3;
    const q2Start = (aq2Num - 1) * 3;

    return [0, 1, 2].map(idx => {
      const m1Name = isEn ? monthsEn[q1Start + idx] : monthsAr[q1Start + idx];
      const m2Name = isEn ? monthsEn[q2Start + idx] : monthsAr[q2Start + idx];
      return {
        month: isEn ? `Month ${idx + 1} (${m1Name} vs ${m2Name})` : `الشهر ${idx + 1} (${m1Name} مقابل ${m2Name})`,
        q1Value: q1Vals[idx],
        q2Value: q2Vals[idx],
      };
    });
  }, [processedData, acquisitionCompare, aq1Year, aq1Num, aq2Year, aq2Num, isEn]);

  // 1. Calculations & Metrics
  const metrics = useMemo(() => {
    let digitalMarketingRevenue = 0;
    const uniqueCustomers = new Set<string>();
    const uniqueProducts = new Set<string>();
    let totalRevenue = 0;
    
    // To calculate LTV/Average Customer Value
    const customerRevenues: Record<string, number> = {};

    processedData.forEach(row => {
      const rev = row.Revenue || 0;
      if (row.CustomerName) {
        uniqueCustomers.add(row.CustomerName);
        customerRevenues[row.CustomerName] = (customerRevenues[row.CustomerName] || 0) + rev;
      }
      if (row.ItemName) {
        uniqueProducts.add(row.ItemName);
      }
      if (row.SalesOffice === 'Digital Marketing') {
        digitalMarketingRevenue += rev;
      }
      totalRevenue += rev;
    });

    const activeCustomersCount = uniqueCustomers.size;
    const avgCustomerValue = activeCustomersCount > 0 ? totalRevenue / activeCustomersCount : 0;

    return {
      digitalMarketingRevenue,
      activeCustomersCount,
      productCount: uniqueProducts.size,
      avgCustomerValue,
      totalRevenue
    };
  }, [processedData]);

  // 2. Sales Channel Contribution (Sales Office grouping)
  const channelData = useMemo(() => {
    const offices: Record<string, { revenue: number; volume: number }> = {};
    processedData.forEach(row => {
      const office = row.SalesOffice || 'General';
      const rev = row.Revenue || 0;
      const vol = row.Volume || 0;
      
      if (!offices[office]) {
        offices[office] = { revenue: 0, volume: 0 };
      }
      offices[office].revenue += rev;
      offices[office].volume += vol;
    });

    return Object.entries(offices)
      .map(([name, val]) => ({
        name: isEn ? name : (
          name === 'Digital Marketing' ? 'التسويق الرقمي' :
          name === 'Horeca Team' ? 'فريق الهوريكا' :
          name === 'Sisters Companies' ? 'الشركات الشقيقة' :
          name === 'SME' ? 'المشاريع الصغيرة' :
          name === 'Export' ? 'التصدير' : name
        ),
        revenue: Math.round(val.revenue),
        volume: Math.round(val.volume)
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [processedData, isEn]);

  // 3. Customer Acquisition Trend (Cohort analysis by first purchase date)
  const acquisitionData = useMemo(() => {
    const customerFirstDate: Record<string, Date> = {};
    
    processedData.forEach(row => {
      const cust = row.CustomerName;
      const date = row.DateObj;
      if (cust && date) {
        if (!customerFirstDate[cust] || date < customerFirstDate[cust]) {
          customerFirstDate[cust] = date;
        }
      }
    });

    const monthlyAcquisitions: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    Object.values(customerFirstDate).forEach(date => {
      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      monthlyAcquisitions[bucket] = (monthlyAcquisitions[bucket] || 0) + 1;
    });

    // We want to sort the buckets chronologically
    const sortedBuckets = Object.entries(monthlyAcquisitions)
      .map(([bucket, count]) => {
        const parts = bucket.split(' ');
        const monthIdx = months.indexOf(parts[0]);
        const year = 2000 + parseInt(parts[1]);
        return { bucket, count, sortKey: year * 12 + monthIdx };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(item => ({
        month: item.bucket,
        newCustomers: item.count
      }));

    return sortedBuckets.slice(-12); // Show last 12 active months
  }, [processedData]);

  // 4. Product Group Penetration (Unique customers per Item Group)
  const groupPenetrationData = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    processedData.forEach(row => {
      const group = row.ItemGroup || 'Other';
      const cust = row.CustomerName;
      if (cust) {
        if (!groups[group]) {
          groups[group] = new Set<string>();
        }
        groups[group].add(cust);
      }
    });

    return Object.entries(groups)
      .map(([name, custSet]) => ({
        name: isEn ? name : (
          name === 'Vitality Snacks' ? 'سويت آند سليم' :
          name === 'Nova Koffi' ? 'يلا كوفي' :
          name === 'Horeca Frappe' ? 'فرايب الهوريكا' :
          name === 'Phos Cheese' ? 'فوسفات الجبن' :
          name === 'Phos Meat' ? 'فوسفات اللحوم' :
          name === 'Colours' ? 'الألوان الغذائية' : name
        ),
        customersCount: custSet.size
      }))
      .sort((a, b) => b.customersCount - a.customersCount)
      .slice(0, 8); // Top 8 product groups
  }, [processedData, isEn]);

  // 5. Segment Share
  const segmentRevenueShare = useMemo(() => {
    const segments: Record<string, number> = {};
    processedData.forEach(row => {
      if (row.Segment) {
        segments[row.Segment] = (segments[row.Segment] || 0) + (row.Revenue || 0);
      }
    });

    return Object.entries(segments).map(([name, value]) => ({
      name: isEn ? name : (name === 'Additives' ? 'الإضافات' : name === 'Solutions' ? 'الحلول' : 'المنتجات الحيوية'),
      value: Math.round(value)
    }));
  }, [processedData, isEn]);

  // 6. Marketing Briefing Text
  const briefing = useMemo(() => {
    const topChannel = channelData.length > 0 ? channelData[0].name : 'N/A';
    const topPenetration = groupPenetrationData.length > 0 ? groupPenetrationData[0].name : 'N/A';
    
    const formattedDigitalSales = Math.round(metrics.digitalMarketingRevenue / 1000000);
    
    if (isEn) {
      return {
        title: "Growth & Acquisition Insights",
        overview: `Apex Group is showing excellent market penetration. The top channel by revenue is **${topChannel}**, driven by wholesale corporate distribution. Our active client database covers **${metrics.activeCustomersCount.toLocaleString()} business accounts** purchasing a catalog of **${metrics.productCount} specialized products**.`,
        digitalPerformance: `**Digital Marketing** sales generated **EGP ${formattedDigitalSales}M** in revenue. Digital channel onboarding accounts for a steady portion of the customer acquisition trend, indicating high inbound funnel efficiency.`,
        recommendations: `1. **Target Group Expansion:** Build dedicated campaigns for the **${topPenetration}** product group which has the highest account penetration. 
2. **Cross-Selling:** Target Solutions accounts with specialized stabilizers to increase LTV. 
3. **Digital Funnel Scale:** Expand digital outbound messaging for SMEs to further diversify the customer risk profile.`
      };
    } else {
      return {
        title: "رؤى النمو واستحواذ العملاء",
        overview: `تظهر مجموعة أبكس معدلات انتشار ممتازة في السوق. القناة الأكثر تحقيقاً للمبيعات هي **${topChannel}**، مدفوعة بالتوزيع المؤسسي الكبير. تغطي قاعدة عملائنا النشطة **${metrics.activeCustomersCount.toLocaleString()} حساب تجاري** يشترون من قائمة تضم **${metrics.productCount} منتجاً متخصصاً**.`,
        digitalPerformance: `حققت مبيعات **التسويق الرقمي** إيرادات بلغت **${formattedDigitalSales} مليون جنيه مصري**. يمثل عملاء القنوات الرقمية رافداً مستمراً في معدلات استحواذ العملاء الجدد، مما يعزز كفاءة قمع المبيعات الرقمي.`,
        recommendations: `١. **التوسع في المجموعات المستهدفة:** إطلاق حملات مخصصة لمجموعة **${topPenetration}** والتي تمتلك أكبر معدل تغلغل للعملاء. 
٢. **البيع المتقاطع (Cross-Selling):** استهداف عملاء قطاع "الحلول" بمنتجات المثبتات لزيادة القيمة الشرائية للعميل. 
٣. **توسيع القمع الرقمي:** تكثيف الاستهداف الرقمي للشركات الصغيرة والمتوسطة لتقليل مخاطر التركز البيعي.`
      };
    }
  }, [channelData, groupPenetrationData, metrics, isEn]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 border-slate-200 dark:border-slate-700">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Marketing & Strategic Growth Dashboard' : 'لوحة تحكم التسويق والنمو الاستراتيجي'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isEn 
              ? 'Analyze sales channels contribution, customer acquisition cohorts, product penetration, and digital marketing efficiency.' 
              : 'تحليل مساهمة القنوات البيعية، مجموعات استحواذ العملاء الجدد، تغلغل المنتجات وكفاءة التسويق الرقمي.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 no-print">
          {/* Sales Office / Channel Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Channel:' : 'القناة:'}
            </span>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              disabled={isChannelRestricted}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-slate-200 disabled:text-slate-500' 
                  : 'bg-white border-slate-300 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400'
              }`}
            >
              <option value="All">{isEn ? 'All Channels' : 'جميع القنوات'}</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
              <option value="Horeca Team">Horeca Team</option>
              <option value="Pharma">Pharma</option>
              <option value="Export">Export</option>
              <option value="SME">SME</option>
              <option value="Sisters Companies">Sisters Companies</option>
              {(currentUser?.role === 'ceo' || currentUser?.role === 'admin' || currentUser?.role === 'finance') && (
                <option value="Apex HQ">Apex HQ</option>
              )}
              <option value="Digital Marketing">Digital Marketing</option>
            </select>
          </div>

          <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-xl flex items-center gap-1 text-[10px] font-bold">
            <Target size={14} />
            <span>{isEn ? 'Marketing View' : 'منظور التسويق'}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Digital Sales */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn ? 'Digital Channel Revenue' : 'إيرادات التسويق الرقمي'}
              </p>
              <h3 className={`text-2xl font-black mt-2 text-[#128d46]`}>
                EGP {Math.round(metrics.digitalMarketingRevenue / 1000000)}M
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn ? 'Total Customer Accounts' : 'إجمالي حسابات العملاء'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {metrics.activeCustomersCount.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Catalog Products */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn ? 'Active Products Sold' : 'المنتجات النشطة المباعة'}
              </p>
              <h3 className={`text-2xl font-black mt-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {metrics.productCount}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>

        {/* Average Value */}
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isEn ? 'Average Value per Client' : 'متوسط القيمة لكل عميل'}
              </p>
              <h3 className={`text-2xl font-black mt-2 text-[#128d46]`}>
                EGP {Math.round(metrics.avgCustomerValue / 1000000)}M
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row 1: Channels and Cohort Acquisitions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Channel Contribution */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {isEn ? 'Sales Channel Revenue Contribution' : 'مساهمة القنوات البيعية في الإيرادات'}
            </h3>
            <button
              onClick={() => setChannelCompare(!channelCompare)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                channelCompare
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
              }`}
            >
              📊 {isEn ? 'Compare' : 'مقارنة'}
            </button>
          </div>

          {channelCompare && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  {isEn ? 'Base:' : 'الأساس:'}
                </span>
                <select 
                  value={cq1Num} 
                  onChange={(e) => setCq1Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-xs"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select 
                  value={cq1Year} 
                  onChange={(e) => setCq1Year(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-xs"
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
                  {isEn ? 'Compare:' : 'المقارن:'}
                </span>
                <select 
                  value={cq2Num} 
                  onChange={(e) => setCq2Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-xs"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select 
                  value={cq2Year} 
                  onChange={(e) => setCq2Year(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-xs"
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
              {channelCompare ? (
                <BarChart data={channelCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                  <YAxis 
                    stroke={darkMode ? '#94a3b8' : '#64748b'} 
                    fontSize={9} 
                    tickFormatter={(val) => {
                      if (Math.abs(val) >= 1000000) return `${Math.round(val / 1000000)}M`;
                      return val.toLocaleString();
                    }}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`EGP ${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q1Value" name={isEn ? `Base: Q${cq1Num} ${cq1Year}` : `الأساس: ربع ${cq1Num} ${cq1Year}`} fill="#128d46" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="q2Value" name={isEn ? `Compare: Q${cq2Num} ${cq2Year}` : `المقارن: ربع ${cq2Num} ${cq2Year}`} fill="#e97025" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={channelData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} 
                    angle={-15} 
                    textAnchor="end"
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }}
                    tickFormatter={(val) => `${Math.round(val / 1000000)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#475569' : '#cbd5e1' }}
                    labelStyle={{ color: darkMode ? '#ffffff' : '#000000', fontSize: 10, fontWeight: 'bold' }}
                    itemStyle={{ fontSize: 10 }}
                    formatter={(value: any) => [`EGP ${Math.round(Number(value) / 1000000)}M`, isEn ? 'Revenue' : 'الإيرادات']}
                  />
                  <Bar dataKey="revenue" fill="#128d46" radius={[4, 4, 0, 0]}>
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment share */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Revenue Segment Share' : 'مشاركة الإيرادات حسب القطاع'}
          </h3>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={segmentRevenueShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke={darkMode ? '#1e293b' : '#ffffff'}
                >
                  {segmentRevenueShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSegmentColor(entry.name, darkMode)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#475569' : '#cbd5e1' }}
                  itemStyle={{ fontSize: 10 }}
                  formatter={(value: any) => [`EGP ${Math.round(Number(value) / 1000000)}M`, isEn ? 'Revenue' : 'الإيرادات']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className={`text-[10px] uppercase font-bold text-slate-400 block`}>
                {isEn ? 'Total Sales' : 'إجمالي المبيعات'}
              </span>
              <span className={`text-sm font-extrabold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {Math.round(metrics.totalRevenue / 1000000)}M EGP
              </span>
            </div>
          </div>
          <div className="space-y-1 mt-4">
            {segmentRevenueShare.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getSegmentColor(item.name, darkMode) }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span>{((item.value / (metrics.totalRevenue || 1)) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Customer Acquisition Trend & Product Group Penetration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Cohorts */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {isEn ? 'New Customer Onboarding Trend' : 'مسار استحواذ العملاء الجدد'}
            </h3>
            <button
              onClick={() => setAcquisitionCompare(!acquisitionCompare)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                acquisitionCompare
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
              }`}
            >
              📊 {isEn ? 'Compare' : 'مقارنة'}
            </button>
          </div>

          {acquisitionCompare && (
            <div className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  {isEn ? 'Base:' : 'الأساس:'}
                </span>
                <select 
                  value={aq1Num} 
                  onChange={(e) => setAq1Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select 
                  value={aq1Year} 
                  onChange={(e) => setAq1Year(Number(e.target.value))}
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
                  {isEn ? 'Compare:' : 'المقارن:'}
                </span>
                <select 
                  value={aq2Num} 
                  onChange={(e) => setAq2Num(Number(e.target.value))}
                  className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
                <select 
                  value={aq2Year} 
                  onChange={(e) => setAq2Year(Number(e.target.value))}
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
              {acquisitionCompare ? (
                <BarChart data={acquisitionCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                  <YAxis 
                    stroke={darkMode ? '#94a3b8' : '#64748b'} 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${val} Customers`, '']}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q1Value" name={isEn ? `Base: Q${aq1Num} ${aq1Year}` : `الأساس: ربع ${aq1Num} ${aq1Year}`} fill="#128d46" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="q2Value" name={isEn ? `Compare: Q${aq2Num} ${aq2Year}` : `المقارن: ربع ${aq2Num} ${aq2Year}`} fill="#e97025" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={acquisitionData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#128d46" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#128d46" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <YAxis tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#475569' : '#cbd5e1' }}
                    itemStyle={{ fontSize: 10 }}
                    formatter={(value: any) => [value, isEn ? 'New Customers' : 'عملاء جدد']}
                  />
                  <Area type="monotone" dataKey="newCustomers" stroke="#128d46" strokeWidth={2} fillOpacity={1} fill="url(#colorAcq)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Group Penetration */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Top Product Groups Account Penetration' : 'تغلغل مجموعات المنتجات الرئيسية في حسابات العملاء'}
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={groupPenetrationData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis type="number" tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b' }} width={85} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#475569' : '#cbd5e1' }}
                  itemStyle={{ fontSize: 10 }}
                  formatter={(value: any) => [value, isEn ? 'Unique Clients' : 'عملاء نشطين']}
                />
                <Bar dataKey="customersCount" fill="#e97025" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION: Marketing Campaign ROI Simulator & Performance Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign ROI & CAC Simulator Panel */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {isEn ? 'Interactive Campaign ROI & CAC Simulator' : 'محاكي العائد على الاستثمار وتكلفة الاستحواذ للحملات'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {isEn 
                ? 'Adjust budget, target reach, and conversion rate to simulate acquisition metrics.' 
                : 'اضبط الميزانية، والوصول المستهدف، ونسبة التحويل لمحاكاة مؤشرات الاستحواذ.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Slider 1: Budget */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span>{isEn ? 'Campaign Budget (EGP)' : 'ميزانية الحملة (ج.م)'}</span>
                <span className="text-[#128d46]">{simBudget.toLocaleString()} EGP</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={simBudget}
                onChange={(e) => setSimBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#128d46]"
              />
            </div>

            {/* Slider 2: Target Reach */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span>{isEn ? 'Target Reach (Accounts)' : 'الوصول المستهدف (الحسابات)'}</span>
                <span className="text-indigo-500">{simReach.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={simReach}
                onChange={(e) => setSimReach(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Slider 3: Conversion Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span>{isEn ? 'Target Conversion Rate (%)' : 'نسبة التحويل المستهدفة (%)'}</span>
                <span className="text-amber-500">{simConv.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={simConv}
                onChange={(e) => setSimConv(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Simulator Calculations Output */}
          {(() => {
            const expectedCustomers = Math.round(simReach * (simConv / 100));
            const cac = expectedCustomers > 0 ? Math.round(simBudget / expectedCustomers) : 0;
            const projectedRevenue = expectedCustomers * (metrics.avgCustomerValue || 200000) * 0.8;
            const netProfit = projectedRevenue - simBudget;
            const roas = simBudget > 0 ? (projectedRevenue / simBudget).toFixed(1) : '0';
            const roi = simBudget > 0 ? Math.round(((projectedRevenue - simBudget) / simBudget) * 100) : 0;

            return (
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                <div className="space-y-1">
                  <span className="text-slate-400 block">{isEn ? 'Expected New Customers' : 'العملاء الجدد المتوقعون'}</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{expectedCustomers}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">{isEn ? 'Acquisition Cost (CAC)' : 'تكلفة الاستحواذ (CAC)'}</span>
                  <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{cac.toLocaleString()} EGP</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">{isEn ? 'Projected Revenue' : 'الإيرادات المتوقعة'}</span>
                  <span className="text-sm font-extrabold text-emerald-500">{projectedRevenue.toLocaleString()} EGP</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">ROAS / ROI</span>
                  <span className={`text-sm font-extrabold ${roi > 0 ? 'text-[#128d46]' : 'text-rose-500'}`}>
                    {roas}x / {roi}%
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Marketing Campaign Performance Tracker Panel */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6 flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {isEn ? 'Campaign Performance Tracker' : 'متابعة أداء الحملات التسويقية'}
              </h3>
              <button
                onClick={() => {
                  const demoCampaign = {
                    name: isEn ? `Digital Inbound Camp #${campaignsList.length + 1}` : `حملة رقمية تجريبية #${campaignsList.length + 1}`,
                    budget: 50000,
                    leads: 180,
                    deals: 6,
                    revenue: 210000,
                    status: 'Active'
                  };
                  setCampaignsList(prev => [...prev, demoCampaign]);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-[9px] font-bold transition-all shadow-md"
              >
                🚀 {isEn ? 'Simulate Campaign Run' : 'محاكاة تشغيل حملة'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {isEn 
                ? 'Onboarding pipeline conversion, budget allocations, and ROI per marketing channel.' 
                : 'نسب تحويل العملاء الجدد، توزيع الميزانية، والعائد على الاستثمار لكل قناة.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{isEn ? 'Campaign Channel' : 'قناة الحملة'}</th>
                  <th className="p-3 text-right">{isEn ? 'Budget' : 'الميزانية'}</th>
                  <th className="p-3 text-right">{isEn ? 'Leads' : 'العملاء المحتملون'}</th>
                  <th className="p-3 text-center">{isEn ? 'Conv. Rate' : 'معدل التحويل'}</th>
                  <th className="p-3 text-center">{isEn ? 'ROI' : 'العائد'}</th>
                </tr>
              </thead>
              <tbody>
                {campaignsList.map((c, idx) => {
                  const convRate = c.leads > 0 ? ((c.deals / c.leads) * 100).toFixed(1) : '0';
                  const roi = c.budget > 0 ? (((c.revenue - c.budget) / c.budget) * 100).toFixed(0) : '0';
                  return (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3 text-right font-medium text-slate-500">{c.budget.toLocaleString()} EGP</td>
                      <td className="p-3 text-right font-semibold text-indigo-500">{c.leads}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span className="font-bold">{convRate}%</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        </div>
                      </td>
                      <td className={`p-3 text-center font-extrabold ${Number(roi) > 0 ? 'text-[#128d46]' : 'text-rose-500'}`}>
                        {roi}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strategic Briefing */}
      <div className={`p-6 rounded-2xl border ${
        darkMode ? 'bg-slate-800/40 border-slate-700/60 text-slate-200' : 'bg-amber-500/5 border-amber-500/10 text-slate-800'
      } shadow-sm flex flex-col md:flex-row gap-6 items-start animate-fadeIn`}>
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
          <Lightbulb size={24} className="animate-pulse" />
        </div>
        <div className="space-y-3 w-full">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
            {briefing.title}
          </h3>
          <p className="text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: briefing.overview }} />
          </p>
          <p className="text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: briefing.digitalPerformance }} />
          </p>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              {isEn ? 'Marketing Action Items:' : 'توصيات العمل المباشرة:'}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {briefing.recommendations.split('\n').map((item, idx) => {
                const cleaned = item.replace(/^\d+\.\s*/, '').trim();
                return (
                  <div key={idx} className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl leading-relaxed">
                    {cleaned}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MarketingView);
