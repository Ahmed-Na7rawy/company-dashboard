import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, BarChart
} from 'recharts';
import CustomerMaterialTable from './CustomerMaterialTable';
import type { ProcessedRow } from './CustomerMaterialTable';
import { CustomTooltip } from './CustomTooltip';
import {
  Activity, Percent, ShieldAlert, Award,
  BriefcaseBusiness, FileSearch, Megaphone, BarChart3, Brain, ChevronRight, Flame
} from 'lucide-react';
import opportunityAlerts from '../data/opportunity_alerts.json';
import Plotly from 'plotly.js-dist-min';
import { useScaleMode } from '../hooks/useScaleMode';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  language: 'en' | 'ar';
  darkMode: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder,
  language,
  darkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const displayLabel = () => {
    if (selected.length === 0) return language === 'en' ? 'All Selected' : 'الكل محدد';
    if (selected.length === options.length) return language === 'en' ? 'All Selected' : 'الكل محدد';
    return language === 'en'
      ? `${selected.length} Selected`
      : `تم تحديد ${selected.length}`;
  };

  return (
    <div ref={dropdownRef} className="relative space-y-1 w-full text-left">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex justify-between items-center text-left ${darkMode
            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700/50'
            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100/50'
          }`}
      >
        <span>{selected.length === 0 ? placeholder : displayLabel()}</span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-50 mt-1 w-full min-w-[200px] rounded-xl border p-2 shadow-lg max-h-60 overflow-y-auto ${darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-300 text-slate-700'
            }`}
        >
          {/* Quick Controls */}
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200/20 text-[9px] font-bold">
            <button
              type="button"
              onClick={selectAll}
              className="text-[#128d46] hover:underline"
            >
              {language === 'en' ? 'Select All' : 'تحديد الكل'}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-rose-500 hover:underline"
            >
              {language === 'en' ? 'Clear All' : 'إلغاء التحديد'}
            </button>
          </div>

          {/* Search Input */}
          {options.length > 5 && (
            <input
              type="text"
              placeholder={language === 'en' ? 'Search...' : 'بحث...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full px-2 py-1 mb-2 rounded border text-[11px] focus:outline-none ${darkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
            />
          )}

          {/* Options List */}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {filteredOptions.map(opt => {
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[11px] hover:bg-slate-500/10 ${isChecked ? 'font-bold text-[#128d46]' : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOption(opt)}
                    className="rounded border-slate-300 text-[#128d46] focus:ring-[#128d46] w-3.5 h-3.5"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="text-[10px] text-center text-slate-400 py-1">
                {language === 'en' ? 'No options found' : 'لم يتم العثور على خيارات'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CeoViewProps {
  processedData: ProcessedRow[];
  language: 'en' | 'ar';
  darkMode: boolean;
  t?: (key: string) => string;
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  inflationRate?: number;
  customsDelay?: number;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  chartDisplayMode: 'count' | 'percent';
  globalChartMetric?: 'revenue' | 'volume';
  globalCompareMode?: boolean;
}

function CeoView({
  processedData,
  language,
  darkMode,
  adminSettings,
  inflationRate,
  customsDelay,
  currentUser,
  chartDisplayMode,
  globalChartMetric = 'revenue',
  globalCompareMode = false
}: CeoViewProps) {
  const scaleMode = useScaleMode();

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

  // Sales office / Channel filter state (restricted users are locked to their own channel)
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
  const [timelineCompare, setTimelineCompare] = useState(false);
  const [tq1Year, setTq1Year] = useState(2026);
  const [tq1Num, setTq1Num] = useState(1);
  const [tq2Year, setTq2Year] = useState(2026);
  const [tq2Num, setTq2Num] = useState(2);

  // Quarter Comparison State for Segments Chart
  const [segmentCompare, setSegmentCompare] = useState(false);
  const [sq1Year, setSq1Year] = useState(2026);
  const [sq1Num, setSq1Num] = useState(1);
  const [sq2Year, setSq2Year] = useState(2026);
  const [sq2Num, setSq2Num] = useState(2);

  // 0. Filter Lists Derived from raw data
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

  // Selected Filter States (choices can be multiple)
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

  // 1. Calculations
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

    // Margins weighted calculation
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

  // 1b. Sparkline Data (Last 6 Months History)
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
      .slice(-6); // Last 6 months for sparkline

    return {
      revenue: sortedBuckets.map(b => ({ value: b.revenue })),
      margin: sortedBuckets.map(b => ({ value: b.margin })),
      accounts: sortedBuckets.map(b => ({ value: b.accounts })),
      returns: sortedBuckets.map(b => ({ value: b.returns }))
    };
  }, [filteredData, adminSettings, inflationRate]);

  // 2. Timeline Data (Historical Sales & Returns Timeline)
  const timelineData = useMemo(() => {
    const monthlyBuckets: Record<string, { grossVol: number; returnsVol: number; grossRev: number; returnsRev: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    filteredData.forEach(row => {
      const date = new Date(row.Date);
      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;

      if (!monthlyBuckets[bucket]) {
        monthlyBuckets[bucket] = { grossVol: 0, returnsVol: 0, grossRev: 0, returnsRev: 0 };
      }

      const rev = Math.abs(row.Revenue || 0);
      if (row.IsReturn) {
        monthlyBuckets[bucket].returnsVol += row.Volume * (adminSettings.returnRateModifier / 8);
        monthlyBuckets[bucket].returnsRev += rev * (adminSettings.returnRateModifier / 8);
      } else {
        monthlyBuckets[bucket].grossVol += row.Volume;
        monthlyBuckets[bucket].grossRev += rev;
      }
    });

    return Object.entries(monthlyBuckets)
      .map(([month, val]) => ({
        month,
        grossVol: Math.round(val.grossVol),
        returnsVol: Math.round(val.returnsVol),
        netVol: Math.round(Math.max(0, val.grossVol - val.returnsVol)),
        grossRev: Math.round(val.grossRev),
        returnsRev: Math.round(val.returnsRev),
        netRev: Math.round(Math.max(0, val.grossRev - val.returnsRev))
      }))
      .slice(-10); // Show last 10 operational months
  }, [filteredData, adminSettings.returnRateModifier]);

  const timelineCompareData = useMemo(() => {
    if (!timelineCompare) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const getQuarterData = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const aggregated = [0, 0, 0]; // Month 1, Month 2, Month 3

      filteredData.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj.getFullYear() === year) {
          const m = dateObj.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const idx = m - startMonth;
            const rev = Math.abs(row.Revenue || 0);
            const value = chartMetric === 'revenue'
              ? (row.IsReturn ? -rev * (adminSettings.returnRateModifier / 8) : rev)
              : (row.IsReturn ? -row.Volume * (adminSettings.returnRateModifier / 8) : row.Volume);
            aggregated[idx] += value;
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
        q1Value: Math.round(q1Vals[idx]),
        q2Value: Math.round(q2Vals[idx]),
      };
    });
  }, [filteredData, timelineCompare, tq1Year, tq1Num, tq2Year, tq2Num, chartMetric, adminSettings, language]);

  const segmentCompareData = useMemo(() => {
    if (!segmentCompare) return [];

    const getQuarterSegments = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const sums: Record<string, number> = { 'Bio': 0, 'Solutions': 0, 'Additives': 0 };

      filteredData.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj.getFullYear() === year) {
          const m = dateObj.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const seg = row.Segment || 'Solutions';
            if (sums[seg] !== undefined) {
              sums[seg] += row.IsReturn ? -row.Volume : row.Volume;
            }
          }
        }
      });
      return sums;
    };

    const q1Sums = getQuarterSegments(sq1Year, sq1Num);
    const q2Sums = getQuarterSegments(sq2Year, sq2Num);

    return [
      {
        name: language === 'en' ? 'Bio' : 'المنتجات الحيوية',
        q1Value: Math.round(q1Sums['Bio']),
        q2Value: Math.round(q2Sums['Bio'])
      },
      {
        name: language === 'en' ? 'Solutions' : 'الحلول',
        q1Value: Math.round(q1Sums['Solutions']),
        q2Value: Math.round(q2Sums['Solutions'])
      },
      {
        name: language === 'en' ? 'Additives' : 'الإضافات',
        q1Value: Math.round(q1Sums['Additives']),
        q2Value: Math.round(q2Sums['Additives'])
      }
    ];
  }, [filteredData, segmentCompare, sq1Year, sq1Num, sq2Year, sq2Num, language]);

  // 3. Pie Chart: Segment share
  const segmentData = useMemo(() => {
    const segs: Record<string, number> = {};
    filteredData.forEach(row => {
      if (row.Segment && !row.IsReturn) {
        const val = chartMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
        segs[row.Segment] = (segs[row.Segment] || 0) + val;
      }
    });

    const COLORS = ['#128d46', '#191342', '#e97025'];
    const rawList = Object.entries(segs).map(([name, value], idx) => ({
      name: language === 'en' ? name : (name === 'Additives' ? 'الإضافات الغذائية' : name === 'Solutions' ? 'الحلول الغذائية' : 'المنتجات الحيوية'),
      value: Math.round(value),
      color: COLORS[idx % COLORS.length]
    }));

    if (chartDisplayMode === 'percent') {
      const total = rawList.reduce((acc, curr) => acc + curr.value, 0);
      return rawList.map(item => ({
        ...item,
        value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
      }));
    }

    return rawList;
  }, [filteredData, language, chartMetric, chartDisplayMode]);

  const flowVisualizer = useMemo(() => {
    const channels = ['B2B', 'B2C', 'Horeca Team'];
    const groupTotals: Record<string, number> = {};
    filteredData.forEach(row => {
      if (!row.IsReturn) {
        const grp = row.ItemGroup || 'Other';
        groupTotals[grp] = (groupTotals[grp] || 0) + row.Volume;
      }
    });
    const topGroups = Object.entries(groupTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    const flows: { source: string; target: string; value: number }[] = [];
    filteredData.forEach(row => {
      if (!row.IsReturn) {
        const rawCh = row.SalesOffice || 'B2B';
        const ch = channels.includes(rawCh) ? rawCh : 'B2B';
        const grp = row.ItemGroup || 'Other';
        if (topGroups.includes(grp)) {
          const existing = flows.find(f => f.source === ch && f.target === grp);
          if (existing) {
            existing.value += row.Volume;
          } else {
            flows.push({ source: ch, target: grp, value: row.Volume });
          }
        }
      }
    });

    const totalFlow = flows.reduce((sum, f) => sum + f.value, 0) || 1;

    const leftNodes = channels.map((ch, idx) => {
      const chFlow = flows.filter(f => f.source === ch).reduce((sum, f) => sum + f.value, 0);
      return { id: ch, label: ch, value: chFlow, y: 30 + idx * 80 };
    });

    const rightNodes = topGroups.map((grp, idx) => {
      const grpFlow = flows.filter(f => f.target === grp).reduce((sum, f) => sum + f.value, 0);
      return { id: grp, label: grp, value: grpFlow, y: 15 + idx * 52 };
    });

    const paths = flows.map(f => {
      const sourceNode = leftNodes.find(n => n.id === f.source);
      const targetNode = rightNodes.find(n => n.id === f.target);
      if (!sourceNode || !targetNode) return null;

      const strokeWidth = Math.max(1.5, (f.value / totalFlow) * 60);
      const x1 = 120;
      const y1 = sourceNode.y + 15;
      const x2 = 380;
      const y2 = targetNode.y + 15;
      const pathD = `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;

      return {
        id: `${f.source}-${f.target}`,
        d: pathD,
        strokeWidth,
        source: f.source,
        target: f.target,
        value: f.value
      };
    }).filter(Boolean);

    return { leftNodes, rightNodes, paths };
  }, [filteredData]);

  const formatM = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions'
      ? (language === 'ar' ? 'مليون' : 'M')
      : (language === 'ar' ? 'ألف' : 'K');
    const rounded = Math.round(val / factor);
    return `${rounded} ${suffix}`;
  };

  const formatQty = (qty: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions'
      ? (language === 'ar' ? 'مليون' : 'M')
      : (language === 'ar' ? 'ألف' : 'K');
    const rounded = Math.round(qty / factor);
    return `${rounded} ${suffix}`;
  };

  const sankeyChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sankeyChartRef.current) return;

    const leftLabels = flowVisualizer.leftNodes.map(n => n.label);
    const rightLabels = flowVisualizer.rightNodes.map(n => n.label);
    const allLabels = [...leftLabels, ...rightLabels];

    const sourceIndices: number[] = [];
    const targetIndices: number[] = [];
    const flowValues: number[] = [];

    flowVisualizer.paths.forEach((p: { id: string; d: string; strokeWidth: number; source: string; target: string; value: number } | null) => {
      if (!p) return;
      const srcIdx = allLabels.indexOf(p.source);
      const tgtIdx = allLabels.indexOf(p.target);
      if (srcIdx !== -1 && tgtIdx !== -1) {
        sourceIndices.push(srcIdx);
        targetIndices.push(tgtIdx);
        flowValues.push(p.value);
      }
    });

    const data = [
      {
        type: 'sankey',
        orientation: 'h',
        node: {
          pad: 15,
          thickness: 18,
          line: { color: darkMode ? '#334155' : '#cbd5e1', width: 1 },
          label: allLabels,
          color: allLabels.map((_, idx) => idx < leftLabels.length ? '#10b981' : '#0284c7'),
          font: { color: darkMode ? '#f8fafc' : '#0f172a', size: 9, family: 'Outfit, sans-serif' }
        },
        link: {
          source: sourceIndices,
          target: targetIndices,
          value: flowValues,
          color: darkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)'
        }
      }
    ];

    const layout = {
      margin: { t: 15, r: 15, b: 15, l: 15 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent'
    };

    if (Plotly && Plotly.react) {
      Plotly.react(sankeyChartRef.current, data, layout, { responsive: true, displayModeBar: false });
    }
  }, [flowVisualizer, darkMode]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          {language === 'en' ? 'CEO Command Perspective' : 'منظور المدير التنفيذي الاستراتيجي'}
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
          {language === 'en'
            ? 'Access global synergy metrics, corporate growth, total risk exposures, and strategic recommendations.'
            : 'الاطلاع على مؤشرات التآزر الشاملة، النمو النموذجي، إجمالي المخاطر المعرضة، والتوصيات الاستراتيجية.'}
        </p>
      </div>

      {/* Strategic Filters Panel */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-200/10">
          <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            🛡️ {language === 'en' ? 'Strategic Command Filters' : 'فلاتر القيادة الاستراتيجية'}
          </h3>
          <button
            onClick={() => {
              setSelectedChannels([]);
              setSelectedSegments([]);
              setSelectedItemGroups([]);
              setSelectedSalesmen([]);
            }}
            className="text-[10px] font-bold text-rose-500 hover:underline"
          >
            {language === 'en' ? 'Reset Filters' : 'إعادة ضبط الفلاتر'}
          </button>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${isOfficeLocked ? '3' : '4'} gap-4`}>
          {/* Sales Channel Filter */}
          {!isOfficeLocked && (
            <MultiSelect
              label={language === 'en' ? 'Sales Channel' : 'القناة البيعية'}
              options={channelsList}
              selected={selectedChannels}
              onChange={setSelectedChannels}
              placeholder={language === 'en' ? 'All Channels' : 'جميع القنوات'}
              language={language}
              darkMode={darkMode}
            />
          )}

          {/* Segment Filter */}
          <MultiSelect
            label={language === 'en' ? 'Company Segment' : 'قطاع الشركة'}
            options={segmentsList}
            selected={selectedSegments}
            onChange={setSelectedSegments}
            placeholder={language === 'en' ? 'All Segments' : 'جميع القطاعات'}
            language={language}
            darkMode={darkMode}
          />

          {/* Item Group Filter */}
          <MultiSelect
            label={language === 'en' ? 'Item Group' : 'مجموعة الأصناف'}
            options={itemGroupsList}
            selected={selectedItemGroups}
            onChange={setSelectedItemGroups}
            placeholder={language === 'en' ? 'All Groups' : 'جميع المجموعات'}
            language={language}
            darkMode={darkMode}
          />

          {/* Salesman Filter */}
          <MultiSelect
            label={language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}
            options={salesmenList}
            selected={selectedSalesmen}
            onChange={setSelectedSalesmen}
            placeholder={language === 'en' ? 'All Salesmen' : 'جميع المناديب'}
            language={language}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="space-y-1.5 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'en' ? 'Global Net Revenue' : 'صافي الإيرادات الشاملة'}
            </p>
            <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              EGP {formatM(metrics.netRevenue)}
            </h3>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              {language === 'en' ? 'Vol: ' : 'الحجم: '}{formatQty(metrics.netQty)} {language === 'en' ? 'Units' : 'وحدة'}
            </p>
          </div>

          <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={sparklineData.revenue}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#128d46"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-xl shadow-inner">
            <Activity size={18} />
          </div>
        </div>

        {/* Global Margin */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="space-y-1.5 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'en' ? 'Global Margin %' : 'هامش الربح الإجمالي'}
            </p>
            <h3 className="text-xl font-black text-[#128d46]">
              {metrics.margin}%
            </h3>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              {language === 'en' ? 'Weighted Avg' : 'المتوسط المرجح'}
            </p>
          </div>

          <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={sparklineData.margin}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#128d46"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-xl">
            <Percent size={18} />
          </div>
        </div>

        {/* Customer Count */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="space-y-1.5 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'en' ? 'Active Accounts' : 'حسابات العملاء النشطة'}
            </p>
            <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {metrics.activeCustomers}
            </h3>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              {language === 'en' ? 'B2B Customers' : 'عملاء قطاع الأعمال'}
            </p>
          </div>

          <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={sparklineData.accounts}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Award size={18} />
          </div>
        </div>

        {/* Return Rate */}
        <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] flex justify-between items-center ${darkMode ? 'bg-slate-800/40 border-slate-700/55 shadow-md shadow-slate-950/20' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="space-y-1.5 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'en' ? 'Logistics Return Rate' : 'معدل المرتجعات اللوجستية'}
            </p>
            <h3 className={`text-xl font-black ${metrics.returnRate > 5 ? 'text-rose-500' : 'text-amber-500'}`}>
              {metrics.returnRate}%
            </h3>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              {metrics.returnRate > 5 ? (language === 'en' ? 'Attention required' : 'مطلوب مراجعة') : (language === 'en' ? 'Acceptable' : 'معدل مقبول')}
            </p>
          </div>

          <div className="w-16 h-8 mx-2 overflow-visible hidden sm:block">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={sparklineData.returns}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={metrics.returnRate > 5 ? '#f43f5e' : '#f59e0b'}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`p-2 rounded-xl ${metrics.returnRate > 5 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      {/* Main Charts: Net Sales vs Returns and Segment share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Historical Sales & Returns Timeline' : 'الجدول الزمني التاريخي للمبيعات والمرتجعات'}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTimelineCompare(!timelineCompare)}
                className={`px-3 py-1 rounded-lg transition-all text-[10px] font-bold border ${timelineCompare
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                    : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500 dark:hover:text-slate-200'
                  }`}
              >
                📊 {language === 'en' ? 'Compare Quarters' : 'مقارنة ربع سنوية'}
              </button>
              <div className="flex border border-slate-200 dark:border-slate-800/60 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartMetric === 'revenue'
                      ? (darkMode ? 'bg-[#191342] text-white shadow' : 'bg-white text-[#191342] shadow border border-slate-200/60')
                      : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-200'
                    }`}
                >
                  {language === 'en' ? 'Net Revenue (EGP)' : 'صافي الإيرادات (جنيه)'}
                </button>
                <button
                  onClick={() => setChartMetric('volume')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartMetric === 'volume'
                      ? (darkMode ? 'bg-[#191342] text-white shadow' : 'bg-white text-[#191342] shadow border border-slate-200/60')
                      : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-200'
                    }`}
                >
                  {language === 'en' ? 'Sales Volume (Qty)' : 'حجم المبيعات (كمية)'}
                </button>
              </div>
            </div>
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              {timelineCompare ? (
                <BarChart
                  data={timelineCompareData}
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
                    tickFormatter={(val) => {
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      const labelSuffix = chartMetric === 'revenue' ? ' EGP' : ` ${language === 'en' ? 'Units' : 'وحدة'}`;
                      return [`${Math.round(num / factor)}${suffix}${labelSuffix}`, ''];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="q1Value"
                    name={language === 'en' ? `Base: Q${tq1Num} ${tq1Year}` : `الأساس: ربع ${tq1Num} ${tq1Year}`}
                    fill="#128d46"
                    radius={[3, 3, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="q2Value"
                    name={language === 'en' ? `Compare: Q${tq2Num} ${tq2Year}` : `المقارن: ربع ${tq2Num} ${tq2Year}`}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              ) : (
                <ComposedChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={darkMode ? '#334155' : '#cbd5e1'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={darkMode ? '#334155' : '#cbd5e1'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    tickFormatter={(val) => {
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      const labelSuffix = chartMetric === 'revenue' ? ' EGP' : ` ${language === 'en' ? 'Units' : 'وحدة'}`;
                      return [`${Math.round(num / factor)}${suffix}${labelSuffix}`, ''];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey={chartMetric === 'revenue' ? 'grossRev' : 'grossVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Gross Revenue' : 'Gross Volume') : (chartMetric === 'revenue' ? 'إجمالي الإيرادات' : 'إجمالي الحجم')}
                    fill="url(#colorGross)"
                    stroke={darkMode ? '#475569' : '#cbd5e1'}
                  />
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'returnsRev' : 'returnsVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Returns Value' : 'Returns Volume') : (chartMetric === 'revenue' ? 'قيمة المرتجعات' : 'حجم المرتجعات')}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                    barSize={12}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric === 'revenue' ? 'netRev' : 'netVol'}
                    name={language === 'en' ? (chartMetric === 'revenue' ? 'Net Revenue' : 'Net Volume') : (chartMetric === 'revenue' ? 'صافي الإيرادات' : 'صافي الحجم')}
                    stroke="#128d46"
                    strokeWidth={3}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Unit Share */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Business Unit Volume Share' : 'حصة حجم مبيعات قطاعات الشركة'}
            </h3>
            <button
              onClick={() => setSegmentCompare(!segmentCompare)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${segmentCompare
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
            >
              📊 {language === 'en' ? 'Compare' : 'مقارنة'}
            </button>
          </div>

          {segmentCompare && (
            <div className="flex flex-col gap-2 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[9px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Base:' : 'الأساس:'}
                </span>
                <div className="flex gap-1">
                  <select
                    value={sq1Num}
                    onChange={(e) => setSq1Num(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={sq1Year}
                    onChange={(e) => setSq1Year(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={2022}>2022</option>
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[9px] uppercase text-slate-400 font-bold">
                  {language === 'en' ? 'Compare:' : 'المقارن:'}
                </span>
                <div className="flex gap-1">
                  <select
                    value={sq2Num}
                    onChange={(e) => setSq2Num(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={sq2Year}
                    onChange={(e) => setSq2Year(Number(e.target.value))}
                    className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  >
                    <option value={2022}>2022</option>
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="h-64 flex flex-col justify-center items-center">
            {segmentCompare ? (
              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                <BarChart data={segmentCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                  <YAxis
                    stroke={darkMode ? '#94a3b8' : '#64748b'}
                    fontSize={9}
                    tickFormatter={(val) => {
                      if (chartDisplayMode === 'percent') return `${val}%`;
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return `${Math.round(val / factor)}${suffix}`;
                    }}
                  />
                  <Tooltip content={<CustomTooltip darkMode={darkMode} />}
                    formatter={(val: unknown) => {
                      if (typeof val !== 'number') return ['', ''];
                      if (chartDisplayMode === 'percent') return [`${val}%`, ''];
                      const num = Number(val);
                      const factor = scaleMode === 'millions' ? 1000000 : 1000;
                      const suffix = scaleMode === 'millions' ? 'M' : 'K';
                      return [`${Math.round(num / factor)}${suffix} ${language === 'en' ? 'Units' : 'وحدة'}`, ''];
                    }}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="q1Value" name={language === 'en' ? `Base: Q${sq1Num} ${sq1Year}` : `الأساس: ربع ${sq1Num} ${sq1Year}`} fill="#128d46" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="q2Value" name={language === 'en' ? `Compare: Q${sq2Num} ${sq2Year}` : `المقارن: ربع ${sq2Num} ${sq2Year}`} fill="#e97025" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip darkMode={darkMode} />}
                      formatter={(val: unknown) => {
                        if (typeof val !== 'number') return ['', ''];
                        if (chartDisplayMode === 'percent') {
                          const total = segmentData.reduce((acc, curr) => acc + curr.value, 0);
                          const pct = total > 0 ? ((Number(val) / total) * 100).toFixed(1) : '0.0';
                          return [`${pct}%`, language === 'en' ? 'Share' : 'الحصة'];
                        }
                        const factor = scaleMode === 'millions' ? 1000000 : 1000;
                        const suffix = scaleMode === 'millions' ? 'M' : 'K';
                        return [`${Math.round(Number(val) / factor)}${suffix} ${language === 'en' ? 'Units' : 'وحدة'}`, ''];
                      }}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] font-bold">
                  {segmentData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Segment Flow Visualizer (Sankey Flow) */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm premium-card mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Revenue Source-to-Product Group Flow (Sankey)' : 'تدفق الإيرادات من قنوات البيع إلى مجموعات المنتجات'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en'
                ? 'Visualizes active sales value flowing from Sales Channels to top Product categories. Width of bezier curves indicates flow volume.'
                : 'توضيح قيم المبيعات النشطة المتدفقة من قنوات البيع إلى مجموعات المنتجات الرئيسية. عرض الخط يمثل حجم التدفق.'}
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center py-4 bg-transparent rounded-xl">
          <div className="w-full max-w-lg h-72">
            <div ref={sankeyChartRef} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Customer material spending matrix page */}
      <CustomerMaterialTable
        processedData={filteredData}
        language={language}
        darkMode={darkMode}
      />

      {/* ── AI Growth & Cross-Selling Opportunity Radar ── FULL WIDTH */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>

        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-4 mb-5`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Brain size={18} className="text-emerald-500" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {language === 'en' ? 'AI Growth & Cross-Selling Opportunity Radar' : 'رادار الفرص ومؤشرات النمو الذكي'}
              </h3>
              <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en'
                  ? `${opportunityAlerts.length} active intelligence signals · Powered by Apex AI Engine`
                  : `${opportunityAlerts.length} إشارة استخباراتية نشطة · مدعوم بمحرك الذكاء الاصطناعي Apex`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/20">
              ● {language === 'en' ? 'Live Signals' : 'إشارات حية'}
            </span>
            <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border ${darkMode ? 'border-slate-700 text-slate-400 bg-slate-900/40' : 'border-slate-200 text-slate-500 bg-slate-50'
              }`}>
              {language === 'en' ? 'Updated: Today' : 'آخر تحديث: اليوم'}
            </span>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: language === 'en' ? 'High Priority' : 'أولوية عالية',
              value: opportunityAlerts.filter((a: { priority?: string; status?: string }) => a.priority === 'High' || a.status === 'Urgent').length,
              color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20'
            },
            {
              label: language === 'en' ? 'Medium Priority' : 'أولوية متوسطة',
              value: opportunityAlerts.filter((a: { priority?: string }) => a.priority === 'Medium').length,
              color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20'
            },
            {
              label: language === 'en' ? 'Total Est. Value' : 'إجمالي القيمة المتوقعة',
              value: `EGP ${(totalEstValue / 1000000).toFixed(1)}M`,
              color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20'
            },
            {
              label: language === 'en' ? 'Avg. Confidence' : 'متوسط الثقة',
              value: `${Math.round(opportunityAlerts.reduce((s: number, a: { confidence: number }) => s + a.confidence, 0) / opportunityAlerts.length)}%`,
              color: 'text-indigo-500', bg: 'bg-indigo-500/10 border-indigo-500/20'
            }
          ].map((stat, i) => (
            <div key={i} className={`p-3 rounded-xl border ${stat.bg} ${darkMode ? 'border-opacity-30' : ''}`}>
              <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className={`flex gap-1 mb-5 p-1 rounded-xl border w-fit ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
          {([
            { key: 'all', label: language === 'en' ? 'All Signals' : 'الكل' },
            { key: 'high', label: language === 'en' ? 'High Priority' : 'أولوية عالية' },
            { key: 'hiring', label: language === 'en' ? 'Hiring Signals' : 'توظيف' },
            { key: 'market', label: language === 'en' ? 'Market Intel' : 'استخبارات السوق' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setRadarTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${radarTab === tab.key
                  ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-[#191342] text-white shadow')
                  : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Signal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {opportunityAlerts
            .filter((alert: { priority?: string; status?: string; sourceType?: string }) => {
              if (radarTab === 'high') return alert.priority === 'High' || alert.status === 'Urgent';
              if (radarTab === 'hiring') return alert.sourceType === 'hiring';
              if (radarTab === 'market') return alert.sourceType === 'market' || alert.sourceType === 'announcement' || alert.sourceType === 'tender';
              return true;
            })
            .map((alert: { priority?: string; status?: string; sourceType?: string; id?: number; company?: string; title?: string; desc?: string; suggestedProducts?: string[]; estimatedValue?: string; confidence?: number; date?: string }) => {
              const priorityConfig: Record<string, { color: string; bg: string; dot: string }> = {
                High: { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' },
                Medium: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-500' },
                Low: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/25', dot: 'bg-slate-400' },
              };
              const urgentConfig = { color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' };
              const pc = alert.status === 'Urgent' ? urgentConfig : (priorityConfig[alert.priority || 'Low'] || priorityConfig['Low']);

              const sourceIconMap: Record<string, { icon: React.ComponentType<{ size?: number }>; label: string; style: string }> = {
                hiring: { icon: BriefcaseBusiness, label: 'Career Board', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
                announcement: { icon: Megaphone, label: 'PR News Feed', style: 'bg-amber-500/10 text-amber-500 border-amber-500/25' },
                market: { icon: BarChart3, label: 'Industry Report', style: 'bg-purple-500/10 text-purple-400 border-purple-500/25' },
                tender: { icon: FileSearch, label: 'Ministry Tender', style: 'bg-rose-500/10 text-rose-400 border-rose-500/25' },
              };
              const srcKey = alert.sourceType || 'market';
              const src = sourceIconMap[srcKey] || sourceIconMap['market'];
              const SrcIcon = src.icon;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${darkMode
                      ? 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Source badge */}
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold rounded-md border ${src.style}`}>
                        <SrcIcon size={9} />{src.label}
                      </span>
                      {/* Urgent badge */}
                      {alert.status === 'Urgent' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-[8px] font-black rounded-md bg-rose-500 text-white animate-pulse">
                          <Flame size={8} /> URGENT
                        </span>
                      )}
                    </div>
                    {/* Priority pill */}
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[8px] font-black rounded-full border ${pc.bg} ${pc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                      {alert.priority}
                    </span>
                  </div>

                  {/* Company + Title */}
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {alert.company}
                    </p>
                    <h4 className={`text-xs font-bold leading-snug ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {alert.title}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {alert.desc}
                  </p>

                  {/* Suggested Products */}
                  <div className="flex flex-wrap gap-1.5">
                    {alert.suggestedProducts?.map((product: string, pi: number) => (
                      <span key={pi} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-bold">
                        {product}
                      </span>
                    ))}
                  </div>

                  {/* Footer: Est. Value + Confidence + Date */}
                  <div className={`flex justify-between items-center pt-2 border-t ${darkMode ? 'border-slate-700/60' : 'border-slate-200'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className={`text-[8px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {language === 'en' ? 'Est. Value' : 'القيمة المتوقعة'}
                        </p>
                        <p className={`text-[10px] font-black ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                          {alert.estimatedValue}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[8px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {language === 'en' ? 'AI Confidence' : 'ثقة الذكاء'}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className={`w-16 h-1.5 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${alert.confidence}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-500">{alert.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-[8px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{alert.date}</p>
                      <button
                        className="flex items-center gap-0.5 text-[9px] font-black text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-wider mt-0.5"
                      >
                        {language === 'en' ? 'Pitch' : 'عرض'} <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>


    </div>
  );
}

export default React.memo(CeoView);
