import { useState, useMemo } from 'react';
import opportunityAlerts from '../../data/opportunity_alerts.json';
import type { ProcessedRow } from '../CustomerMaterialTable';

export function useCeoData({
  processedData,
  adminSettings,
  inflationRate,
  currentUser,
  globalChartMetric = 'revenue',
  globalCompareMode = false
}: {
  processedData: ProcessedRow[];
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  inflationRate?: number;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  globalChartMetric?: 'revenue' | 'volume';
  globalCompareMode?: boolean;
}) {
  const [chartMetric, setChartMetric] = useState<'revenue' | 'volume'>(globalChartMetric || 'revenue');
  const [radarTab, setRadarTab] = useState<'all' | 'high' | 'market' | 'hiring'>('all');

  const totalEstValue = useMemo(() => {
    let sum = 0;
    opportunityAlerts.forEach((a: { estimatedValue?: string }) => {
      const valStr = a.estimatedValue || '';
      const clean = valStr.replace('EGP', '').trim();
      if (clean.endsWith('M')) {
        sum += parseFloat(clean.replace('M', '')) * 1000000;
      } else if (clean.endsWith('K')) {
        sum += parseFloat(clean.replace('K', '')) * 1000;
      } else {
        sum += parseFloat(clean) || 0;
      }
    });
    return sum;
  }, []);

  const [selectedOffice] = useState<string>(() => {
    if (currentUser) {
      if (currentUser.role === 'sales_b2b') return 'B2B';
      if (currentUser.role === 'sales_b2c') return 'B2C';
      if (currentUser.role === 'sales_horeca') return 'Horeca Team';
      if (currentUser.role === 'salesperson') {
        return currentUser.salesOffice || 'B2B';
      }
    }
    return 'All';
  });

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

  // Quarter Comparison State for Timeline Chart
  const [timelineCompare, setTimelineCompare] = useState(globalCompareMode || false);
  const [tq1Year, setTq1Year] = useState(2026);
  const [tq1Num, setTq1Num] = useState(1);
  const [tq2Year, setTq2Year] = useState(2026);
  const [tq2Num, setTq2Num] = useState(2);

  // Quarter Comparison State for Segments Chart
  const [segmentCompare, setSegmentCompare] = useState(globalCompareMode || false);
  const [sq1Year, setSq1Year] = useState(2026);
  const [sq1Num, setSq1Num] = useState(1);
  const [sq2Year, setSq2Year] = useState(2026);
  const [sq2Num, setSq2Num] = useState(2);

  // Filter Lists Derived from raw data
  const channelsList = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.SalesOffice) list.add(row.SalesOffice);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  const segmentsList = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.Segment) list.add(row.Segment);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  const itemGroupsList = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.ItemGroup) list.add(row.ItemGroup);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  const salesmenList = useMemo(() => {
    const list = new Set<string>();
    officeFilteredData.forEach(row => {
      if (row.SalesmanName) list.add(row.SalesmanName);
    });
    return Array.from(list).sort();
  }, [officeFilteredData]);

  // Selected Filter States
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState<string[]>([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);

  // Dynamically Filtered Data based on selection
  const filteredData = useMemo((): ProcessedRow[] => {
    return officeFilteredData.filter(row => {
      if (selectedChannels.length > 0) {
        const hasMatch = selectedChannels.some(ch => {
          if (ch === 'B2C') {
            return ['B2C', 'Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce'].includes(row.SalesOffice || '');
          }
          return row.SalesOffice === ch;
        });
        if (!hasMatch) return false;
      }
      if (selectedSegments.length > 0 && !selectedSegments.includes(row.Segment || '')) return false;
      if (selectedItemGroups.length > 0 && !selectedItemGroups.includes(row.ItemGroup || '')) return false;
      if (selectedSalesmen.length > 0 && !selectedSalesmen.includes(row.SalesmanName || '')) return false;
      return true;
    });
  }, [officeFilteredData, selectedChannels, selectedSegments, selectedItemGroups, selectedSalesmen]);

  // Calculations
  const metrics = useMemo(() => {
    let grossQty = 0;
    let returnQty = 0;
    let grossRevenue = 0;
    let returnRevenue = 0;
    const customers = new Set<string>();

    filteredData.forEach(row => {
      if (row.CustomerName) customers.add(row.CustomerName);
      const rev = row.Revenue || 0;
      if (row.IsReturn) {
        returnQty += row.Volume;
        returnRevenue += Math.abs(rev);
      } else {
        grossQty += row.Volume;
        grossRevenue += Math.abs(rev);
      }
    });

    const netQty = grossQty - returnQty;
    const netRevenue = grossRevenue - returnRevenue;
    const rawReturnRate = grossQty > 0 ? (returnQty / grossQty) * 100 : 0;
    const finalReturnRate = rawReturnRate * (adminSettings.returnRateModifier / 8);

    let weightedMarginSum = 0;
    filteredData.forEach(row => {
      if (!row.IsReturn) {
        const seg = row.Segment || 'Solutions';
        const baseMargin = seg === 'Bio' ? 0.38 : seg === 'Additives' ? 0.24 : 0.18;
        weightedMarginSum += row.Volume * baseMargin;
      }
    });
    const avgMargin = grossQty > 0 ? (weightedMarginSum / grossQty) * 100 : 22;
    const finalMargin = (avgMargin * (adminSettings.marginModifier / 30)) - (inflationRate || 0);

    return {
      netQty,
      grossQty,
      returnQty,
      netRevenue,
      grossRevenue,
      returnRevenue,
      returnRate: parseFloat(finalReturnRate.toFixed(1)),
      margin: parseFloat(Math.max(0, finalMargin).toFixed(1)),
      activeCustomers: customers.size,
    };
  }, [filteredData, adminSettings, inflationRate]);

  // Sparkline Data
  const sparklineData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Record<string, { revs: number; marginSum: number; vols: number; returnVols: number; customers: Set<string> }> = {};

    filteredData.forEach(row => {
      const date = new Date(row.Date);
      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      if (!buckets[bucket]) {
        buckets[bucket] = { revs: 0, marginSum: 0, vols: 0, returnVols: 0, customers: new Set() };
      }

      const rev = Math.abs(row.Revenue || 0);
      if (row.IsReturn) {
        buckets[bucket].returnVols += row.Volume;
      } else {
        buckets[bucket].vols += row.Volume;
        buckets[bucket].revs += rev;
        const seg = row.Segment || 'Solutions';
        const baseMargin = seg === 'Bio' ? 0.38 : seg === 'Additives' ? 0.24 : 0.18;
        buckets[bucket].marginSum += row.Volume * baseMargin;
      }
      if (row.CustomerName) {
        buckets[bucket].customers.add(row.CustomerName);
      }
    });

    const sortedBuckets = Object.entries(buckets)
      .map(([month, val]) => {
        const netRev = val.revs;
        const totalVols = val.vols;
        const avgMargin = totalVols > 0 ? (val.marginSum / totalVols) * 100 : 22;
        const finalMargin = avgMargin * (adminSettings.marginModifier / 30) - (inflationRate || 0);
        const returnRate = totalVols > 0 ? (val.returnVols / totalVols) * 100 : 0;

        return {
          month,
          revenue: Math.round(netRev),
          margin: parseFloat(Math.max(0, finalMargin).toFixed(1)),
          accounts: val.customers.size,
          returns: parseFloat(returnRate.toFixed(1))
        };
      })
      .slice(-6);

    return {
      revenue: sortedBuckets.map(b => ({ value: b.revenue })),
      margin: sortedBuckets.map(b => ({ value: b.margin })),
      accounts: sortedBuckets.map(b => ({ value: b.accounts })),
      returns: sortedBuckets.map(b => ({ value: b.returns }))
    };
  }, [filteredData, adminSettings, inflationRate]);

  return {
    chartMetric,
    setChartMetric,
    radarTab,
    setRadarTab,
    totalEstValue,
    selectedOffice,
    isOfficeLocked,
    officeFilteredData,
    timelineCompare,
    setTimelineCompare,
    tq1Year,
    setTq1Year,
    tq1Num,
    setTq1Num,
    tq2Year,
    setTq2Year,
    tq2Num,
    setTq2Num,
    segmentCompare,
    setSegmentCompare,
    sq1Year,
    setSq1Year,
    sq1Num,
    setSq1Num,
    sq2Year,
    setSq2Year,
    sq2Num,
    setSq2Num,
    channelsList,
    segmentsList,
    itemGroupsList,
    salesmenList,
    selectedChannels,
    setSelectedChannels,
    selectedSegments,
    setSelectedSegments,
    selectedItemGroups,
    setSelectedItemGroups,
    selectedSalesmen,
    setSelectedSalesmen,
    filteredData,
    metrics,
    sparklineData
  };
}
