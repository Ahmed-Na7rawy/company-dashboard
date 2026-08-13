import { useState, useMemo } from 'react';
import novaZenithSalesDataRaw from '../../data/nova_zenith_sales_data.json';

const brandData = novaZenithSalesDataRaw as Record<string, any>;

/**
 * Normalized RFM Churn Risk Scoring Algorithm (Recency, Frequency, Monetary)
 * 
 * Computes a composite 0-100 risk probability for a customer account:
 * - Recency (R, 45% weight): Days since last transaction normalized over a 180-day baseline.
 * - Frequency (F, 35% weight): Account order frequency inverted score (lower frequency = higher risk).
 * - Monetary (M, 20% weight): Lifetime transaction volume normalized against 500,000 EGP baseline.
 * 
 * Formula:
 *   Composite Risk = (0.45 * R_norm + 0.35 * F_norm + 0.20 * M_norm) * 100
 * 
 * Buckets:
 * - Score >= 65: High Risk
 * - Score 35-64: Medium Risk
 * - Score < 35: Low Risk
 */
export function calculateRFMChurnRisk(item: { recency: number; frequency?: number; revenue: number }, maxRecency = 180, maxRevenue = 500000) {
  const rNorm = Math.min(1, Math.max(0, item.recency / maxRecency));
  const fNorm = item.frequency ? Math.max(0, 1 - (item.frequency / 50)) : 0.5;
  const mNorm = Math.min(1, Math.max(0, item.revenue / maxRevenue));
  
  const rawScore = (0.45 * rNorm) + (0.35 * fNorm) + (0.20 * mNorm);
  const probability = Math.min(99, Math.max(10, Math.round(rawScore * 100)));
  
  let risk: 'High' | 'Medium' | 'Low' = 'Low';
  if (probability >= 65) risk = 'High';
  else if (probability >= 35) risk = 'Medium';

  return { probability, risk };
}

export function useBrandDashboard({
  language,
  selectedYear,
  selectedQuarter,
  chartDisplayMode,
  globalChartMetric = 'revenue'
}: {
  language: 'en' | 'ar';
  selectedYear: string;
  selectedQuarter: string;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric?: 'revenue' | 'volume';
}) {
  const [activeTab, setActiveTab] = useState<string>("nova-sales");
  const [novaRepSelect, setNovaRepSelect] = useState<string>("nova_combined");
  const [novaChurnSelect, setNovaChurnSelect] = useState<string>("nova_koffi");
  const [hiddenProducts, setHiddenProducts] = useState<Record<string, boolean>>({});

  const [novaSortField, setNovaSortField] = useState<string>("probability");
  const [novaSortAsc, setNovaSortAsc] = useState<boolean>(false);
  const [zenithSortField, setZenithSortField] = useState<string>("probability");
  const [zenithSortAsc, setZenithSortAsc] = useState<boolean>(false);
  
  const [novaChurnCount, setNovaChurnCount] = useState<number>(10);
  const [zenithChurnCount, setZenithChurnCount] = useState<number>(10);

  const filterKey = useMemo(() => {
    return `${selectedYear}_${selectedQuarter}`;
  }, [selectedYear, selectedQuarter]);

  const activeMetrics = useMemo(() => {
    if (!brandData) return null;
    const defaultData = { metrics: { revenue: 0, qty: 0, return_rate: 0 } };
    const yk = brandData?.nova_koffi?.filters?.[filterKey] || defaultData;
    const yf = brandData?.nova_frappit?.filters?.[filterKey] || defaultData;
    const ys = brandData?.nova_smoozy?.filters?.[filterKey] || defaultData;
    const sq = brandData?.zenith?.filters?.[filterKey] || defaultData;
    const yc = brandData?.nova_combined?.filters?.[filterKey] || defaultData;

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
  }, [filterKey]);

  const brandComparisonData = useMemo(() => {
    if (!activeMetrics) return [];
    const rawData = [
      { name: language === 'en' ? 'Nova Koffee' : 'نوفا كوفي', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.yk.metrics.qty) : Math.round(activeMetrics.yk.metrics.revenue), fill: '#f97316' },
      { name: language === 'en' ? 'Nova Frappitt' : 'نوفا فرابيت', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.yf.metrics.qty) : Math.round(activeMetrics.yf.metrics.revenue), fill: '#eab308' },
      { name: language === 'en' ? 'Nova Smoozy' : 'نوفا سموزي', value: globalChartMetric === 'volume' ? Math.round(activeMetrics.ys.metrics.qty) : Math.round(activeMetrics.ys.metrics.revenue), fill: '#ec4899' },
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

  const ykShare = useMemo(() => getDoughnutData(activeMetrics?.yk?.product_share), [activeMetrics, globalChartMetric]);
  const yfShare = useMemo(() => getDoughnutData(activeMetrics?.yf?.product_share), [activeMetrics, globalChartMetric]);
  const ysShare = useMemo(() => getDoughnutData(activeMetrics?.ys?.product_share), [activeMetrics, globalChartMetric]);
  const sqShare = useMemo(() => getDoughnutData(activeMetrics?.sq?.product_share), [activeMetrics, globalChartMetric]);

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

  const ykTrends = useMemo(() => getTrendData(activeMetrics?.yk?.trends), [activeMetrics, globalChartMetric]);
  const yfTrends = useMemo(() => getTrendData(activeMetrics?.yf?.trends), [activeMetrics, globalChartMetric]);
  const ysTrends = useMemo(() => getTrendData(activeMetrics?.ys?.trends), [activeMetrics, globalChartMetric]);

  const sqTrends = useMemo(() => {
    if (!activeMetrics?.sq) return { products: [], chartData: [] };
    const top5Names = (activeMetrics.sq.product_share || []).slice(0, 5).map((p: any) => p['Material Desc']);
    const allowed = [...top5Names, "Total Sales"];
    const filteredTrends = (activeMetrics.sq.trends || []).filter((t: any) => allowed.includes(t.product));
    return getTrendData(filteredTrends);
  }, [activeMetrics, globalChartMetric]);

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

  const novaQuarterly = useMemo(() => {
    if (!brandData) return [];
    return getQuarterlyComparisonData(brandData?.nova_combined?.quarterly_comparison);
  }, [chartDisplayMode]);

  const zenithQuarterly = useMemo(() => {
    if (!brandData) return [];
    return getQuarterlyComparisonData(brandData?.zenith?.quarterly_comparison);
  }, [chartDisplayMode]);

  const novaQuarterlyTotal = useMemo(() => {
    if (!brandData?.nova_combined?.quarterly_comparison) return 0;
    let sum = 0;
    Object.values(brandData.nova_combined.quarterly_comparison).forEach((arr: any) => {
      sum += arr.reduce((a: number, b: number) => a + b, 0);
    });
    return sum;
  }, []);

  const zenithQuarterlyTotal = useMemo(() => {
    if (!brandData?.zenith?.quarterly_comparison) return 0;
    let sum = 0;
    Object.values(brandData.zenith.quarterly_comparison).forEach((arr: any) => {
      sum += arr.reduce((a: number, b: number) => a + b, 0);
    });
    return sum;
  }, []);

  const novaRepsData = useMemo(() => {
    if (!brandData) return [];
    const div = brandData[novaRepSelect]?.filters[filterKey];
    return div?.salespersons || [];
  }, [novaRepSelect, filterKey]);

  const novaRepsChartData = useMemo(() => {
    return [...novaRepsData].slice(0, 10).map(r => ({
      name: r.name,
      value: Math.round(r.revenue)
    })).reverse();
  }, [novaRepsData]);

  const zenithRepsData = useMemo(() => {
    return activeMetrics?.sq?.salespersons || [];
  }, [activeMetrics]);

  const zenithRepsChartData = useMemo(() => {
    return [...zenithRepsData].slice(0, 10).map(r => ({
      name: r.name,
      value: Math.round(r.revenue)
    })).reverse();
  }, [zenithRepsData]);

  const novaChurnDataSorted = useMemo(() => {
    if (!brandData) return [];
    const divData = brandData[novaChurnSelect]?.filters[filterKey];
    if (!divData?.churn?.at_risk) return [];

    const enriched = divData.churn.at_risk.map((item: any) => {
      const rfm = calculateRFMChurnRisk(item);
      return { ...item, probability: item.probability || rfm.probability, risk: item.risk || rfm.risk };
    });

    return enriched.sort((a: any, b: any) => {
      let valA = a[novaSortField];
      let valB = b[novaSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return novaSortAsc ? -1 : 1;
      if (valA > valB) return novaSortAsc ? 1 : -1;
      return 0;
    });
  }, [novaChurnSelect, filterKey, novaSortField, novaSortAsc]);

  const zenithChurnDataSorted = useMemo(() => {
    const list = activeMetrics?.sq?.churn?.at_risk || [];
    const enriched = list.map((item: any) => {
      const rfm = calculateRFMChurnRisk(item);
      return { ...item, probability: item.probability || rfm.probability, risk: item.risk || rfm.risk };
    });
    return enriched.sort((a: any, b: any) => {
      let valA = a[zenithSortField];
      let valB = b[zenithSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return zenithSortAsc ? -1 : 1;
      if (valA > valB) return zenithSortAsc ? 1 : -1;
      return 0;
    });
  }, [activeMetrics, zenithSortField, zenithSortAsc]);

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

  return {
    brandData,
    activeTab,
    setActiveTab,
    novaRepSelect,
    setNovaRepSelect,
    novaChurnSelect,
    setNovaChurnSelect,
    hiddenProducts,
    setHiddenProducts,
    novaSortField,
    setNovaSortField,
    novaSortAsc,
    setNovaSortAsc,
    zenithSortField,
    setZenithSortField,
    zenithSortAsc,
    setZenithSortAsc,
    novaChurnCount,
    setNovaChurnCount,
    zenithChurnCount,
    setZenithChurnCount,
    filterKey,
    activeMetrics,
    brandComparisonData,
    ykShare,
    yfShare,
    ysShare,
    sqShare,
    ykTrends,
    yfTrends,
    ysTrends,
    sqTrends,
    ykCustomers,
    yfCustomers,
    ysCustomers,
    sqCustomers,
    novaQuarterly,
    zenithQuarterly,
    novaQuarterlyTotal,
    zenithQuarterlyTotal,
    novaRepsData,
    novaRepsChartData,
    zenithRepsData,
    zenithRepsChartData,
    novaChurnDataSorted,
    zenithChurnDataSorted,
    handleLegendClick
  };
}
