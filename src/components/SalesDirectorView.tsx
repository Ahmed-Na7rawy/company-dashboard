import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis, Bar, Legend, ComposedChart, Area, Line, LineChart, PieChart, Pie, Cell, BarChart
} from 'recharts';
import CustomerMaterialTable from './CustomerMaterialTable';
import {
  TrendingUp, Users, Target, AlertTriangle, Search, CheckCircle2, ShieldAlert,
  Percent, Activity, HelpCircle, ArrowLeftRight, Boxes
} from 'lucide-react';

import { useScaleMode } from '../hooks/useScaleMode';
import { useMultiComparison, type ComparisonReturn } from '../hooks/useComparison';
import { useToast } from './ToastProvider';

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
        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex justify-between items-center text-left ${
          darkMode 
            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700/50' 
            : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100/50'
        }`}
      >
        <span>{selected.length === 0 ? placeholder : displayLabel()}</span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <div 
          className={`absolute left-0 z-50 mt-1 w-full min-w-[200px] rounded-xl border p-2 shadow-lg max-h-60 overflow-y-auto ${
            darkMode 
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
              className={`w-full px-2 py-1 mb-2 rounded border text-[11px] focus:outline-none ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
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
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[11px] hover:bg-slate-500/10 ${
                    isChecked ? 'font-bold text-[#128d46]' : ''
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

interface ItemStat {
  customers: Set<string>;
  grossVolume: number;
  returnVolume: number;
}

interface MonthlyReturn {
  month: string;
  grossVolume: number;
  returnsVolume: number;
  netVolume: number;
  grossRevenue: number;
  returnsRevenue: number;
  netRevenue: number;
}

interface ChartData {
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

// Robust data aggregator for specific scopes (Combined or single year)
const computeChartData = (dataList: ProcessedRow[]): ChartData => {
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

function SalesDirectorView({ 
  processedData, 
  roleProcessedData,
  language, 
  darkMode, 
  t, 
  adminSettings,
  sellerTargets,
  currentUser,
  officeType,
  chartDisplayMode,
  globalChartMetric = 'revenue',
  globalCompareMode = false
}: SalesDirectorViewProps) {
  const scaleMode = useScaleMode();
  const { showToast } = useToast();
  const isRep = currentUser?.role === 'salesperson';
  const isSupervisor = isRep && (new Set(processedData.map(r => r.SalesmanName).filter(Boolean))).size > 1;
  const showSalesmanSelector = !isRep || isSupervisor;

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

  const parseDate = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  // Filters State (choices can be multiple)
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedItemGroups, setSelectedItemGroups] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedSalesmen, setSelectedSalesmen] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const isSpecificSeller = isRep || selectedSalesmen.length === 1;

  // Sync viewMetric with globalChartMetric
  const [viewMetric, setViewMetric] = useState<'revenue' | 'volume'>(globalChartMetric || 'revenue');

  useEffect(() => {
    if (globalChartMetric) {
      setViewMetric(globalChartMetric);
    }
  }, [globalChartMetric]);

  // Sync displayMode (Value vs Percentage) with global chartDisplayMode
  const [displayMode, setDisplayMode] = useState<'count' | 'percent'>(chartDisplayMode || 'count');

  useEffect(() => {
    if (chartDisplayMode) {
      setDisplayMode(chartDisplayMode);
    }
  }, [chartDisplayMode]);

  const formatVal = (val: number) => {
    const factor = scaleMode === 'millions' ? 1000000 : 1000;
    const suffix = scaleMode === 'millions' 
      ? (language === 'en' ? 'M' : 'مليون') 
      : (language === 'en' ? 'K' : 'ألف');
    
    const rounded = Math.round(val / factor);
    if (viewMetric === 'revenue') {
      return language === 'en' ? `${rounded}${suffix} EGP` : `${rounded} ${suffix} ج.م`;
    }
    return language === 'en' ? `${rounded}${suffix} ${activeUom}` : `${rounded} ${suffix} ${activeUom}`;
  };

  // Multi-comparison hook consolidates all comparison states
  const comparisons = useMultiComparison(
    ['timeline', 'segment', 'itemGroup', 'salesman', 'returns', 'office'],
    globalCompareMode
  );

  const timelineCompare = comparisons.timeline;
  const segmentCompare = comparisons.segment;
  const itemGroupCompare = comparisons.itemGroup;
  const salesmanCompare = comparisons.salesman;
  const returnsCompare = comparisons.returns;
  const officeCompare = comparisons.office;

  useEffect(() => {
    Object.values(comparisons).forEach(comp => {
      if (comp.enabled !== globalCompareMode) {
        comp.toggle();
      }
    });
  }, [globalCompareMode, comparisons]);

  // Matrix View States (B2C specific)
  const [matrixViewMode, setMatrixViewMode] = useState<'value' | 'percent'>('value');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Flight Risk Pagination & Filtering States
  const [flightRiskFilter, setFlightRiskFilter] = useState<'All' | 'Critical' | 'Medium'>('All');
  const [flightRiskPage, setFlightRiskPage] = useState(0);



  // Extract unique filter lists from data
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

  // Apply general workspace filters
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
        if (!matchesCust && !matchesItem && !matchesSalesman && !matchesGroup) return false;
      }
      return true;
    });
  }, [roleProcessedData, selectedSegments, selectedItemGroups, selectedCustomers, selectedSalesmen, selectedOffices, searchTerm, showSalesmanSelector]);

  // Monthly Product Comparison Plot State & Data Aggregator
  const [prodPlotMetric, setProdPlotMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [prodPlotSelectedProducts, setProdPlotSelectedProducts] = useState<string[]>([]);
  const [prodPlotYearTab, setProdPlotYearTab] = useState<'combined' | '2022' | '2023' | '2024' | '2025' | '2026'>('combined');
  const [prodMonth1, setProdMonth1] = useState<number>(0); // 0 = Jan
  const [prodMonth2, setProdMonth2] = useState<number>(1); // 1 = Feb
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
  const [skuSearch, setSkuSearch] = useState('');
  const skuDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (skuDropdownRef.current && !skuDropdownRef.current.contains(event.target as Node)) {
        setSkuDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allSkusList = useMemo(() => {
    const list = new Set(processedData.map((r) => r.ItemName).filter((v): v is string => !!v));
    return Array.from(list).sort();
  }, [processedData]);

  // Compute Monthly Time-Series Bar Chart Data for selected SKUs
  const { activeProductsForPlot, skuTimeSeriesData } = useMemo(() => {
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const dataset = filteredData.filter((row) => {
      if (prodPlotYearTab !== 'combined') {
        const year = row.DateObj ? row.DateObj.getFullYear() : null;
        if (year && String(year) !== prodPlotYearTab) return false;
      }
      return true;
    });

    let activeProducts = prodPlotSelectedProducts;
    if (activeProducts.length === 0) {
      const totals: Record<string, number> = {};
      dataset.forEach((row) => {
        const name = row.ItemName || (language === 'en' ? 'Uncategorized' : 'غير مصنف');
        const val = prodPlotMetric === 'revenue' ? (row.Revenue || 0) : (row.Volume || row.Quantity || 0);
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
      const val = prodPlotMetric === 'revenue' ? (row.Revenue || 0) : (row.Volume || row.Quantity || 0);

      if (activeProducts.includes(prodName)) {
        monthlyProdValues[mIdx][prodName] = (monthlyProdValues[mIdx][prodName] || 0) + val;
      }
    });

    const timeSeriesArr = monthsEn.map((mEn, idx) => {
      const entry: Record<string, any> = {
        month: language === 'en' ? mEn : monthsAr[idx]
      };
      const totalInMonth = activeProducts.reduce((sum, p) => sum + (monthlyProdValues[idx][p] || 0), 0);

      activeProducts.forEach((p) => {
        const rawVal = monthlyProdValues[idx][p] || 0;
        if (displayMode === 'percent') {
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
  }, [filteredData, prodPlotYearTab, prodPlotMetric, prodPlotSelectedProducts, displayMode, language]);

  // Quarter & Custom Comparison Memos
  const getCompareData = useCallback((
    comp: ComparisonReturn,
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
  }, [language, parseDate]);

  const timelineCompareData = useMemo(() => {
    return getCompareData(
      timelineCompare,
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
  }, [filteredDataNoDate, timelineCompare, getCompareData, viewMetric, adminSettings, language]);

  const segmentCompareData = useMemo(() => {
    if (!segmentCompare.enabled) return [];

    const getSegmentsForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const seg = row.Segment || 'Solutions';
          const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[seg] = (sums[seg] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (segmentCompare.type === 'custom') {
      const bStart = parseDate(segmentCompare.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(segmentCompare.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(segmentCompare.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(segmentCompare.custom.compEnd) || new Date('2026-06-30');
      q1Sums = getSegmentsForRange(bStart, bEnd);
      q2Sums = getSegmentsForRange(cStart, cEnd);
    } else {
      const getQuarterSegments = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const seg = row.Segment || 'Solutions';
              const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
  }, [filteredDataNoDate, segmentCompare, viewMetric, language]);

  const itemGroupCompareData = useMemo(() => {
    if (!itemGroupCompare.enabled) return [];

    const getGroupsForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const group = row.ItemGroup || 'Other';
          const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[group] = (sums[group] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (itemGroupCompare.type === 'custom') {
      const bStart = parseDate(itemGroupCompare.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(itemGroupCompare.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(itemGroupCompare.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(itemGroupCompare.custom.compEnd) || new Date('2026-06-30');
      q1Sums = getGroupsForRange(bStart, bEnd);
      q2Sums = getGroupsForRange(cStart, cEnd);
    } else {
      const getQuarterGroups = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const group = row.ItemGroup || 'Other';
              const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
  }, [filteredDataNoDate, itemGroupCompare, viewMetric]);

  const salesmanCompareData = useMemo(() => {
    if (!salesmanCompare.enabled) return [];

    const getSalesmenForRange = (start: Date, end: Date) => {
      const sums: Record<string, number> = {};
      filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const name = row.SalesmanName || 'General';
          const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
          sums[name] = (sums[name] || 0) + (row.IsReturn ? -value : value);
        }
      });
      return sums;
    };

    let q1Sums: Record<string, number> = {};
    let q2Sums: Record<string, number> = {};

    if (salesmanCompare.type === 'custom') {
      const bStart = parseDate(salesmanCompare.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(salesmanCompare.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(salesmanCompare.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(salesmanCompare.custom.compEnd) || new Date('2026-06-30');
      q1Sums = getSalesmenForRange(bStart, bEnd);
      q2Sums = getSalesmenForRange(cStart, cEnd);
    } else {
      const getQuarterSalesmen = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const sums: Record<string, number> = {};
        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const name = row.SalesmanName || 'General';
              const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
  }, [filteredDataNoDate, salesmanCompare, viewMetric]);

  const returnsCompareData = useMemo(() => {
    if (!returnsCompare.enabled) return [];

    const getReturnsForRange = (start: Date, end: Date) => {
      const productGross: Record<string, number> = {};
      const productReturns: Record<string, number> = {};

      filteredDataNoDate.forEach(row => {
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
      const bStart = parseDate(returnsCompare.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(returnsCompare.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(returnsCompare.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(returnsCompare.custom.compEnd) || new Date('2026-06-30');
      q1Sums = getReturnsForRange(bStart, bEnd);
      q2Sums = getReturnsForRange(cStart, cEnd);
    } else {
      const getQuarterReturns = (year: number, qNum: number) => {
        const startMonth = (qNum - 1) * 3;
        const productGross: Record<string, number> = {};
        const productReturns: Record<string, number> = {};

        filteredDataNoDate.forEach(row => {
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
  }, [filteredDataNoDate, returnsCompare]);



  // Compare mode data for B2C Office Chart
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
      filteredDataNoDate.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj >= start && dateObj <= end) {
          const office = row.SalesOffice || 'B2C';
          const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
      const bStart = parseDate(officeCompare.custom.baseStart) || new Date('2025-01-01');
      const bEnd = parseDate(officeCompare.custom.baseEnd) || new Date('2025-06-30');
      const cStart = parseDate(officeCompare.custom.compStart) || new Date('2026-01-01');
      const cEnd = parseDate(officeCompare.custom.compEnd) || new Date('2026-06-30');
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
        filteredDataNoDate.forEach(row => {
          const dateObj = row.DateObj || new Date(row.Date);
          if (dateObj.getFullYear() === year) {
            const m = dateObj.getMonth();
            if (m >= startMonth && m < startMonth + 3) {
              const office = row.SalesOffice || 'B2C';
              const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
  }, [filteredDataNoDate, officeCompare, viewMetric]);



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
    filteredData.forEach(row => {
      const office = row.SalesOffice || 'B2C';
      const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
      const netVal = row.IsReturn ? -value : value;
      if (totals[office] !== undefined) {
        totals[office] += netVal;
      } else {
        totals['B2C'] += netVal;
      }
    });
    return totals;
  }, [filteredData, viewMetric]);

  // Normal mode data for B2C Office Chart
  const getOfficeData = (tabId: string) => {
    const sums: Record<string, number> = {
      'Modern Trade': 0,
      'Alex Office': 0,
      'Dist. Office': 0,
      'LG Office': 0,
      'E-Commerce': 0,
      'B2C': 0
    };

    filteredData.forEach(row => {
      const dateObj = row.DateObj || new Date(row.Date);
      const year = dateObj.getFullYear();
      if (tabId === 'combined' || year.toString() === tabId) {
        const office = row.SalesOffice || 'B2C';
        const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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

  // Compute yearly totals for summary cards under timeline
  const yearlyTotals = useMemo(() => {
    const totals: Record<number, { grossVol: number; retVol: number; netVol: number; grossRev: number; retRev: number; netRev: number }> = {
      2022: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2023: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2024: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2025: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
      2026: { grossVol: 0, retVol: 0, netVol: 0, grossRev: 0, retRev: 0, netRev: 0 },
    };

    filteredData.forEach(row => {
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
  }, [filteredData]);

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

    filteredData.forEach(row => {
      const group = row.ItemGroup || (language === 'en' ? 'Uncategorized' : 'غير مصنف');
      const office = row.SalesOffice || 'B2C';
      const targetOffice = officeTotalsArr[office] !== undefined ? office : 'B2C';
      
      const value = viewMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
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
  }, [filteredData, viewMetric, language]);

  // Compute Combined Chart Dataset (Memoized)
  const chartsCombined = useMemo(() => computeChartData(filteredData), [filteredData]);

  // Lazy-evaluated chart cache for specific year tabs to prevent unnecessary computation
  const yearChartsCache = useRef<Partial<Record<string, ChartData>>>({});

  // Invalidate year chart cache when filteredData changes
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

      const currentStock = Math.round((soldVolume * 0.6 + 800) * adminSettings.stockLevelModifier);
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
  }, [processedData, adminSettings.stockLevelModifier]);

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
        momentum: `Gross sales volume reached ${Math.round(chartsCombined.totalGrossVolume / 1000000)}M ${activeUom}, offset by returns of ${Math.round(chartsCombined.totalReturnVolume / 1000000)}M ${activeUom}. The overall return logistics rate is healthy at ${chartsCombined.overallReturnRate}%. Segment contribution is balanced across active product groups.`,
        retention: `Client attrition analysis flags ${healthMatrix.lost.length} lost accounts (inactive for 180+ days) and ${healthMatrix.declining.length} active clients exhibiting substantial decline in purchase velocity. We have also identified ${healthMatrix.partialChurn.length} cases of partial product churn.`,
        concentration: isB2C 
          ? `Stock supply audit flags ${pushToSellItems.length} excess stock SKUs exceeding 1.5x safety stock margins, requiring immediate clearance and promotional discounts to optimize rotation.`
          : `Product supply vulnerability audit flags ${chartsCombined.riskMatrix.filter(p => p.isHighRisk).length} high-volume SKUs relying on 2 or fewer B2B accounts. This creates structural concentration risks that could impact operational flow.`
      };
    } else {
      return {
        momentum: `وصل حجم المبيعات الإجمالي إلى ${Math.round(chartsCombined.totalGrossVolume / 1000000)} مليون وحدة، مخصوماً منه مرتجعات بقيمة ${Math.round(chartsCombined.totalReturnVolume / 1000000)} مليون وحدة. معدل المرتجعات اللوجستية الإجمالي مستقر عند ${chartsCombined.overallReturnRate}٪. مساهمة القطاعات متوازنة في المجموعات البيعية.`,
        retention: `يكشف تحليل الاحتفاظ بالعملاء عن عدد ${healthMatrix.lost.length} عميل مفقود (غير نشط +١٨٠ يوم) وعدد ${healthMatrix.declining.length} عميل نشط يظهر تراجعاً ملحوظاً في سرعة الشراء. تم كشف أيضاً عدد ${healthMatrix.partialChurn.length} حالة تراجع جزئي للمنتجات.`,
        concentration: isB2C
          ? `يكشف تدقيق توريد المخزون عن عدد ${pushToSellItems.length} صنف مكدس يتجاوز حد أمان المخزون بـ ١.٥ ضعف، مما يتطلب ترويجاً فورياً أو خصومات لتنشيط حركة بيعها.`
          : `يكشف تدقيق مخاطر تركيز التوريد عن عدد ${chartsCombined.riskMatrix.filter(p => p.isHighRisk).length} منتج ذو حجم سحب كبير يعتمد على عميلين أو أقل. يخلق هذا مخاطر هيكلية قد تؤثر على التدفق التشغيلي.`
      };
    }
  }, [chartsCombined, healthMatrix, language, officeType, pushToSellItems]);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isRep 
              ? `${currentUser?.salesmanName} - ${isSupervisor ? (language === 'en' ? 'Modern Trade Sales Performance (Supervisor)' : 'أداء مبيعات التجزئة (مشرف)') : (language === 'en' ? 'Personal Sales Performance' : 'أدائي البيعي ومؤشراتي الشخصية')}`
              : officeType === 'B2C'
              ? (language === 'en' ? 'B2C Sales Control Center' : 'منصة مبيعات B2C التنفيذية')
              : officeType === 'Horeca Team'
              ? (language === 'en' ? 'HORECA Sales Control Center' : 'منصة مبيعات HORECA التنفيذية')
              : (language === 'en' ? 'B2B Sales Control Center' : 'منصة مبيعات B2B التنفيذية')}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isRep
              ? isSupervisor
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
                setSelectedSegments([]);
                setSelectedItemGroups([]);
                setSelectedCustomers([]);
                setSelectedSalesmen([]);
                setSelectedOffices([]);
              }}
              className="text-[10px] font-bold text-rose-500 hover:underline"
            >
              {language === 'en' ? 'Reset Filters' : 'إعادة ضبط الفلاتر'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Display Mode Toggle (Value vs Percentage) */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-bold no-print select-none">
              <button
                type="button"
                onClick={() => setDisplayMode('count')}
                className={`px-3 py-1 transition-all ${displayMode === 'count' ? 'bg-[#128d46] text-white font-black shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'en' ? 'Value' : 'القيمة'}
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('percent')}
                className={`px-3 py-1 transition-all ${displayMode === 'percent' ? 'bg-[#128d46] text-white font-black shadow' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
              >
                {language === 'en' ? '% Percentage' : 'النسبة ٪'}
              </button>
            </div>

            {/* Metric Toggle (EGP vs Qty) */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-bold no-print select-none">
              <button
                onClick={() => setViewMetric('revenue')}
                className={`px-3 py-1 ${viewMetric === 'revenue' ? 'bg-[#128d46] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {language === 'en' ? 'EGP Revenue' : 'صافي الإيرادات ج.م'}
              </button>
              <button
                onClick={() => setViewMetric('volume')}
                className={`px-3 py-1 ${viewMetric === 'volume' ? 'bg-[#128d46] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
              >
                {language === 'en' ? 'Qty Volume' : 'حجم المبيعات كميات'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Segment */}
          <MultiSelect
            label={language === 'en' ? 'Company Segment' : 'قطاع الشركة'}
            options={segmentsList}
            selected={selectedSegments}
            onChange={setSelectedSegments}
            placeholder={language === 'en' ? 'All Segments' : 'جميع القطاعات'}
            language={language}
            darkMode={darkMode}
          />

          {/* Item Group */}
          <MultiSelect
            label={language === 'en' ? 'Item Group' : 'مجموعة الأصناف'}
            options={itemGroupsList}
            selected={selectedItemGroups}
            onChange={setSelectedItemGroups}
            placeholder={language === 'en' ? 'All Groups' : 'جميع المجموعات'}
            language={language}
            darkMode={darkMode}
          />

          {/* Sales Office / Branch (B2C specific) */}
          {(officeType === 'B2C' || officeType === 'Horeca Team') && (
            <MultiSelect
              label={language === 'en' ? 'Sales Office / Branch' : 'مكتب المبيعات / الفرع'}
              options={officesList.filter(o => !['B2B', 'Pharma', 'Export', 'SME', 'Apex HQ', 'Sisters Companies', 'Digital Marketing'].includes(o))}
              selected={selectedOffices}
              onChange={setSelectedOffices}
              placeholder={language === 'en' ? 'All Offices' : 'جميع المكاتب'}
              language={language}
              darkMode={darkMode}
            />
          )}

          {/* Customer */}
          <MultiSelect
            label={language === 'en' ? 'Customer Account' : 'حساب العميل'}
            options={customersList}
            selected={selectedCustomers}
            onChange={setSelectedCustomers}
            placeholder={language === 'en' ? 'All Accounts' : 'جميع الحسابات'}
            language={language}
            darkMode={darkMode}
          />

          {/* Salesperson (Hidden/Locked if salesperson role, except for supervisors) */}
          {showSalesmanSelector ? (
            <MultiSelect
              label={language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}
              options={salesmenList}
              selected={selectedSalesmen}
              onChange={setSelectedSalesmen}
              placeholder={language === 'en' ? 'All Salesmen' : 'جميع المناديب'}
              language={language}
              darkMode={darkMode}
            />
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}</label>
              <div className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-400'}`}>
                {currentUser?.salesmanName}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Interactive Search' : 'البحث التفاعلي'}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'en' ? 'Search SKU or Customer...' : 'بحث عن منتج أو عميل...'}
                className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-slate-400'} outline-none`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary (Always shows Combined Active selection values) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Net Sales */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {viewMetric === 'revenue' 
              ? (language === 'en' ? 'Net Revenue' : 'صافي الإيرادات')
              : (language === 'en' ? 'Net Sales Vol' : 'صافي حجم المبيعات')}
          </p>
          <h3 className="text-xl font-black mt-2 text-[#128d46]">
            {viewMetric === 'revenue' 
              ? formatVal(chartsCombined.totalNetRevenue)
              : chartsCombined.totalNetVolume.toLocaleString()}
          </h3>
        </div>

        {/* Gross Sales */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {viewMetric === 'revenue'
              ? (language === 'en' ? 'Gross Revenue' : 'إجمالي الإيرادات')
              : (language === 'en' ? 'Gross Sales Vol' : 'إجمالي المبيعات')}
          </p>
          <h3 className="text-xl font-black mt-2">
            {viewMetric === 'revenue'
              ? formatVal(chartsCombined.totalGrossRevenue)
              : chartsCombined.totalGrossVolume.toLocaleString()}
          </h3>
        </div>

        {/* Return Rate */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Return Rate %' : 'معدل المرتجعات %'}</p>
          <h3 className={`text-xl font-black mt-2 ${
            parseFloat(viewMetric === 'revenue' ? chartsCombined.overallReturnRateRevenue : chartsCombined.overallReturnRate) > 5 
              ? 'text-rose-500' 
              : 'text-emerald-500'
          }`}>{viewMetric === 'revenue' ? chartsCombined.overallReturnRateRevenue : chartsCombined.overallReturnRate}%</h3>
        </div>

        {/* Active Clients */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Active Accounts' : 'الحسابات النشطة'}</p>
          <h3 className="text-xl font-black mt-2">{new Set(filteredData.map(r => r.CustomerName)).size}</h3>
        </div>

        {/* Concentration Risk OR Surplus SKUs */}
        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm col-span-2 md:col-span-1`}>
          {officeType === 'B2C' || officeType === 'Horeca Team' ? (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Surplus SKUs' : 'أصناف فائضة'}</p>
              <h3 className="text-xl font-black mt-2 text-[#e97025]">{pushToSellItems.length}</h3>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{language === 'en' ? 'Concentration Risk' : 'مخاطر التركيز'}</p>
              <h3 className="text-xl font-black mt-2 text-indigo-500">{chartsCombined.riskMatrix.filter(p => p.isHighRisk).length}</h3>
            </>
          )}
        </div>
      </div>

      {/* B2C Sales Offices KPI Cards */}
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
                  {viewMetric === 'revenue' 
                    ? formatVal(o.value)
                    : `${o.value.toLocaleString()} Qty`}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts Timeline card */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {language === 'en' ? 'Historical Sales & Returns Timeline' : 'الجدول الزمني التاريخي للمبيعات والمرتجعات'}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => timelineCompare.toggle()}
              className={`px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold border ${
                timelineCompare.enabled
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
              }`}
            >
              📊 {language === 'en' ? 'Compare Quarters' : 'مقارنة ربع سنوية'}
            </button>
            {!timelineCompare.enabled && null}
          </div>
        </div>

        {timelineCompare.enabled && (
          <div className="flex flex-col gap-3 mb-4 p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold">
            {/* Compare Type Toggle */}
            <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-2 mb-1 gap-2">
              <button
                onClick={() => timelineCompare.setType('quarter')}
                className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${timelineCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
              >
                {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
              </button>
              <button
                onClick={() => timelineCompare.setType('custom')}
                className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${timelineCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
              >
                {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
              </button>
            </div>

            {timelineCompare.type === 'custom' ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                    {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                  </span>
                  <input
                    type="date"
                    value={timelineCompare.custom.baseStart}
                    onChange={(e) => timelineCompare.setCustom('baseStart', e.target.value)}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  />
                  <span className="text-slate-400 text-[10px]">{language === 'en' ? 'to' : 'إلى'}</span>
                  <input
                    type="date"
                    value={timelineCompare.custom.baseEnd}
                    onChange={(e) => timelineCompare.setCustom('baseEnd', e.target.value)}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                    {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                  </span>
                  <input
                    type="date"
                    value={timelineCompare.custom.compStart}
                    onChange={(e) => timelineCompare.setCustom('compStart', e.target.value)}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  />
                  <span className="text-slate-400 text-[10px]">{language === 'en' ? 'to' : 'إلى'}</span>
                  <input
                    type="date"
                    value={timelineCompare.custom.compEnd}
                    onChange={(e) => timelineCompare.setCustom('compEnd', e.target.value)}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">
                    {language === 'en' ? 'Base:' : 'الأساس:'}
                  </span>
                  <select
                    value={timelineCompare.quarter.q1Num}
                    onChange={(e) => timelineCompare.setQuarter('q1Num', Number(e.target.value))}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={timelineCompare.quarter.q1Year}
                    onChange={(e) => timelineCompare.setQuarter('q1Year', Number(e.target.value))}
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
                    value={timelineCompare.quarter.q2Num}
                    onChange={(e) => timelineCompare.setQuarter('q2Num', Number(e.target.value))}
                    className="p-1 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white"
                  >
                    <option value={1}>Q1</option>
                    <option value={2}>Q2</option>
                    <option value={3}>Q3</option>
                    <option value={4}>Q4</option>
                  </select>
                  <select
                    value={timelineCompare.quarter.q2Year}
                    onChange={(e) => timelineCompare.setQuarter('q2Year', Number(e.target.value))}
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
          </div>
        )}

        {timelineCompare.enabled ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={timelineCompareData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                <YAxis
                  stroke={darkMode ? '#94a3b8' : '#64748b'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000000) return `${Math.round(val / 1000000)}M`;
                    return val.toLocaleString();
                  }}
                />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    color: darkMode ? '#f8fafc' : '#0f172a',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="q1Value"
                  name={timelineCompare.labels.base}
                  fill="#128d46"
                  radius={[3, 3, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="q2Value"
                  name={timelineCompare.labels.compare}
                  fill="#e97025"
                  radius={[3, 3, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={getChartData('combined').monthlyReturns} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey={viewMetric === 'revenue' ? 'grossRevenue' : 'grossVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Gross Rev' : 'Gross Vol') : (viewMetric === 'revenue' ? 'إجمالي الإيراد' : 'إجمالي الحجم')} fill={darkMode ? '#1e293b' : '#f1f5f9'} stroke={darkMode ? '#475569' : '#cbd5e1'} />
                <Bar dataKey={viewMetric === 'revenue' ? 'returnsRevenue' : 'returnsVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Returns Rev' : 'Returns Vol') : (viewMetric === 'revenue' ? 'المرتجع المالي' : 'المرتجع الحجم')} fill="#e97025" radius={[3, 3, 0, 0]} barSize={12} />
                <Line type="monotone" dataKey={viewMetric === 'revenue' ? 'netRevenue' : 'netVolume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Net Rev' : 'Net Vol') : (viewMetric === 'revenue' ? 'صافي الإيراد' : 'صافي الحجم')} stroke="#128d46" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Yearly Totals Summary Cards (Interactive with filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          {[2022, 2023, 2024, 2025, 2026].map((year) => {
            const isSelected = !timelineCompare.enabled && year === 2026; // Default to 'combined' (2026 represents combined)
            const net = viewMetric === 'revenue' ? yearlyTotals[year].netRev : yearlyTotals[year].netVol;
            const ret = viewMetric === 'revenue' ? yearlyTotals[year].retRev : yearlyTotals[year].retVol;
            
            const formatValue = (val: number) => {
              if (viewMetric === 'revenue') {
                if (Math.abs(val) >= 1000000) {
                  return `${(val / 1000000).toFixed(2)}M EGP`;
                } else if (Math.abs(val) >= 1000) {
                  return `${(val / 1000).toFixed(1)}k EGP`;
                }
                return `${val.toLocaleString()} EGP`;
              } else {
                return `${val.toLocaleString()} ${activeUom}`;
              }
            };

            const netText = formatValue(net);
            const retText = formatValue(ret).replace(' EGP', '').replace(` ${activeUom}`, '');

            return (
              <div
                key={year}
                className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm scale-105 animate-pulse'
                    : darkMode
                      ? 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700/80'
                      : 'bg-slate-50/70 border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-black tracking-wider ${isSelected ? 'text-emerald-500 font-extrabold' : 'text-slate-400'}`}>
                    {language === 'en' ? `Year ${year}` : `عام ${year}`}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className={`text-[13px] font-black block ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                    {netText}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 block">
                    {language === 'en' ? `Returns: ${retText}` : `المرتجع: ${retText}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SKU Monthly Performance Time-Series Bar Plot */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
        {/* Header & Main Controls */}
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
            {/* Metric Selector (Revenue vs Quantity) */}
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setProdPlotMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  prodPlotMetric === 'revenue'
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? 'Revenue (EGP)' : 'الإيرادات (ج.م)'}
              </button>
              <button
                type="button"
                onClick={() => setProdPlotMetric('quantity')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  prodPlotMetric === 'quantity'
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? `Quantity (${activeUom})` : `الكميات (${activeUom})`}
              </button>
            </div>

            {/* Display Mode Selector (Value vs Percentage) */}
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setDisplayMode('count')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  displayMode === 'count'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? 'Value' : 'القيمة'}
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('percent')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  displayMode === 'percent'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {language === 'en' ? '% Share' : 'النسبة ٪'}
              </button>
            </div>

            {/* Year Scope Selector */}
            <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
              {(['combined', '2024', '2025', '2026'] as const).map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setProdPlotYearTab(yr)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    prodPlotYearTab === yr
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

        {/* Secondary Bar Controls: SKU Selection Dropdown with Checkboxes */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div ref={skuDropdownRef} className="relative w-full sm:w-80 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'en' ? 'Select SKU(s) to view monthly time-series:' : 'اختر صنف أو أكثر لمتابعة المنحنى الشهري:'}
            </label>
            <button
              type="button"
              onClick={() => setSkuDropdownOpen(!skuDropdownOpen)}
              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex justify-between items-center text-left ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700/50'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">
                {prodPlotSelectedProducts.length === 0
                  ? (language === 'en' ? 'Top 5 SKUs (Default)' : 'أفضل ٥ أصناف (افتراضي)')
                  : (language === 'en' ? `${prodPlotSelectedProducts.length} SKU(s) Selected` : `تم تحديد ${prodPlotSelectedProducts.length} صنف`)}
              </span>
              <span className="text-[10px] opacity-60 ml-2">▼</span>
            </button>

            {skuDropdownOpen && (
              <div
                className={`absolute left-0 right-0 z-50 mt-1 rounded-xl border p-2 shadow-xl max-h-72 overflow-hidden flex flex-col ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                {/* Search Bar inside SKU dropdown */}
                <div className="p-1 pb-2">
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search SKU...' : 'بحث في الأصناف...'}
                    value={skuSearch}
                    onChange={(e) => setSkuSearch(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                {/* Quick Action Buttons */}
                <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-200/20 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setProdPlotSelectedProducts([...allSkusList])}
                    className="text-emerald-500 hover:underline"
                  >
                    {language === 'en' ? 'Select All' : 'تحديد الكل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdPlotSelectedProducts([])}
                    className="text-indigo-400 hover:underline"
                  >
                    {language === 'en' ? 'Top 5' : 'أفضل ٥'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdPlotSelectedProducts([])}
                    className="text-rose-400 hover:underline"
                  >
                    {language === 'en' ? 'Clear' : 'مسح'}
                  </button>
                </div>

                {/* Scrollable Checkboxes List */}
                <div className="overflow-y-auto max-h-48 pt-1 space-y-0.5">
                  {allSkusList
                    .filter((sku) => sku.toLowerCase().includes(skuSearch.toLowerCase()))
                    .map((sku) => {
                      const checked = prodPlotSelectedProducts.includes(sku);
                      return (
                        <label
                          key={sku}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            checked
                              ? 'bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
                              : darkMode
                                ? 'hover:bg-slate-700/50 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setProdPlotSelectedProducts(prodPlotSelectedProducts.filter((p) => p !== sku));
                              } else {
                                setProdPlotSelectedProducts([...prodPlotSelectedProducts, sku]);
                              }
                            }}
                            className="rounded text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="truncate">{sku}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Active SKU Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
            {activeProductsForPlot.slice(0, 6).map((skuName, idx) => (
              <span
                key={skuName}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate max-w-[120px]">{skuName}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Time-Series Bar Chart */}
        <div className="h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={skuTimeSeriesData} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
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
                  if (displayMode === 'percent') return `${val}%`;
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return String(val);
                }}
              />
              <Tooltip
                formatter={(val: any, name?: any) => [
                  displayMode === 'percent'
                    ? `${Number(val).toFixed(1)}%`
                    : `${Number(val).toLocaleString()} ${prodPlotMetric === 'revenue' ? 'EGP' : activeUom}`,
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

      {/* Grid: Segment Share & Client Dependency Scatter */}
      <div className={`grid grid-cols-1 ${officeType !== 'B2C' ? 'lg:grid-cols-2' : ''} gap-6`}>
        
        {/* Segment Contribution Card (Hidden for B2C) */}
        {officeType !== 'B2C' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Segment Contribution' : 'مساهمة قطاعات الشركة'}
            </h3>
            <div className="flex items-center gap-2">
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
          </div>

          {segmentCompare.enabled && (
            <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              {/* Compare Type Toggle */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-1 gap-2">
                <button
                  onClick={() => segmentCompare.setType('quarter')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${segmentCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
                </button>
                <button
                  onClick={() => segmentCompare.setType('custom')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${segmentCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
                </button>
              </div>

              {segmentCompare.type === 'custom' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={segmentCompare.custom.baseStart}
                        onChange={(e) => segmentCompare.setCustom('baseStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={segmentCompare.custom.baseEnd}
                        onChange={(e) => segmentCompare.setCustom('baseEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={segmentCompare.custom.compStart}
                        onChange={(e) => segmentCompare.setCustom('compStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={segmentCompare.custom.compEnd}
                        onChange={(e) => segmentCompare.setCustom('compEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      {language === 'en' ? 'Base:' : 'الأساس:'}
                    </span>
                    <div className="flex gap-1">
                      <select
                        value={segmentCompare.quarter.q1Num}
                        onChange={(e) => segmentCompare.setQuarter('q1Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={segmentCompare.quarter.q1Year}
                        onChange={(e) => segmentCompare.setQuarter('q1Year', Number(e.target.value))}
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
                        value={segmentCompare.quarter.q2Num}
                        onChange={(e) => segmentCompare.setQuarter('q2Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={segmentCompare.quarter.q2Year}
                        onChange={(e) => segmentCompare.setQuarter('q2Year', Number(e.target.value))}
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
                </>
              )}
            </div>
          )}

          {segmentCompare.enabled ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={segmentCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
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
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar
                    dataKey="q1Value"
                    name={segmentCompare.labels.base}
                    fill="#128d46"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="q2Value"
                    name={segmentCompare.labels.compare}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col justify-center items-center">
              <ResponsiveContainer width="100%" height={180} minWidth={0}>
                <PieChart>
                  <Pie
                    data={getChartData('combined').segmentAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey={viewMetric === 'revenue' ? 'revenue' : 'value'}
                  >
                    {getChartData('combined').segmentAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-4 text-[9px] font-bold">
                {getChartData('combined').segmentAllocation.map((item, idx) => {
                  const itemVal = viewMetric === 'revenue' ? item.revenue : item.value;
                  const totalVal = viewMetric === 'revenue' ? getChartData('combined').totalGrossRevenue : getChartData('combined').totalGrossVolume;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{item.name} ({((itemVal / (totalVal || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Client Dependency Scatter Card OR Product Return Rate Analysis */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {officeType === 'B2C' || officeType === 'Horeca Team'
                ? (language === 'en' ? 'Product Return Rate Analysis' : 'تحليل معدلات مرتجعات المنتجات')
                : (language === 'en' ? 'Client Dependency & Concentration' : 'مخاطر التركيز والاعتماد للعملاء')}
            </h3>
            <div className="flex items-center gap-2">
              {(officeType === 'B2C' || officeType === 'Horeca Team') && (
                <button
                  onClick={() => returnsCompare.toggle()}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    returnsCompare.enabled
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                      : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                  }`}
                >
                  📊 {language === 'en' ? 'Compare' : 'مقارنة'}
                </button>
              )}
            </div>
          </div>

          {returnsCompare.enabled && (officeType === 'B2C' || officeType === 'Horeca Team') && (
            <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              {/* Compare Type Toggle */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-1 gap-2">
                <button
                  onClick={() => returnsCompare.setType('quarter')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${returnsCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
                </button>
                <button
                  onClick={() => returnsCompare.setType('custom')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${returnsCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
                </button>
              </div>

              {returnsCompare.type === 'custom' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={returnsCompare.custom.baseStart}
                        onChange={(e) => returnsCompare.setCustom('baseStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={returnsCompare.custom.baseEnd}
                        onChange={(e) => returnsCompare.setCustom('baseEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={returnsCompare.custom.compStart}
                        onChange={(e) => returnsCompare.setCustom('compStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={returnsCompare.custom.compEnd}
                        onChange={(e) => returnsCompare.setCustom('compEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      {language === 'en' ? 'Base:' : 'الأساس:'}
                    </span>
                    <div className="flex gap-1">
                      <select
                        value={returnsCompare.quarter.q1Num}
                        onChange={(e) => returnsCompare.setQuarter('q1Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={returnsCompare.quarter.q1Year}
                        onChange={(e) => returnsCompare.setQuarter('q1Year', Number(e.target.value))}
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
                        value={returnsCompare.quarter.q2Num}
                        onChange={(e) => returnsCompare.setQuarter('q2Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={returnsCompare.quarter.q2Year}
                        onChange={(e) => returnsCompare.setQuarter('q2Year', Number(e.target.value))}
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
                </>
              )}
            </div>
          )}

          {officeType === 'B2C' || officeType === 'Horeca Team' ? (
            returnsCompare.enabled ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={returnsCompareData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, language === 'en' ? 'Return Rate' : 'معدل المرتجعات']}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar
                      dataKey="q1Value"
                      name={returnsCompare.labels.base}
                      fill="#128d46"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="q2Value"
                      name={returnsCompare.labels.compare}
                      fill="#e97025"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={getChartData('combined').highReturnItems} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                    <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toFixed(1)}%`, language === 'en' ? 'Return Rate' : 'معدل المرتجعات']}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        color: darkMode ? '#f8fafc' : '#0f172a',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="returnRate" name={language === 'en' ? 'Return Rate' : 'معدل المرتجعات'} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" dataKey="customerCount" name="Client Count" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <YAxis type="number" dataKey={viewMetric === 'revenue' ? 'revenue' : 'volume'} name={viewMetric === 'revenue' ? 'Gross Revenue' : 'Gross Volume'} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                  <ZAxis type="category" dataKey="name" name="Material" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Materials" data={getChartData('combined').riskMatrix} fill="#191342">
                    {getChartData('combined').riskMatrix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isHighRisk ? '#ef4444' : '#128d46'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Salesman Performance rankings or Item Groups allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Item Group Contribution Card */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'Item Group Allocation' : 'توزيع مبيعات مجموعات الأصناف'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => itemGroupCompare.toggle()}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                  itemGroupCompare
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                    : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                }`}
              >
                📊 {language === 'en' ? 'Compare' : 'مقارنة'}
              </button>
              {!itemGroupCompare.enabled && null}
            </div>
          </div>

          {itemGroupCompare.enabled && (
            <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              {/* Compare Type Toggle */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-1 gap-2">
                <button
                  onClick={() => itemGroupCompare.setType('quarter')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${itemGroupCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
                </button>
                <button
                  onClick={() => itemGroupCompare.setType('custom')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${itemGroupCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
                </button>
              </div>

              {itemGroupCompare.type === 'custom' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={itemGroupCompare.custom.baseStart}
                        onChange={(e) => itemGroupCompare.setCustom('baseStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={itemGroupCompare.custom.baseEnd}
                        onChange={(e) => itemGroupCompare.setCustom('baseEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={itemGroupCompare.custom.compStart}
                        onChange={(e) => itemGroupCompare.setCustom('compStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={itemGroupCompare.custom.compEnd}
                        onChange={(e) => itemGroupCompare.setCustom('compEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      {language === 'en' ? 'Base:' : 'الأساس:'}
                    </span>
                    <div className="flex gap-1">
                      <select
                        value={itemGroupCompare.quarter.q1Num}
                        onChange={(e) => itemGroupCompare.setQuarter('q1Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={itemGroupCompare.quarter.q1Year}
                        onChange={(e) => itemGroupCompare.setQuarter('q1Year', Number(e.target.value))}
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
                        value={itemGroupCompare.quarter.q2Num}
                        onChange={(e) => itemGroupCompare.setQuarter('q2Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={itemGroupCompare.quarter.q2Year}
                        onChange={(e) => itemGroupCompare.setQuarter('q2Year', Number(e.target.value))}
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
                </>
              )}
            </div>
          )}

          {itemGroupCompare.enabled ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={itemGroupCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
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
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar
                    dataKey="q1Value"
                    name={itemGroupCompare.labels.base}
                    fill="#128d46"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="q2Value"
                    name={itemGroupCompare.labels.compare}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={getChartData('combined').itemGroupAllocation} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : activeUom}`, '']} />
                  <Bar dataKey={viewMetric === 'revenue' ? 'revenue' : 'value'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Revenue' : 'Volume') : (viewMetric === 'revenue' ? 'القيمة' : 'الحجم')} fill="#128d46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Item Group Totals Table (Interactive with filters) */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <h4 className={`text-[10px] font-black uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {language === 'en' ? 'Item Group Sales Summary' : 'ملخص مبيعات مجموعات الأصناف'}
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                    {itemGroupCompare.enabled ? (
                      <>
                        <th className="p-2.5">{language === 'en' ? 'Item Group' : 'مجموعة الأصناف'}</th>
                        <th className="p-2.5 text-right">
                          {itemGroupCompare.type === 'custom'
                            ? (language === 'en' ? `Base (${itemGroupCompare.custom.baseStart.substring(2)} / ${itemGroupCompare.custom.baseEnd.substring(2)})` : `الأساس (${itemGroupCompare.custom.baseStart.substring(2)} / ${itemGroupCompare.custom.baseEnd.substring(2)})`)
                            : (language === 'en' ? `Base (Q${itemGroupCompare.quarter.q1Num} ${itemGroupCompare.quarter.q1Year})` : `الأساس (ربع ${itemGroupCompare.quarter.q1Num} ${itemGroupCompare.quarter.q1Year})`)}
                        </th>
                        <th className="p-2.5 text-right">
                          {itemGroupCompare.type === 'custom'
                            ? (language === 'en' ? `Compare (${itemGroupCompare.custom.compStart.substring(2)} / ${itemGroupCompare.custom.compEnd.substring(2)})` : `المقارن (${itemGroupCompare.custom.compStart.substring(2)} / ${itemGroupCompare.custom.compEnd.substring(2)})`)
                            : (language === 'en' ? `Compare (Q${itemGroupCompare.quarter.q2Num} ${itemGroupCompare.quarter.q2Year})` : `المقارن (ربع ${itemGroupCompare.quarter.q2Num} ${itemGroupCompare.quarter.q2Year})`)}
                        </th>
                        <th className="p-2.5 text-right">{language === 'en' ? 'Growth' : 'النمو'}</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2.5">{language === 'en' ? 'Item Group' : 'مجموعة الأصناف'}</th>
                        <th className="p-2.5 text-right">{language === 'en' ? `Volume (${activeUom})` : `الحجم (${activeUom})`}</th>
                        <th className="p-2.5 text-right">{language === 'en' ? 'Revenue' : 'الإيرادات'}</th>
                        <th className="p-2.5 text-right">{language === 'en' ? 'Avg Price' : 'متوسط السعر'}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (itemGroupCompare.enabled) {
                      return itemGroupCompareData.map((c, idx) => {
                        const baseVal = c.q1Value;
                        const compVal = c.q2Value;
                        const diff = compVal - baseVal;
                        const pctChange = baseVal > 0 ? ((diff / baseVal) * 100).toFixed(1) : '0';
                        return (
                          <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                            <td className="p-2.5 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              {c.name}
                            </td>
                            <td className="p-2.5 text-right font-medium">{baseVal.toLocaleString()} {viewMetric === 'revenue' ? 'ج.م' : 'units'}</td>
                            <td className="p-2.5 text-right font-medium">{compVal.toLocaleString()} {viewMetric === 'revenue' ? 'ج.م' : 'units'}</td>
                            <td className={`p-2.5 text-right font-bold ${diff >= 0 ? 'text-[#128d46]' : 'text-rose-500'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toLocaleString()} ({diff >= 0 ? '+' : ''}{pctChange}%)
                            </td>
                          </tr>
                        );
                      });
                    } else {
                      const currentGroups = getChartData('combined').itemGroupAllocation;
                      return currentGroups.map((g, idx) => {
                        const avgPrice = g.value > 0 ? (g.revenue / g.value) : 0;
                        return (
                          <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                            <td className="p-2.5 font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              {g.name}
                            </td>
                            <td className="p-2.5 text-right font-medium">{g.value.toLocaleString()} units</td>
                            <td className="p-2.5 text-right font-bold text-emerald-500">{g.revenue.toLocaleString()} ج.م</td>
                            <td className="p-2.5 text-right font-semibold text-slate-500">
                              {avgPrice > 0 ? `${Math.round(avgPrice).toLocaleString()} ج.م` : '-'}
                            </td>
                          </tr>
                        );
                      });
                    }
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Representative performance OR Lock view */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          {isRep ? (
            /* Salesperson personal target indicators */
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                {language === 'en' ? 'Target Quota Performance Status' : 'حالة استهداف المبيعات والمؤشرات'}
              </h3>
              {(() => {
                const salesmanTarget = sellerTargets[currentUser?.salesmanName || ''] || (officeType === 'B2C' ? 50000 : officeType === 'Horeca Team' ? 25000 : 15000);
                return (
                  <div className="space-y-6 py-6 text-xs font-semibold">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'Annual Quota Progression' : 'معدل التطور السنوي للمستهدف'}</span>
                        <span className="text-[#128d46]">{((chartsCombined.totalNetVolume / salesmanTarget) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (chartsCombined.totalNetVolume / salesmanTarget) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <span className="text-slate-400 block mb-1">{language === 'en' ? 'Personal Target' : 'المستهدف الشخصي:'}</span>
                        <strong className="text-sm">{salesmanTarget.toLocaleString()} Qty</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">{language === 'en' ? 'Net Achieved' : 'صافي المحقق:'}</span>
                        <strong className="text-sm text-[#128d46]">{chartsCombined.totalNetVolume.toLocaleString()} Qty</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Salesperson comparative bar chart for Sales Director */
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  {language === 'en' ? 'Salesperson Performance rankings' : 'أداء وترتيب مناديب المبيعات'}
                </h3>
                {!salesmanCompare.enabled && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => salesmanCompare.toggle()}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                        salesmanCompare.enabled
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                          : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                      }`}
                    >
                      📊 {language === 'en' ? 'Compare' : 'مقارنة'}
                    </button>
                  </div>
                )}
              </div>

              {salesmanCompare.enabled && (
                <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
                  {/* Compare Type Toggle */}
                  <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-1 gap-2">
                    <button
                      onClick={() => salesmanCompare.setType('quarter')}
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${salesmanCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                    >
                      {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
                    </button>
                    <button
                      onClick={() => salesmanCompare.setType('custom')}
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${salesmanCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                    >
                      {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
                    </button>
                  </div>

                  {salesmanCompare.type === 'custom' ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                          {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={salesmanCompare.custom.baseStart}
                            onChange={(e) => salesmanCompare.setCustom('baseStart', e.target.value)}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="date"
                            value={salesmanCompare.custom.baseEnd}
                            onChange={(e) => salesmanCompare.setCustom('baseEnd', e.target.value)}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                          {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={salesmanCompare.custom.compStart}
                            onChange={(e) => salesmanCompare.setCustom('compStart', e.target.value)}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="date"
                            value={salesmanCompare.custom.compEnd}
                            onChange={(e) => salesmanCompare.setCustom('compEnd', e.target.value)}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-[9px] uppercase text-slate-400 font-bold">
                          {language === 'en' ? 'Base:' : 'الأساس:'}
                        </span>
                        <div className="flex gap-1">
                          <select
                            value={salesmanCompare.quarter.q1Num}
                            onChange={(e) => salesmanCompare.setQuarter('q1Num', Number(e.target.value))}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                            <option value={3}>Q3</option>
                            <option value={4}>Q4</option>
                          </select>
                          <select
                            value={salesmanCompare.quarter.q1Year}
                            onChange={(e) => salesmanCompare.setQuarter('q1Year', Number(e.target.value))}
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
                            value={salesmanCompare.quarter.q2Num}
                            onChange={(e) => salesmanCompare.setQuarter('q2Num', Number(e.target.value))}
                            className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                          >
                            <option value={1}>Q1</option>
                            <option value={2}>Q2</option>
                            <option value={3}>Q3</option>
                            <option value={4}>Q4</option>
                          </select>
                          <select
                            value={salesmanCompare.quarter.q2Year}
                            onChange={(e) => salesmanCompare.setQuarter('q2Year', Number(e.target.value))}
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
                    </>
                  )}
                </div>
              )}

              {salesmanCompare.enabled ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={salesmanCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
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
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : (language === 'en' ? 'Cartons' : 'كرتونة')}`, '']}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          borderColor: darkMode ? '#334155' : '#e2e8f0',
                          color: darkMode ? '#f8fafc' : '#0f172a',
                          borderRadius: '12px',
                          fontSize: '11px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar
                        dataKey="q1Value"
                        name={salesmanCompare.labels.base}
                        fill="#128d46"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="q2Value"
                        name={salesmanCompare.labels.compare}
                        fill="#e97025"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={[...getChartData('combined').topSalesmen].sort((a,b)=> (viewMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume))} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                      <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey={viewMetric === 'revenue' ? 'revenue' : 'volume'} name={language === 'en' ? (viewMetric === 'revenue' ? 'Gross Revenue' : 'Gross Volume') : (viewMetric === 'revenue' ? 'إجمالي الإيرادات' : 'إجمالي الحجم')} fill="#191342" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sales Office Comparison Section (B2C specific) */}
      {officeType === 'B2C' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {language === 'en' ? 'B2C Sales Offices / Branches Performance' : 'أداء ومقارنة مكاتب وفروع مبيعات B2C'}
            </h3>
            <div className="flex items-center gap-2">
              {!officeCompare.enabled && (
                <button
                  onClick={() => officeCompare.toggle()}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    officeCompare.enabled
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                      : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                  }`}
                >
                  📊 {language === 'en' ? 'Compare' : 'مقارنة'}
                </button>
              )}
            </div>
          </div>

          {officeCompare.enabled && (
            <div className="flex flex-col gap-2.5 mb-4 p-2.5 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 text-[10px] font-semibold">
              {/* Compare Type Toggle */}
              <div className="flex border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5 mb-1 gap-2">
                <button
                  onClick={() => officeCompare.setType('quarter')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${officeCompare.type === 'quarter' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Quarter Compare' : 'مقارنة ربع سنوية'}
                </button>
                <button
                  onClick={() => officeCompare.setType('custom')}
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold transition-colors ${officeCompare.type === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-500'}`}
                >
                  {language === 'en' ? 'Custom Date Compare' : 'مقارنة تواريخ مخصصة'}
                </button>
              </div>

              {officeCompare.type === 'custom' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Base Period:' : 'فترة الأساس:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={officeCompare.custom.baseStart}
                        onChange={(e) => officeCompare.setCustom('baseStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={officeCompare.custom.baseEnd}
                        onChange={(e) => officeCompare.setCustom('baseEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] uppercase text-slate-400 font-extrabold">
                      {language === 'en' ? 'Compare Period:' : 'فترة المقارنة:'}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={officeCompare.custom.compStart}
                        onChange={(e) => officeCompare.setCustom('compStart', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="date"
                        value={officeCompare.custom.compEnd}
                        onChange={(e) => officeCompare.setCustom('compEnd', e.target.value)}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 justify-between">
                    <span className="text-[9px] uppercase text-slate-400 font-bold">
                      {language === 'en' ? 'Base:' : 'الأساس:'}
                    </span>
                    <div className="flex gap-1">
                      <select
                        value={officeCompare.quarter.q1Num}
                        onChange={(e) => officeCompare.setQuarter('q1Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={officeCompare.quarter.q1Year}
                        onChange={(e) => officeCompare.setQuarter('q1Year', Number(e.target.value))}
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
                        value={officeCompare.quarter.q2Num}
                        onChange={(e) => officeCompare.setQuarter('q2Num', Number(e.target.value))}
                        className="p-0.5 rounded border dark:bg-slate-800 dark:border-slate-700 bg-white dark:text-white text-[10px]"
                      >
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                      </select>
                      <select
                        value={officeCompare.quarter.q2Year}
                        onChange={(e) => officeCompare.setQuarter('q2Year', Number(e.target.value))}
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
                </>
              )}
            </div>
          )}

          {officeCompare.enabled ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={officeCompareData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
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
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : 'units'}`, '']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar
                    dataKey="q1Value"
                    name={officeCompare.labels.base}
                    fill="#128d46"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="q2Value"
                    name={officeCompare.labels.compare}
                    fill="#e97025"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={getOfficeData('combined')} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${viewMetric === 'revenue' ? 'EGP' : 'units'}`, '']}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      color: darkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="value" name={viewMetric === 'revenue' ? (language === 'en' ? 'Net Revenue' : 'صافي الإيرادات') : (language === 'en' ? 'Net Volume' : 'صافي الكميات')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tables: Top customer accounts & materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isSpecificSeller 
              ? (viewMetric === 'revenue' 
                  ? (language === 'en' ? 'All Accounts by Net Revenue' : 'جميع حسابات العملاء حسب صافي الإيرادات')
                  : (language === 'en' ? 'All Accounts by Sales Volume' : 'جميع حسابات العملاء حسب حجم المبيعات'))
              : (viewMetric === 'revenue'
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
                {([...(isSpecificSeller ? chartsCombined.topCustomers : chartsCombined.topCustomers.slice(0, 10))]
                  .sort((a, b) => viewMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume))
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

        {/* Top products */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isSpecificSeller 
              ? (viewMetric === 'revenue'
                  ? (language === 'en' ? 'All Materials by Net Revenue' : 'جميع الأصناف حسب صافي الإيرادات')
                  : (language === 'en' ? 'All High-Velocity Materials' : 'جميع الأصناف سريعة الحركة'))
              : (viewMetric === 'revenue'
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
                {([...(isSpecificSeller ? chartsCombined.topProducts : chartsCombined.topProducts.slice(0, 10))]
                  .sort((a, b) => viewMetric === 'revenue' ? b.revenue - a.revenue : b.volume - a.volume))
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

      {/* Customer Health & Attrition Matrix */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="mb-4">
          <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <ShieldAlert size={16} className="text-amber-500" />
            {language === 'en' ? 'Customer Health & Attrition Matrix' : 'مصفوفة صحة العملاء وتراجع المبيعات'}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            {language === 'en' ? 'Accounts lost (inactive 180D+) or displaying critical volume decline (>50% last 3 months).' : 'الحسابات المفقودة (غير نشطة +١٨٠ يوم) أو التي تظهر تراجعاً حرجاً (>٥٠٪ في آخر ٣ أشهر).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lost Accounts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-rose-500">{language === 'en' ? 'Lost Customer Accounts' : 'حسابات العملاء المفقودة'}</h4>
            <div className="space-y-2">
              {healthMatrix.lost.slice(0, 4).map((c, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-rose-950/15 border-rose-900/40 text-rose-300' : 'bg-rose-50/50 border-rose-100 text-rose-800'}`}>
                  <div>
                    <span className="font-bold text-xs block">{c.name}</span>
                    {c.customerCode && c.customerCode !== 'N/A' && (
                      <span className="text-[10px] text-rose-500 font-mono font-medium block">
                        Code: {c.customerCode}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Last Purchase:' : 'آخر شراء:'} {c.lastPurchase}</span>
                  </div>
                  <span className="font-semibold text-xs text-rose-500">{(c.lostValue/1000).toFixed(0)}k Qty</span>
                </div>
              ))}
              {healthMatrix.lost.length === 0 && (
                <p className="text-slate-400 text-xs italic">{language === 'en' ? 'All accounts healthy!' : 'جميع الحسابات نشطة وسليمة!'}</p>
              )}
            </div>
          </div>

          {/* Declining Accounts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-500">{language === 'en' ? 'Volume Attrition Accounts (>50% Decline)' : 'الحسابات التي تظهر تراجعاً كبيراً (>٥٠٪)'}</h4>
            <div className="space-y-2">
              {healthMatrix.declining.slice(0, 4).map((c, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' : 'bg-amber-50/50 border-amber-100 text-amber-800'}`}>
                  <div>
                    <span className="font-bold text-xs block">{c.name}</span>
                    {c.customerCode && c.customerCode !== 'N/A' && (
                      <span className="text-[10px] text-amber-500 font-mono font-medium block">
                        Code: {c.customerCode}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 mt-0.5 block">{language === 'en' ? 'Volume drop:' : 'تراجع الحجم:'} -{c.dropPercent}%</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-xs text-amber-500">{c.recentVol.toLocaleString()} Qty</span>
                  </div>
                </div>
              ))}
              {healthMatrix.declining.length === 0 && (
                <p className="text-slate-400 text-xs italic">{language === 'en' ? 'No clients showing volume drop.' : 'لا توجد حسابات تظهر تراجعاً في السحب.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* S&OP Proactive Insights: Push-To-Sell & Flight Risk Alerts */}
      {officeType !== 'B2C' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Push-to-Sell Inventory Opportunities */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="mb-4">
            <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <Boxes size={16} className="text-emerald-500" />
              {language === 'en' ? 'S&OP Push-to-Sell Inventory Opportunities' : 'مؤشرات التصفية وفرص ترويج المخزون الزائد'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              {language === 'en' 
                ? 'Excess stock SKUs (> 1.5x safety stock). Suggested margin discounts to accelerate shelf clearing.' 
                : 'الأصناف التي تتجاوز حد الأمان بـ ١.٥ ضعف. التخفيضات المقترحة لتسريع تصريف البضائع.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-3">{language === 'en' ? 'Material Description' : 'وصف المنتج'}</th>
                  <th className="p-3 text-right">{language === 'en' ? 'Excess Qty' : 'حجم الفائض'}</th>
                  <th className="p-3 text-center">{language === 'en' ? 'Discount' : 'الخصم المقترح'}</th>
                  <th className="p-3 text-center no-print">{language === 'en' ? 'Action' : 'إجراء'}</th>
                </tr>
              </thead>
              <tbody>
                {pushToSellItems.map((item, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                    <td className="p-3 font-bold">
                      <div>{item.name}</div>
                      {item.materialCode && item.materialCode !== 'N/A' && (
                        <span className="text-[10px] text-indigo-400 font-mono font-medium block">
                          Code: {item.materialCode} | UoM: {item.uom}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-amber-500">{item.excessQty.toLocaleString()}</td>
                    <td className="p-3 text-center font-extrabold text-emerald-500">{item.discount}%</td>
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={(e) => {
                          const btn = e.currentTarget;
                          const text = btn.innerText;
                          btn.innerText = language === 'en' ? 'Pushed ✓' : 'تم الإرسال ✓';
                          btn.disabled = true;
                          showToast({
                            type: 'success',
                            title: language === 'en' ? 'Surplus Clearance Deal Pushed' : 'تم إرسال العرض الترويجي',
                            message: language === 'en' 
                              ? `Deal for ${item.name} dispatched to all sales reps!` 
                              : `تم توزيع عرض صنف ${item.name} لجميع مندوبي المبيعات!`
                          });
                          setTimeout(() => {
                            btn.innerText = text;
                            btn.disabled = false;
                          }, 2000);
                        }}
                        className="px-2 py-0.5 bg-[#128d46] text-white rounded text-[8px] hover:bg-emerald-600 transition-colors uppercase font-bold disabled:opacity-75"
                      >
                        {language === 'en' ? 'Push Deal' : 'إرسال العرض'}
                      </button>
                    </td>
                  </tr>
                ))}
                {pushToSellItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      {language === 'en' ? 'No excess stock currently detected.' : 'لا يوجد بضاعة زائدة عن حد الأمان حالياً.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predictive Flight Risk Alerts */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between`}>
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                  <ShieldAlert size={16} className="text-rose-500" />
                  {language === 'en' ? 'Predictive Customer Flight Risk Alerts' : 'التنبؤ الذكي بمخاطر فقدان العملاء وتأخر الطلبات'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'en' 
                    ? 'Accounts exceeding 1.5x or 2.5x of their historical order cycle frequency.' 
                    : 'الحسابات التي تتخطى فترات شرائها المعتادة بمقدار ١.٥ ضعف أو ٢.٥ ضعف.'}
                </p>
              </div>

              {/* Severity Filter Tabs */}
              <div className="flex gap-1 no-print select-none text-[9px] font-bold">
                <button
                  onClick={() => { setFlightRiskFilter('All'); setFlightRiskPage(0); }}
                  className={`px-2 py-0.5 rounded transition-all border ${
                    flightRiskFilter === 'All'
                      ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 border-transparent shadow'
                      : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-500'
                  }`}
                >
                  {language === 'en' ? 'All' : 'الكل'} ({flightRiskAlerts.length})
                </button>
                <button
                  onClick={() => { setFlightRiskFilter('Critical'); setFlightRiskPage(0); }}
                  className={`px-2 py-0.5 rounded transition-all border ${
                    flightRiskFilter === 'Critical'
                      ? 'bg-rose-500 text-white border-rose-500 shadow'
                      : 'text-rose-400 border-slate-200 dark:border-slate-800 hover:text-rose-500'
                  }`}
                >
                  {language === 'en' ? 'Critical' : 'حرجة'} ({flightRiskAlerts.filter(a => a.color === 'rose').length})
                </button>
                <button
                  onClick={() => { setFlightRiskFilter('Medium'); setFlightRiskPage(0); }}
                  className={`px-2 py-0.5 rounded transition-all border ${
                    flightRiskFilter === 'Medium'
                      ? 'bg-amber-500 text-white border-amber-500 shadow'
                      : 'text-amber-500 border-slate-200 dark:border-slate-800 hover:text-amber-500'
                  }`}
                >
                  {language === 'en' ? 'Medium' : 'متوسطة'} ({flightRiskAlerts.filter(a => a.color === 'amber').length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                    <th className="p-3">{language === 'en' ? 'Customer Account' : 'حساب العميل'}</th>
                    <th className="p-3 text-right">{language === 'en' ? 'Order Cycle' : 'دورة الطلب المعتادة'}</th>
                    <th className="p-3 text-right">{language === 'en' ? 'Inactivity' : 'مدة الغياب'}</th>
                    <th className="p-3 text-center">{language === 'en' ? 'Risk Status' : 'مستوى الخطر'}</th>
                    <th className="p-3 text-center no-print">{language === 'en' ? 'Action' : 'إجراء'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedFlightAlerts.map((item, idx) => (
                    <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold">
                        <div>{item.name}</div>
                        {item.customerCode && item.customerCode !== 'N/A' && (
                          <span className="text-[10px] text-indigo-500 font-mono font-medium block">
                            Code: {item.customerCode}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">{item.avgCycle} {language === 'en' ? 'Days' : 'أيام'}</td>
                      <td className="p-3 text-right font-semibold text-rose-500">{item.recencyDays} {language === 'en' ? 'Days' : 'يوم'} ({item.multiplier}x)</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          item.color === 'rose' 
                            ? 'bg-rose-500/10 text-rose-500' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {item.risk}
                        </span>
                      </td>
                      <td className="p-3 text-center no-print">
                        <button
                          onClick={(e) => {
                            const btn = e.currentTarget;
                            const text = btn.innerText;
                            btn.innerText = language === 'en' ? 'Scheduled ✓' : 'تم التحديد ✓';
                            btn.disabled = true;
                            showToast({
                              type: 'info',
                              title: language === 'en' ? 'Review Call Scheduled' : 'تم تحديد مكالمة المراجعة',
                              message: language === 'en'
                                ? `Direct review call scheduled for ${item.name}. Rep notified.`
                                : `تم تحديد موعد لمكالمة مراجعة مع ${item.name} وإشعار المندوب.`
                            });
                            setTimeout(() => {
                              btn.innerText = text;
                              btn.disabled = false;
                            }, 2000);
                          }}
                          className="px-2 py-0.5 bg-indigo-500 text-white rounded text-[8px] hover:bg-indigo-600 transition-colors uppercase font-bold disabled:opacity-75"
                        >
                          {language === 'en' ? 'Review' : 'مراجعة'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredFlightAlerts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {language === 'en' ? 'No high flight-risk accounts identified for this filter.' : 'لا توجد حسابات معرضة للفقدان لهذا الفلتر حالياً.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalFlightRiskPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 no-print select-none text-[10px] font-bold text-slate-500">
              <button
                disabled={flightRiskPage === 0}
                onClick={() => setFlightRiskPage(p => Math.max(0, p - 1))}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  flightRiskPage === 0
                    ? 'text-slate-300 border-slate-100 dark:text-slate-700 dark:border-slate-800/60 cursor-not-allowed'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Previous' : 'السابق'}
              </button>
              <span>
                {language === 'en'
                  ? `Page ${flightRiskPage + 1} of ${totalFlightRiskPages}`
                  : `الصفحة ${flightRiskPage + 1} من ${totalFlightRiskPages}`}
              </span>
              <button
                disabled={flightRiskPage >= totalFlightRiskPages - 1}
                onClick={() => setFlightRiskPage(p => Math.min(totalFlightRiskPages - 1, p + 1))}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  flightRiskPage >= totalFlightRiskPages - 1
                    ? 'text-slate-300 border-slate-100 dark:text-slate-700 dark:border-slate-800/60 cursor-not-allowed'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-slate-600'
                }`}
              >
                {language === 'en' ? 'Next' : 'التالي'}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Supply & Quality Risks: Product Concentration & Returns */}
      <div className={`grid gap-6 ${officeType === 'B2C' || officeType === 'Horeca Team' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        
        {/* Product Concentration */}
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
                  {chartsCombined.riskMatrix.filter(p => p.isHighRisk).map((p, idx) => (
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

        {/* Quality Returns */}
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
                {chartsCombined.highReturnItems.map((p, idx) => (
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
              {/* Local search in matrix */}
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

              {/* View Mode Switcher */}
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
                    const totalVal = row.sums.Total || 1; // avoid divide by zero
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
                                  <span className="font-semibold block">{viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                                  <span className="text-[9px] text-slate-400 block">{pct.toFixed(1)}%</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-indigo-500 block">{pct.toFixed(1)}%</span>
                                  <span className="text-[9px] text-slate-400 block">{viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                                </>
                              )}
                              {/* Mini progress indicator */}
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1 max-w-[80px] ml-auto">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full" 
                                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                                />
                              </div>
                            </td>
                          );
                        })}
                        {/* Group Total cell */}
                        <td className="p-3 text-right bg-indigo-50/20 dark:bg-indigo-950/10 font-bold">
                          <span className="block">{viewMetric === 'revenue' ? formatVal(row.sums.Total) : `${row.sums.Total.toLocaleString()} Qty`}</span>
                          <span className="text-[9px] text-slate-400 block">100%</span>
                        </td>
                      </tr>
                    );
                  });
                })()}
                
                {/* Total Row */}
                {matrixData.rows.length > 0 && (
                  <tr className={`${darkMode ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-100/60 text-slate-800'} font-black text-[11px]`}>
                    <td className="p-3 uppercase">{language === 'en' ? 'Grand Total' : 'الإجمالي الكلي'}</td>
                    {['Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce', 'B2C'].map(offKey => {
                      const val = matrixData.officeTotals[offKey] || 0;
                      const grand = matrixData.grandTotal || 1;
                      const pct = (val / grand) * 100;
                      return (
                        <td key={offKey} className="p-3 text-right">
                          <span className="block">{viewMetric === 'revenue' ? formatVal(val) : `${val.toLocaleString()} Qty`}</span>
                          <span className="text-[9px] text-slate-400 block">{pct.toFixed(1)}% of B2C</span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-right bg-indigo-100/30 dark:bg-indigo-950/30 font-black">
                      <span className="block">{viewMetric === 'revenue' ? formatVal(matrixData.grandTotal) : `${matrixData.grandTotal.toLocaleString()} Qty`}</span>
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
          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-[#128d46]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#128d46]" />
              {language === 'en' ? 'I. Performance & Volume Momentum' : 'أولاً. أداء وحجم المبيعات'}
            </h4>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {executiveBriefing.momentum}
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {language === 'en' ? 'II. Churn & Logistics Risks' : 'ثانياً. مخاطر التراجع والشحن اللوجستي'}
            </h4>
            <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
              {executiveBriefing.retention}
            </p>
          </div>

          {/* Section 3 */}
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

      {/* Customer material spending matrix page */}
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
