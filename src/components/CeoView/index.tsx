import React, { useMemo } from 'react';
import CustomerMaterialTable from '../CustomerMaterialTable';
import type { ProcessedRow } from '../CustomerMaterialTable';
import { useScaleMode } from '../../hooks/useScaleMode';
import { useCeoData } from './useCeoData';
import { MultiSelect } from '../SalesDirectorView/MultiSelect';
import { CeoKpiCards } from './CeoKpiCards';
import { CeoCharts } from './CeoCharts';
import { OpportunityRadar } from './OpportunityRadar';

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

function CeoView(props: CeoViewProps) {
  const { language, darkMode, officeType } = {
    ...props,
    officeType: props.currentUser?.salesOffice || 'B2B'
  };
  
  const scaleMode = useScaleMode();
  const dataHook = useCeoData(props);

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

  // Sankey flow visualizer computations
  const flowVisualizer = useMemo(() => {
    const channels = ['B2B', 'B2C', 'Horeca Team'];
    const groupTotals: Record<string, number> = {};
    
    dataHook.filteredData.forEach(row => {
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
    
    dataHook.filteredData.forEach(row => {
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
  }, [dataHook.filteredData]);

  // Timeline ComposedChart data computations
  const timelineData = useMemo(() => {
    const monthlyBuckets: Record<string, { grossVol: number; returnsVol: number; grossRev: number; returnsRev: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    dataHook.filteredData.forEach(row => {
      const date = new Date(row.Date);
      const bucket = `${months[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;

      if (!monthlyBuckets[bucket]) {
        monthlyBuckets[bucket] = { grossVol: 0, returnsVol: 0, grossRev: 0, returnsRev: 0 };
      }

      const rev = Math.abs(row.Revenue || 0);
      if (row.IsReturn) {
        monthlyBuckets[bucket].returnsVol += row.Volume * (props.adminSettings.returnRateModifier / 8);
        monthlyBuckets[bucket].returnsRev += rev * (props.adminSettings.returnRateModifier / 8);
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
      .slice(-10);
  }, [dataHook.filteredData, props.adminSettings.returnRateModifier]);

  const timelineCompareData = useMemo(() => {
    if (!dataHook.timelineCompare) return [];

    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const getQuarterData = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const aggregated = [0, 0, 0];

      dataHook.filteredData.forEach(row => {
        const dateObj = row.DateObj || new Date(row.Date);
        if (dateObj.getFullYear() === year) {
          const m = dateObj.getMonth();
          if (m >= startMonth && m < startMonth + 3) {
            const idx = m - startMonth;
            const rev = Math.abs(row.Revenue || 0);
            const value = dataHook.chartMetric === 'revenue'
              ? (row.IsReturn ? -rev * (props.adminSettings.returnRateModifier / 8) : rev)
              : (row.IsReturn ? -row.Volume * (props.adminSettings.returnRateModifier / 8) : row.Volume);
            aggregated[idx] += value;
          }
        }
      });
      return aggregated;
    };

    const q1Vals = getQuarterData(dataHook.tq1Year, dataHook.tq1Num);
    const q2Vals = getQuarterData(dataHook.tq2Year, dataHook.tq2Num);

    const q1Start = (dataHook.tq1Num - 1) * 3;
    const q2Start = (dataHook.tq2Num - 1) * 3;

    return [0, 1, 2].map(idx => {
      const m1Name = language === 'en' ? monthsEn[q1Start + idx] : monthsAr[q1Start + idx];
      const m2Name = language === 'en' ? monthsEn[q2Start + idx] : monthsAr[q2Start + idx];
      return {
        month: language === 'en' ? `Month ${idx + 1} (${m1Name} vs ${m2Name})` : `الشهر ${idx + 1} (${m1Name} مقابل ${m2Name})`,
        q1Value: Math.round(q1Vals[idx]),
        q2Value: Math.round(q2Vals[idx]),
      };
    });
  }, [dataHook.filteredData, dataHook.timelineCompare, dataHook.tq1Year, dataHook.tq1Num, dataHook.tq2Year, dataHook.tq2Num, dataHook.chartMetric, props.adminSettings, language]);

  const segmentCompareData = useMemo(() => {
    if (!dataHook.segmentCompare) return [];

    const getQuarterSegments = (year: number, qNum: number) => {
      const startMonth = (qNum - 1) * 3;
      const sums: Record<string, number> = { 'Bio': 0, 'Solutions': 0, 'Additives': 0 };

      dataHook.filteredData.forEach(row => {
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

    const q1Sums = getQuarterSegments(dataHook.sq1Year, dataHook.sq1Num);
    const q2Sums = getQuarterSegments(dataHook.sq2Year, dataHook.sq2Num);

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
  }, [dataHook.filteredData, dataHook.segmentCompare, dataHook.sq1Year, dataHook.sq1Num, dataHook.sq2Year, dataHook.sq2Num, language]);

  const segmentData = useMemo(() => {
    const segs: Record<string, number> = {};
    dataHook.filteredData.forEach(row => {
      if (row.Segment && !row.IsReturn) {
        const val = dataHook.chartMetric === 'revenue' ? Math.abs(row.Revenue || 0) : row.Volume;
        segs[row.Segment] = (segs[row.Segment] || 0) + val;
      }
    });

    const COLORS = ['#128d46', '#191342', '#e97025'];
    const rawList = Object.entries(segs).map(([name, value], idx) => ({
      name: language === 'en' ? name : (name === 'Additives' ? 'الإضافات الغذائية' : name === 'Solutions' ? 'الحلول الغذائية' : 'المنتجات الحيوية'),
      value: Math.round(value),
      color: COLORS[idx % COLORS.length]
    }));

    if (props.chartDisplayMode === 'percent') {
      const total = rawList.reduce((acc, curr) => acc + curr.value, 0);
      return rawList.map(item => ({
        ...item,
        value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
      }));
    }

    return rawList;
  }, [dataHook.filteredData, language, dataHook.chartMetric, props.chartDisplayMode]);

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
              dataHook.setSelectedChannels([]);
              dataHook.setSelectedSegments([]);
              dataHook.setSelectedItemGroups([]);
              dataHook.setSelectedSalesmen([]);
            }}
            className="text-[10px] font-bold text-rose-500 hover:underline"
          >
            {language === 'en' ? 'Reset Filters' : 'إعادة ضبط الفلاتر'}
          </button>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${dataHook.isOfficeLocked ? '3' : '4'} gap-4`}>
          {!dataHook.isOfficeLocked && (
            <MultiSelect
              label={language === 'en' ? 'Sales Channel' : 'القناة البيعية'}
              options={dataHook.channelsList}
              selected={dataHook.selectedChannels}
              onChange={dataHook.setSelectedChannels}
              placeholder={language === 'en' ? 'All Channels' : 'جميع القنوات'}
              language={language}
              darkMode={darkMode}
            />
          )}

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

          <MultiSelect
            label={language === 'en' ? 'Sales Representative' : 'مسؤول المبيعات'}
            options={dataHook.salesmenList}
            selected={dataHook.selectedSalesmen}
            onChange={dataHook.setSelectedSalesmen}
            placeholder={language === 'en' ? 'All Salesmen' : 'جميع المناديب'}
            language={language}
            darkMode={darkMode}
          />
        </div>
      </div>

      <CeoKpiCards
        metrics={dataHook.metrics}
        sparklineData={dataHook.sparklineData}
        formatM={formatM}
        formatQty={formatQty}
        language={language}
        darkMode={darkMode}
      />

      <CeoCharts
        darkMode={darkMode}
        language={language}
        scaleMode={scaleMode}
        chartDisplayMode={props.chartDisplayMode}
        chartMetric={dataHook.chartMetric}
        setChartMetric={dataHook.setChartMetric}
        timelineCompare={dataHook.timelineCompare}
        setTimelineCompare={dataHook.setTimelineCompare}
        tq1Num={dataHook.tq1Num}
        setTq1Num={dataHook.setTq1Num}
        tq1Year={dataHook.tq1Year}
        setTq1Year={dataHook.setTq1Year}
        tq2Num={dataHook.tq2Num}
        setTq2Num={dataHook.setTq2Num}
        tq2Year={dataHook.tq2Year}
        setTq2Year={dataHook.setTq2Year}
        timelineCompareData={timelineCompareData}
        timelineData={timelineData}
        segmentCompare={dataHook.segmentCompare}
        setSegmentCompare={dataHook.setSegmentCompare}
        sq1Num={dataHook.sq1Num}
        setSq1Num={dataHook.setSq1Num}
        sq1Year={dataHook.sq1Year}
        setSq1Year={dataHook.setSq1Year}
        sq2Num={dataHook.sq2Num}
        setSq2Num={dataHook.setSq2Num}
        sq2Year={dataHook.sq2Year}
        setSq2Year={dataHook.setSq2Year}
        segmentCompareData={segmentCompareData}
        segmentData={segmentData}
        flowVisualizer={flowVisualizer}
      />

      <CustomerMaterialTable
        processedData={dataHook.filteredData}
        language={language}
        darkMode={darkMode}
      />

      <OpportunityRadar
        darkMode={darkMode}
        language={language}
        radarTab={dataHook.radarTab}
        setRadarTab={dataHook.setRadarTab}
        totalEstValue={dataHook.totalEstValue}
      />
    </div>
  );
}

export default React.memo(CeoView);
export { CeoView };
