import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Target, Boxes, AlertTriangle, 
  Search, Check, DollarSign, Coffee, Percent, Compass, 
  ChevronDown, BookOpen, Sparkles, Filter, ArrowUpDown, ChevronUp, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import CompetitorAnalysisView from './CompetitorAnalysisView';
import { useScaleMode } from '../hooks/useScaleMode';
import yallaSqueasySalesDataRaw from '../data/yalla_squeasy_sales_data.json';

const brandData = yallaSqueasySalesDataRaw as Record<string, any>;

// Translations
const translations = {
  en: {
    brandDashboard: "Brand Intelligence Dashboard",
    brandSubtitle: "Yalla & Squeezy B2C Analytics & Competitive Intelligence",
    globalFilters: "Global Filters",
    year: "Year",
    quarter: "Quarter",
    allYears: "All Years",
    allQuarters: "All Quarters",
    yallaSales: "Yalla Sales",
    yallaMarketing: "Yalla Market Intelligence",
    squeasySales: "Squeasy Sales",
    squeasyMarketing: "Squeasy Market Intelligence",
    revenue: "Net Revenue",
    volumeSold: "Volume Sold",
    returnRate: "Return Rate",
    topSKU: "Top Selling SKU",
    brandRevenueComparison: "Total Revenue by Brand Comparison",
    productRevenueShare: "Product Revenue Share",
    monthlyTrends: "Monthly Sales Trends by Product",
    topCustomers: "Top 10 B2C Customers",
    quarterlySalesComparison: "Quarterly Sales Comparison",
    salespersonPerformance: "B2C Sales Representative Performance",
    representativeDetails: "Representatives Details",
    predictiveChurn: "Predictive Churn Risk & Revenue At Risk",
    revenueAtRisk: "Revenue at Risk",
    atRiskCustomers: "At Risk Customers (High/Med)",
    totalCustomers: "Total Customers",
    riskSegmentDistribution: "Risk Segment Distribution",
    highValueCustomersRisk: "High-Value Customers at Risk of Churning",
    customer: "Customer",
    salesValue: "Sales Value",
    recency: "Recency",
    churnProb: "Churn Prob.",
    lowRisk: "Low Risk",
    mediumRisk: "Medium Risk",
    highRisk: "High Risk",
    marketingInsights: "Market Overview & Consumer Trends",
    omnichannelPricing: "Omnichannel Pricing Matrix",
    competitiveLandscape: "Competitive Landscape",
    strategicCampaignDirectives: "Strategic Recommendations",
    pricingSubtitle: "Retail vs Q-Commerce pricing comparison.",
    sku: "Brand / SKU",
    size: "Size",
    retailPrice: "Retail Price",
    qcomPrice: "Q-Commerce Price",
    inflation: "Inflation",
    pricePerGram: "Price / g",
    formatFriction: "Format Friction",
    attribute: "Attribute",
    flavourRange: "Flavour Range",
    adSpend: "Ad Spend (Dig / Trad)",
    positioning: "Positioning",
    servingPrice: "Serving Price",
    shelfLife: "Shelf Life",
    logisticsFriction: "Logistics Friction",
    priceStability: "Price-Stability Messaging",
    closePOS: "Close the POS Gap",
    leadFlavour: "Lead with Flavour Differentiation",
    ownConvenience: "Own Convenience",
    actionDirective: "Action Directive",
    targetMetric: "Target Metric",
    rationaleProof: "Rationale & Data Proof Points",
    loading: "Loading brand dashboard data...",
    error: "Failed to load brand data.",
    active: "Active",
    leader: "Leader",
    otherProducts: "Other Products",
    selectDivision: "Select Division",
    combinedYallaGroup: "Combined Yalla Group",
    yallaKoffee: "Yalla Koffee",
    yallaFrappitt: "Yalla Frappitt",
    yallaSmoozy: "Yalla Smoozy",
    select: "Select All",
    deselect: "Deselect All",
    repsTotal: "Total Net Sales",
    allTimeNet: "All-Time Net Sales",
  },
  ar: {
    brandDashboard: "لوحة تحكم ذكاء العلامة التجارية",
    brandSubtitle: "تحليلات B2C لـ Yalla و Squeezy والذكاء التنافسي",
    globalFilters: "الفلاتر العامة",
    year: "السنة",
    quarter: "الربع",
    allYears: "جميع السنوات",
    allQuarters: "جميع الأرباع",
    yallaSales: "مبيعات يالا",
    yallaMarketing: "تسويق يالا",
    squeasySales: "مبيعات سكويزي",
    squeasyMarketing: "تسويق سكويزي",
    revenue: "صافي الإيرادات",
    volumeSold: "الكمية المباعة",
    returnRate: "معدل المرتجعات",
    topSKU: "المنتج الأكثر مبيعاً",
    brandRevenueComparison: "مقارنة إجمالي الإيرادات حسب العلامة التجارية",
    productRevenueShare: "الحصة السوقية لإيرادات المنتجات",
    monthlyTrends: "اتجاهات المبيعات الشهرية حسب المنتج",
    topCustomers: "أهم ١٠ عملاء B2C",
    quarterlySalesComparison: "مقارنة المبيعات الربع سنوية",
    salespersonPerformance: "أداء مندوبي مبيعات B2C",
    representativeDetails: "تفاصيل المندوبين",
    predictiveChurn: "مخاطر العملاء المحتمل توقفهم والإيرادات المعرضة للخطر",
    revenueAtRisk: "الإيرادات المعرضة للخطر",
    atRiskCustomers: "العملاء المعرضون للخطر (مرتفع/متوسط)",
    totalCustomers: "إجمالي العملاء",
    riskSegmentDistribution: "توزيع فئات المخاطر",
    highValueCustomersRisk: "العملاء ذوي القيمة العالية المعرضون للتوقف",
    customer: "العميل",
    salesValue: "قيمة المبيعات",
    recency: "الحداثة (أيام)",
    churnProb: "احتمالية التوقف",
    lowRisk: "خطر منخفض",
    mediumRisk: "خطر متوسط",
    highRisk: "خطر مرتفع",
    marketingInsights: "نظرة عامة على السوق واتجاهات المستهلكين",
    omnichannelPricing: "مصفوفة التسعير متعددة القنوات",
    competitiveLandscape: "المشهد التنافسي",
    strategicCampaignDirectives: "التوجيهات والتوصيات الاستراتيجية",
    pricingSubtitle: "مقارنة أسعار التجزئة مقابل أسعار التجارة السريعة.",
    sku: "الصنف / المنتج",
    size: "الحجم",
    retailPrice: "سعر التجزئة",
    qcomPrice: "سعر التجارة السريعة",
    inflation: "التضخم",
    pricePerGram: "السعر / جرام",
    formatFriction: "عوائق الاستخدام",
    attribute: "الخاصية",
    flavourRange: "مجموعة النكهات",
    adSpend: "الإنفاق الإعلاني (رقمي / تقليدي)",
    positioning: "الموقع في السوق",
    servingPrice: "سعر الحصة",
    shelfLife: "مدة الصلاحية",
    logisticsFriction: "عوائق اللوجستيات",
    priceStability: "رسائل استقرار الأسعار",
    closePOS: "سد فجوة نقاط البيع",
    leadFlavour: "الريادة بتميز النكهات",
    ownConvenience: "التركيز على ميزة السهولة",
    actionDirective: "التوجيه الاستراتيجي",
    targetMetric: "المؤشر المستهدف",
    rationaleProof: "المبررات وإثباتات البيانات",
    loading: "جاري تحميل بيانات لوحة التحكم...",
    error: "فشل تحميل بيانات العلامات التجارية.",
    active: "نشط",
    leader: "رائد المبيعات",
    otherProducts: "منتجات أخرى",
    selectDivision: "اختر القسم",
    combinedYallaGroup: "مجموعة يالا المشتركة",
    yallaKoffee: "يالا كوفي",
    yallaFrappitt: "يالا فرابيت",
    yallaSmoozy: "يالا سموزي",
    select: "تحديد الكل",
    deselect: "إلغاء تحديد الكل",
    repsTotal: "إجمالي المبيعات الصافية",
    allTimeNet: "صافي مبيعات كل الأوقات",
  }
};

interface BrandDashboardProps {
  language: 'en' | 'ar';
  darkMode: boolean;
  timePeriod?: string;
  customStartDate?: string;
  customEndDate?: string;
  processedData: any[];
  currentUser?: any;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (q: string) => void;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric?: 'revenue' | 'volume';
  globalCompareMode?: boolean;
}

function BrandDashboardView({ 
  language, 
  darkMode,
  timePeriod = 'All',
  customStartDate = '',
  customEndDate = '',
  processedData,
  currentUser,
  selectedYear,
  setSelectedYear,
  selectedQuarter,
  setSelectedQuarter,
  chartDisplayMode,
  globalChartMetric = 'revenue',
  globalCompareMode = false
}: BrandDashboardProps) {
  const t = translations[language];
  const isEn = language === 'en';
  const scaleMode = useScaleMode();

  const [activeTab, setActiveTab] = useState<string>("yalla-sales");

  // Dynamic filterKey based on parent global time filters or local selectors
  const filterKey = useMemo(() => {
    return `${selectedYear}_${selectedQuarter}`;
  }, [selectedYear, selectedQuarter]);

  // Dynamic selectors
  const [yallaRepSelect, setYallaRepSelect] = useState<string>("yalla_combined");
  const [yallaChurnSelect, setYallaChurnSelect] = useState<string>("yalla_koffi");

  // Local Trends line visibility filters
  const [hiddenProducts, setHiddenProducts] = useState<Record<string, boolean>>({});

  // Dynamic Churn table sorting
  const [yallaSortField, setYallaSortField] = useState<string>("probability");
  const [yallaSortAsc, setYallaSortAsc] = useState<boolean>(false);
  const [squeasySortField, setSqueasySortField] = useState<string>("probability");
  const [squeasySortAsc, setSqueasySortAsc] = useState<boolean>(false);
  const [yallaChurnCount, setYallaChurnCount] = useState<number>(10);
  const [squeasyChurnCount, setSqueasyChurnCount] = useState<number>(10);

  // Format Helper functions
  const formatVal = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const scaledVal = val / factor;
    const formattedNum = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(scaledVal);

    return `${formattedNum} ${suffix} ${language === 'en' ? 'EGP' : 'ج.م'}`;
  };

  const formatNum = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const scaledVal = val / factor;
    const formatted = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ar-EG', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(scaledVal);
    return `${formatted} ${suffix}`;
  };

  // Click handler to toggle lines via Legend click
  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    if (!dataKey) return;
    setHiddenProducts(prev => {
      const updated = { ...prev };
      if (updated[dataKey]) {
        delete updated[dataKey];
      } else {
        updated[dataKey] = true;
      }
      return updated;
    });
  };

  // Custom legend text formatter to show line-through & opacity on disabled items
  const renderLegendText = (value: string, entry: any) => {
    const isHidden = hiddenProducts[entry.dataKey];
    return (
      <span 
        style={{ 
          textDecoration: isHidden ? 'line-through' : 'none', 
          opacity: isHidden ? 0.35 : 0.85,
          cursor: 'pointer',
          userSelect: 'none',
          paddingLeft: '4px',
          paddingRight: '4px'
        }}
      >
        {value}
      </span>
    );
  };

  // filterKey is computed dynamically based on global filters

  // Get active datasets
  const activeMetrics = useMemo(() => {
    if (!brandData) return null;
    const yk = brandData.yalla_koffi.filters[filterKey];
    const yf = brandData.yalla_frappit.filters[filterKey];
    const ys = brandData.yalla_smoozy.filters[filterKey];
    const sq = brandData.squeasy.filters[filterKey];
    const yc = brandData.yalla_combined.filters[filterKey];

    // Squeasy Top Selling SKU extraction
    let sqTopSKU = "-";
    let sqTopSKURev = 0;
    if (sq?.product_share && sq.product_share.length > 0) {
      const leader = sq.product_share[0];
      sqTopSKU = leader['Material Desc'].split(" - ")[0];
      sqTopSKURev = leader['Net_Sales'];
    }

    return {
      yk, yf, ys, sq, yc,
      sqTopSKU, sqTopSKURev
    };
  }, [brandData, filterKey]);

  // Brand Revenue comparison dataset (excludes Squeezy per original specifications)
  const brandComparisonData = useMemo(() => {
    if (!activeMetrics) return [];
    const rawData = [
      { name: language === 'en' ? 'Yalla Koffee' : 'يالا كوفي', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.yk.metrics.qty) : Math.round(activeMetrics.yk.metrics.revenue), fill: '#f97316' },
      { name: language === 'en' ? 'Yalla Frappitt' : 'يالا فرابيت', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.yf.metrics.qty) : Math.round(activeMetrics.yf.metrics.revenue), fill: '#eab308' },
      { name: language === 'en' ? 'Yalla Smoozy' : 'يالا سموزي', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.ys.metrics.qty) : Math.round(activeMetrics.ys.metrics.revenue), fill: '#ec4899' },
    ];
    if (chartDisplayMode === 'percent') {
      const total = rawData.reduce((acc, curr) => acc + curr.value, 0);
      return rawData.map(item => ({
        ...item,
        originalValue: item.value,
        value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
      }));
    }
    return rawData;
  }, [activeMetrics, language, chartDisplayMode, globalChartMetric]);

  // Product share donuts helper
  const getDoughnutData = (shareData: any[] | undefined) => {
    if (!shareData) return [];
    let items = [...shareData];
    if (items.length > 5) {
      const top5 = items.slice(0, 5);
      const rest = items.slice(5);
      const otherSales = rest.reduce((sum, x) => sum + x.Net_Sales, 0);
      const otherQty = rest.reduce((sum, x) => sum + x.Quantity, 0);
      if (otherSales > 0) {
        top5.push({
          'Material Desc': language === 'en' ? 'Other Products' : 'منتجات أخرى',
          'Net_Sales': otherSales,
          'Quantity': otherQty
        });
      }
      items = top5;
    }
    return items.map(x => ({
      name: x['Material Desc'].split(" - ")[0],
      value: globalChartMetric === 'volume' ? (x.Quantity || 0) : Math.round(x.Net_Sales),
      qty: x.Quantity
    }));
  };

  const ykShare = useMemo(() => getDoughnutData(activeMetrics?.yk?.product_share), [activeMetrics, language, globalChartMetric]);
  const yfShare = useMemo(() => getDoughnutData(activeMetrics?.yf?.product_share), [activeMetrics, language, globalChartMetric]);
  const ysShare = useMemo(() => getDoughnutData(activeMetrics?.ys?.product_share), [activeMetrics, language, globalChartMetric]);
  const sqShare = useMemo(() => getDoughnutData(activeMetrics?.sq?.product_share), [activeMetrics, language, globalChartMetric]);

  // Trend lines helper
  const getTrendData = (trends: any[] | undefined) => {
    if (!trends || trends.length === 0) return { products: [], chartData: [] };
    const months = Array.from(new Set(trends.map(t => t.month))).sort();
    const products = Array.from(new Set(trends.map(t => t.product)));

    return {
      products,
      chartData: months.map(m => {
        const point: any = { monthLabel: new Date(m).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-EG', { month: 'short', year: '2-digit' }) };
        let monthTotal = 0;
        products.forEach((p: any) => {
          const found = trends.find(t => t.month === m && t.product === p);
          const val = found ? Math.round(globalChartMetric === 'volume' ? (found.qty || found.quantity || found.volume || 0) : found.revenue) : 0;
          point[p] = val;
          if (p !== 'Total Sales' && p !== 'Total' && p !== 'الإجمالي') {
            monthTotal += val;
          }
        });
        point[language === 'en' ? 'Total' : 'الإجمالي'] = monthTotal;
        return point;
      })
    };
  };

  const ykTrends = useMemo(() => getTrendData(activeMetrics?.yk?.trends), [activeMetrics, language, globalChartMetric]);
  const yfTrends = useMemo(() => getTrendData(activeMetrics?.yf?.trends), [activeMetrics, language, globalChartMetric]);
  const ysTrends = useMemo(() => getTrendData(activeMetrics?.ys?.trends), [activeMetrics, language, globalChartMetric]);

  const sqTrends = useMemo(() => {
    if (!activeMetrics?.sq) return { products: [], chartData: [] };
    // Filter to top 5 products + Total Sales to mirror original
    const top5Names = (activeMetrics.sq.product_share || []).slice(0, 5).map((p: any) => p['Material Desc']);
    const allowed = [...top5Names, "Total Sales"];
    const filteredTrends = (activeMetrics.sq.trends || []).filter((t: any) => allowed.includes(t.product));
    return getTrendData(filteredTrends);
  }, [activeMetrics, language, globalChartMetric]);

  // Horizontal bar top customers helper
  const getCustomerChartData = (customers: any[] | undefined) => {
    if (!customers) return [];
    const items = [...customers].slice(0, 10).map(c => ({
      name: c['Customer Name'],
      value: Math.round(globalChartMetric === 'volume' ? (c.Quantity || c.Qty || 0) : c.Net_Sales)
    })).reverse();

    if (chartDisplayMode === 'percent') {
      const total = items.reduce((acc, curr) => acc + curr.value, 0);
      return items.map(c => ({
        ...c,
        value: total > 0 ? Number(((c.value / total) * 100).toFixed(1)) : 0
      }));
    }

    return items;
  };

  const ykCustomers = useMemo(() => getCustomerChartData(activeMetrics?.yk?.top_customers), [activeMetrics, globalChartMetric, chartDisplayMode]);
  const yfCustomers = useMemo(() => getCustomerChartData(activeMetrics?.yf?.top_customers), [activeMetrics, globalChartMetric, chartDisplayMode]);
  const ysCustomers = useMemo(() => getCustomerChartData(activeMetrics?.ys?.top_customers), [activeMetrics, globalChartMetric, chartDisplayMode]);
  const sqCustomers = useMemo(() => getCustomerChartData(activeMetrics?.sq?.top_customers), [activeMetrics, globalChartMetric, chartDisplayMode]);

  // Grouped Quarterly Performance comparison
  const getQuarterlyComparisonData = (comparison: any) => {
    if (!comparison) return [];
    const years = Object.keys(comparison).sort();
    return years.map(yr => {
      const q1 = Math.round(comparison[yr][0]);
      const q2 = Math.round(comparison[yr][1]);
      const q3 = Math.round(comparison[yr][2]);
      const q4 = Math.round(comparison[yr][3]);
      const yrTotal = q1 + q2 + q3 + q4;
      if (chartDisplayMode === 'percent' && yrTotal > 0) {
        return {
          year: yr,
          Q1: Number(((q1 / yrTotal) * 100).toFixed(1)),
          Q2: Number(((q2 / yrTotal) * 100).toFixed(1)),
          Q3: Number(((q3 / yrTotal) * 100).toFixed(1)),
          Q4: Number(((q4 / yrTotal) * 100).toFixed(1)),
        };
      }
      return {
        year: yr,
        Q1: q1,
        Q2: q2,
        Q3: q3,
        Q4: q4,
      };
    });
  };

  const yallaQuarterly = useMemo(() => {
    if (!brandData) return [];
    return getQuarterlyComparisonData(brandData.yalla_combined.quarterly_comparison);
  }, [brandData, chartDisplayMode]);

  const squeasyQuarterly = useMemo(() => {
    if (!brandData) return [];
    return getQuarterlyComparisonData(brandData.squeasy.quarterly_comparison);
  }, [brandData, chartDisplayMode]);

  const yallaQuarterlyTotal = useMemo(() => {
    if (!brandData?.yalla_combined?.quarterly_comparison) return 0;
    let sum = 0;
    Object.values(brandData.yalla_combined.quarterly_comparison).forEach((arr: any) => {
      sum += arr.reduce((a: number, b: number) => a + b, 0);
    });
    return sum;
  }, [brandData]);

  const squeasyQuarterlyTotal = useMemo(() => {
    if (!brandData?.squeasy?.quarterly_comparison) return 0;
    let sum = 0;
    Object.values(brandData.squeasy.quarterly_comparison).forEach((arr: any) => {
      sum += arr.reduce((a: number, b: number) => a + b, 0);
    });
    return sum;
  }, [brandData]);

  // Salespersons performance division switcher
  const yallaRepsData = useMemo(() => {
    if (!brandData) return [];
    const div = brandData[yallaRepSelect]?.filters[filterKey];
    return div?.salespersons || [];
  }, [brandData, yallaRepSelect, filterKey]);

  const yallaRepsChartData = useMemo(() => {
    return [...yallaRepsData].slice(0, 10).map(r => ({
      name: r.name,
      value: Math.round(r.revenue)
    })).reverse();
  }, [yallaRepsData]);

  const squeasyRepsData = useMemo(() => {
    return activeMetrics?.sq?.salespersons || [];
  }, [activeMetrics]);

  const squeasyRepsChartData = useMemo(() => {
    return [...squeasyRepsData].slice(0, 10).map(r => ({
      name: r.name,
      value: Math.round(r.revenue)
    })).reverse();
  }, [squeasyRepsData]);

  // Churn tables dynamic sorting
  const yallaChurnDataSorted = useMemo(() => {
    if (!brandData) return [];
    const divData = brandData[yallaChurnSelect]?.filters[filterKey];
    if (!divData?.churn?.at_risk) return [];

    return [...divData.churn.at_risk].sort((a, b) => {
      let valA = a[yallaSortField];
      let valB = b[yallaSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return yallaSortAsc ? -1 : 1;
      if (valA > valB) return yallaSortAsc ? 1 : -1;
      return 0;
    });
  }, [brandData, yallaChurnSelect, filterKey, yallaSortField, yallaSortAsc]);

  const squeasyChurnDataSorted = useMemo(() => {
    const list = activeMetrics?.sq?.churn?.at_risk || [];
    return [...list].sort((a, b) => {
      let valA = a[squeasySortField];
      let valB = b[squeasySortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return squeasySortAsc ? -1 : 1;
      if (valA > valB) return squeasySortAsc ? 1 : -1;
      return 0;
    });
  }, [activeMetrics, squeasySortField, squeasySortAsc]);

  const handleYallaSort = (field: string) => {
    if (yallaSortField === field) {
      setYallaSortAsc(!yallaSortAsc);
    } else {
      setYallaSortField(field);
      setYallaSortAsc(field === 'customer');
    }
  };

  const handleSqueasySort = (field: string) => {
    if (squeasySortField === field) {
      setSqueasySortAsc(!squeasySortAsc);
    } else {
      setSqueasySortField(field);
      setSqueasySortAsc(field === 'customer');
    }
  };

  // Multi-color palette for trend lines
  const multiColors = [
    '#f97316', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6',
    '#eab308', '#06b6d4', '#f43f5e', '#14b8a6', '#6366f1',
    '#a855f7', '#ff6b6b', '#4ecdc4', '#ffe66d', '#ff1493'
  ];

  if (!brandData || !activeMetrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-rose-500">
        <AlertTriangle size={32} />
        <p className="text-sm font-bold mt-2">{t.error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Platform Header */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
        <div>
          <h2 className={`text-xl font-extrabold flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <Sparkles size={20} className="text-indigo-500" />
            <span>{t.brandDashboard}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t.brandSubtitle}</p>
        </div>

        {/* Global Filter Summary Banner */}
        <div className={`p-3 px-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
          darkMode ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <Filter size={13} className="text-indigo-500" />
          <span>
            {language === 'en' ? 'Active Filters:' : 'الفلاتر النشطة:'}{' '}
            <span className="text-indigo-500 font-bold dark:text-indigo-400">
              {language === 'en' ? 'Year:' : 'السنة:'} {selectedYear} | {language === 'en' ? 'Quarter:' : 'الربع:'} {selectedQuarter === 'All' ? (language === 'en' ? 'All' : 'الكل') : `Q${selectedQuarter}`}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 text-xs no-print">
        <button
          onClick={() => setActiveTab('yalla-sales')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'yalla-sales' 
              ? 'border-orange-500 text-orange-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Coffee size={14} />
          {t.yallaSales}
        </button>
        <button
          onClick={() => setActiveTab('yalla-marketing')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'yalla-marketing' 
              ? 'border-orange-500 text-orange-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <BookOpen size={14} />
          {t.yallaMarketing}
        </button>
        <button
          onClick={() => setActiveTab('squeasy-sales')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'squeasy-sales' 
              ? 'border-violet-500 text-violet-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Boxes size={14} />
          {t.squeasySales}
        </button>
        <button
          onClick={() => setActiveTab('squeasy-marketing')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'squeasy-marketing' 
              ? 'border-violet-500 text-violet-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <BookOpen size={14} />
          {t.squeasyMarketing}
        </button>
        <button
          onClick={() => setActiveTab('competitor-insights')}
          className={`px-4 py-2.5 font-extrabold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'competitor-insights' 
              ? 'border-indigo-500 text-indigo-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <TrendingUp size={14} />
          {language === 'en' ? 'Competitor Insights' : 'تحليلات المنافسين'}
        </button>
      </div>

      {/* Main content grid switch */}
      
      {/* TAB 1: YALLA SALES */}
      {activeTab === 'yalla-sales' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/20 border-orange-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block mb-1">{t.yallaKoffee}</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yk.metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yk.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
              <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                Return: {(activeMetrics.yk.metrics.return_rate * 100).toFixed(1)}%
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50/20 border-yellow-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-yellow-600 tracking-wider block mb-1">{t.yallaFrappitt}</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yf.metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yf.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
              <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                Return: {(activeMetrics.yf.metrics.return_rate * 100).toFixed(1)}%
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-pink-500/5 border-pink-500/20' : 'bg-pink-50/20 border-pink-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-pink-500 tracking-wider block mb-1">{t.yallaSmoozy}</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.ys.metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.ys.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
              <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                Return: {(activeMetrics.ys.metrics.return_rate * 100).toFixed(1)}%
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/20 border-indigo-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">{t.combinedYallaGroup}</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.yc.metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.yc.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
              <div className="absolute right-4 top-4 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                {t.active}
              </div>
            </div>
          </div>

          {/* Core Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand comparison bar chart */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.brandRevenueComparison}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={brandComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (chartDisplayMode === 'percent') return `${v}%`;
                        return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                      }}
                    />
                    <Tooltip 
                      formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                      {brandComparisonData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Combined Quarterly Sales */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-1">{t.quarterlySalesComparison}</h3>
              <p className="text-[9px] text-slate-400 mb-4">{t.allTimeNet}: {formatVal(yallaQuarterlyTotal)}</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={yallaQuarterly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="year" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (chartDisplayMode === 'percent') return `${v}%`;
                        return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                      }}
                    />
                    <Tooltip 
                      formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Q1" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q2" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q3" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q4" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Product shares grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.yallaKoffee} — {t.productRevenueShare}</h3>
              <div className="h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={ykShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                      {ykShare.map((entry, idx) => (
                        <Cell key={idx} fill={['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#64748b'][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => {
                        if (chartDisplayMode === 'percent') {
                          const total = ykShare.reduce((sum, x) => sum + x.value, 0);
                          return [`${total > 0 ? ((Number(v) / total) * 100).toFixed(1) : 0}%`, isEn ? 'Share' : 'الحصة'];
                        }
                        return [formatVal(v), ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col justify-center items-center pointer-events-none text-center">
                  <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#475569' }}>{isEn ? 'Total' : 'الإجمالي'}</span>
                  <span className="text-[9.5px] font-black" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
                    {chartDisplayMode === 'percent' ? '100%' : formatVal(ykShare.reduce((sum, x) => sum + x.value, 0))}
                  </span>
                </div>
              </div>
              <div className="text-[10px] space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
                {ykShare.map((entry, idx) => {
                  const total = ykShare.reduce((sum, x) => sum + x.value, 0);
                  const displayVal = chartDisplayMode === 'percent' 
                    ? `${total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%` 
                    : formatVal(entry.value);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400 truncate max-w-[70%]">{entry.name}</span>
                      <span className="font-bold">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.yallaFrappitt} — {t.productRevenueShare}</h3>
              <div className="h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={yfShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                      {yfShare.map((entry, idx) => (
                        <Cell key={idx} fill={['#ca8a04', '#eab308', '#fde047', '#fef08a', '#fef9c3', '#64748b'][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => {
                        if (chartDisplayMode === 'percent') {
                          const total = yfShare.reduce((sum, x) => sum + x.value, 0);
                          return [`${total > 0 ? ((Number(v) / total) * 100).toFixed(1) : 0}%`, isEn ? 'Share' : 'الحصة'];
                        }
                        return [formatVal(v), ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col justify-center items-center pointer-events-none text-center">
                  <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#475569' }}>{isEn ? 'Total' : 'الإجمالي'}</span>
                  <span className="text-[9.5px] font-black" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
                    {chartDisplayMode === 'percent' ? '100%' : formatVal(yfShare.reduce((sum, x) => sum + x.value, 0))}
                  </span>
                </div>
              </div>
              <div className="text-[10px] space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
                {yfShare.map((entry, idx) => {
                  const total = yfShare.reduce((sum, x) => sum + x.value, 0);
                  const displayVal = chartDisplayMode === 'percent' 
                    ? `${total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%` 
                    : formatVal(entry.value);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400 truncate max-w-[70%]">{entry.name}</span>
                      <span className="font-bold">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.yallaSmoozy} — {t.productRevenueShare}</h3>
              <div className="h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={ysShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                      {ysShare.map((entry, idx) => (
                        <Cell key={idx} fill={['#db2777', '#ec4899', '#f472b6', '#fbcfe8', '#fdf2f8', '#64748b'][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => {
                        if (chartDisplayMode === 'percent') {
                          const total = ysShare.reduce((sum, x) => sum + x.value, 0);
                          return [`${total > 0 ? ((Number(v) / total) * 100).toFixed(1) : 0}%`, isEn ? 'Share' : 'الحصة'];
                        }
                        return [formatVal(v), ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col justify-center items-center pointer-events-none text-center">
                  <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#475569' }}>{isEn ? 'Total' : 'الإجمالي'}</span>
                  <span className="text-[9.5px] font-black" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
                    {chartDisplayMode === 'percent' ? '100%' : formatVal(ysShare.reduce((sum, x) => sum + x.value, 0))}
                  </span>
                </div>
              </div>
              <div className="text-[10px] space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
                {ysShare.map((entry, idx) => {
                  const total = ysShare.reduce((sum, x) => sum + x.value, 0);
                  const displayVal = chartDisplayMode === 'percent' 
                    ? `${total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%` 
                    : formatVal(entry.value);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400 truncate max-w-[70%]">{entry.name}</span>
                      <span className="font-bold">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Monthly line trend charts with visibility filters */}
          <div className="space-y-6">
            {/* Koffee Trend */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider">{t.yallaKoffee}: {t.monthlyTrends}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      ykTrends.products.forEach((p: any) => delete updated[p]);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.select}
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      ykTrends.products.forEach((p: any) => updated[p] = true);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.deselect}
                  </button>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={ykTrends.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                    {ykTrends.products.map((prod, idx) => (
                      <Line
                        key={prod}
                        type="monotone"
                        dataKey={prod}
                        name={prod.split(" - ")[0]}
                        stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                        strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                        strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                        hide={hiddenProducts[prod]}
                        dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey={language === 'en' ? 'Total' : 'الإجمالي'}
                      name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
                      stroke={darkMode ? '#38bdf8' : '#0284c7'}
                      strokeWidth={3.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Frappitt Trend */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider">{t.yallaFrappitt}: {t.monthlyTrends}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      yfTrends.products.forEach((p: any) => delete updated[p]);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.select}
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      yfTrends.products.forEach((p: any) => updated[p] = true);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.deselect}
                  </button>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={yfTrends.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                    {yfTrends.products.map((prod, idx) => (
                      <Line
                        key={prod}
                        type="monotone"
                        dataKey={prod}
                        name={prod.split(" - ")[0]}
                        stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                        strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                        strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                        hide={hiddenProducts[prod]}
                        dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey={language === 'en' ? 'Total' : 'الإجمالي'}
                      name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
                      stroke={darkMode ? '#38bdf8' : '#0284c7'}
                      strokeWidth={3.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Smoozy Trend */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider">{t.yallaSmoozy}: {t.monthlyTrends}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      ysTrends.products.forEach((p: any) => delete updated[p]);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.select}
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      ysTrends.products.forEach((p: any) => updated[p] = true);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.deselect}
                  </button>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={ysTrends.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                    {ysTrends.products.map((prod, idx) => (
                      <Line
                        key={prod}
                        type="monotone"
                        dataKey={prod}
                        name={prod.split(" - ")[0]}
                        stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                        strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                        strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                        hide={hiddenProducts[prod]}
                        dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey={language === 'en' ? 'Total' : 'الإجمالي'}
                      name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
                      stroke={darkMode ? '#38bdf8' : '#0284c7'}
                      strokeWidth={3.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top B2C Customers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.yallaKoffee}</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={ykCustomers} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.yallaFrappitt}</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={yfCustomers} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="#eab308" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers} — {t.yallaSmoozy}</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={ysCustomers} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={85} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="#ec4899" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Salesperson Performance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-750 pb-4 mb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Users size={15} className="text-orange-500" />
                  <span>{t.salespersonPerformance} ({t.combinedYallaGroup})</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-400 font-medium">{t.selectDivision}:</label>
                <select
                  value={yallaRepSelect}
                  onChange={(e) => setYallaRepSelect(e.target.value)}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  } outline-none focus:border-indigo-500`}
                >
                  <option value="yalla_combined">{t.combinedYallaGroup}</option>
                  <option value="yalla_koffi">{t.yallaKoffee}</option>
                  <option value="yalla_frappit">{t.yallaFrappitt}</option>
                  <option value="yalla_smoozy">{t.yallaSmoozy}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={yallaRepsChartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="rgba(249, 115, 22, 0.75)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reps details table */}
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{language === 'en' ? 'Salesperson' : 'مندوب المبيعات'}</th>
                      <th className="p-2.5 text-right">{t.revenue}</th>
                      <th className="p-2.5 text-right">{t.volumeSold}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yallaRepsData.map((rep: any, idx: number) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-2.5 font-bold">{rep.name}</td>
                        <td className="p-2.5 text-right font-semibold text-orange-500">{formatVal(rep.revenue)}</td>
                        <td className="p-2.5 text-right font-medium">{formatNum(rep.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Predictive Churn Analysis */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-750 pb-4 mb-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={15} className="text-rose-500 animate-pulse" />
                  <span>{t.predictiveChurn}</span>
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 p-1 px-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px]">{language === 'en' ? 'Show Rows:' : 'عرض الصفوف:'}</span>
                  <input 
                    type="range" 
                    min="5" 
                    max={Math.max(10, yallaChurnDataSorted.length)} 
                    value={yallaChurnCount} 
                    onChange={(e) => setYallaChurnCount(Number(e.target.value))}
                    className="w-16 lg:w-20 accent-indigo-500 h-1 bg-slate-350 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-indigo-500 font-extrabold text-[10px]">{yallaChurnCount}</span>
                </div>
                <label className="text-slate-400 font-medium">{t.selectDivision}:</label>
                <select
                  value={yallaChurnSelect}
                  onChange={(e) => setYallaChurnSelect(e.target.value)}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-bold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  } outline-none focus:border-indigo-500`}
                >
                  <option value="yalla_koffi">{t.yallaKoffee}</option>
                  <option value="yalla_frappit">{t.yallaFrappitt}</option>
                  <option value="yalla_smoozy">{t.yallaSmoozy}</option>
                </select>
              </div>
            </div>

            {/* Churn Stats Cards */}
            {(() => {
              const churn = brandData[yallaChurnSelect]?.filters[filterKey]?.churn;
              if (!churn) return null;
              
              const lowPct = ((churn.summary.low / churn.summary.total_customers) * 100).toFixed(1);
              const medPct = ((churn.summary.medium / churn.summary.total_customers) * 100).toFixed(1);
              const highPct = ((churn.summary.high / churn.summary.total_customers) * 100).toFixed(1);

              const distributionPie = [
                { name: t.lowRisk, value: churn.summary.low, percentage: lowPct, fill: '#10b981' },
                { name: t.mediumRisk, value: churn.summary.medium, percentage: medPct, fill: '#f59e0b' },
                { name: t.highRisk, value: churn.summary.high, percentage: highPct, fill: '#ef4444' },
              ];

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/10 border-rose-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.revenueAtRisk}</span>
                      <span className="text-base font-black text-rose-500 block mt-1">{formatVal(churn.summary.revenue_at_risk)}</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/10 border-amber-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.atRiskCustomers}</span>
                      <span className="text-base font-black text-amber-500 block mt-1">{churn.summary.high + churn.summary.medium} {language === 'en' ? 'customers' : 'عملاء'}</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-750' : 'bg-slate-100/50 border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.totalCustomers}</span>
                      <span className="text-base font-black block mt-1">{formatNum(churn.summary.total_customers)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Segment distribution pie chart */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-750' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between`}>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">{t.riskSegmentDistribution}</h4>
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <PieChart>
                            <Pie 
                              data={distributionPie} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={35} 
                              outerRadius={55}
                            >
                              {distributionPie.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`${v} customers`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[10px] space-y-2 mt-2">
                        {distributionPie.map((entry, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                              {entry.name}
                            </span>
                            <span className="font-bold">{entry.value} ({entry.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customers at risk list */}
                    <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px] select-none`}>
                            <th className="p-3 cursor-pointer" onClick={() => handleYallaSort('customer')}>
                              <div className="flex items-center gap-1">
                                <span>{t.customer}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleYallaSort('revenue')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.salesValue}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleYallaSort('recency')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.recency}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleYallaSort('probability')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.churnProb}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {yallaChurnDataSorted.slice(0, yallaChurnCount).map((cust: any, idx: number) => {
                            const badge = cust.risk === "High" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20";
                            return (
                              <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                                <td className="p-3 font-bold">{cust.customer}</td>
                                <td className="p-3 text-right font-semibold">{formatVal(cust.revenue)}</td>
                                <td className="p-3 text-right">{cust.recency} {language === 'en' ? 'days' : 'أيام'}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${badge}`}>
                                    {cust.probability}% ({cust.risk})
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 2: YALLA MARKETING */}
      {activeTab === 'yalla-marketing' && (
        <div className="space-y-6">
          {/* Highlights grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-orange-500">0%</div>
              <p className="text-[10px] text-slate-400 mt-1">Yalla Smoozy price inflation from retail to Q-commerce delivery apps.</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-rose-500">+54%</div>
              <p className="text-[10px] text-slate-400 mt-1">Nescafé Q-commerce markup versus retail store shelf pricing.</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-yellow-500">3 / 10</div>
              <p className="text-[10px] text-slate-400 mt-1">Yalla traditional/POS ad spend score – the key brand visibility gap.</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-emerald-500">18 mo</div>
              <p className="text-[10px] text-slate-400 mt-1">Yalla Smoozy dry-sachet shelf life versus Osterberg's perishability.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Summary */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-orange-500" />
                <span>{t.marketingInsights}</span>
              </h3>
              <div className="text-xs leading-relaxed space-y-3 text-slate-300">
                <p>
                  Yalla Drinks enters an instant café category that Nescafé still dominates by sheer weight of spend, but the underlying data points to an opening rather than a wall. Across seven brands and three formats — instant coffee sachets, frappé mixes, and fruit smoothies — the market splits cleanly into two behaviours: legacy players that pass Q-commerce fees straight onto the consumer, and a smaller group, Yalla included, that has chosen to absorb them.
                </p>
                <p>
                  On pricing, <strong>Yalla Frappit</strong> and <strong>Yalla Smoozy</strong> carry the flattest retail-to-Q-commerce curve in the set (4.8% and 0%, respectively), while Nescafé's basket inflates by 54% and Ali Café by 40% the moment a shopper orders through Talabat instead of a supermarket shelf. On format, Yalla Smoozy is the only smoothie SKU in a spill-proof, shelf-stable sachet — a direct answer to Osterberg's 1-litre glass bottle, which requires refrigeration and a measuring step. On spend, Yalla's digital score (7/10) is competitive, but its traditional/POS score (3/10) trails every major competitor except Osterberg, leaving physical point-of-sale visibility as the primary growth lever.
                </p>
              </div>
            </div>

            {/* Market Overview */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Compass size={16} className="text-orange-500" />
                <span>{language === 'en' ? '2. Market Overview & Consumer Trends' : '٢. نظرة عامة على السوق واتجاهات المستهلك'}</span>
              </h3>
              <div className="text-xs leading-relaxed space-y-3 text-slate-300">
                <p>
                  Egypt's instant beverage shelf has quietly split into three tiers. At the base sits the commodity 3-in-1 sachet (Nescafé and Ali Café) built for volume and habit, priced to be impulse-cheap in supermarkets but heavily marked up on delivery apps. Above that sits a café-replication tier (Abu Auf, Hintz, Cilantro) chasing the at-home flat white and frappé occasion with premium profiles, jar formats, and Q-commerce prices north of 30 EGP per serving. Yalla Drinks was built to sit inside that second tier on flavour credibility (Pistachio, Spanish Latte, zero-sugar variants) while maintaining the cost structure of the first.
                </p>
                <p>
                  In cold beverages, Osterberg's fruit concentrate owns supermarket shelf space, but carries high logistics drag (cold-chain, short shelf-life). Yalla Smoozy's dry sachet format sidesteps these constraints and is the only smoothie SKU priced identically across retail and e-commerce channels.
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
                    { name: "Yalla Koffi", size: "25g", retail: "18.00 EGP", qcom: "20.95 EGP", inflation: "+16.4%", type: "warning", perG: "0.72 EGP", friction: "None - sachet" },
                    { name: "Yalla Frappit", size: "35g", retail: "20.00 EGP", qcom: "20.95 EGP", inflation: "+4.8%", type: "safe", perG: "0.57 EGP", friction: "None - sachet" },
                    { name: "Yalla Smoozy", size: "40g", retail: "15.00 EGP", qcom: "15.00 EGP", inflation: "0%", type: "safe", perG: "0.38 EGP", friction: "None - sachet" },
                    { name: "Nescafe 3-in-1", size: "20g", retail: "12.00 EGP", qcom: "18.50 EGP", inflation: "+54.2%", type: "danger", perG: "0.60 EGP", friction: "None - sachet" },
                    { name: "Ali Cafe", size: "20g", retail: "10.00 EGP", qcom: "14.00 EGP", inflation: "+40.0%", type: "danger", perG: "0.50 EGP", friction: "None - sachet" },
                    { name: "Abu Auf Iced Coffee Mix", size: "30g", retail: "25.00 EGP", qcom: "32.00 EGP", inflation: "+28.0%", type: "danger", perG: "0.83 EGP", friction: "None - sachet" },
                    { name: "Hintz Iced Coffee", size: "25g", retail: "35.00 EGP", qcom: "45.00 EGP", inflation: "+28.6%", type: "danger", perG: "1.40 EGP", friction: "Scooping from jar" },
                  ].map((row, idx) => {
                    const badge = row.type === 'safe' ? 'text-emerald-500' : row.type === 'warning' ? 'text-amber-500' : 'text-rose-500';
                    const isYalla = row.name.startsWith("Yalla");
                    return (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} ${isYalla ? 'bg-orange-500/5 font-semibold' : ''}`}>
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

          {/* Social Share of Voice & Brand Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share of Voice Pie Chart */}
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
                        { name: 'Yalla Drinks (Our)', value: 18, color: '#f97316' },
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

            {/* Sentiment Splits Bar Chart */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                <span>{language === 'en' ? 'Consumer Sentiment Splits (Egypt Market)' : 'تحليل انطباعات المستهلكين (السوق المصري)'}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={[
                      { name: 'Yalla (Our)', Positive: 78, Neutral: 14, Negative: 8 },
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

          {/* Competitive Landscape Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.competitiveLandscape} — Coffee & Frappes</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{t.attribute}</th>
                      <th className="p-2.5">Yalla Frappit</th>
                      <th className="p-2.5">Nescafe</th>
                      <th className="p-2.5">Abu Auf</th>
                      <th className="p-2.5">Hintz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { attr: t.retailPrice, yalla: "20.00 EGP", nesc: "12.00 EGP", abua: "25.00 EGP", hintz: "35.00 EGP" },
                      { attr: "Format", yalla: "Sachet 35g", nesc: "Sachet 20g", abua: "Sachet 30g", hintz: "Jar-scoop 25g" },
                      { attr: t.flavourRange, yalla: "Pistachio / Spanish Latte", nesc: "Ice Roast / 3-in-1", abua: "Iced Coffee Mix", hintz: "Iced Coffee" },
                      { attr: t.adSpend, yalla: "7 / 3", nesc: "10 / 10", abua: "9 / 8", hintz: "4 / 1" },
                      { attr: t.positioning, yalla: "Cafe-quality convenience", nesc: "Mass habit", abua: "Premium cafe-replica", hintz: "Premium, high-friction" },
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <td className="p-2.5 font-bold text-slate-400">{row.attr}</td>
                        <td className="p-2.5 font-semibold text-orange-500">{row.yalla}</td>
                        <td className="p-2.5">{row.nesc}</td>
                        <td className="p-2.5">{row.abua}</td>
                        <td className="p-2.5">{row.hintz}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smoothies competitive landscape */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.competitiveLandscape} — Smoothies</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{t.attribute}</th>
                      <th className="p-2.5">Yalla Smoozy</th>
                      <th className="p-2.5">Osterberg Fruit Crush</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { attr: t.servingPrice, yalla: "15.00 EGP (40g sachet)", oster: "14.16 EGP (40ml serving)" },
                      { attr: "Format", yalla: "Dry powder sachet", oster: "Liquid concentrate, bottle" },
                      { attr: t.shelfLife, yalla: "18 months, ambient", oster: "Short post-opening, cold chain" },
                      { attr: "Retail to Q-com Inflation", yalla: "0% (Flat)", oster: "n/a" },
                      { attr: t.logisticsFriction, yalla: "None - dry powder", oster: "High - heavy, perishable" },
                      { attr: t.adSpend, yalla: "7 / 3", oster: "2 / 1" },
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <td className="p-2.5 font-bold text-slate-400">{row.attr}</td>
                        <td className="p-2.5 font-semibold text-pink-500">{row.yalla}</td>
                        <td className="p-2.5">{row.oster}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Strategic Campaign Directives */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass size={16} className="text-orange-500" />
              <span>{t.strategicCampaignDirectives}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {[
                { title: t.priceStability, num: 1, text: "Promote 'Same Price, Delivered' campaigns to exploit Nescafé's +54% and Ali Café's +40% markups on delivery apps. Turn this into a quantifiable consumer trust argument." },
                { title: t.closePOS, num: 2, text: "Allocate budget to physical point-of-sale displays and in-store samplings at major retailers (Carrefour, Spinneys) to address the low 3/10 traditional marketing score." },
                { title: t.leadFlavour, num: 3, text: "Highlight the Pistachio, Spanish Latte, and Zero Sugar range. Use this taste-forward messaging to attract consumers expressing fatigue with plain instant coffee." },
                { title: t.ownConvenience, num: 4, text: "Position Yalla Smoozy as 'no fridge, no mess, no waste' to directly target the spoilage and heavy-handling pain points of liquid smoothie concentrates." },
              ].map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-[10px]">
                      {item.num}
                    </span>
                    <h4 className="font-bold text-slate-300">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SQUEASY SALES */}
      {activeTab === 'squeasy-sales' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-violet-500/5 border-violet-500/20' : 'bg-violet-50/20 border-violet-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-violet-500 tracking-wider block mb-1">{t.revenue}</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatVal(activeMetrics.sq.metrics.revenue)}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatNum(activeMetrics.sq.metrics.qty)} {isEn ? 'Units sold' : 'وحدة مباعة'}</p>
              <div className="absolute right-4 top-4 text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                Return: {(activeMetrics.sq.metrics.return_rate * 100).toFixed(1)}%
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">{t.topSKU}</span>
              <h4 className={`text-base font-black truncate max-w-[80%] ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeMetrics.sqTopSKU}</h4>
              <p className="text-[10px] text-slate-400 mt-1">{formatVal(activeMetrics.sqTopSKURev)} sales share</p>
              <div className="absolute right-4 top-4 text-xs font-black text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">
                {t.leader}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/20 border-emerald-200'} shadow-sm relative overflow-hidden`}>
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider block mb-1">Status</span>
              <h4 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Operational</h4>
              <p className="text-[10px] text-slate-400 mt-1">B2C distribution lines running</p>
              <div className="absolute right-4 top-4 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                Active
              </div>
            </div>
          </div>

          {/* Core Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Squeezy share donut */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">Squeasy — {t.productRevenueShare}</h3>
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={sqShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2}>
                      {sqShare.map((entry, idx) => (
                        <Cell key={idx} fill={['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#64748b'][idx % 6]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any) => {
                        if (chartDisplayMode === 'percent') {
                          const total = sqShare.reduce((sum, x) => sum + x.value, 0);
                          return [`${total > 0 ? ((Number(v) / total) * 100).toFixed(1) : 0}%`, isEn ? 'Share' : 'الحصة'];
                        }
                        return [formatVal(v), ''];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col justify-center items-center pointer-events-none text-center">
                  <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#475569' }}>{isEn ? 'Total' : 'الإجمالي'}</span>
                  <span className="text-[9.5px] font-black" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
                    {chartDisplayMode === 'percent' ? '100%' : formatVal(sqShare.reduce((sum, x) => sum + x.value, 0))}
                  </span>
                </div>
              </div>
              <div className="text-[10px] space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
                {sqShare.map((entry, idx) => {
                  const total = sqShare.reduce((sum, x) => sum + x.value, 0);
                  const displayVal = chartDisplayMode === 'percent' 
                    ? `${total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0}%` 
                    : formatVal(entry.value);
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400 truncate max-w-[70%]">{entry.name}</span>
                      <span className="font-bold">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Trend lines */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider">Squeasy: {t.monthlyTrends}</h3>
                <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      sqTrends.products.forEach((p: any) => delete updated[p]);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.select}
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...hiddenProducts };
                      sqTrends.products.forEach((p: any) => updated[p] = true);
                      setHiddenProducts(updated);
                    }}
                    className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                  >
                    {t.deselect}
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={sqTrends.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k EGP` : v}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                    {sqTrends.products.map((prod, idx) => (
                      <Line
                        key={prod}
                        type="monotone"
                        dataKey={prod}
                        name={prod.split(" - ")[0]}
                        stroke={prod === 'Total Sales' ? (darkMode ? '#ffffff' : '#0f172a') : multiColors[idx % multiColors.length]}
                        strokeWidth={prod === 'Total Sales' ? 3.5 : 2}
                        strokeDasharray={prod === 'Total Sales' ? "5 5" : undefined}
                        hide={hiddenProducts[prod]}
                        dot={{ r: prod === 'Total Sales' ? 4 : 3 }}
                      />
                    ))}
                    <Line
                      type="monotone"
                      dataKey={language === 'en' ? 'Total' : 'الإجمالي'}
                      name={language === 'en' ? 'Total Sales' : 'إجمالي المبيعات'}
                      stroke={darkMode ? '#38bdf8' : '#0284c7'}
                      strokeWidth={3.5}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quarterly comparisons & top customers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quarterly comparison chart */}
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-1">{t.quarterlySalesComparison}</h3>
              <p className="text-[9px] text-slate-400 mb-4">{t.allTimeNet}: {formatVal(squeasyQuarterlyTotal)}</p>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={squeasyQuarterly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="year" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={9} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => {
                        if (chartDisplayMode === 'percent') return `${v}%`;
                        return v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v.toLocaleString();
                      }}
                    />
                    <Tooltip 
                      formatter={(val: any) => [chartDisplayMode === 'percent' ? `${val}%` : formatVal(val), '']}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="Q1" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q2" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q3" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Q4" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 B2C Customers */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.topCustomers}</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={sqCustomers} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={110} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Salesperson Performance */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="border-b border-slate-750 pb-4 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-violet-500" />
                <span>{t.salespersonPerformance} (Squeasy)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={squeasyRepsChartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={8} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" fill="rgba(139, 92, 246, 0.75)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reps details table */}
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{language === 'en' ? 'Salesperson' : 'مندوب المبيعات'}</th>
                      <th className="p-2.5 text-right">{t.revenue}</th>
                      <th className="p-2.5 text-right">{t.volumeSold}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {squeasyRepsData.map((rep: any, idx: number) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-2.5 font-bold">{rep.name}</td>
                        <td className="p-2.5 text-right font-semibold text-violet-500">{formatVal(rep.revenue)}</td>
                        <td className="p-2.5 text-right font-medium">{formatNum(rep.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Predictive Churn Analysis */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-750 pb-4 mb-5">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-rose-500 animate-pulse" />
                <span>{t.predictiveChurn} (Squeasy)</span>
              </h3>
              <div className="flex items-center gap-1.5 p-1 px-2 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold">
                <span className="text-slate-400 text-[10px]">{language === 'en' ? 'Show Rows:' : 'عرض الصفوف:'}</span>
                <input 
                  type="range" 
                  min="5" 
                  max={Math.max(10, squeasyChurnDataSorted.length)} 
                  value={squeasyChurnCount} 
                  onChange={(e) => setSqueasyChurnCount(Number(e.target.value))}
                  className="w-16 lg:w-20 accent-indigo-500 h-1 bg-slate-350 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-indigo-500 font-extrabold text-[10px]">{squeasyChurnCount}</span>
              </div>
            </div>

            {/* Churn Stats Cards */}
            {(() => {
              const churn = activeMetrics?.sq?.churn;
              if (!churn) return null;
              
              const lowPct = ((churn.summary.low / churn.summary.total_customers) * 100).toFixed(1);
              const medPct = ((churn.summary.medium / churn.summary.total_customers) * 100).toFixed(1);
              const highPct = ((churn.summary.high / churn.summary.total_customers) * 100).toFixed(1);

              const distributionPie = [
                { name: t.lowRisk, value: churn.summary.low, percentage: lowPct, fill: '#10b981' },
                { name: t.mediumRisk, value: churn.summary.medium, percentage: medPct, fill: '#f59e0b' },
                { name: t.highRisk, value: churn.summary.high, percentage: highPct, fill: '#ef4444' },
              ];

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/10 border-rose-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.revenueAtRisk}</span>
                      <span className="text-base font-black text-rose-500 block mt-1">{formatVal(churn.summary.revenue_at_risk)}</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50/10 border-amber-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.atRiskCustomers}</span>
                      <span className="text-base font-black text-amber-500 block mt-1">{churn.summary.high + churn.summary.medium} {language === 'en' ? 'customers' : 'عملاء'}</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-750' : 'bg-slate-100/50 border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block">{t.totalCustomers}</span>
                      <span className="text-base font-black block mt-1">{formatNum(churn.summary.total_customers)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Segment distribution pie chart */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-750' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between`}>
                      <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">{t.riskSegmentDistribution}</h4>
                      <div className="h-44 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <PieChart>
                            <Pie 
                              data={distributionPie} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={35} 
                              outerRadius={55}
                            >
                              {distributionPie.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`${v} customers`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[10px] space-y-2 mt-2">
                        {distributionPie.map((entry, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                              {entry.name}
                            </span>
                            <span className="font-bold">{entry.value} ({entry.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customers at risk list */}
                    <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60 max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px] select-none`}>
                            <th className="p-3 cursor-pointer" onClick={() => handleSqueasySort('customer')}>
                              <div className="flex items-center gap-1">
                                <span>{t.customer}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleSqueasySort('revenue')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.salesValue}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleSqueasySort('recency')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.recency}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                            <th className="p-3 text-right cursor-pointer" onClick={() => handleSqueasySort('probability')}>
                              <div className="flex items-center justify-end gap-1">
                                <span>{t.churnProb}</span>
                                <ArrowUpDown size={10} />
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {squeasyChurnDataSorted.slice(0, squeasyChurnCount).map((cust: any, idx: number) => {
                            const badge = cust.risk === "High" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20";
                            return (
                              <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                                <td className="p-3 font-bold">{cust.customer}</td>
                                <td className="p-3 text-right font-semibold">{formatVal(cust.revenue)}</td>
                                <td className="p-3 text-right">{cust.recency} {language === 'en' ? 'days' : 'أيام'}</td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${badge}`}>
                                    {cust.probability}% ({cust.risk})
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: SQUEASY MARKETING */}
      {activeTab === 'squeasy-marketing' && (
        <div className="space-y-6">
          {/* Highlights grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-violet-500">0%</div>
              <p className="text-[10px] text-slate-400 mt-1">Squeasy Harissa price markup on Q-Commerce platforms vs retail store shelf.</p>
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
              <p className="text-[10px] text-slate-400 mt-1">Squeasy point-of-sale/shelf score compared to Heinz's major budget.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Summary */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-violet-500" />
                <span>{t.marketingInsights}</span>
              </h3>
              <div className="text-xs leading-relaxed space-y-3 text-slate-300">
                <p>
                  Squeasy wins decisively on package format (a zero-friction, squeeze pouch) and price stability across channels, but lags behind on POS reach and traditional advertising budget compared to Heinz and regional jar brands.
                </p>
                <p className="font-semibold text-slate-400">Consumer Trends & Pain Points Solved:</p>
                <ul className="list-disc pl-4 space-y-2 text-slate-400">
                  <li><strong>Opening Friction:</strong> Stuck lids are a common issue for glass jars (Don Lopez, Heinz, Tashkila). Squeasy pouches eliminate this entirely.</li>
                  <li><strong>Hygiene:</strong> Squeeze format prevents cross-contamination and refrigerator odors caused by open jars.</li>
                  <li><strong>Trial/Impulse Tier:</strong> While competitors offer no small SKUs, Squeasy's 12g sachet (2.75–2.99 EGP) is a major volume builder for trials.</li>
                </ul>
              </div>
            </div>

          {/* Social Share of Voice & Brand Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share of Voice Pie Chart */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Percent size={16} className="text-violet-500" />
                <span>{language === 'en' ? 'Share of Voice (Egypt Social Media & Search)' : 'حصة التغطية الإعلامية (مواقع التواصل والبحث في مصر)'}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Heinz', value: 52, color: '#64748b' },
                        { name: 'Durra', value: 24, color: '#94a3b8' },
                        { name: 'Squeasy (Our)', value: 18, color: '#8b5cf6' },
                        { name: 'Harvest', value: 6, color: '#cbd5e1' }
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
                        { color: '#8b5cf6' },
                        { color: '#cbd5e1' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }}
                      itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                      formatter={(value) => [`${value}%`, language === 'en' ? 'Share of Voice' : 'حصة التغطية']}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment Splits Bar Chart */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-500" />
                <span>{language === 'en' ? 'Consumer Sentiment Splits (Egypt Market)' : 'تحليل انطباعات المستهلكين (السوق المصري)'}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={[
                      { name: 'Squeasy (Our)', Positive: 82, Neutral: 12, Negative: 6 },
                      { name: 'Heinz', Positive: 60, Neutral: 30, Negative: 10 },
                      { name: 'Durra', Positive: 50, Neutral: 40, Negative: 10 },
                      { name: 'Harvest', Positive: 58, Neutral: 32, Negative: 10 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="Positive" stackId="a" fill="#10b981" name={language === 'en' ? 'Positive' : 'إيجابي'} />
                    <Bar dataKey="Neutral" stackId="a" fill="#f59e0b" name={language === 'en' ? 'Neutral' : 'حيادي'} />
                    <Bar dataKey="Negative" stackId="a" fill="#ef4444" name={language === 'en' ? 'Negative' : 'سلبي'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>



            {/* Minced Garlic Landscape */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Coffee size={16} className="text-violet-500" />
                <span>{language === 'en' ? '2. Competitive Landscape — Canned Minced Garlic' : '٢. المشهد التنافسي — الثوم المفروم المعلب'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{t.attribute}</th>
                      <th className="p-2.5">Squeasy</th>
                      <th className="p-2.5">Don Lopez</th>
                      <th className="p-2.5">Tashkila</th>
                      <th className="p-2.5">Dobella</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { attr: t.retailPrice, squeasy: "250g: 45.00 EGP", don: "200g: 46.75 EGP", tash: "360g: 33.95 EGP", dob: "200g: 30.00 EGP" },
                      { attr: t.pricePerGram, squeasy: "0.18 EGP", don: "0.23 EGP", tash: "0.09 EGP", dob: "0.15 EGP" },
                      { attr: "Format", squeasy: "Squeeze Pouch", don: "Glass Jar", tash: "Glass Jar", dob: "Glass Jar" },
                      { attr: "Friction", squeasy: "None", don: "High (Lid jam)", tash: "High (Lid jam)", dob: "High (Lid jam)" },
                      { attr: t.positioning, squeasy: "Convenience Premium", don: "Mainstream Mid", tash: "Bulk Economy", dob: "Mainstream Mid" },
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <td className="p-2.5 font-bold text-slate-400">{row.attr}</td>
                        <td className="p-2.5 font-semibold text-violet-500">{row.squeasy}</td>
                        <td className="p-2.5">{row.don}</td>
                        <td className="p-2.5">{row.tash}</td>
                        <td className="p-2.5">{row.dob}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Harissa Landscape */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Compass size={16} className="text-violet-500" />
                <span>{language === 'en' ? '3. Competitive Landscape — Harissa' : '٣. المشهد التنافسي — الهريسة شطة'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{t.attribute}</th>
                      <th className="p-2.5">Squeasy</th>
                      <th className="p-2.5">Heinz</th>
                      <th className="p-2.5">Shana</th>
                      <th className="p-2.5">Wadi Food</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { attr: t.retailPrice, squeasy: "250g: 28.00 EGP", heinz: "170g: 34.75 EGP", shana: "170g: 48.06 EGP", wadi: "190g: 27.00 EGP" },
                      { attr: t.pricePerGram, squeasy: "0.11 EGP", heinz: "0.20 EGP", shana: "0.28 EGP", wadi: "0.14 EGP" },
                      { attr: "Format", squeasy: "Squeeze Pouch", heinz: "Glass Jar", shana: "Glass Jar", wadi: "Glass Jar" },
                      { attr: "Flavor Sentiment", squeasy: "Positive, Balanced", heinz: "Too Mild", shana: "Premium Spicy", wadi: "Mainstream Spicy" },
                      { attr: t.positioning, squeasy: "Convenience Value Leader", heinz: "Mainstream Volatile", shana: "Premium Niche", wadi: "Value Mainstream" },
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                        <td className="p-2.5 font-bold text-slate-400">{row.attr}</td>
                        <td className="p-2.5 font-semibold text-violet-500">{row.squeasy}</td>
                        <td className="p-2.5">{row.heinz}</td>
                        <td className="p-2.5">{row.shana}</td>
                        <td className="p-2.5">{row.wadi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Qcom Inflation & Ad Spend */}
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-4">{language === 'en' ? '4. Retail vs. Q-Commerce Inflation' : '٤. مبيعات التجزئة مقابل تضخم التجارة السريعة'}</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                        <th className="p-2">SKU</th>
                        <th className="p-2 text-right">Retail</th>
                        <th className="p-2 text-right">Q-Commerce</th>
                        <th className="p-2 text-right">Inflation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b dark:border-slate-800 bg-violet-500/5 font-semibold">
                        <td className="p-2">Squeasy Harissa 250g</td>
                        <td className="p-2 text-right">28.00 EGP</td>
                        <td className="p-2 text-right">28.00 EGP</td>
                        <td className="p-2 text-right text-emerald-500">0%</td>
                      </tr>
                      <tr className="border-b dark:border-slate-800">
                        <td className="p-2">Don Lopez Garlic 200g</td>
                        <td className="p-2 text-right">46.75 EGP</td>
                        <td className="p-2 text-right">54.95 EGP</td>
                        <td className="p-2 text-right text-amber-500">+17.5%</td>
                      </tr>
                      <tr className="border-b dark:border-slate-800">
                        <td className="p-2">Heinz Harissa 170g</td>
                        <td className="p-2 text-right">34.75 EGP</td>
                        <td className="p-2 text-right">55.00 EGP</td>
                        <td className="p-2 text-right text-rose-500">+58.3%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
                <h3 className="text-xs font-black uppercase tracking-wider mb-4">{t.adSpend}</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                        <th className="p-2">Brand</th>
                        <th className="p-2">Traditional</th>
                        <th className="p-2">Digital</th>
                        <th className="p-2">POS / Shelf</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b dark:border-slate-800 bg-violet-500/5 font-semibold">
                        <td className="p-2">Squeasy</td>
                        <td className="p-2 text-slate-400">Low</td>
                        <td className="p-2">7 / 10</td>
                        <td className="p-2 text-amber-500">4 / 10</td>
                      </tr>
                      <tr className="border-b dark:border-slate-800">
                        <td className="p-2">Heinz</td>
                        <td className="p-2 text-rose-500 font-bold">10 / 10</td>
                        <td className="p-2 text-emerald-500 font-bold">Strong</td>
                        <td className="p-2 text-rose-500 font-bold">Strong</td>
                      </tr>
                      <tr className="border-b dark:border-slate-800">
                        <td className="p-2">Don Lopez</td>
                        <td className="p-2 text-slate-400">Minimal</td>
                        <td className="p-2">3 / 10</td>
                        <td className="p-2 text-slate-400">Low</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations table */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass size={16} className="text-violet-500" />
              <span>{t.strategicCampaignDirectives}</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-250 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                    <th className="p-3 w-1/4">{t.actionDirective}</th>
                    <th className="p-3 w-1/5">{t.targetMetric}</th>
                    <th className="p-3">{t.rationaleProof}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { directive: "Market flat pricing as core guarantee", target: "0% vs +58.3% inflation", rationale: "Squeasy is the only brand in the dataset with 0% inflation. Leverage this in dark-store advertising campaigns." },
                    { directive: "Raise POS and shelf investment", target: "4/10 → 8/10 visibility", rationale: "Heinz dominates POS and traditional ads. Close the in-store visibility gap at supermarket checkout and deli areas." },
                    { directive: "Expand sachet distribution", target: "12g volume growth", rationale: "Priced at 2.75–2.99 EGP, Squeasy's 12g sachet has zero direct competition in the trial and impulse purchase category." },
                    { directive: "Head-to-head vs Heinz (harissa)", target: "28.00 vs 55.00 EGP", rationale: "Squeasy is significantly cheaper per gram and carries positive flavor sentiment, while Heinz is criticized as too mild." },
                    { directive: "Monthly Q-commerce price monitoring", target: "Track inflation margins", rationale: "Continuously monitor pricing of volatile competitors (Heinz/Don Lopez) to adjust visual banners in real-time." },
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">{row.directive}</td>
                      <td className="p-3 text-violet-500 font-extrabold">{row.target}</td>
                      <td className="p-3 text-slate-400 leading-relaxed">{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'competitor-insights' && (
        <CompetitorAnalysisView 
          processedData={processedData}
          language={language}
          darkMode={darkMode}
          currentUser={currentUser}
          brandScope="yalla_squeasy"
        />
      )}
    </div>
  );
}

export default React.memo(BrandDashboardView);