import React, { useMemo, useState } from 'react';
import { Search, ShieldAlert, Boxes, AlertTriangle, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CustomerMaterialTable from '../CustomerMaterialTable';
import { useToast } from '../ToastProvider';
import { useScaleMode } from '../../hooks/useScaleMode';
import { useSalesDirectorData, type ProcessedRow } from './useSalesDirectorData';
import { MultiSelect } from './MultiSelect';
import { KpiCards } from './KpiCards';
import { SalesCharts } from './SalesCharts';
import { LostDecliningTables } from './LostDecliningTables';
import { SurplusFlightRiskTables } from './SurplusFlightRiskTables';
import { EmptyState } from '../EmptyState';

interface SalesDirectorViewProps {
  processedData: ProcessedRow[];
  roleProcessedData: ProcessedRow[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  sellerTargets: Record<string, number>;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  officeType: string;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric: 'revenue' | 'volume';
  globalCompareMode: boolean;
}

const COLORS = ['#128d46', '#191342', '#e97025', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899'];

function SalesDirectorView(props: SalesDirectorViewProps) {
  const { language, darkMode, officeType, processedData } = props;
  const scaleMode = useScaleMode();
  const { showToast } = useToast();

  const dataHook = useSalesDirectorData(props);

  const activeUom = useMemo(() => {
    const uniqueUoms = new Set<string>();
    processedData.forEach(row => {
      if (row.UoM && row.UoM !== 'Units') {
        uniqueUoms.add(row.UoM);
      }
    });
    if (uniqueUoms.size === 1) {
      return Array.from(uniqueUoms)[0];
    }
    return language === 'en' ? 'Units' : 'وحدة';
  }, [processedData, language]);

  const formatVal = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const rounded = Math.round(val / factor);
    if (dataHook.viewMetric === 'revenue') {
      return language === 'en' ? `${rounded}${suffix} EGP` : `${rounded} ${suffix} ج.م`;
    }
    return language === 'en' ? `${rounded}${suffix} ${activeUom}` : `${rounded} ${suffix} ${activeUom}`;
  };

  // Matrix View States (B2C specific)
  const [matrixViewMode, setMatrixViewMode] = useState<'value' | 'percent'>('value');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Flight Risk Pagination & Filtering States
  const [flightRiskFilter, setFlightRiskFilter] = useState<'All' | 'Critical' | 'Medium'>('All');
  const [flightRiskPage, setFlightRiskPage] = useState(0);

  // Office Totals for KPI cards (B2C specific)
  const officeTotals = useMemo(() => {
    const totals: Record<string, number> = {
      'Modern Trade': 0,
      'Alex Office': 0,
      'Dist. Office': 0,
      'LG Office': 0,
      'E-Commerce': 0,
      'B2C': 0
    };
    dataHook.filteredData.forEach(row => {
      const office = row.SalesOffice || 'B2C';
      const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
      const netVal = row.IsReturn ? -value : value;
      if (totals[office] !== undefined) {
        totals[office] += netVal;
      } else {
        totals['B2C'] += netVal;
      }
    });
    return totals;
  }, [dataHook.filteredData, dataHook.viewMetric]);

  // B2C Item Group per Sales Office Matrix Data
  const matrixData = useMemo(() => {
    const officeTotalsArr: Record<string, number> = {
      'Modern Trade': 0,
      'Alex Office': 0,
      'Dist. Office': 0,
      'LG Office': 0,
      'E-Commerce': 0,
      'B2C': 0
    };
    const groupSums: Record<string, Record<string, number>> = {};
    let grandTotal = 0;

    dataHook.filteredData.forEach(row => {
      const group = row.ItemGroup || (language === 'en' ? 'Uncategorized' : 'غير مصنف');
      const office = row.SalesOffice || 'B2C';
      const targetOffice = officeTotalsArr[office] !== undefined ? office : 'B2C';
      
      const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
      const netVal = row.IsReturn ? -value : value;

      if (!groupSums[group]) {
        groupSums[group] = {
          'Modern Trade': 0,
          'Alex Office': 0,
          'Dist. Office': 0,
          'LG Office': 0,
          'E-Commerce': 0,
          'B2C': 0,
          'Total': 0
        };
      }

      groupSums[group][targetOffice] += netVal;
      groupSums[group]['Total'] += netVal;
      officeTotalsArr[targetOffice] += netVal;
      grandTotal += netVal;
    });

    return {
      rows: Object.entries(groupSums).map(([groupName, sums]) => ({
        groupName,
        sums
      })).sort((a, b) => b.sums.Total - a.sums.Total),
      officeTotals: officeTotalsArr,
      grandTotal
    };
  }, [dataHook.filteredData, dataHook.viewMetric, language]);

  // Compute yearly totals for summary cards under timeline
  const yearlyTotals = useMemo(() => {
    const totals: Record<number, { grossVol: number; retVol: number; netVol: number; grossRev: number; retRev: number; netRev: number }> = {
      2022: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2023: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2024: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2025: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2026: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
    };

    dataHook.filteredData.forEach(row => {
      const year = row.DateObj.getFullYear();
      if (totals[year]) {
        const vol = row.Volume;
        const rev = row.Revenue || 0;
        if (row.IsReturn) {
          totals[year].retVol += vol;
          totals[year].retRev += Math.abs(rev);
        } else {
          totals[year].grossVol += vol;
          totals[year].grossRev += Math.abs(rev);
        }
      }
    });

    Object.keys(totals).forEach(y => {
      const yr = Number(y);
      totals[yr].netVol = totals[yr].grossVol - totals[yr].retVol;
      totals[yr].netRev = totals[yr].grossRev - totals[yr].retRev;
    });

    return totals;
  }, [dataHook.filteredData]);

  // Customer Health & Attrition Matrix
  const healthMatrix = useMemo(() => {
    const stats: Record<string, { lastPurchase: Date; totalVolume: number; recentVolume: number; previousVolume: number; items: Record<string, { lastDate: Date; volume: number }> }> = {};
    
    let maxDate = new Date('2022-01-01');
    processedData.forEach(row => {
      if (row.DateObj > maxDate) maxDate = row.DateObj;
    });
    
    const today = maxDate;
    const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(today.getMonth() - 3);
    const sixMonthsAgo = new Date(today); sixMonthsAgo.setMonth(today.getMonth() - 6);

    processedData.forEach(row => {
      if (row.CustomerName && !row.IsReturn) {
        if (!stats[row.CustomerName]) {
          stats[row.CustomerName] = {
            lastPurchase: new Date(row.Date),
            totalVolume: 0,
            recentVolume: 0,
            previousVolume: 0,
            items: {}
          };
        }

        const date = new Date(row.Date);
        if (date > stats[row.CustomerName].lastPurchase) {
          stats[row.CustomerName].lastPurchase = date;
        }

        if (!stats[row.CustomerName].items[row.ItemName]) {
          stats[row.CustomerName].items[row.ItemName] = { lastDate: date, volume: 0 };
        } else {
          if (date > stats[row.CustomerName].items[row.ItemName].lastDate) {
            stats[row.CustomerName].items[row.ItemName].lastDate = date;
          }
        }

        stats[row.CustomerName].totalVolume += row.Volume;
        stats[row.CustomerName].items[row.ItemName].volume += row.Volume;

        if (date >= threeMonthsAgo) {
          stats[row.CustomerName].recentVolume += row.Volume;
        } else if (date >= sixMonthsAgo && date < threeMonthsAgo) {
          stats[row.CustomerName].previousVolume += row.Volume;
        }
      }
    });

    const lostCustomers: any[] = [];
    const decliningCustomers: any[] = [];
    const partialChurn: any[] = [];

    Object.entries(stats).forEach(([name, data]) => {
      if (data.totalVolume === 0) return;

      let customerCode = 'N/A';
      processedData.forEach(r => {
        if (r.CustomerName === name && r.CustomerCode) {
          customerCode = r.CustomerCode;
        }
      });

      if (data.lastPurchase < sixMonthsAgo) {
        lostCustomers.push({ name, customerCode, lastPurchase: data.lastPurchase.toISOString().split('T')[0], lostValue: data.totalVolume });
      } else if (data.previousVolume > 0 && data.recentVolume < (data.previousVolume * 0.5)) {
        const dropPercent = ((data.previousVolume - data.recentVolume) / data.previousVolume * 100).toFixed(0);
        decliningCustomers.push({ name, customerCode, dropPercent, recentVol: data.recentVolume, prevVol: data.previousVolume });
      }

      Object.entries(data.items).forEach(([itemName, itemData]) => {
        if (itemData.lastDate < sixMonthsAgo && itemData.volume > 200) {
          let materialCode = 'N/A';
          let uom = 'Units';
          processedData.forEach(r => {
            if (r.ItemName === itemName) {
              if (r.MaterialCode) materialCode = r.MaterialCode;
              if (r.UoM) uom = r.UoM;
            }
          });
          partialChurn.push({
            customerName: name,
            customerCode,
            itemName,
            materialCode,
            uom,
            lastPurchase: itemData.lastDate.toISOString().split('T')[0],
            lostVolume: itemData.volume
          });
        }
      });
    });

    return {
      lost: lostCustomers.sort((a, b) => b.lostValue - a.lostValue),
      declining: decliningCustomers.sort((a, b) => b.prevVol - a.prevVol),
      partialChurn: partialChurn.sort((a, b) => b.lostVolume - a.lostVolume)
    };
  }, [processedData]);

  // Push-to-Sell Calculations (Excess stock items with suggested clearance discounts)
  const pushToSellItems = useMemo(() => {
    const items = ['Sodium Tripolyphosphate', 'Carrageenan', 'Guar Gum', 'Sodium Nitrite', 'Ascorbic Acid', 'Xanthan Gum', 'Soy Protein', 'Potato Starch'];
    
    return items.map(itemName => {
      let soldVolume = 0;
      processedData.forEach(row => {
        if (row.ItemName === itemName) {
          soldVolume += row.Volume;
        }
      });

      const currentStock = Math.round((soldVolume * 0.6 + 800) * props.adminSettings.stockLevelModifier);
      const safetyStock = Math.round(soldVolume * 0.35 + 400);
      const ratio = currentStock / safetyStock;
      const isExcess = currentStock > 1.5 * safetyStock;

      let discount = 0;
      if (ratio > 1.8) discount = 15;
      else if (ratio > 1.5) discount = 10;
      else if (ratio > 1.3) discount = 5;

      let materialCode = 'N/A';
      let uom = 'Units';
      processedData.forEach(row => {
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
        safetyStock,
        excessQty: Math.max(0, currentStock - safetyStock),
        ratio,
        discount,
        isExcess
      };
    })
    .filter(item => item.isExcess)
    .sort((a, b) => b.ratio - a.ratio);
  }, [processedData, props.adminSettings.stockLevelModifier]);

  // Predictive Flight Risk calculations (Ordering intervals recency exceeding 1.5x / 2.5x)
  const flightRiskAlerts = useMemo(() => {
    const customerOrders: Record<string, number[]> = {};
    
    processedData.forEach(row => {
      if (row.CustomerName && !row.IsReturn) {
        const time = new Date(row.Date).getTime();
        if (!customerOrders[row.CustomerName]) {
          customerOrders[row.CustomerName] = [];
        }
        customerOrders[row.CustomerName].push(time);
      }
    });

    let maxDate = new Date('2022-01-01');
    processedData.forEach(row => {
      if (row.DateObj > maxDate) maxDate = row.DateObj;
    });
    const today = maxDate.getTime();
    const alerts: any[] = [];

    Object.entries(customerOrders).forEach(([name, times]) => {
      times.sort((a, b) => a - b);
      
      const diffs: number[] = [];
      for (let i = 1; i < times.length; i++) {
        const diffDays = (times[i] - times[i - 1]) / (1000 * 60 * 60 * 24);
        diffs.push(diffDays);
      }

      const avgCycle = diffs.length > 0 ? parseFloat((diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(0)) : 45;
      
      const lastOrder = times[times.length - 1];
      const recencyDays = Math.round((today - lastOrder) / (1000 * 60 * 60 * 24));
      const multiplier = recencyDays / avgCycle;

      let risk = 'Normal';
      let color = 'emerald';
      if (multiplier > 2.5) {
        risk = language === 'en' ? 'Critical Risk' : 'مخاطر حرجة';
        color = 'rose';
      } else if (multiplier > 1.5) {
        risk = language === 'en' ? 'Medium Risk' : 'مخاطر متوسطة';
        color = 'amber';
      }

      if (risk !== 'Normal') {
        let customerCode = 'N/A';
        processedData.forEach(r => {
          if (r.CustomerName === name && r.CustomerCode) {
            customerCode = r.CustomerCode;
          }
        });
        alerts.push({
          name,
          customerCode,
          avgCycle,
          recencyDays,
          multiplier: parseFloat(multiplier.toFixed(1)),
          risk,
          color,
          lastPurchaseDate: new Date(lastOrder).toISOString().split('T')[0]
        });
      }
    });

    return alerts.sort((a, b) => b.multiplier - a.multiplier);
  }, [processedData, language]);

  const filteredFlightAlerts = useMemo(() => {
    return flightRiskAlerts.filter(item => {
      if (flightRiskFilter === 'Critical') return item.color === 'rose';
      if (flightRiskFilter === 'Medium') return item.color === 'amber';
      return true;
    });
  }, [flightRiskAlerts, flightRiskFilter]);

  const totalFlightRiskPages = Math.ceil(filteredFlightAlerts.length / 5);
  const pagedFlightAlerts = useMemo(() => {
    return filteredFlightAlerts.slice(flightRiskPage * 5, (flightRiskPage + 1) * 5);
  }, [filteredFlightAlerts, flightRiskPage]);

  // Executive Analyst Briefing text
  const executiveBriefing = useMemo(() => {
    const isEn = language === 'en';
    const isB2C = officeType === 'B2C' || officeType === 'Horeca Team';
    
    if (isEn) {
      return {
        momentum: `Gross sales volume reached ${Math.round(dataHook.chartsCombined.totalGrossVolume / 1000000)}M ${activeUom}, offset by returns of ${Math.round(dataHook.chartsCombined.totalReturnVolume / 1000000)}M ${activeUom}. The overall return logistics rate is healthy at ${dataHook.chartsCombined.overallReturnRate}%. Segment contribution is balanced across active product groups.`,
        retention: `Client attrition analysis flags ${healthMatrix.lost.length} lost accounts (inactive for 180+ days) and ${healthMatrix.declining.length} active clients exhibiting substantial decline in purchase velocity. We have also identified ${healthMatrix.partialChurn.length} cases of partial product churn.`,
        concentration: isB2C 
          ? `Stock supply audit flags ${pushToSellItems.length} excess stock SKUs exceeding 1.5x safety stock margins, requiring immediate clearance and promotional discounts to optimize rotation.`
          : `Product supply vulnerability audit flags ${dataHook.chartsCombined.riskMatrix.filter((p: any) => p.isHighRisk).length} high-volume SKUs relying on 2 or fewer B2B accounts. This creates structural concentration risks that could impact operational flow.`
      };
    } else {
      return {
        momentum: `وصل حجم المبيعات الإجمالي إلى ${Math.round(dataHook.chartsCombined.totalGrossVolume / 1000000)} مليون وحدة، مخصوماً منه مرتجعات بقيمة ${Math.round(dataHook.chartsCombined.totalReturnVolume / 1000000)} مليون وحدة. معدل المرتجعات اللوجستية الإجمالي مستقر عند ${dataHook.chartsCombined.overallReturnRate}٪. مساهمة القطاعات متوازنة في المجموعات البيعية.`,
        retention: `يكشف تحليل الاحتفاظ بالعملاء عن عدد ${healthMatrix.lost.length} عميل مفقود (غير نشط +١٨٠ يوم) وعدد ${healthMatrix.declining.length} عميل نشط يظهر تراجعاً ملحوظاً في سرعة الشراء. تم كشف أيضاً عدد ${healthMatrix.partialChurn.length} حالة تراجع جزئي للمنتجات.`,
        concentration: isB2C
          ? `يكشف تدقيق توريد المخزون عن عدد ${pushToSellItems.length} صنف مكدس يتجاوز حد أمان المخزون بـ ١.٥ ضعف، مما يتطلب ترويجاً فورياً أو خصومات لتنشيط حركة بيعها.`
          : `يكشف تدقيق مخاطر تركيز التوريد عن عدد ${dataHook.chartsCombined.riskMatrix.filter((p: any) => p.isHighRisk).length} منتج ذو حجم سحب كبير يعتمد على عميلين أو أقل. يخلق هذا مخاطر هيكلية قد تؤثر على التدفق التشغيلي.`
      };
    }
  }, [dataHook.chartsCombined, healthMatrix, language, officeType, pushToSellItems]);

  const isSpecificSeller = dataHook.isRep || dataHook.selectedSalesmen.length === 1;

  // Normal mode B2C Office data aggregator
  const getOfficeData = (tabId: string) => {
    const sums: Record<string, number> = {
      'Modern Trade': 0,
      'Alex Office': 0,
      'Dist. Office': 0,
      'LG Office': 0,
      'E-Commerce': 0,
      'B2C': 0
    };

    dataHook.filteredData.forEach(row => {
      const dateObj = row.DateObj || new Date(row.Date);
      const year = dateObj.getFullYear();
      if (tabId === 'combined' || year.toString() === tabId) {
        const office = row.SalesOffice || 'B2C';
        const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
        const netVal = row.IsReturn ? -value : value;
        if (sums[office] !== undefined) {
          sums[office] += netVal;
        } else {
          sums['B2C'] += netVal;
        }
      }
    });

    return Object.entries(sums).map(([name, value]) => ({
      name,
      value: Math.round(value)
    })).sort((a, b) => b.value - a.value);
  };

  const segmentCompare = dataHook.comparisons.segment;
  const itemGroupCompare = dataHook.comparisons.itemGroup;
  const salesmanCompare = dataHook.comparisons.salesman;
  const returnsCompare = dataHook.comparisons.returns;
  const officeCompare = dataHook.comparisons.office;

  const segmentCompareData = useMemo(() => {
    if (!segmentCompare.enabled) return [];

    const getSegmentsForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      dataHook.filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const seg = row.Segment || 'Solutions';
          const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[seg] = (sums[seg] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (segmentCompare.type === 'custom') {
      const bStart = new Date(segmentCompare.custom.baseStart || '2025-01-01');
      const bEnd = new Date(segmentCompare.custom.baseEnd || '2025-06-30');
      const cStart = new Date(segmentCompare.custom.compStart || '2026-01-01');
      const cEnd = new Date(segmentCompare.custom.compEnd || '2026-06-30');
      q1Sums = getSegmentsForRange(bStart, bEnd);
      q2Sums = getSegmentsForRange(cStart, cEnd);
    } else {
      const getQuarterSegments = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        dataHook.filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const seg = row.Segment || 'Solutions';
              const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
              sums[seg] = (sums[seg] || 0) + (row.IsReturn ? -value : value);
            }
          }
        });
        return sums;
      };
      q1Sums = getQuarterSegments(segmentCompare.quarter.q1Year, segmentCompare.quarter.q1Num);
      q2Sums = getQuarterSegments(segmentCompare.quarter.q2Year, segmentCompare.quarter.q2Num);
    }

    const allKeys = Array.from(new Set([...Object.keys(q1Sums), ...Object.keys(q2Sums)]));

    return allKeys.map(key => ({
      name: language === 'en' ? key : (key === 'Additives' ? 'الإضافات' : key === 'Solutions' ? 'الحلول' : key === 'Bio' ? 'المنتجات الحيوية' : key),
      q1Value: Math.round(q1Sums[key] || 0),
      q2Value: Math.round(q2Sums[key] || 0)
    })).sort((a, b) => b.q1Value - a.q1Value);
  }, [dataHook.filteredDataNoDate, segmentCompare, dataHook.viewMetric, language]);

  const itemGroupCompareData = useMemo(() => {
    if (!itemGroupCompare.enabled) return [];

    const getGroupsForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      dataHook.filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const group = row.ItemGroup || 'Other';
          const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[group] = (sums[group] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (itemGroupCompare.type === 'custom') {
      const bStart = new Date(itemGroupCompare.custom.baseStart || '2025-01-01');
      const bEnd = new Date(itemGroupCompare.custom.baseEnd || '2025-06-30');
      const cStart = new Date(itemGroupCompare.custom.compStart || '2026-01-01');
      const cEnd = new Date(itemGroupCompare.custom.compEnd || '2026-06-30');
      q1Sums = getGroupsForRange(bStart, bEnd);
      q2Sums = getGroupsForRange(cStart, cEnd);
    } else {
      const getQuarterGroups = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        dataHook.filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const group = row.ItemGroup || 'Other';
              const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
              sums[group] = (sums[group] || 0) + (row.IsReturn ? -value : value);
            }
          }
        });
        return sums;
      };
      q1Sums = getQuarterGroups(itemGroupCompare.quarter.q1Year, itemGroupCompare.quarter.q1Num);
      q2Sums = getQuarterGroups(itemGroupCompare.quarter.q2Year, itemGroupCompare.quarter.q2Num);
    }

    const allKeys = Array.from(new Set([...Object.keys(q1Sums), ...Object.keys(q2Sums)]));

    return allKeys.map(key => ({
      name: key,
      q1Value: Math.round(q1Sums[key] || 0),
      q2Value: Math.round(q2Sums[key] || 0)
    })).sort((a, b) => b.q1Value - a.q1Value).slice(0, 10);
  }, [dataHook.filteredDataNoDate, itemGroupCompare, dataHook.viewMetric]);

  const salesmanCompareData = useMemo(() => {
    if (!salesmanCompare.enabled) return [];

    const getSalesmenForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      dataHook.filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const name = row.SalesmanName || 'General';
          const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[name] = (sums[name] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (salesmanCompare.type === 'custom') {
      const bStart = new Date(salesmanCompare.custom.baseStart || '2025-01-01');
      const bEnd = new Date(salesmanCompare.custom.baseEnd || '2025-06-30');
      const cStart = new Date(salesmanCompare.custom.compStart || '2026-01-01');
      const cEnd = new Date(salesmanCompare.custom.compEnd || '2026-06-30');
      q1Sums = getSalesmenForRange(bStart, bEnd);
      q2Sums = getSalesmenForRange(cStart, cEnd);
    } else {
      const getQuarterSalesmen = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        dataHook.filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const name = row.SalesmanName || 'General';
              const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
              sums[name] = (sums[name] || 0) + (row.IsReturn ? -value : value);
            }
          }
        });
        return sums;
      };
      q1Sums = getQuarterSalesmen(salesmanCompare.quarter.q1Year, salesmanCompare.quarter.q1Num);
      q2Sums = getQuarterSalesmen(salesmanCompare.quarter.q2Year, salesmanCompare.quarter.q2Num);
    }

    const allKeys = Array.from(new Set([...Object.keys(q1Sums), ...Object.keys(q2Sums)]));

    return allKeys.map(key => ({
      name: key,
      q1Value: Math.round(q1Sums[key] || 0),
      q2Value: Math.round(q2Sums[key] || 0)
    })).sort((a, b) => b.q1Value - a.q1Value).slice(0, 10);
  }, [dataHook.filteredDataNoDate, salesmanCompare, dataHook.viewMetric]);

  const returnsCompareData = useMemo(() => {
    if (!returnsCompare.enabled) return [];

    const getReturnsForRange = (start: Date, end: Date) => {
      const productGross: Record<string, number> = {};
      const productReturns: Record<string, number> = {};

      dataHook.filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const item = row.ItemName;
          const vol = row.Volume;
          if (row.IsReturn) {
            productReturns[item] = (productReturns[item] || 0) + vol;
          } else {
            productGross[item] = (productGross[item] || 0) + vol;
          }
        }
      });

      const rates: Record<string, { returnRate: number; volume: number }> = {};
      Object.keys(productGross).forEach(itemName => {
        const vol = productGross[itemName];
        const ret = productReturns[itemName] || 0;
        rates[itemName] = {
          returnRate: vol > 0 ? (ret / vol) * 100 : 0,
          volume: vol
        };
      });
      return rates;
    };

    let q1Sums: Record<string, { returnRate: number; volume: number }> = {};
    let q2Sums: Record<string, { returnRate: number; volume: number }> = {};

    if (returnsCompare.type === 'custom') {
      const bStart = new Date(returnsCompare.custom.baseStart || '2025-01-01');
      const bEnd = new Date(returnsCompare.custom.baseEnd || '2025-06-30');
      const cStart = new Date(returnsCompare.custom.compStart || '2026-01-01');
      const cEnd = new Date(returnsCompare.custom.compEnd || '2026-06-30');
      q1Sums = getReturnsForRange(bStart, bEnd);
      q2Sums = getReturnsForRange(cStart, cEnd);
    } else {
      const getQuarterReturns = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const productGross: Record<string, number> = {};
        const productReturns: Record<string, number> = {};

        dataHook.filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const item = row.ItemName;
              const vol = row.Volume;
              if (row.IsReturn) {
                productReturns[item] = (productReturns[item] || 0) + vol;
              } else {
                productGross[item] = (productGross[item] || 0) + vol;
              }
            }
          }
        });

        const rates: Record<string, { returnRate: number; volume: number }> = {};
        Object.keys(productGross).forEach(itemName => {
          const vol = productGross[itemName];
          const ret = productReturns[itemName] || 0;
          rates[itemName] = {
            returnRate: vol > 0 ? (ret / vol) * 100 : 0,
            volume: vol
          };
        });
        return rates;
      };
      q1Sums = getQuarterReturns(returnsCompare.quarter.q1Year, returnsCompare.quarter.q1Num);
      q2Sums = getQuarterReturns(returnsCompare.quarter.q2Year, returnsCompare.quarter.q2Num);
    }

    const allKeys = Array.from(new Set([...Object.keys(q1Sums), ...Object.keys(q2Sums)]))
      .filter(key => {
        const base = q1Sums[key];
        const comp = q2Sums[key];
        const baseRate = base ? base.returnRate : 0;
        const compRate = comp ? comp.returnRate : 0;
        const baseVol = base ? base.volume : 0;
        const compVol = comp ? comp.volume : 0;
        return (baseRate > 5 && baseVol > 200) || (compRate > 5 && compVol > 200);
      });

    return allKeys.map(key => ({
      name: key,
      q1Value: q1Sums[key] ? Number(q1Sums[key].returnRate.toFixed(1)) : 0,
      q2Value: q2Sums[key] ? Number(q2Sums[key].returnRate.toFixed(1)) : 0
    })).sort((a, b) => b.q1Value - a.q1Value).slice(0, 8);
  }, [dataHook.filteredDataNoDate, returnsCompare]);

  const officeCompareData = useMemo(() => {
    if (!officeCompare.enabled) return [];

    const getOfficesForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {
        'Modern Trade': 0,
        'Alex Office': 0,
        'Dist. Office': 0,
        'LG Office': 0,
        'E-Commerce': 0,
        'B2C': 0
      };
      dataHook.filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const office = row.SalesOffice || 'B2C';
          const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          const netVal = row.IsReturn ? -value : value;
          if (sums[office] !== undefined) {
            sums[office] += netVal;
          } else {
            sums['B2C'] += netVal;
          }
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (officeCompare.type === 'custom') {
      const bStart = new Date(officeCompare.custom.baseStart || '2025-01-01');
      const bEnd = new Date(officeCompare.custom.baseEnd || '2025-06-30');
      const cStart = new Date(officeCompare.custom.compStart || '2026-01-01');
      const cEnd = new Date(officeCompare.custom.compEnd || '2026-06-30');
      q1Sums = getOfficesForRange(bStart, bEnd);
      q2Sums = getOfficesForRange(cStart, cEnd);
    } else {
      const getQuarterOffices = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {
          'Modern Trade': 0,
          'Alex Office': 0,
          'Dist. Office': 0,
          'LG Office': 0,
          'E-Commerce': 0,
          'B2C': 0
        };
        dataHook.filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const office = row.SalesOffice || 'B2C';
              const value = dataHook.viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
              const netVal = row.IsReturn ? -value : value;
              if (sums[office] !== undefined) {
                sums[office] += netVal;
              } else {
                sums['B2C'] += netVal;
              }
            }
          }
        });
        return sums;
      };
      q1Sums = getQuarterOffices(officeCompare.quarter.q1Year, officeCompare.quarter.q1Num);
      q2Sums = getQuarterOffices(officeCompare.quarter.q2Year, officeCompare.quarter.q2Num);
    }

    const allKeys = ['Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce', 'B2C'];

    return allKeys.map(key => ({
      name: key,
      q1Value: Math.round(q1Sums[key] || 0),
      q2Value: Math.round(q2Sums[key] || 0)
    })).sort((a, b) => b.q1Value - a.q1Value);
  }, [dataHook.filteredDataNoDate, officeCompare, dataHook.viewMetric]);

  const { activeProductsForPlot, skuTimeSeriesData } = useMemo(() => {
    const dataset = dataHook.filteredData.filter((row) => {
      if (dataHook.prodPlotYearTab !== 'combined') {
        const year = row.DateObj ? row.DateObj.getFullYear() : null;
        if (year && String(year) !== dataHook.prodPlotYearTab) return false;
      }
      return true;
    });

    let activeProducts = dataHook.prodPlotSelectedProducts;
    if (activeProducts.length === 0) {
      const totals: Record<string, number> = {};
      dataset.forEach((row) => {
        const name = row.ItemName || (language === 'en' ? 'Uncategorized' : 'غير مصنف');
        const val = dataHook.prodPlotMetric === 'revenue' ? (row.Revenue || 0) : (row.Volume || row.Quantity || 0);
        totals[name] = (totals[name] || 0) + val;
      });
      activeProducts = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((t) => t[0]);
    }

    const monthlyProdValues: Record<number, Record<string, number>> = {};
    for (let i = 0; i < 12; i++) {
      monthlyProdValues[i] = {};
      activeProducts.forEach((p) => {
        monthlyProdValues[i][p] = 0;
      });
    }

    dataset.forEach((row) => {
      if (!row.DateObj) return;
      const mIdx = row.DateObj.getMonth();
      if (mIdx < 0 || mIdx > 11) return;
      const prodName = row.ItemName || (language === 'en' ? 'Uncategorized' : 'غير مصنف');
      const val = dataHook.prodPlotMetric === 'revenue' ? (row.Revenue || 0) : (row.Volume || row.Quantity || 0);

      if (activeProducts.includes(prodName)) {
        monthlyProdValues[mIdx][prodName] = (monthlyProdValues[mIdx][prodName] || 0) + val;
      }
    });

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const timeSeriesArr = monthsEn.map((mEn, idx) => {
      const entry: Record<string, any> = {
        month: language === 'en' ? mEn : monthsAr[idx]
      };
      const totalInMonth = activeProducts.reduce((sum, p) => sum + (monthlyProdValues[idx][p] || 0), 0);

      activeProducts.forEach((p) => {
        const rawVal = monthlyProdValues[idx][p] || 0;
        if (dataHook.displayMode === 'percent') {
          entry[p] = totalInMonth > 0 ? Number(((rawVal / totalInMonth) * 100).toFixed(1)) : 0;
        } else {
          entry[p] = rawVal;
        }
      });
      return entry;
    });

    return {
      activeProductsForPlot: activeProducts,
      skuTimeSeriesData: timeSeriesArr
    };
  }, [dataHook.filteredData, dataHook.prodPlotYearTab, dataHook.prodPlotMetric, dataHook.prodPlotSelectedProducts, dataHook.displayMode, language]);

  if (dataHook.filteredData.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          illustration="filter"
          title={language === 'en' ? 'No Matching Transaction Records' : 'لا توجد سجلات معاملات مطابقة'}
          description={language === 'en' 
            ? 'No sales records match your currently selected filters. Try broadening your date range or clearing category filters.' 
            : 'لا توجد سجلات مبيعات تطابق الفلاتر المحددة حالياً. يرجى توسيع النطاق الزمني أو مسح الفلاتر.'}
          action={{
            label: language === 'en' ? 'Reset Filters' : 'إعادة ضبط الفلاتر',
            onClick: () => {
              dataHook.setSearchTerm('');
              dataHook.setTimePeriod('All');
              dataHook.setSelectedYear('All');
              dataHook.setSelectedMonth('All');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {dataHook.isRep 
              ? `${props.currentUser?.salesmanName} - ${dataHook.isSupervisor ? (language === 'en' ? 'Modern Trade Sales Performance (Supervisor)' : 'أداء مبيعات التجزئة (مشرف)') : (language === 'en' ? 'Personal Sales Performance' : 'أدائي البيعي ومؤشراتي الشخصية')}`
              : officeType === 'B2C'
              ? (language === 'en' ? 'B2C Sales Control Center' : 'منصة مبيعات B2C التنفيذية')
              : officeType === 'Horeca Team'
              ? (language === 'en' ? 'HORECA Sales Control Center' : 'منصة مبيعات HORECA التنفيذية')
              : (language === 'en' ? 'B2B Sales Control Center' : 'منصة مبيعات B2B التنفيذية')}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {dataHook.isRep
              ? dataHook.isSupervisor
                ? (language === 'en' ? 'Monitor and manage your Modern Trade team performance and sales pipelines.' : 'متابعة وإدارة أداء فريق مبيعات التجزئة والمنافذ التابعين لك.')
                : (language === 'en' ? 'Personal sales metrics, customer health, and product sella-rates.' : 'متابعة مؤشرات مبيعاتك الشخصية وصحة عملائك وتوزيع سحب منتجاتك.')
              : officeType === 'B2C'
              ? (language === 'en' ? 'Manage retail B2C consumer solutions, digital orders, and representative performance.' : 'إدارة عمليات مبيعات التجزئة B2C، والطلبات الرقمية، ومؤشرات أداء المندوبين.')
              : officeType === 'Horeca Team'
              ? (language === 'en' ? 'Manage hospitality, hotels, and restaurant channel sales pipelines and accounts.' : 'إدارة مبيعات قطاع الفنادق والمطاعم والكافيهات، وتدقيق حسابات وتوريدات هذا القطاع.')
              : (language === 'en' ? 'Manage complete B2B sales operations, representatives performance, and concentration risks.' : 'إدارة عمليات مبيعات B2B الكاملة، وتقييم أداء المندوبين، ومخاطر التركيز والجودة.')}
          </p>
        </div>
      </div>

      {/* Filter Toolbar (No-Print) */}
      <div className={`p-5 rounded-2xl border no-print space-y-4 ${
        darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
      } shadow-sm`}>
        <div className="flex justify-between items-center border-b pb-2.5 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#128d46]">
              {language === 'en' ? 'Active Workspace Filters' : 'فلاتر مساحة العمل النشطة'}
            </span>
            <button 
              onClick={() => {
                dataHook.setSelectedSegments([]);
                dataHook.setSelectedItemGroups([]);
                dataHook.setSelectedCustomers([]);
                dataHook.setSelectedSalesmen([]);
                dataHook.setSelectedOffices([]);
              }}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              {language === 'en' ? 'Reset Filters' : 'إعادة ضبط الفلاتر'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Display Mode Toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-bold no-print select-none">
              <button
                type="button"
                onClick={() => dataHook.setDisplayMode('count')}
                className={`px-3 py-1 transition-all ${dataHook.displayMode === 'count' ? 'bg-[#128d46] text-white font-black shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'en' ? 'Value' : 'القيمة'}
              </button>
              <button
                type="button"
                onClick={() => dataHook.setDisplayMode('percent')}
                className={`px-3 py-1 transition-all ${dataHook.displayMode === 'percent' ? 'bg-[#128d46] text-white font-black shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'en' ? '% Percentage' : 'النسبة ٪'}
              </button>
            </div>

            {/* Metric Toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-bold no-print select-none">
              <button
                onClick={() => dataHook.setViewMetric('revenue')}
                className={`px-3 py-1 ${dataHook.viewMetric === 'revenue' ? 'bg-[#128d46] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {language === 'en' ? 'EGP Revenue' : 'صافي الإيرادات ج.م'}
              </button>
              <button
                onClick={() => dataHook.setViewMetric('volume')}
                className={`px-3 py-1 ${dataHook.viewMetric === 'volume' ? 'bg-[#128d46] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {language === 'en' ? 'Qty Volume' : 'حجم المبيعات كميات'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <MultiSelect
            label={language === 'en' ? 'Company Segment' : 'قطاع الشركة'}
            options={dataHook.segmentsList}
            selected={dataHook.selectedSegments}
            onChange={dataHook.setSelectedSegments}
            placeholder={language === 'en' ? 'All Segments' : 'جميع القطاعات'}
            language={language}
            darkMode={darkMode}
          />
          <MultiSelect
            label={language === 'en' ? 'Item Group' : 'مجموعة الأصناف'}
            options={dataHook.itemGroupsList}
            selected={dataHook.selectedItemGroups}
            onChange={dataHook.setSelectedItemGroups}
            placeholder={language === 'en' ? 'All Groups' : 'جميع المجموعات'}
            language={language}
            darkMode={darkMode}
          />
          {(officeType === 'B2C' || officeType === 'Horeca Team') && (
            <MultiSelect
              label={language === 'en' ? 'Sales Office / Branch' : 'مكتب المبيعات / الفرع'}
              options={dataHook.officesList.filter(o => !['B2B', 'Pharma', 'Export', 'SME', 'Apex HQ', 'Sisters Companies', 'Digital Marketing'].includes(o))}
              selected={dataHook.selectedOffices}
              onChange={dataHook.setSelectedOffices}
              placeholder={language === 'en' ? 'All Offices' : 'جميع المكاتب'}
              language={language}
              darkMode={darkMode}
            />
          )}
          <MultiSelect
            label={language === 'en' ? 'Customer Account' : 'حساب العميل'}
            options={dataHook.customersList}
            selected={dataHook.selectedCustomers}
            onChange={dataHook.setSelectedCustomers}
            placeholder={language === 'en' ? 'All Accounts' : 'جميع الحسابات'}
            language={language}
            darkMode={darkMode}
          />
          {dataHook.showSalesmanSelector ? (
            <MultiSelect
              label={language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}
              options={dataHook.salesmenList}
              selected={dataHook.selectedSalesmen}
              onChange={dataHook.setSelectedSalesmen}
              placeholder={language === 'en' ? 'All Salesmen' : 'جميع المناديب'}
              language={language}
              darkMode={darkMode}
            />
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}</label>
              <div className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                {props.currentUser?.salesmanName}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Interactive Search' : 'البحث التفاعلي'}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={dataHook.searchTerm}
                onChange={(e) => dataHook.setSearchTerm(e.target.value)}
                placeholder={language === 'en' ? 'Search SKU or Customer...' : 'بحث عن منتج أو عميل...'}
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-slate-400'} outline-none`}
              />
            </div>
          </div>
        </div>
      </div>

      <KpiCards
        viewMetric={dataHook.viewMetric}
        language={language}
        darkMode={darkMode}
        chartsCombined={dataHook.chartsCombined}
        filteredData={dataHook.filteredData}
        officeType={officeType}
        pushToSellItems={pushToSellItems}
        formatVal={formatVal}
      />

      {officeType === 'B2C' && (
        <div className="space-y-3">
          <h4 className={`text-[10px] font-black uppercase tracking-wider text-indigo-500`}>
            {language === 'en' ? 'B2C Sales Offices / Branches Net Performance' : 'صافي أداء مكاتب / فروع مبيعات B2C'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'mt', name: 'Modern Trade', arabic: 'مبيعات التجزئة الحديثة', value: officeTotals['Modern Trade'], color: 'text-emerald-500' },
              { id: 'do', name: 'Dist. Office', arabic: 'مكتب التوزيع', value: officeTotals['Dist. Office'], color: 'text-indigo-500' },
              { id: 'lg', name: 'LG Office', arabic: 'مكتب LG', value: officeTotals['LG Office'], color: 'text-blue-500' },
              { id: 'ao', name: 'Alex Office', arabic: 'مكتب الإسكندرية', value: officeTotals['Alex Office'], color: 'text-amber-500' },
              { id: 'ec', name: 'E-Commerce', arabic: 'التجارة الإلكترونية', value: officeTotals['E-Commerce'], color: 'text-pink-500' },
              { id: 'b2c_other', name: 'B2C Others', arabic: 'أخرى B2C', value: officeTotals['B2C'], color: 'text-slate-500' }
            ].map(o => (
              <div key={o.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'en' ? o.name : o.arabic}
                </p>
                <h3 className={`text-sm font-black mt-1 ${o.color}`}>
                  {dataHook.viewMetric === 'revenue' 
                    ? formatVal(o.value)
                    : `${o.value.toLocaleString()} Qty`}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      <SalesCharts
        darkMode={darkMode}
        language={language}
        viewMetric={dataHook.viewMetric}
        activeUom={activeUom}
        timelineCompare={dataHook.comparisons.timeline}
        timelineCompareData={dataHook.timelineCompareData}
        getChartData={dataHook.getChartData}
        yearlyTotals={yearlyTotals}
        formatVal={formatVal}
      />

      {/* SKU Performance Section */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Boxes size={20} />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {language === 'en' ? 'SKU Monthly Performance (Time Series)' : 'الأداء الشهري لأصناف المنتجات عبر الوقت'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {activeProductsForPlot.length === 1
                  ? (language === 'en' ? `Showing monthly performance time-series for: ${activeProductsForPlot[0]}` : `عرض منحنى الأداء الشهري للصنف: ${activeProductsForPlot[0]}`)
                  : (language === 'en' ? `Monthly time-series breakdown across ${activeProductsForPlot.length} selected SKUs` : `عرض المنحنى الشهري وتطوره لـ ${activeProductsForPlot.length} أصناف`)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => dataHook.setProdPlotMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dataHook.prodPlotMetric === 'revenue'
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? 'Revenue (EGP)' : 'الإيرادات (ج.م)'}
              </button>
              <button
                type="button"
                onClick={() => dataHook.setProdPlotMetric('quantity')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dataHook.prodPlotMetric === 'quantity'
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? `Quantity (${activeUom})` : `الكميات (${activeUom})`}
              </button>
            </div>

            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => dataHook.setDisplayMode('count')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  dataHook.displayMode === 'count'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? 'Value' : 'القيمة'}
              </button>
              <button
                type="button"
                onClick={() => dataHook.setDisplayMode('percent')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  dataHook.displayMode === 'percent'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? '% Share' : 'النسبة ٪'}
              </button>
            </div>

            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              {(['combined', '2024', '2025', '2026'] as const).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => dataHook.setProdPlotYearTab(yr)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    dataHook.prodPlotYearTab === yr
                      ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm font-black'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {yr === 'combined' ? (language === 'en' ? 'All Years' : 'جميع السنوات') : yr}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={skuTimeSeriesData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis
                stroke={darkMode ? '#94a3b8' : '#64748b'}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (dataHook.displayMode === 'percent') return `${val}%`;
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return String(val);
                }}
              />
              <Tooltip
                formatter={(val: any, name?: any) => [
                  dataHook.displayMode === 'percent'
                    ? `${Number(val).toFixed(1)}%`
                    : `${Number(val).toLocaleString()} ${dataHook.prodPlotMetric === 'revenue' ? 'EGP' : activeUom}`,
                  name || ''
                ]}
                contentStyle={{
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: darkMode ? '#f8fafc' : '#0f172a'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              {activeProductsForPlot.map((skuName, idx) => (
                <Bar
                  key={skuName}
                  dataKey={skuName}
                  name={skuName}
                  stackId="a"
                  fill={COLORS[idx % COLORS.length]}
                  radius={idx === activeProductsForPlot.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={45}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${officeType !== 'B2C' ? 'lg:grid-cols-2' : ''} gap-6`}>
        {officeType !== 'B2C' && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {language === 'en' ? 'Segment Contribution' : 'مساهمة قطاعات الشركة'}
              </h3>
              <button
                onClick={() => segmentCompare.toggle()}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                  segmentCompare.enabled
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                    : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
              >
                📊 {language === 'en' ? 'Compare' : 'مقارنة'}
              </button>
            </div>

            {segmentCompare.enabled ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={segmentCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()} ${dataHook.viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="q1Value" name={segmentCompare.labels.base} fill="#128d46" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="q2Value" name={segmentCompare.labels.compare} fill="#e97025" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={dataHook.chartsCombined.segmentAllocation} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString()} ${dataHook.viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                    />
                    <Bar dataKey={dataHook.viewMetric === 'revenue' ? 'revenue' : 'value'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lost / Declining Tables */}
      <LostDecliningTables
        darkMode={darkMode}
        language={language}
        healthMatrix={healthMatrix}
      />

      {/* S&OP Tables (Push-to-Sell & Flight Risk) */}
      {officeType !== 'B2C' && (
        <SurplusFlightRiskTables
          darkMode={darkMode}
          language={language}
          pushToSellItems={pushToSellItems}
          flightRiskAlerts={flightRiskAlerts}
          pagedFlightAlerts={pagedFlightAlerts}
          flightRiskFilter={flightRiskFilter}
          setFlightRiskFilter={setFlightRiskFilter}
          flightRiskPage={flightRiskPage}
          setFlightRiskPage={setFlightRiskPage}
          totalFlightRiskPages={totalFlightRiskPages}
          filteredFlightAlerts={filteredFlightAlerts}
          showToast={showToast}
        />
      )}

      {/* Tables: Top customer accounts & materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isSpecificSeller 
              ? (dataHook.viewMetric === 'revenue' 
                  ? (language === 'en' ? 'All Accounts by Net Revenue' : 'جميع حسابات العملاء حسب صافي الإيرادات')
                  : (language === 'en' ? 'All Accounts by Sales Volume' : 'جميع حسابات العملاء حسب حجم المبيعات'))
              : (dataHook.viewMetric === 'revenue'
                  ? (language === 'en' ? 'Top 10 Accounts by Net Revenue' : 'أهم ١٠ حسابات عملاء حسب صافي الإيرادات')
                  : (language === 'en' ? 'Top 10 Accounts by Sales Volume' : 'أهم ١٠ حسابات عملاء حسب حجم المبيعات'))}
          </h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Customer Account' : 'حساب العميل'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Volume Qty' : 'حجم المبيعات كمية'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Net Revenue' : 'صافي الإيرادات'}</th>
                </tr>
              </thead>
              <tbody>
                {([...(isSpecificSeller ? dataHook.chartsCombined.topCustomers : dataHook.chartsCombined.topCustomers.slice(0, 10))]
                  .sort((a, b) => dataHook.viewMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume))
                  .map((c, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">
                        <div>{c.name}</div>
                        {c.customerCode && c.customerCode !== 'N/A' && (
                          <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                            Code: {c.customerCode}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">{c.volume.toLocaleString()}</td>
                      <td className="p-3 text-right font-extrabold text-[#128d46]">{formatVal(c.revenue)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isSpecificSeller 
              ? (dataHook.viewMetric === 'revenue'
                  ? (language === 'en' ? 'All Materials by Net Revenue' : 'جميع الأصناف حسب صافي الإيرادات')
                  : (language === 'en' ? 'All High-Velocity Materials' : 'جميع الأصناف سريعة الحركة'))
              : (dataHook.viewMetric === 'revenue'
                  ? (language === 'en' ? 'Top 10 Materials by Net Revenue' : 'أهم ١٠ أصناف حسب صافي الإيرادات')
                  : (language === 'en' ? 'Top 10 High-Velocity Materials' : 'أهم ١٠ أصناف سريعة الحركة'))}
          </h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف الصنف'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Volume Qty' : 'حجم المبيعات كمية'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Net Revenue' : 'صافي الإيرادات'}</th>
                </tr>
              </thead>
              <tbody>
                {([...(isSpecificSeller ? dataHook.chartsCombined.topProducts : dataHook.chartsCombined.topProducts.slice(0, 10))]
                  .sort((a, b) => dataHook.viewMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume))
                  .map((p, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">
                        <div>{p.name}</div>
                        {p.materialCode && p.materialCode !== 'N/A' && (
                          <span className="text-[10px] text-indigo-400 font-mono font-medium block">
                            Code: {p.materialCode} | UoM: {p.uom}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">{p.volume.toLocaleString()}</td>
                      <td className="p-3 text-right font-extrabold text-[#128d46]">{formatVal(p.revenue)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supply & Quality Risks: Product Concentration & Returns */}
      <div className={`grid gap-6 ${officeType === 'B2C' || officeType === 'Horeca Team' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {!(officeType === 'B2C' || officeType === 'Horeca Team') && (
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="mb-4">
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                <ShieldAlert size={16} className="text-indigo-500" />
                {language === 'en' ? 'Product Concentration Risk (Sold to <= 2 clients)' : 'مخاطر تركيز المنتجات (بيعت لعميلين أو أقل)'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'en' ? 'High volume lines dependent on very few customers, creating structural risks.' : 'أصناف كبيرة يعتمد سحبها على عملاء قليلين جداً، مما يخلق مخاطر هيكلية.'}
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                    <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                    <th className="p-3 text-right">{language === 'en' ? 'Clients Count' : 'عدد العملاء'}</th>
                    <th className="p-3 text-right">{language === 'en' ? 'Gross Qty' : 'إجمالي الكمية'}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHook.chartsCombined.riskMatrix.filter((p: any) => p.isHighRisk).map((p: any, idx: number) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">{p.name}</td>
                      <td className="p-3 text-right font-semibold text-rose-500">{p.customerCount}</td>
                      <td className="p-3 text-right font-semibold">{p.volume.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <AlertTriangle size={16} className="text-rose-500" />
              {language === 'en' ? 'Quality Spec & Return Rates Table' : 'جدول مطابقة الجودة ونسب المرتجعات'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en' ? 'Materials displaying high return rates (> 5%) with significant volume.' : 'المواد التي تظهر معدلات مرتجعات مرتفعة (> ٥٪) مع أحجام سحب كافية.'}
            </p>
          </div>

          <div className="overflow-y-auto max-h-[350px] rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Return Rate %' : 'معدل المرتجعات %'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Gross Qty' : 'إجمالي الكمية'}</th>
                </tr>
              </thead>
              <tbody>
                {dataHook.chartsCombined.highReturnItems.map((p: any, idx: number) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                    <td className="p-3 font-bold">{p.name}</td>
                    <td className="p-3 text-right font-extrabold text-rose-500">{p.returnRate.toFixed(1)}%</td>
                    <td className="p-3 text-right font-semibold">{p.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* B2C Branch & Category Strategic Matrix (B2C specific) */}
      {officeType === 'B2C' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                <Boxes size={16} className="text-indigo-500" />
                {language === 'en' ? 'B2C Branch & Category Strategic Matrix' : 'مصفوفة أداء مجموعات الأصناف حسب الفروع'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'en' 
                  ? 'Strategic breakdown of product category sales across physical offices and channels.' 
                  : 'التوزيع الاستراتيجي لمبيعات فئات المنتجات عبر مكاتب المبيعات والقنوات المختلفة.'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 no-print w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  type="text"
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  placeholder={language === 'en' ? 'Filter categories...' : 'تصفية الفئات...'}
                  className={`w-full pl-8 pr-3 py-1 rounded-lg border text-[10px] ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                  } outline-none focus:border-indigo-500`}
                />
              </div>

              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[9px] font-bold">
                <button
                  onClick={() => setMatrixViewMode('value')}
                  className={`px-2 py-1 ${matrixViewMode === 'value' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                >
                  {language === 'en' ? 'Absolute Values' : 'قيم مطلقة'}
                </button>
                <button
                  onClick={() => setMatrixViewMode('percent')}
                  className={`px-2 py-1 ${matrixViewMode === 'percent' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                >
                  {language === 'en' ? 'Percentages (%)' : 'نسب مئوية (%)'}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold text-[10px]`}>
                  <th className="p-3 whitespace-nowrap">{language === 'en' ? 'Item Group / Category' : 'مجموعة الأصناف'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'Modern Trade' : 'مبيعات التجزئة الحديثة'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'Alex Office' : 'مكتب الإسكندرية'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'Dist. Office' : 'مكتب التوزيع'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'LG Office' : 'مكتب LG'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'E-Commerce' : 'التجارة الإلكترونية'}</th>
                  <th className="p-3 text-right whitespace-nowrap">{language === 'en' ? 'B2C Others' : 'أخرى B2C'}</th>
                  <th className="p-3 text-right whitespace-nowrap bg-indigo-50/30 dark:bg-indigo-950/20 font-black">{language === 'en' ? 'Total' : 'الإجمالي'}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredRows = matrixData.rows.filter(r => 
                    r.groupName.toLowerCase().includes(matrixSearch.toLowerCase())
                  );

                  if (filteredRows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 font-semibold">
                          {language === 'en' ? 'No matching categories found.' : 'لم يتم العثور على فئات مطابقة.'}
                        </td>
                      </tr>
                    );
                  }

                  return filteredRows.map((row, idx) => {
                    const totalVal = row.sums.Total || 1;
                    return (
                      <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                        <td className="p-3 font-bold whitespace-nowrap">{row.groupName}</td>
                        {['Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce', 'B2C'].map(offKey => {
                          const val = row.sums[offKey] || 0;
                          const pct = (val / totalVal) * 100;
                          return (
                            <td key={offKey} className="p-3 text-right">
                              {matrixViewMode === 'value' ? (
                                <>
                                  <span className="font-semibold block">{dataHook.viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                                  <span className="text-[9px] text-slate-400 block">{pct.toFixed(1)}%</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-indigo-500 block">{pct.toFixed(1)}%</span>
                                  <span className="text-[9px] text-slate-400 block">{dataHook.viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                                </>
                              )}
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1 max-w-[80px] ml-auto">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full" 
                                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 text-right bg-indigo-50/20 dark:bg-indigo-950/10 font-bold">
                          <span className="block">{dataHook.viewMetric === 'revenue' ? formatVal(row.sums.Total) : `${row.sums.Total.toLocaleString()} Qty`}</span>
                          <span className="text-[9px] text-slate-400 block">100%</span>
                        </td>
                      </tr>
                    );
                  });
                })()}
                
                {matrixData.rows.length > 0 && (
                  <tr className={`${darkMode ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-100/60 text-slate-800'} font-black text-[11px]`}>
                    <td className="p-3 uppercase">{language === 'en' ? 'Grand Total' : 'الإجمالي الكلي'}</td>
                    {['Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce', 'B2C'].map(offKey => {
                      const val = matrixData.officeTotals[offKey] || 0;
                      const grand = matrixData.grandTotal || 1;
                      const pct = (val / grand) * 100;
                      return (
                        <td key={offKey} className="p-3 text-right">
                          <span className="block">{dataHook.viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                          <span className="text-[9px] text-slate-400 block">{pct.toFixed(1)}% of B2C</span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right bg-indigo-100/30 dark:bg-indigo-950/30 font-black">
                      <span className="block">{dataHook.viewMetric === 'revenue' ? formatVal(matrixData.grandTotal) : `${matrixData.grandTotal.toLocaleString()} Qty`}</span>
                      <span className="text-[9px] text-slate-400 block">100%</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analyst Briefing Panel */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <h3 className={`text-xs font-black uppercase tracking-wider border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-3 mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          <span className="w-2 h-4 bg-[#128d46] rounded" />
          {language === 'en' ? 'Executive Briefing' : 'ملخص المدير التنفيذي'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-[#128d46]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#128d46]" />
              {language === 'en' ? 'I. Performance & Volume Momentum' : 'أولاً. أداء وحجم المبيعات'}
            </h4>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {executiveBriefing.momentum}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {language === 'en' ? 'II. Churn & Logistics Risks' : 'ثانياً. مخاطر التراجع والشحن اللوجستي'}
            </h4>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {executiveBriefing.retention}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {language === 'en' ? 'III. Supply Vulnerabilities' : 'ثالثاً. مخاطر التوريد والتركز'}
            </h4>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {executiveBriefing.concentration}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CustomerMaterialTable 
          processedData={processedData} 
          language={language} 
          darkMode={darkMode} 
        />
      </div>
    </div>
  );
}

export default React.memo(SalesDirectorView);
export { SalesDirectorView };
