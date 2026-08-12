import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useMultiComparison } from '../../hooks/useComparison';

export interface Transaction {
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

export interface ProcessedRow extends Transaction {
  DateObj: Date;
  Volume: number;
  IsReturn: boolean;
}

export interface MonthlyReturn {
  month: string;
  grossVolume: number;
  returnsVolume: number;
  netVolume: number;
  grossRevenue: number;
  returnsRevenue: number;
  netRevenue: number;
}

export interface ChartData {
  riskMatrix: { name: string; customerCount: number; volume: number; revenue: number; returnRate: number; isHighRisk: boolean }[];
  highReturnItems: any[];
  monthlyReturns: MonthlyReturn[];
  totalNetVolume: number;
  totalGrossVolume: number;
  totalReturnVolume: number;
  overallReturnRate: string;
  totalNetRevenue: number;
  totalGrossRevenue: number;
  totalReturnRevenue: number;
  overallReturnRateRevenue: string;
  segmentAllocation: { name: string; value: number; revenue: number }[];
  topCustomers: { name: string; customerCode?: string; volume: number; revenue: number }[];
  topProducts: { name: string; materialCode?: string; uom?: string; volume: number; revenue: number }[];
  topSalesmen: { name: string; volume: number; revenue: number }[];
  itemGroupAllocation: { name: string; value: number; revenue: number }[];
}

export const computeChartData = (dataList: ProcessedRow[]): ChartData => {
  const segmentVols: Record<string, number> = {};
  const customerVols: Record<string, number> = {};
  const productVols: Record<string, number> = {};
  const salesmenVols: Record<string, number> = {};
  const itemGroupVols: Record<string, number> = {};

  const segmentRevs: Record<string, number> = {};
  const customerRevs: Record<string, number> = {};
  const productRevs: Record<string, number> = {};
  const salesmenRevs: Record<string, number> = {};
  const itemGroupRevs: Record<string, number> = {};

  const monthlyBuckets: Record<string, { gross: number; returns: number; grossRev: number; returnsRev: number }> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const productCustomers: Record<string, Set<string>> = {};
  const productGross: Record<string, number> = {};
  const productReturns: Record<string, number> = {};

  let totalGrossVolume = 0;
  let totalReturnVolume = 0;
  let totalGrossRevenue = 0;
  let totalReturnRevenue = 0;

  dataList.forEach(row => {
    const vol = row.Volume;
    const isReturn = row.IsReturn;
    const rev = row.Revenue || 0;
    
    if (isReturn) {
      totalReturnVolume += vol;
      totalReturnRevenue += Math.abs(rev);
    } else {
      totalGrossVolume += vol;
      totalGrossRevenue += Math.abs(rev);
    }

    // Monthly timeline bucket
    const date = row.DateObj;
    if (date && !isNaN(date.getTime())) {
      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      if (!monthlyBuckets[bucket]) {
        monthlyBuckets[bucket] = { gross: 0, returns: 0, grossRev: 0, returnsRev: 0 };
      }
      if (isReturn) {
        monthlyBuckets[bucket].returns += vol;
        monthlyBuckets[bucket].returnsRev += Math.abs(rev);
      } else {
        monthlyBuckets[bucket].gross += vol;
        monthlyBuckets[bucket].grossRev += Math.abs(rev);
      }
    }

    if (!isReturn) {
      if (row.Segment) {
        segmentVols[row.Segment] = (segmentVols[row.Segment] || 0) + vol;
        segmentRevs[row.Segment] = (segmentRevs[row.Segment] || 0) + rev;
      }
      if (row.CustomerName) {
        customerVols[row.CustomerName] = (customerVols[row.CustomerName] || 0) + vol;
        customerRevs[row.CustomerName] = (customerRevs[row.CustomerName] || 0) + rev;
      }
      if (row.ItemName) {
        productVols[row.ItemName] = (productVols[row.ItemName] || 0) + vol;
        productRevs[row.ItemName] = (productRevs[row.ItemName] || 0) + rev;
      }
      if (row.SalesmanName) {
        salesmenVols[row.SalesmanName] = (salesmenVols[row.SalesmanName] || 0) + vol;
        salesmenRevs[row.SalesmanName] = (salesmenRevs[row.SalesmanName] || 0) + rev;
      }
      if (row.ItemGroup) {
        itemGroupVols[row.ItemGroup] = (itemGroupVols[row.ItemGroup] || 0) + vol;
        itemGroupRevs[row.ItemGroup] = (itemGroupRevs[row.ItemGroup] || 0) + rev;
      }

      // Risk matrix data
      if (row.ItemName && row.CustomerName) {
        if (!productCustomers[row.ItemName]) productCustomers[row.ItemName] = new Set();
        productCustomers[row.ItemName].add(row.CustomerName);
        productGross[row.ItemName] = (productGross[row.ItemName] || 0) + vol;
      }
    } else {
      if (row.ItemName) {
        productReturns[row.ItemName] = (productReturns[row.ItemName] || 0) + vol;
      }
    }
  });

  const totalNetVolume = totalGrossVolume - totalReturnVolume;
  const overallReturnRate = totalGrossVolume > 0 ? (totalReturnVolume / totalGrossVolume) * 100 : 0;

  const totalNetRevenue = totalGrossRevenue - totalReturnRevenue;
  const overallReturnRateRevenue = totalGrossRevenue > 0 ? (totalReturnRevenue / totalGrossRevenue) * 100 : 0;

  // Monthly returns array
  const monthlyReturnsArr = Object.entries(monthlyBuckets).map(([month, val]) => ({
    month,
    grossVolume: val.gross,
    returnsVolume: val.returns,
    netVolume: Math.max(0, val.gross - val.returns),
    grossRevenue: val.grossRev,
    returnsRevenue: val.returnsRev,
    netRevenue: Math.max(0, val.grossRev - val.returnsRev)
  }));

  const segmentAllocation = Object.entries(segmentVols).map(([name, value]) => ({ name, value, revenue: segmentRevs[name] || 0 }));
  const itemGroupAllocation = Object.entries(itemGroupVols).map(([name, value]) => ({ name, value, revenue: itemGroupRevs[name] || 0 }));
  const customerCodes: Record<string, string> = {};
  const productCodes: Record<string, string> = {};
  const productUoms: Record<string, string> = {};

  dataList.forEach(r => {
    if (r.CustomerName && r.CustomerCode && !customerCodes[r.CustomerName]) {
      customerCodes[r.CustomerName] = r.CustomerCode;
    }
    if (r.ItemName && !productCodes[r.ItemName]) {
      if (r.MaterialCode) productCodes[r.ItemName] = r.MaterialCode;
      if (r.UoM) productUoms[r.ItemName] = r.UoM;
    }
  });

  const topCustomers = Object.entries(customerVols).map(([name, volume]) => ({
    name,
    customerCode: customerCodes[name] || 'N/A',
    volume,
    revenue: customerRevs[name] || 0
  }));

  const topProducts = Object.entries(productVols).map(([name, volume]) => ({
    name,
    materialCode: productCodes[name] || 'N/A',
    uom: productUoms[name] || 'Units',
    volume,
    revenue: productRevs[name] || 0
  }));
  const topSalesmen = Object.entries(salesmenVols).map(([name, volume]) => ({ name, volume, revenue: salesmenRevs[name] || 0 }));

  const riskMatrix = Object.keys(productGross).map(itemName => {
    const custCount = productCustomers[itemName].size;
    const vol = productGross[itemName];
    const ret = productReturns[itemName] || 0;
    const itemReturnRate = vol > 0 ? (ret / vol) * 100 : 0;
    return {
      name: itemName.substring(0, 12) + '...',
      customerCount: custCount,
      volume: vol,
      revenue: productRevs[itemName] || 0,
      returnRate: itemReturnRate,
      isHighRisk: custCount <= 2 && vol > 1500
    };
  });

  const highReturnItems = Object.keys(productReturns)
    .map(itemName => {
      const vol = productGross[itemName] || 0;
      const ret = productReturns[itemName] || 0;
      const rate = vol > 0 ? (ret / vol) * 100 : 0;
      return { name: itemName, returnRate: rate, volume: vol };
    })
    .filter(item => item.returnRate > 5 && item.volume > 500)
    .sort((a,b)=>b.returnRate - a.returnRate);

  return {
    riskMatrix,
    highReturnItems,
    monthlyReturns: monthlyReturnsArr,
    totalNetVolume,
    totalGrossVolume,
    totalReturnVolume,
    overallReturnRate: overallReturnRate.toFixed(1),
    totalNetRevenue,
    totalGrossRevenue,
    totalReturnRevenue,
    overallReturnRateRevenue: overallReturnRateRevenue.toFixed(1),
    segmentAllocation,
    topCustomers,
    topProducts,
    topSalesmen,
    itemGroupAllocation
  };
};

export function useSalesDirectorData({
  processedData,
  roleProcessedData,
  language,
  adminSettings,
  currentUser,
  officeType,
  globalChartMetric,
  globalCompareMode,
  chartDisplayMode
}: {
  processedData: ProcessedRow[];
  roleProcessedData: ProcessedRow[];
  language: 'en' | 'ar';
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  currentUser: any;
  officeType: string;
  globalChartMetric: 'revenue' | 'volume';
  globalCompareMode: boolean;
  chartDisplayMode: 'count' | 'percent';
}) {
  const isRep = currentUser?.role === 'salesperson';
  const isSupervisor = isRep && (new Set(processedData.map(r => r.SalesmanName).filter(Boolean))).size > 1;
  const showSalesmanSelector = !isRep || isSupervisor;

  // Filter States
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Plot configurations
  const [prodPlotMetric, setProdPlotMetric] = useState<'revenue' | 'quantity'>(globalChartMetric === 'volume' ? 'quantity' : 'revenue');
  const [prodPlotSelectedProducts, setProdPlotSelectedProducts] = useState<string[]>([]);
  const [prodPlotYearTab, setProdPlotYearTab] = useState<'combined' | '2022' | '2023' | '2024' | '2025' | '2026'>('combined');
  const [displayMode, setDisplayMode] = useState<'count' | 'percent'>(chartDisplayMode || 'count');
  const [viewMetric, setViewMetric] = useState<'revenue' | 'volume'>(globalChartMetric || 'revenue');

  useEffect(() => {
    if (globalChartMetric) {
      setViewMetric(globalChartMetric);
      setProdPlotMetric(globalChartMetric === 'volume' ? 'quantity' : 'revenue');
    }
  }, [globalChartMetric]);

  useEffect(() => {
    if (chartDisplayMode) {
      setDisplayMode(chartDisplayMode);
    }
  }, [chartDisplayMode]);

  // Extract unique filters
  const segmentsList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.Segment).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  const officesList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.SalesOffice).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  const customersList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.CustomerName).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  const salesmenList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.SalesmanName).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  const itemGroupsList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.ItemGroup).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  const allSkusList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.ItemName).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  // General filtering
  const filteredData = useMemo(() => {
    return processedData.filter((row) => {
      if (selectedSegments.length > 0 && !selectedSegments.includes(row.Segment || '')) return false;
      if (selectedItemGroups.length > 0 && !selectedItemGroups.includes(row.ItemGroup || '')) return false;
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(row.CustomerName || '')) return false;
      if (showSalesmanSelector && selectedSalesmen.length > 0 && !selectedSalesmen.includes(row.SalesmanName || '')) return false;
      if (selectedOffices.length > 0 && !selectedOffices.includes(row.SalesOffice || '')) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesCust = row.CustomerName?.toLowerCase().includes(term);
        const matchesItem = row.ItemName?.toLowerCase().includes(term);
        const matchesSalesman = row.SalesmanName?.toLowerCase().includes(term);
        const matchesGroup = row.ItemGroup?.toLowerCase().includes(term);
        if (!matchesCust && !matchesItem && !matchesSalesman && !matchesGroup) return false;
      }
      return true;
    });
  }, [processedData, selectedSegments, selectedItemGroups, selectedCustomers, selectedSalesmen, selectedOffices, searchTerm, showSalesmanSelector]);

  const filteredDataNoDate = useMemo(() => {
    return roleProcessedData.filter((row) => {
      if (selectedSegments.length > 0 && !selectedSegments.includes(row.Segment || '')) return false;
      if (selectedItemGroups.length > 0 && !selectedItemGroups.includes(row.ItemGroup || '')) return false;
      if (selectedCustomers.length > 0 && !selectedCustomers.includes(row.CustomerName || '')) return false;
      if (showSalesmanSelector && selectedSalesmen.length > 0 && !selectedSalesmen.includes(row.SalesmanName || '')) return false;
      if (selectedOffices.length > 0 && !selectedOffices.includes(row.SalesOffice || '')) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesCust = row.CustomerName?.toLowerCase().includes(term);
        const matchesItem = row.ItemName?.toLowerCase().includes(term);
        const matchesSalesman = row.SalesmanName?.toLowerCase().includes(term);
        const matchesGroup = row.ItemGroup?.toLowerCase().includes(term);
        if (!matchesCust && !matchesItem && !matchesSalesman && matchesGroup) return false;
      }
      return true;
    });
  }, [roleProcessedData, selectedSegments, selectedItemGroups, selectedCustomers, selectedSalesmen, selectedOffices, searchTerm, showSalesmanSelector]);

  // Aggregate Combined Data
  const chartsCombined = useMemo(() => computeChartData(filteredData), [filteredData]);

  // Invalidate Year Charts Cache on filter changes
  const yearChartsCache = useRef<Partial<Record<string, ChartData>>>({});
  useEffect(() => {
    yearChartsCache.current = {};
  }, [filteredData]);

  const getChartData = useCallback((tabName: 'combined' | '2022' | '2023' | '2024' | '2025' | '2026') => {
    if (tabName === 'combined') return chartsCombined;
    if (!yearChartsCache.current[tabName]) {
      const yearNum = Number(tabName);
      const yearFilteredData = filteredData.filter(r => r.DateObj && r.DateObj.getFullYear() === yearNum);
      yearChartsCache.current[tabName] = computeChartData(yearFilteredData);
    }
    return yearChartsCache.current[tabName]!;
  }, [chartsCombined, filteredData]);

  // Comparisons
  const comparisons = useMultiComparison(
    ['timeline', 'segment', 'itemGroup', 'salesman', 'returns', 'office'],
    globalCompareMode
  );

  useEffect(() => {
    Object.values(comparisons).forEach(comp => {
      if (comp.enabled !== globalCompareMode) {
        comp.toggle();
      }
    });
  }, [globalCompareMode, comparisons]);

  const parseDate = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getCompareData = useCallback((
    comp: any,
    getRangeData: (start: Date, end: Date) => any,
    getQuarterData: (year: number, qNum: number) => any
  ) => {
    if (!comp.enabled) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    if (comp.type === 'custom') {
      const bStart = parseDate(comp.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(comp.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(comp.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(comp.custom.compEnd) || new Date('2026-06-30');

      const baseData = getRangeData(bStart, bEnd);
      const compData = getRangeData(cStart, cEnd);
      const totalLen = Math.max(baseData.sums.length, compData.sums.length);

      return Array.from({ length: totalLen }).map((_, idx) => {
        const m1Label = baseData.monthNames[idx] || (language === 'en' ? 'N/A' : 'غير متوفر');
        const m2Label = compData.monthNames[idx] || (language === 'en' ? 'N/A' : 'غير متوفر');
        return {
          month: language === 'en' ? `Month ${idx + 1} (${m1Label} vs ${m2Label})` : `الشهر ${idx + 1} (${m1Label} مقابل ${m2Label})`,
          q1Value: Math.round(baseData.sums[idx] || 0),
          q2Value: Math.round(compData.sums[idx] || 0),
        };
      });
    }

    const q1Vals = getQuarterData(comp.quarter.q1Year, comp.quarter.q1Num);
    const q2Vals = getQuarterData(comp.quarter.q2Year, comp.quarter.q2Num);
    const q1Start = (comp.quarter.q1Num - 1) * 3;
    const q2Start = (comp.quarter.q2Num - 1) * 3;

    return [0, 1, 2].map(idx => {
      const m1Name = language === 'en' ? monthsEn[q1Start + idx] : monthsAr[q1Start + idx];
      const m2Name = language === 'en' ? monthsEn[q2Start + idx] : monthsAr[q2Start + idx];
      return {
        month: language === 'en' ? `Month ${idx + 1} (${m1Name} vs ${m2Name})` : `الشهر ${idx + 1} (${m1Name} مقابل ${m2Name})`,
        q1Value: Math.round(q1Vals[idx]),
        q2Value: Math.round(q2Vals[idx]),
      };
    });
  }, [language]);

  // Timeline Compare Data
  const timelineCompareData = useMemo(() => {
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return getCompareData(
      comparisons.timeline,
      (start: Date, end: Date) => {
        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        const numMonths = Math.max(1, Math.min(24, monthsDiff));
        const sums = Array(numMonths).fill(0);
        const monthNames: string[] = [];

        for (let i = 0; i < numMonths; i++) {
          const tempDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
          const mName = language === 'en' ? monthsEn[tempDate.getMonth()] : monthsAr[tempDate.getMonth()];
          monthNames.push(`${mName} ${tempDate.getFullYear().toString().substring(2)}`);
        }

        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj >= start && dateObj <= end) {
            const mIdx = (dateObj.getFullYear() - start.getFullYear()) * 12 + (dateObj.getMonth() - start.getMonth());
            if (mIdx >= 0 && mIdx < numMonths) {
              const rev = Math.abs(row.Revenue || 0);
              const isReturn = row.IsReturn;
              const value = viewMetric === 'revenue'
                ? (isReturn ? -rev * (adminSettings.returnRateModifier / 8) : rev)
                : (isReturn ? -row.Volume * (adminSettings.returnRateModifier / 8) : row.Volume);
              sums[mIdx] += value;
            }
          }
        });
        return { sums, monthNames };
      },
      (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const aggregated = [0, 0, 0];
        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const idx = m - startMonth;
              const rev = Math.abs(row.Revenue || 0);
              const isReturn = row.IsReturn;
              const value = viewMetric === 'revenue'
                ? (isReturn ? -rev * (adminSettings.returnRateModifier / 8) : rev)
                : (isReturn ? -row.Volume * (adminSettings.returnRateModifier / 8) : row.Volume);
              aggregated[idx] += value;
            }
          }
        });
        return aggregated;
      }
    );
  }, [filteredDataNoDate, comparisons.timeline, getCompareData, viewMetric, adminSettings, language]);

  return {
    isRep,
    isSupervisor,
    showSalesmanSelector,
    selectedSegments,
    setSelectedSegments,
    selectedItemGroups,
    setSelectedItemGroups,
    selectedCustomers,
    setSelectedCustomers,
    selectedSalesmen,
    setSelectedSalesmen,
    selectedOffices,
    setSelectedOffices,
    searchTerm,
    setSearchTerm,
    prodPlotMetric,
    setProdPlotMetric,
    prodPlotSelectedProducts,
    setProdPlotSelectedProducts,
    prodPlotYearTab,
    setProdPlotYearTab,
    displayMode,
    setDisplayMode,
    viewMetric,
    setViewMetric,
    segmentsList,
    officesList,
    customersList,
    salesmenList,
    itemGroupsList,
    allSkusList,
    filteredData,
    filteredDataNoDate,
    chartsCombined,
    getChartData,
    comparisons,
    timelineCompareData
  };
}
