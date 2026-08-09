import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, Users, Target, Boxes, AlertTriangle, 
  Search, Check, DollarSign, Percent, Sparkles, Filter, 
  ArrowUpDown, ChevronUp, Calendar, ShoppingBag, Compass, BookOpen,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import CompetitorAnalysisView from './CompetitorAnalysisView';
import { useScaleMode } from '../hooks/useScaleMode';
import 'leaflet/dist/leaflet.css';
import { locationsData } from './locations_data';

// Leaflet Map Component (Client-side only)
const LeafletMap = React.lazy(() => Promise.all([
  import('leaflet'),
  import('react-leaflet')
]).then(([L, reactLeaflet]) => {
  const { MapContainer, TileLayer, CircleMarker, Popup } = reactLeaflet;

  return {
    default: ({ data, filters, onSelect, darkMode }: any) => {
      const showSweetener = filters.categories.sweetener;
      const showCoffee = filters.categories.coffee;
      const showHotChocolate = filters.categories.hot_chocolate;
      const showMints = filters.categories.mints;

      // Filter by Governorate
      let filtered = filters.governorate === "All" 
        ? data 
        : data.filter((loc: any) => loc.governorate === filters.governorate);

      // Filter by Category
      const filteredLocations = filtered.filter((loc: any) => {
        if (showSweetener && loc.is_sweetener) return true;
        if (showCoffee && loc.is_coffee) return true;
        if (showHotChocolate && loc.is_hot_chocolate) return true;
        if (showMints && loc.is_mints) return true;
        return false;
      });

      return (
        <div style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
          <MapContainer 
            center={[30.0444, 31.2357]} 
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            {filteredLocations.map((loc: any) => {
              // Determine primary brand color for marker fill
              let markerColor = '#10b981'; // default sweeteners (green)
              if (loc.is_sweetener) markerColor = '#10b981';
              else if (loc.is_coffee) markerColor = '#f97316';
              else if (loc.is_hot_chocolate) markerColor = '#a855f7';
              else if (loc.is_mints) markerColor = '#3b82f6';

              // Generate list of purchased categories to show in popup
              const cats: string[] = [];
              if (loc.is_sweetener) cats.push('<span style="color:#10b981; font-weight:700;">Sweeteners</span>');
              if (loc.is_coffee) cats.push('<span style="color:#f97316; font-weight:700;">Coffee</span>');
              if (loc.is_hot_chocolate) cats.push('<span style="color:#a855f7; font-weight:700;">Hot Chocolate</span>');
              if (loc.is_mints) cats.push('<span style="color:#3b82f6; font-weight:700;">Mints</span>');

              const popupHtml = `
                <div style="padding: 0.2rem; min-width: 220px; font-family: sans-serif; text-align: left;">
                  <h4 style="margin:0 0 6px 0; color:#10b981; font-size:0.95rem; font-weight:700;">${loc.name}</h4>
                  <p style="margin:3px 0; font-size:0.8rem; color:#f8fafc;"><i class="fa-solid fa-map-pin" style="color:#f97316; margin-right:4px;"></i><strong>${loc.location}, ${loc.governorate}</strong></p>
                  <p style="margin:3px 0; font-size:0.75rem; color:#94a3b8; line-height:1.4;">${loc.address}</p>
                  <p style="margin:4px 0 0 0; font-size:0.8rem; color:#fff;"><strong>Purchases:</strong> ${cats.join(', ')}</p>
                  <p style="margin:6px 0 0 0; font-size:0.7rem; color:#64748b; font-family:monospace;">Lat: ${loc.lat.toFixed(5)}, Lng: ${loc.lng.toFixed(5)}</p>
                </div>
              `;

              return (
                <CircleMarker
                  key={loc.name + loc.lat + loc.lng}
                  center={[loc.lat, loc.lng]}
                  radius={6}
                  fillColor={markerColor}
                  color="#080c14"
                  weight={1.5}
                  opacity={1}
                  fillOpacity={0.85}
                  eventHandlers={{
                    click: () => onSelect?.(loc)
                  }}
                >
                  <Popup>
                    <div dangerouslySetInnerHTML={{ __html: popupHtml }} />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      );
    }
  };
}));

// Location type
interface LocationData {
  name: string;
  location: string;
  governorate: string;
  address: string;
  lat: number;
  lng: number;
  is_sweetener: boolean;
  is_coffee: boolean;
  is_hot_chocolate: boolean;
  is_mints: boolean;
}

// Translations
const translations = {
  en: {
    dashboardTitle: "Vitality Snacks Brand Dashboard",
    dashboardSubtitle: "Vitality Snacks Sugar Substitutes B2C Sales & Client Analytics Panel",
    combinedVitalitySnacks: "Vitality Snacks Combined",
    tabletopSweetener: "Tabletop Sweetener",
    steviaSweetener: "Stevia Sweetener",
    syrupDrinks: "Syrups & Drinks",
    sugarFreeMints: "Sugar-Free Mints",
    netSales: "Net Sales (EGP)",
    volumeSold: "Volume Sold",
    returns: "Returns",
    returnRate: "Return Rate",
    select: "Select All",
    deselect: "Deselect All",
    monthlyTrends: "Monthly Sales Trend",
    topCustomers: "Top 10 Sweetener Customers",
    salesReps: "Top Sales Representatives",
    activeWindow: "Active Window:",
    allTime: "All Time",
    last3M: "Last 3 Months",
    last6M: "Last 6 Months",
    last12M: "Last 12 Months",
    churnAnalytics: "Customer Churn Risk Analytics",
    churnSubtitle: "Predictive model evaluating tabletop sweetener customer purchase frequency & churn indicators.",
    customerName: "Customer Name",
    salesVal: "Total Sales",
    recency: "Last Purchase",
    churnProb: "Churn Probability",
    riskHigh: "High Risk",
    riskMedium: "Medium Risk",
    riskActive: "Active",
    daysAgo: "days ago",
    revenueShare: "Product Sales Share",
    divisionSales: "Division Sales Comparison",
    actions: "Recommended Strategic Action",
    allTimeNet: "All-Time Net Sales",
    repsTotal: "Total Net Sales",
    millions: "Millions",
    thousands: "Thousands",
    viewUnit: "View Unit:",
  },
  ar: {
    dashboardTitle: "لوحة تحكم سويت آند سليم",
    dashboardSubtitle: "تحليلات مبيعات سويت آند سليم لبدائل السكر ومؤشرات العملاء B2C",
    combinedVitalitySnacks: "سويت آند سليم المشترك",
    tabletopSweetener: "بدائل السكر للمائدة",
    steviaSweetener: "بدائل السكر ستيفيا",
    syrupDrinks: "الشراب والشراب المركز",
    sugarFreeMints: "النعناع الخالي من السكر",
    netSales: "صافي المبيعات (ج.م)",
    volumeSold: "حجم المبيعات",
    returns: "المرتجعات",
    returnRate: "معدل المرتجعات",
    select: "تحديد الكل",
    deselect: "إلغاء تحديد الكل",
    monthlyTrends: "مؤشر المبيعات الشهري",
    topCustomers: "أفضل ١٠ عملاء لبدائل السكر",
    salesReps: "أداء مسؤولي المبيعات",
    activeWindow: "الفترة النشطة:",
    allTime: "كل الأوقات",
    last3M: "آخر ٣ أشهر",
    last6M: "آخر ٦ أشهر",
    last12M: "آخر ١٢ شهراً",
    churnAnalytics: "تحليلات مخاطر خسارة العملاء (Churn)",
    churnSubtitle: "نموذج تنبؤي لتقييم تكرار شراء المحليات للعملاء ومؤشرات التوقف عن الشراء.",
    customerName: "اسم العميل",
    salesVal: "إجمالي المبيعات",
    recency: "آخر شراء",
    churnProb: "احتمالية الخسارة",
    riskHigh: "مخاطر عالية",
    riskMedium: "مخاطر متوسطة",
    riskActive: "نشط",
    daysAgo: "يوم مضى",
    revenueShare: "حصة المبيعات للمنتجات",
    divisionSales: "مقارنة مبيعات الأقسام",
    actions: "الإجراء الاستراتيجي الموصى به",
    allTimeNet: "صافي مبيعات كل الأوقات",
    repsTotal: "إجمالي المبيعات الصافية",
    millions: "ملايين",
    thousands: "آلاف",
    viewUnit: "وحدة العرض:",
  }
};

const multiColors = [
  '#06b6d4', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#10b981', '#f59e0b', '#3b82f6', '#6366f1'
];

interface VitalitySnacksDashboardViewProps {
  processedData: any[];
  language: 'en' | 'ar';
  darkMode: boolean;
  timePeriod: string;
  customStartDate: string;
  customEndDate: string;
  currentUser?: any;
  selectedYear: string;
  setSelectedYear: (yr: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (qtr: string) => void;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric?: 'revenue' | 'volume';
  globalCompareMode?: boolean;
}

function VitalitySnacksDashboardView({
  processedData,
  language,
  darkMode,
  timePeriod,
  customStartDate,
  customEndDate,
  currentUser,
  selectedYear,
  setSelectedYear,
  selectedQuarter,
  setSelectedQuarter,
  chartDisplayMode,
  globalChartMetric = 'revenue',
  globalCompareMode = false
}: VitalitySnacksDashboardViewProps) {
  const t = translations[language];
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<string>("combined");
  const [hiddenProducts, setHiddenProducts] = useState<Record<string, boolean>>({});
  const [churnSortField, setChurnSortField] = useState<string>("probability");
  const [churnSortAsc, setChurnSortAsc] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const scaleMode = useScaleMode();

  // Map view state
  const [mapGovFilter, setMapGovFilter] = useState<string>("All");
  const [mapCategories, setMapCategories] = useState({
    sweetener: true,
    coffee: true,
    hot_chocolate: true,
    mints: true
  });
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedMapOutlet, setSelectedMapOutlet] = useState<LocationData | null>(null);

  // Auto-resize trigger to fix incomplete tile layouts
  useEffect(() => {
    if (activeTab === 'customer-map') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 200);
    }
  }, [activeTab]);

  useEffect(() => {
    setLocations(locationsData);
    if (locationsData.length > 0) {
      setSelectedMapOutlet(locationsData[0]);
    }
  }, []);

  // Compute unique governorates in locations
  const governoratesList = useMemo(() => {
    const govs = new Set(locations.map(l => l.governorate).filter(Boolean));
    return Array.from(govs).sort();
  }, [locations]);

  // Compute governorate stats breakdown
  const governorateBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    locations.forEach(loc => {
      if (loc.governorate) {
        counts[loc.governorate] = (counts[loc.governorate] || 0) + 1;
        total++;
      }
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
      }))
      .sort((a, b) => b.count - a.count);
  }, [locations]);

  // Helper formatting functions
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

  // Determine if a product belongs to Vitality Snacks and categorize it
  const getProductCategory = (itemName: string): string | null => {
    const name = itemName.toLowerCase();
    if (!name.includes('sweet') || !name.includes('slim')) return null;

    if (name.includes('stevia')) return 'stevia';
    if (name.includes('mints')) return 'mints';
    if (name.includes('syrup') || name.includes('chocolate') || name.includes('coffee') || name.includes('3 in 1')) return 'syrup_drinks';
    
    // Default tabletop sachet/pack sweeteners
    return 'tabletop';
  };

  // Filter raw transactions to only Vitality Snacks matching items
  const vitalitySnacksTransactions = useMemo(() => {
    return processedData.filter(row => {
      const cat = getProductCategory(row.ItemName || '');
      if (!cat) return false;
      if (activeTab === 'combined') return true;
      return cat === activeTab;
    });
  }, [processedData, activeTab]);

  // Compute overall division metrics cards
  const metrics = useMemo(() => {
    let sales = 0;
    let volume = 0;
    let returnSales = 0;

    vitalitySnacksTransactions.forEach(row => {
      const rev = Math.abs(row.Revenue || 0);
      const qty = Math.abs(row.Quantity || 0);
      if (row.IsReturn) {
        returnSales += rev;
        sales -= rev;
        volume -= qty;
      } else {
        sales += rev;
        volume += qty;
      }
    });

    const returnRate = sales + returnSales > 0 ? returnSales / (sales + returnSales) : 0;

    return {
      sales: Math.max(0, sales),
      volume: Math.max(0, volume),
      returns: returnSales,
      returnRate: returnRate * 100
    };
  }, [vitalitySnacksTransactions]);

  // Compute Division sales comparison data (Tabletop vs Stevia vs Syrups vs Mints)
  const divisionComparisonData = useMemo(() => {
    const categories = {
      tabletop: { name: t.tabletopSweetener, value: 0, fill: '#06b6d4' },
      stevia: { name: t.steviaSweetener, value: 0, fill: '#10b981' },
      syrup_drinks: { name: t.syrupDrinks, value: 0, fill: '#8b5cf6' },
      mints: { name: t.sugarFreeMints, value: 0, fill: '#ec4899' },
    };

    processedData.forEach(row => {
      const cat = getProductCategory(row.ItemName || '');
      if (cat && cat in categories) {
        const metricVal = Math.abs(globalChartMetric === 'volume' ? (row.Quantity || 0) : (row.Revenue || 0));
        if (row.IsReturn) {
          categories[cat as keyof typeof categories].value -= metricVal;
        } else {
          categories[cat as keyof typeof categories].value += metricVal;
        }
      }
    });

    const rawList = Object.values(categories).map(cat => ({
      ...cat,
      value: Math.max(0, Math.round(cat.value))
    }));

    if (chartDisplayMode === 'percent') {
      const total = rawList.reduce((acc, curr) => acc + curr.value, 0);
      return rawList.map(cat => ({
        ...cat,
        value: total > 0 ? Number(((cat.value / total) * 100).toFixed(1)) : 0
      }));
    }

    return rawList;
  }, [processedData, language, globalChartMetric, chartDisplayMode]);

  // SKU revenue share distribution data
  const skuShareData = useMemo(() => {
    const skuMap: Record<string, { revenue: number; qty: number }> = {};
    vitalitySnacksTransactions.forEach(row => {
      const name = (row.ItemName || '').split(" - ")[0].split(" + ")[0].split(" (")[0];
      if (!skuMap[name]) skuMap[name] = { revenue: 0, qty: 0 };
      const rev = Math.abs(row.Revenue || 0);
      const qty = Math.abs(row.Quantity || 0);
      if (row.IsReturn) {
        skuMap[name].revenue -= rev;
        skuMap[name].qty -= qty;
      } else {
        skuMap[name].revenue += rev;
        skuMap[name].qty += qty;
      }
    });

    let items = Object.entries(skuMap).map(([name, stat]) => ({
      name,
      value: Math.max(0, Math.round(globalChartMetric === 'volume' ? stat.qty : stat.revenue)),
      qty: Math.max(0, stat.qty)
    })).sort((a, b) => b.value - a.value);

    if (items.length > 5) {
      const top5 = items.slice(0, 5);
      const rest = items.slice(5);
      const otherSales = rest.reduce((sum, x) => sum + x.value, 0);
      const otherQty = rest.reduce((sum, x) => sum + x.qty, 0);
      if (otherSales > 0) {
        top5.push({
          name: isEn ? 'Other Products' : 'منتجات أخرى',
          value: otherSales,
          qty: otherQty
        });
      }
      items = top5;
    }

    if (chartDisplayMode === 'percent') {
      const total = items.reduce((acc, curr) => acc + curr.value, 0);
      return items.map(item => ({
        ...item,
        value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
      }));
    }

    return items;
  }, [vitalitySnacksTransactions, isEn, globalChartMetric, chartDisplayMode]);

  // Monthly Sales trend lines dataset
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySkuSales: Record<string, Record<string, number>> = {};
    const skusSet = new Set<string>();

    months.forEach(m => {
      monthlySkuSales[m] = {};
    });

    vitalitySnacksTransactions.forEach(row => {
      const dateObj = row.DateObj || new Date(row.Date);
      const monthName = months[dateObj.getMonth()];
      const sku = (row.ItemName || '').split(" - ")[0].split(" + ")[0].split(" (")[0];
      skusSet.add(sku);

      const metricVal = Math.abs(globalChartMetric === 'volume' ? (row.Quantity || 0) : (row.Revenue || 0));
      if (!monthlySkuSales[monthName][sku]) monthlySkuSales[monthName][sku] = 0;
      
      if (row.IsReturn) {
        monthlySkuSales[monthName][sku] -= metricVal;
      } else {
        monthlySkuSales[monthName][sku] += metricVal;
      }
    });

    const skus = Array.from(skusSet).slice(0, 8); // top 8 to avoid chart clutter

    const chartData = months.map(m => {
      const monthLabel = isEn ? m : (
        m === 'Jan' ? 'يناير' : m === 'Feb' ? 'فبراير' : m === 'Mar' ? 'مارس' :
        m === 'Apr' ? 'أبريل' : m === 'May' ? 'مايو' : m === 'Jun' ? 'يونيو' :
        m === 'Jul' ? 'يوليو' : m === 'Aug' ? 'أغسطس' : m === 'Sep' ? 'سبتمبر' :
        m === 'Oct' ? 'أكتوبر' : m === 'Nov' ? 'نوفمبر' : 'ديسمبر'
      );
      const point: any = { monthLabel };
      let monthTotal = 0;
      skus.forEach(sku => {
        const val = Math.max(0, Math.round(monthlySkuSales[m][sku] || 0));
        point[sku] = val;
        monthTotal += val;
      });

      if (chartDisplayMode === 'percent' && monthTotal > 0) {
        skus.forEach(sku => {
          point[sku] = Number(((point[sku] / monthTotal) * 100).toFixed(1));
        });
        point[isEn ? 'Total' : 'الإجمالي'] = 100;
      } else {
        point[isEn ? 'Total' : 'الإجمالي'] = monthTotal;
      }
      return point;
    });

    return {
      products: skus,
      chartData
    };
  }, [vitalitySnacksTransactions, isEn, globalChartMetric, chartDisplayMode]);

  // Top 10 sweetener customers
  const topCustomersData = useMemo(() => {
    const custMap: Record<string, number> = {};
    vitalitySnacksTransactions.forEach(row => {
      const name = row.CustomerName || 'Other';
      if (!custMap[name]) custMap[name] = 0;
      const metricVal = Math.abs(globalChartMetric === 'volume' ? (row.Quantity || 0) : (row.Revenue || 0));
      if (row.IsReturn) {
        custMap[name] -= metricVal;
      } else {
        custMap[name] += metricVal;
      }
    });

    const rawList = Object.entries(custMap)
      .map(([name, revenue]) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        revenue: Math.max(0, Math.round(revenue))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    if (chartDisplayMode === 'percent') {
      const total = rawList.reduce((acc, curr) => acc + curr.revenue, 0);
      return rawList.map(c => ({
        ...c,
        revenue: total > 0 ? Number(((c.revenue / total) * 100).toFixed(1)) : 0
      }));
    }

    return rawList;
  }, [vitalitySnacksTransactions, globalChartMetric, chartDisplayMode]);

  // Top sales representatives selling sweeteners
  const topRepsData = useMemo(() => {
    const repMap: Record<string, number> = {};
    vitalitySnacksTransactions.forEach(row => {
      const name = row.SalesmanName || 'Unassigned';
      if (!repMap[name]) repMap[name] = 0;
      const metricVal = Math.abs(globalChartMetric === 'volume' ? (row.Quantity || 0) : (row.Revenue || 0));
      if (row.IsReturn) {
        repMap[name] -= metricVal;
      } else {
        repMap[name] += metricVal;
      }
    });

    const rawList = Object.entries(repMap)
      .map(([name, revenue]) => ({
        name,
        revenue: Math.max(0, Math.round(revenue))
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    if (chartDisplayMode === 'percent') {
      const total = rawList.reduce((acc, curr) => acc + curr.revenue, 0);
      return rawList.map(r => ({
        ...r,
        revenue: total > 0 ? Number(((r.revenue / total) * 100).toFixed(1)) : 0
      }));
    }

    return rawList;
  }, [vitalitySnacksTransactions, globalChartMetric, chartDisplayMode]);

  // Churn predictive analysis
  const churnAnalysis = useMemo(() => {
    const clientHistory: Record<string, { lastDate: Date; totalSales: number; count: number }> = {};
    const referenceDate = new Date('2026-06-30'); // Database max date

    vitalitySnacksTransactions.forEach(row => {
      const name = row.CustomerName;
      if (!name) return;

      const dateObj = row.DateObj || new Date(row.Date);
      const rev = Math.abs(row.Revenue || 0);
      
      if (!clientHistory[name]) {
        clientHistory[name] = { lastDate: dateObj, totalSales: 0, count: 0 };
      }

      if (dateObj > clientHistory[name].lastDate) {
        clientHistory[name].lastDate = dateObj;
      }

      if (!row.IsReturn) {
        clientHistory[name].totalSales += rev;
        clientHistory[name].count += 1;
      } else {
        clientHistory[name].totalSales -= rev;
      }
    });

    const clientRows = Object.entries(clientHistory).map(([name, info]) => {
      const diffTime = Math.abs(referenceDate.getTime() - info.lastDate.getTime());
      const recencyDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate churn probability based on recency and order frequency
      let prob = 5;
      if (recencyDays > 120) prob = 98;
      else if (recencyDays > 90) prob = 85;
      else if (recencyDays > 60) prob = 65;
      else if (recencyDays > 30) prob = 35;
      else if (recencyDays > 15) prob = 15;

      // Adjust for frequency
      if (info.count > 10 && prob < 90) prob = Math.max(5, prob - 10);

      let status: 'active' | 'medium' | 'high' = 'active';
      if (prob >= 65) status = 'high';
      else if (prob >= 35) status = 'medium';

      return {
        name,
        totalSales: Math.max(0, info.totalSales),
        recency: recencyDays,
        probability: prob,
        status
      };
    }).filter(c => c.totalSales > 0);

    const segmentCounts = { active: 0, medium: 0, high: 0 };
    let totalRiskRev = 0;

    clientRows.forEach(c => {
      segmentCounts[c.status]++;
      if (c.status === 'high') {
        totalRiskRev += c.totalSales;
      } else if (c.status === 'medium') {
        totalRiskRev += c.totalSales * 0.3; // weighted risk
      }
    });

    return {
      clientRows,
      segmentCounts,
      totalRiskRev: Math.round(totalRiskRev)
    };
  }, [vitalitySnacksTransactions]);

  // Sortable Churn Table rows
  const sortedChurnRows = useMemo(() => {
    return [...churnAnalysis.clientRows].sort((a, b) => {
      let comparison = 0;
      if (churnSortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (churnSortField === 'totalSales') {
        comparison = a.totalSales - b.totalSales;
      } else if (churnSortField === 'recency') {
        comparison = a.recency - b.recency;
      } else if (churnSortField === 'probability') {
        comparison = a.probability - b.probability;
      }
      return churnSortAsc ? comparison : -comparison;
    });
  }, [churnAnalysis.clientRows, churnSortField, churnSortAsc]);

  const requestSort = (field: string) => {
    if (churnSortField === field) {
      setChurnSortAsc(!churnSortAsc);
    } else {
      setChurnSortField(field);
      setChurnSortAsc(true);
    }
  };

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Brand Dashboard Title */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
        <div>
          <h2 className={`text-xl font-extrabold flex items-center gap-2.5 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <Sparkles size={20} className="text-indigo-500" />
            <span>{t.dashboardTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t.dashboardSubtitle}</p>
        </div>

        {/* Global Controls Panel */}
        <div className={`flex items-center gap-2.5 p-3 px-4 rounded-xl border ${
          darkMode ? 'bg-slate-900/65 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
        } text-xs font-bold`}>
          <Calendar size={14} className="text-indigo-500" />
          <span>
            {t.activeWindow}{' '}
            <span className="text-indigo-500 dark:text-indigo-400">
              {timePeriod === 'All' && t.allTime}
              {timePeriod === '3M' && `${t.last3M} (2026 Q2)`}
              {timePeriod === '6M' && `${t.last6M} (2026)`}
              {timePeriod === '12M' && t.last12M}
              {timePeriod === 'Custom' && `${customStartDate || '2022'} - ${customEndDate || '2026'}`}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 text-xs no-print">
        {[
          { id: 'combined', label: t.combinedVitalitySnacks, count: vitalitySnacksTransactions.length },
          { id: 'tabletop', label: t.tabletopSweetener, count: 0 },
          { id: 'stevia', label: t.steviaSweetener, count: 0 },
          { id: 'syrup_drinks', label: t.syrupDrinks, count: 0 },
          { id: 'mints', label: t.sugarFreeMints, count: 0 },
          { id: 'competitor-insights', label: isEn ? 'Competitor Insights' : 'تحليلات المنافسين', count: 0 },
          { id: 'market-intelligence', label: isEn ? 'Market Intelligence' : 'ذكاء السوق', count: 0 },
          { id: 'customer-map', label: isEn ? 'Customer Map' : 'خريطة العملاء', count: 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setHiddenProducts({});
            }}
            className={`px-4 py-2.5 font-extrabold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-indigo-500 text-indigo-500' 
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'competitor-insights' && (
        <CompetitorAnalysisView 
          processedData={processedData}
          language={language}
          darkMode={darkMode}
          currentUser={currentUser}
          brandScope="vitality_snacks"
        />
      )}

      {activeTab === 'market-intelligence' && (
        <div className="space-y-6">
          {/* Highlights grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-indigo-500">0%</div>
              <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Vitality Snacks inflation across Hypermarkets & Q-commerce apps (100% price stable).' : 'تضخم أسعار سويت آند سليم عبر الهايبر ماركت والتطبيقات (استقرار الأسعار بنسبة ١٠٠٪).'}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-rose-500">+45%</div>
              <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Canderel Classic markup due to imported active chemical compound index.' : 'زيادة أسعار كانديريل كلاسيك بسبب ارتفاع أسعار المكونات الكيميائية المستوردة.'}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-yellow-500">4 / 10</div>
              <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Vitality Snacks shelf visibility score in chains – the key brand placement gap.' : 'درجة ظهور سويت آند سليم على رفوف السلاسل الصيدلانية – الفجوة الرئيسية للتواجد.'}</p>
            </div>
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
              <div className="text-2xl font-black text-emerald-500">36 mo</div>
              <p className="text-[10px] text-slate-400 mt-1">{isEn ? 'Vitality Snacks dry sweetener sachet shelf life stability index.' : 'مؤشر استقرار العمر الافتراضي لأكياس المحليات الجافة من سويت آند سليم (٣٦ شهراً).'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Executive Summary */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-500" />
                <span>{isEn ? 'Sweetener Market Intelligence Summary' : 'ملخص ذكاء سوق المحليات'}</span>
              </h3>
              <div className="text-xs leading-relaxed space-y-3 text-slate-450 dark:text-slate-350">
                <p>
                  {isEn 
                    ? 'Vitality Snacks holds a powerful position in the local Egyptian sugar-substitute market due to the active boycott wave of multinationals like Canderel and Splenda. However, to maximize market share, the brand must bridge the clinical detailing gap.' 
                    : 'تحتل سويت آند سليم موقعاً قوياً في السوق المصري لبدائل السكر نتيجة لموجة المقاطعة النشطة للعلامات التجارية العالمية مثل كانديريل وسبليندا. ومع ذلك، لتعظيم الحصة السوقية، يجب سد فجوة الزيارات الطبية.'}
                </p>
                <p className="font-semibold text-slate-400">{isEn ? 'Consumer Segments & Pain Points Solved:' : 'فئات المستهلكين والمشكلات التي تم حلها:'}</p>
                <ul className="list-disc pl-4 space-y-2 text-slate-500 dark:text-slate-400">
                  <li><strong>{isEn ? 'Metallic Aftertaste:' : 'الطعم المعدني المتبقي:'}</strong> {isEn ? 'Cheap sweeteners (e.g. Diet Sweet) leave a lingering chemical taste. Vitality Snacks’s premium sucralose/stevia blend tastes exactly like natural sugar.' : 'المحليات الرخيصة تترك طعماً كيميائياً متبقياً. تركيبة سويت آند سليم من السكرالوز/الستيفيا تعطي طعماً طبيعياً.'}</li>
                  <li><strong>{isEn ? '100% Aspartame-Free Safety:' : 'أمان خالي ١٠٠٪ من الأسبرتام:'}</strong> {isEn ? 'Consumers are increasingly wary of chemical side-effects. Highlighting our safe formulation is crucial for diabetic trust.' : 'المستهلكون حذرون بشكل متزايد من الآثار الكيميائية. إبراز تركيبتنا الآمنة أمر بالغ الأهمية لثقة مرضى السكري.'}</li>
                  <li><strong>{isEn ? 'Economical Daily Usage:' : 'الاستخدام اليومي الاقتصادي:'}</strong> {isEn ? 'Vitality Snacks Classic costs EGP 0.84 per sachet, compared to Canderel’s EGP 1.36. This premium affordability drives high-frequency household purchases.' : 'تبلغ تكلفة سويت آند سليم كلاسيك ٠.٨٤ ج.م للكيس مقارنة بـ ١.٣٦ ج.م لكانديريل. هذا السعر الذكي يعزز الشراء المتكرر.'}</li>
                </ul>
              </div>
            </div>

          {/* Social Share of Voice & Brand Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share of Voice Pie Chart */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Percent size={16} className="text-indigo-500" />
                <span>{isEn ? 'Share of Voice (Egypt Social Media & Search)' : 'حصة التغطية الإعلامية (مواقع التواصل والبحث في مصر)'}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Canderel', value: 42, color: '#64748b' },
                        { name: 'Splenda', value: 28, color: '#94a3b8' },
                        { name: 'Vitality Snacks (Our)', value: 20, color: '#6366f1' },
                        { name: 'Diet Sweet', value: 10, color: '#cbd5e1' }
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
                        { color: '#6366f1' },
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
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                <span>{isEn ? 'Consumer Sentiment Splits (Egypt Market)' : 'تحليل انطباعات المستهلكين (السوق المصري)'}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={[
                      { name: 'Vitality Snacks (Our)', Positive: 85, Neutral: 10, Negative: 5 },
                      { name: 'Canderel', Positive: 58, Neutral: 32, Negative: 10 },
                      { name: 'Splenda', Positive: 70, Neutral: 22, Negative: 8 },
                      { name: 'Diet Sweet', Positive: 42, Neutral: 38, Negative: 20 }
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
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <Boxes size={16} className="text-indigo-500" />
                <span>{isEn ? 'Sweetener Compounds & Channel Matrix' : 'مصفوفة مركبات وقنوات المحليات'}</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                      <th className="p-2.5">{isEn ? 'Attribute' : 'الصفة'}</th>
                      <th className="p-2.5">Vitality Snacks</th>
                      <th className="p-2.5">Canderel</th>
                      <th className="p-2.5">Diet Sweet</th>
                      <th className="p-2.5">Splenda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { attr: isEn ? 'Sweetening Agent' : 'عامل التحلية', ss: 'Sucralose / Stevia', cand: 'Aspartame / Sucralose', diet: 'Saccharin', spl: 'Stevia / Sucralose' },
                      { attr: isEn ? 'Glycemic Index' : 'المؤشر الجلايسيمي', ss: '0', cand: '0 (Classic)', diet: '85 (Sorbitol blend)', spl: '0' },
                      { attr: isEn ? 'Baking Stability' : 'الاستقرار بالطهي', ss: 'High (Baking safe)', cand: 'Low (Bitter at heat)', diet: 'Medium', spl: 'High' },
                      { attr: isEn ? 'Target Channel' : 'القناة المستهدفة', ss: 'Pharmacies & Hyper', cand: 'Pharmacies (Premium)', diet: 'Traditional Grocers', spl: 'Premium Hyper' }
                    ].map((row, idx) => (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-2.5 font-semibold text-slate-400">{row.attr}</td>
                        <td className="p-2.5 font-bold text-indigo-500">{row.ss}</td>
                        <td className="p-2.5 text-slate-400">{row.cand}</td>
                        <td className="p-2.5 text-slate-400">{row.diet}</td>
                        <td className="p-2.5 text-slate-400">{row.spl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Strategic Campaign Directives */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass size={16} className="text-indigo-500" />
              <span>{isEn ? 'Strategic Marketing Campaigns & Actions' : 'حملات التسويق والخطط الاستراتيجية المقترحة'}</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                    <th className="p-3 w-1/4">{isEn ? 'Action Directive' : 'التوجيه الاستراتيجي'}</th>
                    <th className="p-3 w-1/5">{isEn ? 'Target Metric' : 'المؤشر المستهدف'}</th>
                    <th className="p-3">{isEn ? 'Rationale & Market Proof' : 'المبرر والدليل التسويقي'}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { directive: isEn ? "Deploy Medical Rep Detailing" : "تفعيل فريق الزيارات الطبية", target: isEn ? "Doctor referrals" : "توصيات الأطباء للبدائل", rationale: isEn ? "Canderel dominates endocrinology networks. Vitality Snacks must supply medical detailing kits (aspartame-free brochures) directly to local clinics." : "تسيطر كانديريل على شبكات أطباء الغدد الصماء. يجب توفير عينات وكتيبات خالية من الأسبرتام للعيادات المحلية." },
                    { directive: isEn ? "Highlight 'No Metallic Taste' Badge" : "إبراز ملصق 'بدون طعم معدني'", target: isEn ? "+35% trial rate" : "+٣٥٪ تجربة للمنتج", rationale: isEn ? "Sucralose blends are preferred over cheap saccharin due to clean taste. Highlighting taste quality drives consumer trial among diabetics." : "تفضل تركيبات السكرالوز على السكرين الرخيص. إبراز جودة المذاق يعزز رغبة مرضى السكري في التجربة." },
                    { directive: isEn ? "Launch Zero-Spill Liquid Drops" : "إطلاق عبوات القطرات السائلة", target: isEn ? "Gym-goer segment" : "فئة الرياضيين والشباب", rationale: isEn ? "Extremely high convenience for on-the-go gym-goers. No competitive local alternative offers zero-spill liquid dropper packs in Egypt." : "راحة بالغة للرياضيين أثناء التنقل. لا يوجد بديل محلي ينافس في تقديم عبوات القطرات السائلة سهلة الاستخدام في مصر." },
                    { directive: isEn ? "Co-brand Sugar-Free Syrups" : "شراكة شراب التحلية الخالي من السكر", target: isEn ? "HORECA volume" : "حجم مبيعات هوريكا", rationale: isEn ? "Bundle Vitality Snacks flavored baking sweeteners and syrups with local coffee chains to create boycotted international syrup replacements." : "تقديم شراب محلي خالي من السكر بنكهات الفانيليا والكراميل للمقاهي المحلية كبديل للعلامات المستوردة." }
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">{row.directive}</td>
                      <td className="p-3 text-indigo-500 font-extrabold">{row.target}</td>
                      <td className="p-3 text-slate-400 leading-relaxed">{row.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'competitor-insights' && activeTab !== 'market-intelligence' && activeTab !== 'customer-map' && (
        <>
          {/* Numerical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t.netSales, val: formatVal(metrics.sales), desc: t.allTimeNet, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
              { label: t.volumeSold, val: formatNum(metrics.volume), desc: isEn ? "Total packs sold" : "إجمالي العبوات المباعة", color: 'text-purple-500', bg: 'bg-purple-500/10' },
              { label: t.returns, val: formatVal(metrics.returns), desc: isEn ? "Total return sales value" : "إجمالي قيمة مبيعات المرتجعات", color: 'text-rose-500', bg: 'bg-rose-500/10' },
              { label: t.returnRate, val: `${metrics.returnRate.toFixed(2)}%`, desc: isEn ? "Returns share of overall sales" : "نسبة المرتجعات من إجمالي المبيعات", color: 'text-amber-500', bg: 'bg-amber-500/10' }
            ].map((card, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} shadow-sm flex items-center gap-4`}>
                <div className={`p-3.5 rounded-xl ${card.bg} ${card.color}`}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <h3 className={`text-lg font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-850'}`}>{card.val}</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grid: Charts & Product Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product SKU Revenue Share */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {t.revenueShare}
              </h3>
              <div className="h-60 relative flex justify-center items-center">
                {skuShareData.length === 0 ? (
                  <p className="text-slate-400 text-xs">{isEn ? 'No SKU share data available for this range.' : 'لا توجد بيانات حصة للمنتجات لهذه الفترة.'}</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={skuShareData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {skuShareData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={multiColors[index % multiColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatVal(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col justify-center items-center pointer-events-none text-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#94a3b8' : '#475569' }}>
                        {isEn ? 'Total' : 'الإجمالي'}
                      </span>
                      <span className="text-[11px] font-black" style={{ color: darkMode ? '#ffffff' : '#0f172a' }}>
                        {formatVal(skuShareData.reduce((sum, x) => sum + x.value, 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="text-[10px] space-y-1.5 mt-3 max-h-[120px] overflow-y-auto pr-1">
                {skuShareData.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: multiColors[idx % multiColors.length] }}></span>
                      <span className="font-semibold text-slate-400 truncate">{entry.name}</span>
                    </div>
                    <span className="font-bold">{formatVal(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Division Sales Comparison (Column Chart) */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {t.divisionSales}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={divisionComparisonData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickFormatter={(v) => {
                        const factor = scaleMode === 'millions' ? 1000000 : 1000;
                        const suffix = scaleMode === 'millions' ? 'M' : 'K';
                        return `${(v / factor).toFixed(1)}${suffix}`;
                      }}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {divisionComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Line Trend chart with Visiblity toggles */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider">{t.monthlyTrends}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold no-print">
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trendData.products.forEach((p: any) => delete updated[p]);
                    setHiddenProducts(updated);
                  }}
                  className="px-2 py-0.5 rounded border border-slate-700/60 hover:bg-slate-800"
                >
                  {t.select}
                </button>
                <button
                  onClick={() => {
                    const updated = { ...hiddenProducts };
                    trendData.products.forEach((p: any) => updated[p] = true);
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
                <LineChart data={trendData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="monthLabel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis 
                    stroke={darkMode ? '#94a3b8' : '#64748b'} 
                    fontSize={10}
                    tickFormatter={(v) => {
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${(v / factor).toFixed(0)}${suffix} EGP`;
                    }}
                  />
                  <Tooltip formatter={(v: any) => formatVal(v)} />
                  <Legend onClick={handleLegendClick} formatter={renderLegendText} wrapperStyle={{ fontSize: 10 }} />
                  {trendData.products.map((prod, idx) => (
                    <Line
                      key={prod}
                      type="monotone"
                      dataKey={prod}
                      name={prod}
                      stroke={multiColors[idx % multiColors.length]}
                      strokeWidth={2}
                      hide={hiddenProducts[prod]}
                      dot={{ r: 3 }}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey={isEn ? 'Total' : 'الإجمالي'}
                    name={isEn ? 'Total Sales' : 'إجمالي المبيعات'}
                    stroke={darkMode ? '#38bdf8' : '#0284c7'}
                    strokeWidth={3.5}
                    strokeDasharray="6 4"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Customers vs Reps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Customers */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {t.topCustomers}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={topCustomersData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis 
                      type="number" 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={9} 
                      tickFormatter={(v) => {
                        const factor = scaleMode === 'millions' ? 1000000 : 1000;
                        const suffix = scaleMode === 'millions' ? 'M' : 'K';
                        return `${(v / factor).toFixed(0)}${suffix}`;
                      }}
                    />
                    <YAxis dataKey="name" type="category" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} width={90} />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Representatives */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white border-slate-200'} shadow-sm`}>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {t.salesReps}
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={topRepsData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                    <YAxis 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickFormatter={(v) => {
                        const factor = scaleMode === 'millions' ? 1000000 : 1000;
                        const suffix = scaleMode === 'millions' ? 'M' : 'K';
                        return `${(v / factor).toFixed(0)}${suffix}`;
                      }}
                    />
                    <Tooltip formatter={(v: any) => formatVal(v)} />
                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer Churn Analytics Risk Panel */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-850'}`}>
                  <AlertTriangle className="text-amber-500" size={14} />
                  <span>{t.churnAnalytics}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">{t.churnSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-xs font-bold w-full lg:w-auto justify-between lg:justify-end">
                <div className="flex items-center gap-2 p-1.5 px-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">{isEn ? 'Show Rows:' : 'عرض الصفوف:'}</span>
                  <input 
                    type="range" 
                    min="5" 
                    max={Math.max(10, churnAnalysis.clientRows.length)} 
                    value={visibleCount} 
                    onChange={(e) => setVisibleCount(Number(e.target.value))}
                    className="w-20 lg:w-24 accent-indigo-500 h-1 bg-slate-350 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-indigo-500 font-extrabold">{visibleCount}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-full block"></span>
                    <span className="text-slate-400">{t.riskHigh}:</span>
                    <span>{churnAnalysis.segmentCounts.high}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full block"></span>
                    <span className="text-slate-400">{t.riskMedium}:</span>
                    <span>{churnAnalysis.segmentCounts.medium}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full block"></span>
                    <span className="text-slate-400">{t.riskActive}:</span>
                    <span>{churnAnalysis.segmentCounts.active}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Churn Risk Table */}
            <div className="overflow-x-auto select-none rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'} font-bold border-b border-slate-200 dark:border-slate-800`}>
                    <th onClick={() => requestSort('name')} className="p-3 cursor-pointer hover:bg-slate-800/20 truncate">
                      <div className="flex items-center gap-1.5">
                        <span>{t.customerName}</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => requestSort('totalSales')} className="p-3 cursor-pointer hover:bg-slate-800/20 text-right truncate">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>{t.salesVal}</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => requestSort('recency')} className="p-3 cursor-pointer hover:bg-slate-800/20 text-right truncate">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>{t.recency}</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th onClick={() => requestSort('probability')} className="p-3 cursor-pointer hover:bg-slate-800/20 text-right truncate">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span>{t.churnProb}</span>
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3 truncate">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChurnRows.slice(0, visibleCount).map((row, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                        row.status === 'high' ? 'bg-rose-500/5' : row.status === 'medium' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3 font-semibold truncate max-w-[200px]">{row.name}</td>
                      <td className="p-3 text-right font-bold text-slate-500">{formatVal(row.totalSales)}</td>
                      <td className="p-3 text-right font-medium text-slate-500">{row.recency} {t.daysAgo}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          row.status === 'high' ? 'bg-rose-500/10 text-rose-500' :
                          row.status === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {row.probability}%
                        </span>
                      </td>
                      <td className="p-3 font-medium text-[10.5px]">
                        {row.status === 'high' && (
                          <span className="text-rose-500 dark:text-rose-400">
                            🚨 {isEn ? 'URGENT: Re-engage with custom price discounts.' : 'عاجل: أعد التواصل فوراً مع خصومات تسعير مخصصة.'}
                          </span>
                        )}
                        {row.status === 'medium' && (
                          <span className="text-amber-500 dark:text-amber-400">
                            📞 {isEn ? 'Routine Call: Send sweetener catalog update.' : 'اتصال روتيني: أرسل كتالوج المحليات المحدث.'}
                          </span>
                        )}
                        {row.status === 'active' && (
                          <span className="text-emerald-500 dark:text-emerald-400">
                            ✅ {isEn ? 'Good Standing: Send volume bonus reward.' : 'حالة جيدة: أرسل مكافأة المبيعات الكبيرة.'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'customer-map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Controls */}
            <div className={`lg:col-span-1 p-6 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Filter size={14} className="text-indigo-500" />
                  <span className={`${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{isEn ? 'Map Controls' : 'أدوات التحكم بالخريطة'}</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      {isEn ? 'Filter by Governorate' : 'تصفية حسب المحافظة'}
                    </label>
                    <select
                      value={mapGovFilter}
                      onChange={(e) => setMapGovFilter(e.target.value)}
                      className="w-full p-2 text-xs rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="All">{isEn ? 'All Governorates (Egypt)' : 'كل المحافظات (مصر)'}</option>
                      {governoratesList.map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      {isEn ? 'Filter by Category Purchased' : 'تصفية حسب المنتجات المشتراة'}
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'sweetener', label: isEn ? 'Sweeteners' : 'المحليات', color: 'accent-emerald-500' },
                        { key: 'coffee', label: isEn ? '3-in-1 Coffee' : 'قهوة ٣ في ١', color: 'accent-amber-500' },
                        { key: 'hot_chocolate', label: isEn ? 'Hot Chocolate' : 'هوت شوكليت', color: 'accent-violet-500' },
                        { key: 'mints', label: isEn ? 'Mints' : 'النعناع', color: 'accent-blue-500' },
                      ].map(cat => (
                        <label key={cat.key} className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${darkMode ? 'text-slate-350' : 'text-slate-800'}`}>
                          <input
                            type="checkbox"
                            checked={(mapCategories as any)[cat.key]}
                            onChange={(e) => setMapCategories({ ...mapCategories, [cat.key]: e.target.checked })}
                            className={`rounded cursor-pointer ${cat.color}`}
                          />
                          <span>{cat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapped Outlets Metric Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                    {isEn ? 'Mapped Outlets' : 'المنافذ المحددة'}
                  </span>
                  <span className="text-base font-black text-indigo-500 block mt-1">
                    {locations.filter(loc => {
                      if (mapGovFilter !== 'All' && loc.governorate !== mapGovFilter) return false;
                      if (mapCategories.sweetener && !loc.is_sweetener) return false;
                      if (mapCategories.coffee && !loc.is_coffee) return false;
                      if (mapCategories.hot_chocolate && !loc.is_hot_chocolate) return false;
                      if (mapCategories.mints && !loc.is_mints) return false;
                      return true;
                    }).length}
                  </span>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[9px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                    {isEn ? 'Top Location' : 'أعلى موقع'}
                  </span>
                  <span className={`text-sm font-black block mt-1 truncate ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {governorateBreakdown[0]?.name || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Governorate breakdown stats */}
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                  {isEn ? 'Governorate Share' : 'حصة المحافظات'}
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {governorateBreakdown.map((gov, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${darkMode ? 'text-slate-350' : 'text-slate-800'}`}>{gov.name}</span>
                      <span className={`font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{gov.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Frame Area */}
            <div className={`lg:col-span-3 p-2 rounded-2xl border ${darkMode ? 'bg-slate-850/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`} style={{ minHeight: '550px' }}>
              <React.Suspense fallback={<div className="h-full w-full flex justify-center items-center text-xs text-slate-400">Loading Map...</div>}>
                <LeafletMap 
                  data={locations} 
                  filters={{ governorate: mapGovFilter, categories: mapCategories }} 
                  onSelect={setSelectedMapOutlet} 
                  darkMode={darkMode} 
                />
              </React.Suspense>

              {/* Selected Outlet Overlay Details */}
              {selectedMapOutlet && (
                <div className={`absolute bottom-4 left-4 z-[999] p-4 rounded-xl border max-w-sm ${
                  darkMode ? 'bg-slate-900/95 border-slate-700/60 text-slate-355' : 'bg-white/95 border-slate-200 text-slate-800'
                } shadow-xl backdrop-blur-sm pointer-events-auto`}>
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{selectedMapOutlet.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">{selectedMapOutlet.address}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {isEn ? 'Coords:' : 'الإحداثيات:'} {selectedMapOutlet.lat.toFixed(6)}, {selectedMapOutlet.lng.toFixed(6)}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {selectedMapOutlet.is_sweetener && <span className="bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded text-[8px] font-black">🍬 {isEn ? 'Sweetener' : 'محليات'}</span>}
                        {selectedMapOutlet.is_coffee && <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-black">☕ {isEn ? 'Coffee' : 'قهوة'}</span>}
                        {selectedMapOutlet.is_hot_chocolate && <span className="bg-violet-500/10 text-violet-500 px-1.5 py-0.5 rounded text-[8px] font-black">🍫 {isEn ? 'Hot Choc' : 'شوكولاتة'}</span>}
                        {selectedMapOutlet.is_mints && <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[8px] font-black">🌿 {isEn ? 'Mints' : 'نعناع'}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(VitalitySnacksDashboardView);
