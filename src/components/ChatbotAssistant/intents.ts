import type { ProcessedRow } from './index';

export interface ChartConfig {
  data: { label: string; value: number }[];
  valueFormatter: 'revenue' | 'volume';
}

export interface IntentResponse {
  text: string;
  chart?: ChartConfig;
}

export type AnswerFn = (
  data: ProcessedRow[],
  lang: 'en' | 'ar',
  args: string,
  ctx?: { year: string; month: string; office: string; product: string }
) => string | IntentResponse;

export interface Intent {
  id: string;
  keywords_en: string[];
  keywords_ar: string[];
  handler: AnswerFn;
}

// Formatting Utilities
export function fmtRevenue(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  if (val >= 1_000_000) return (val / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 }) + (lang === 'ar' ? ' م.ج' : 'M EGP');
  if (val >= 1_000) return (val / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 }) + (lang === 'ar' ? ' ألف ج' : 'K EGP');
  return val.toLocaleString(locale, { maximumFractionDigits: 0 }) + (lang === 'ar' ? ' ج' : ' EGP');
}

export function fmtNum(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return val.toLocaleString(locale, { maximumFractionDigits: 0 });
}

export function fmtPct(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const sign = val >= 0 ? '+' : '';
  return sign + val.toLocaleString(locale, { maximumFractionDigits: 1 }) + '%';
}

// Helpers
export function groupByRevenue(data: ProcessedRow[], field: keyof ProcessedRow): [string, number][] {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = String(row[field] || 'Unknown');
      map[key] = (map[key] || 0) + row.Revenue;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

export function groupByVolume(data: ProcessedRow[], field: keyof ProcessedRow): [string, number][] {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = String(row[field] || 'Unknown');
      map[key] = (map[key] || 0) + row.Volume;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

export function extractTopN(query: string): number {
  const m = query.match(/\d+/);
  return m ? Math.min(parseInt(m[0]), 20) : 5;
}

export function getMonthlyRevenue(data: ProcessedRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = `${row.DateObj.getFullYear()}-${String(row.DateObj.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + row.Revenue;
    }
  }
  return map;
}

export function getLastTwoMonths(data: ProcessedRow[]): { cur: { label: string; rev: number }; prev: { label: string; rev: number } } | null {
  const monthly = getMonthlyRevenue(data);
  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  if (sorted.length < 2) return null;
  const cur = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return {
    cur: { label: cur[0], rev: cur[1] },
    prev: { label: prev[0], rev: prev[1] },
  };
}

export function monthLabel(key: string, lang: 'en' | 'ar'): string {
  const [yr, mo] = key.split('-');
  const date = new Date(Number(yr), Number(mo) - 1, 1);
  return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
}

export function totalNetRevenue(data: ProcessedRow[]): number {
  return data.reduce((acc, row) => acc + (row.IsReturn ? -row.Revenue : row.Revenue), 0);
}

export function totalGrossRevenue(data: ProcessedRow[]): number {
  return data.filter(r => !r.IsReturn).reduce((acc, r) => acc + r.Revenue, 0);
}

export function totalReturnRevenue(data: ProcessedRow[]): number {
  return data.filter(r => r.IsReturn).reduce((acc, r) => acc + r.Revenue, 0);
}

export function totalVolume(data: ProcessedRow[]): number {
  return data.filter(r => !r.IsReturn).reduce((acc, r) => acc + r.Volume, 0);
}

export function uniqueCount(data: ProcessedRow[], field: keyof ProcessedRow): number {
  return new Set(data.map(r => r[field])).size;
}

export function generateTrendStory(data: ProcessedRow[], lang: 'en' | 'ar'): string {
  const monthly = getMonthlyRevenue(data);
  const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  
  if (sorted.length === 0) {
    return lang === 'en' ? 'No data available to analyze trends.' : 'لا توجد بيانات متاحة لتحليل الاتجاهات.';
  }

  const net = totalNetRevenue(data);
  let bestMonth = sorted[0];
  let worstMonth = sorted[0];

  for (const [key, rev] of sorted) {
    if (rev > bestMonth[1]) bestMonth = [key, rev];
    if (rev < worstMonth[1]) worstMonth = [key, rev];
  }

  const months = getLastTwoMonths(data);
  let recentGrowthStr = '';
  if (months && months.prev.rev > 0) {
    const change = ((months.cur.rev - months.prev.rev) / months.prev.rev) * 100;
    const direction = change >= 0 ? (lang === 'en' ? 'grown' : 'نمت') : (lang === 'en' ? 'shrunk' : 'انكمشت');
    recentGrowthStr = lang === 'en' 
      ? `Recently, comparing ${monthLabel(months.prev.label, lang)} to ${monthLabel(months.cur.label, lang)}, revenue has **${direction} by ${fmtPct(Math.abs(change), lang)}**.`
      : `مؤخراً، بمقارنة ${monthLabel(months.prev.label, lang)} مع ${monthLabel(months.cur.label, lang)}، **${direction} الإيرادات بنسبة ${fmtPct(Math.abs(change), lang)}**.`;
  }

  if (lang === 'en') {
    return `📈 **Data Story & Trend Analysis**\n\nLet's look at the story behind your data. Over the period analyzed, your total net revenue reached **${fmtRevenue(net, lang)}**.\n\nYour strongest month was **${monthLabel(bestMonth[0], lang)}** with ${fmtRevenue(bestMonth[1], lang)}, while **${monthLabel(worstMonth[0], lang)}** was the weakest at ${fmtRevenue(worstMonth[1], lang)}.\n\n${recentGrowthStr}`;
  }
  return `📈 **قصة البيانات وتحليل الاتجاهات**\n\nدعونا نلقي نظرة على القصة وراء بياناتك. خلال الفترة التي تم تحليلها، بلغ إجمالي صافي الإيرادات **${fmtRevenue(net, lang)}**.\n\nكان أقوى شهر هو **${monthLabel(bestMonth[0], lang)}** بإيرادات بلغت ${fmtRevenue(bestMonth[1], lang)}، بينما كان **${monthLabel(worstMonth[0], lang)}** هو الأضعف بـ ${fmtRevenue(worstMonth[1], lang)}.\n\n${recentGrowthStr}`;
}

export const INTENTS: Intent[] = [
  {
    id: 'TOTAL_REVENUE',
    keywords_en: ['total revenue', 'overall revenue', 'how much revenue', 'total sales', 'total income', 'gross revenue', 'revenue total'],
    keywords_ar: ['إجمالي الإيرادات', 'الإيرادات الكلية', 'إجمالي المبيعات', 'كم الإيرادات', 'مجموع الإيرادات', 'الدخل الكلي'],
    handler: (data, lang) => {
      const gross = totalGrossRevenue(data);
      const returns = totalReturnRevenue(data);
      const net = gross - returns;
      const rows = data.filter(r => !r.IsReturn).length;
      if (lang === 'en') {
        return `📊 **Revenue Summary**\n• Gross Revenue: **${fmtRevenue(gross, lang)}**\n• Returns: ${fmtRevenue(returns, lang)}\n• Net Revenue: **${fmtRevenue(net, lang)}**\n• Total Transactions: ${fmtNum(rows, lang)}`;
      }
      return `📊 **ملخص الإيرادات**\n• الإيرادات الإجمالية: **${fmtRevenue(gross, lang)}**\n• المرتجعات: ${fmtRevenue(returns, lang)}\n• صافي الإيرادات: **${fmtRevenue(net, lang)}**\n• إجمالي المعاملات: ${fmtNum(rows, lang)}`;
    },
  },
  {
    id: 'NET_REVENUE',
    keywords_en: ['net revenue', 'net sales', 'after returns', 'net income'],
    keywords_ar: ['صافي الإيرادات', 'صافي المبيعات', 'بعد المرتجعات', 'الصافي'],
    handler: (data, lang) => {
      const net = totalNetRevenue(data);
      if (lang === 'en') return `💰 Net Revenue (after returns): **${fmtRevenue(net, lang)}**`;
      return `💰 صافي الإيرادات (بعد المرتجعات): **${fmtRevenue(net, lang)}**`;
    },
  },
  {
    id: 'TOP_PRODUCT_REVENUE',
    keywords_en: ['top product', 'best product', 'highest product', 'top item', 'best selling product', 'product revenue', 'top products', 'products by revenue'],
    keywords_ar: ['أفضل منتج', 'أعلى منتج', 'أكثر منتج', 'أفضل مادة', 'المنتج الأول', 'منتج بالإيرادات', 'أفضل منتجات', 'منتجات من حيث الإيرادات'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByRevenue(data, 'ItemName').slice(0, n);
      if (top.length === 0) return lang === 'en' ? 'No product data available.' : 'لا توجد بيانات منتجات متاحة.';
      const header = lang === 'en' ? `🏆 Top ${n} Products by Revenue:` : `🏆 أفضل ${n} منتجات من حيث الإيرادات:`;
      const lines = top.map(([name, rev], i) => `${i + 1}. **${name}** — ${fmtRevenue(rev, lang)}`);
      return {
        text: header + '\n' + lines.join('\n'),
        chart: { data: top.map(([l, v]) => ({ label: l, value: v })), valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'TOP_PRODUCT_VOLUME',
    keywords_en: ['top product volume', 'best product volume', 'highest volume product', 'most sold product', 'product quantity', 'top product by quantity', 'top products volume'],
    keywords_ar: ['أفضل منتج حجماً', 'أعلى منتج كمية', 'أكثر منتج مبيعاً', 'كمية المنتج', 'أفضل منتجات حجماً'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByVolume(data, 'ItemName').slice(0, n);
      if (top.length === 0) return lang === 'en' ? 'No product data available.' : 'لا توجد بيانات منتجات متاحة.';
      const header = lang === 'en' ? `📦 Top ${n} Products by Volume:` : `📦 أفضل ${n} منتجات من حيث الكمية:`;
      const lines = top.map(([name, vol], i) => `${i + 1}. **${name}** — ${fmtNum(vol, lang)} units`);
      return {
        text: header + '\n' + lines.join('\n'),
        chart: { data: top.map(([l, v]) => ({ label: l, value: v })), valueFormatter: 'volume' }
      };
    },
  },
  {
    id: 'TOP_CUSTOMER',
    keywords_en: ['top customer', 'best customer', 'highest customer', 'top client', 'top account', 'customer revenue'],
    keywords_ar: ['أفضل عميل', 'أعلى عميل', 'أكبر عميل', 'أفضل حساب', 'أفضل زبون'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByRevenue(data, 'CustomerName').slice(0, n);
      if (top.length === 0) return lang === 'en' ? 'No customer data available.' : 'لا توجد بيانات عملاء متاحة.';
      const header = lang === 'en' ? `🤝 Top ${n} Customers by Revenue:` : `🤝 أفضل ${n} عملاء من حيث الإيرادات:`;
      const lines = top.map(([name, rev], i) => `${i + 1}. **${name}** — ${fmtRevenue(rev, lang)}`);
      return {
        text: header + '\n' + lines.join('\n'),
        chart: { data: top.map(([l, v]) => ({ label: l, value: v })), valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'TOP_SALESMAN',
    keywords_en: ['top salesman', 'best salesman', 'top sales rep', 'best rep', 'highest salesman', 'top performer', 'who is the top salesman', 'best performing rep'],
    keywords_ar: ['أفضل مندوب', 'أعلى مندوب', 'أفضل مبيعات', 'أفضل مندوب مبيعات', 'من هو أفضل مندوب', 'أفضل الباعة'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByRevenue(data, 'SalesmanName').slice(0, n);
      if (top.length === 0) return lang === 'en' ? 'No salesman data available.' : 'لا توجد بيانات مندوبين متاحة.';
      const header = lang === 'en' ? `🥇 Top ${n} Salespeople by Revenue:` : `🥇 أفضل ${n} مندوبين من حيث الإيرادات:`;
      const lines = top.map(([name, rev], i) => `${i + 1}. **${name}** — ${fmtRevenue(rev, lang)}`);
      return {
        text: header + '\n' + lines.join('\n'),
        chart: { data: top.map(([l, v]) => ({ label: l, value: v })), valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'MOM_COMPARISON',
    keywords_en: ['compare months', 'month comparison', 'month over month', 'mom', 'this month vs last month', 'monthly comparison', 'compare this month'],
    keywords_ar: ['مقارنة الأشهر', 'مقارنة الشهور', 'الشهر مقابل الشهر', 'هذا الشهر مقابل الشهر الماضي', 'مقارنة شهرية'],
    handler: (data, lang, args, ctx) => {
      const monthly = getMonthlyRevenue(data);
      let curLabel: string;
      let prevLabel: string;
      
      if (ctx && ctx.year !== 'All' && ctx.month !== 'All') {
        const y = parseInt(ctx.year);
        const m = parseInt(ctx.month);
        curLabel = `${y}-${String(m + 1).padStart(2, '0')}`;
        
        let py = y;
        let pm = m - 1;
        if (pm < 0) {
            pm = 11;
            py -= 1;
        }
        prevLabel = `${py}-${String(pm + 1).padStart(2, '0')}`;
      } else {
        const sorted = Object.keys(monthly).sort();
        if (sorted.length < 2) return lang === 'en' ? 'Not enough monthly data to compare.' : 'لا تتوفر بيانات شهرية كافية للمقارنة.';
        curLabel = sorted[sorted.length - 1];
        prevLabel = sorted[sorted.length - 2];
      }

      const curRev = monthly[curLabel] || 0;
      const prevRev = monthly[prevLabel] || 0;
      
      if (curRev === 0 && prevRev === 0) {
          return lang === 'en' ? 'No data found for the selected months.' : 'لم يتم العثور على بيانات للأشهر المحددة.';
      }
      
      const change = prevRev > 0 ? ((curRev - prevRev) / prevRev) * 100 : 0;
      const arrow = change >= 0 ? '📈' : '📉';
      const chartData = [
          { label: monthLabel(prevLabel, lang), value: prevRev },
          { label: monthLabel(curLabel, lang), value: curRev }
      ];

      if (lang === 'en') {
        return {
          text: `${arrow} **Month-over-Month Comparison**\n• ${monthLabel(curLabel, lang)}: **${fmtRevenue(curRev, lang)}**\n• ${monthLabel(prevLabel, lang)}: ${fmtRevenue(prevRev, lang)}\n• Change: **${fmtPct(change, lang)}**`,
          chart: { data: chartData, valueFormatter: 'revenue' }
        };
      }
      return {
        text: `${arrow} **مقارنة شهر بشهر**\n• ${monthLabel(curLabel, lang)}: **${fmtRevenue(curRev, lang)}**\n• ${monthLabel(prevLabel, lang)}: ${fmtRevenue(prevRev, lang)}\n• التغيير: **${fmtPct(change, lang)}**`,
        chart: { data: chartData, valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'YEARLY_COMPARISON',
    keywords_en: ['compare years', 'year over year', 'yearly comparison', 'yoy', 'compare this year', 'this year vs last year'],
    keywords_ar: ['مقارنة السنوات', 'مقارنة سنوية', 'السنة مقابل السنة', 'مقارنة هذه السنة', 'هذه السنة مقابل السنة الماضية'],
    handler: (data, lang, args, ctx) => {
      const yearly: Record<string, number> = {};
      for (const row of data) {
        if (!row.IsReturn) {
          const y = row.DateObj.getFullYear().toString();
          yearly[y] = (yearly[y] || 0) + row.Revenue;
        }
      }
      
      const sorted = Object.entries(yearly).sort((a, b) => a[0].localeCompare(b[0]));
      
      if (sorted.length === 0) {
        return lang === 'en' ? 'No yearly data available.' : 'لا تتوفر بيانات سنوية.';
      }
      
      const chartData = sorted.map(([l, v]) => ({ label: l, value: v }));
      
      let subtitleEn = '';
      let subtitleAr = '';
      if (ctx) {
        const filters = [];
        if (ctx.product !== 'All') filters.push(ctx.product);
        if (ctx.office !== 'All') filters.push(ctx.office);
        if (filters.length > 0) {
          subtitleEn = ` for ${filters.join(' - ')}`;
          subtitleAr = ` لـ ${filters.join(' - ')}`;
        }
      }
      
      if (lang === 'en') {
        const lines = sorted.map(([yr, rev]) => `• ${yr}: **${fmtRevenue(rev, lang)}**`);
        return {
          text: `📊 **Yearly Comparison${subtitleEn}**\n${lines.join('\n')}`,
          chart: { data: chartData, valueFormatter: 'revenue' }
        };
      }
      const lines = sorted.map(([yr, rev]) => `• ${yr}: **${fmtRevenue(rev, lang)}**`);
      return {
        text: `📊 **مقارنة السنوات${subtitleAr}**\n${lines.join('\n')}`,
        chart: { data: chartData, valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'MONTHLY_BREAKDOWN',
    keywords_en: ['monthly revenue', 'revenue by month', 'monthly breakdown', 'month breakdown', 'each month', 'per month'],
    keywords_ar: ['الإيرادات الشهرية', 'إيرادات كل شهر', 'تفصيل شهري', 'كل شهر', 'شهرياً'],
    handler: (data, lang) => {
      const monthly = getMonthlyRevenue(data);
      const sorted = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
      if (sorted.length === 0) return lang === 'en' ? 'No monthly data available.' : 'لا توجد بيانات شهرية.';
      const header = lang === 'en' ? '📅 Monthly Revenue Breakdown:' : '📅 تفصيل الإيرادات الشهرية:';
      const lines = sorted.slice(-12).map(([key, rev]) => `• ${monthLabel(key, lang)}: ${fmtRevenue(rev, lang)}`);
      return {
        text: header + '\n' + lines.join('\n'),
        chart: { data: sorted.slice(-12).map(([l, v]) => ({ label: monthLabel(l, lang), value: v })), valueFormatter: 'revenue' }
      };
    },
  },
  {
    id: 'TRENDS_STORY',
    keywords_en: ['trend', 'trends', 'story', 'storytelling', 'narrative', 'how are we doing', 'performance summary', 'analyze per month', 'monthly analysis', 'month analysis'],
    keywords_ar: ['اتجاه', 'اتجاهات', 'قصة', 'سرد', 'أداء', 'كيف حالنا', 'ملخص الأداء', 'تحليل شهري', 'تحليل الشهور'],
    handler: (data, lang) => {
      return generateTrendStory(data, lang);
    }
  },
  {
    id: 'SEGMENT_PERFORMANCE',
    keywords_en: ['segment', 'modern trade', 'traditional trade', 'pharmacy', 'pharmacies', 'channel', 'segment performance', 'by segment'],
    keywords_ar: ['قطاع', 'التجارة الحديثة', 'التجارة التقليدية', 'الصيدليات', 'أداء القطاعات', 'القنوات'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByRevenue(data, 'Segment').slice(0, Math.max(n, 5));
      if (top.length === 0) return lang === 'en' ? 'No segment data available.' : 'لا توجد بيانات قطاعات.';
      const total = top.reduce((s, [, r]) => s + r, 0);
      const header = lang === 'en' ? '🏪 Revenue by Segment:' : '🏪 الإيرادات حسب القطاع:';
      const lines = top.map(([seg, rev]) => {
        const pct = total > 0 ? ((rev / total) * 100).toFixed(1) : '0.0';
        return `• **${seg}**: ${fmtRevenue(rev, lang)} (${pct}%)`;
      });
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'REGIONAL_BREAKDOWN',
    keywords_en: ['region', 'office', 'sales office', 'area', 'regional', 'by region', 'by office', 'which region', 'highest region'],
    keywords_ar: ['منطقة', 'مكتب', 'مكتب المبيعات', 'المناطق', 'حسب المنطقة', 'أي منطقة', 'أعلى منطقة'],
    handler: (data, lang) => {
      const top = groupByRevenue(data, 'SalesOffice').slice(0, 10);
      if (top.length === 0) return lang === 'en' ? 'No regional data available.' : 'لا توجد بيانات مناطق.';
      const total = top.reduce((s, [, r]) => s + r, 0);
      const header = lang === 'en' ? '🗺️ Revenue by Sales Office/Region:' : '🗺️ الإيرادات حسب مكتب المبيعات:';
      const lines = top.map(([office, rev]) => {
        const pct = total > 0 ? ((rev / total) * 100).toFixed(1) : '0.0';
        return `• **${office}**: ${fmtRevenue(rev, lang)} (${pct}%)`;
      });
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'ITEM_GROUP',
    keywords_en: ['item group', 'product group', 'product category', 'category', 'by group', 'brand performance'],
    keywords_ar: ['مجموعة المنتجات', 'فئة المنتجات', 'تصنيف المنتج', 'أداء المجموعة', 'حسب الفئة'],
    handler: (data, lang) => {
      const top = groupByRevenue(data, 'ItemGroup').slice(0, 10);
      if (top.length === 0) return lang === 'en' ? 'No item group data.' : 'لا توجد بيانات مجموعات.';
      const header = lang === 'en' ? '📂 Revenue by Product Group:' : '📂 الإيرادات حسب مجموعة المنتجات:';
      const lines = top.map(([grp, rev], i) => `${i + 1}. **${grp}**: ${fmtRevenue(rev, lang)}`);
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'TOTAL_VOLUME',
    keywords_en: ['total volume', 'total quantity', 'units sold', 'total units', 'how many units', 'quantity sold'],
    keywords_ar: ['إجمالي الكمية', 'الكمية الكلية', 'الوحدات المباعة', 'كم وحدة', 'حجم المبيعات'],
    handler: (data, lang) => {
      const vol = totalVolume(data);
      if (lang === 'en') return `📦 Total Volume Sold: **${fmtNum(vol, lang)} units**`;
      return `📦 إجمالي الكمية المباعة: **${fmtNum(vol, lang)} وحدة**`;
    },
  },
  {
    id: 'RETURN_RATE',
    keywords_en: ['return rate', 'returns', 'how many returns', 'total returns', 'return percentage'],
    keywords_ar: ['معدل المرتجعات', 'المرتجعات', 'كم المرتجع', 'نسبة المرتجعات', 'الراجعات'],
    handler: (data, lang) => {
      const returns = data.filter(r => r.IsReturn);
      const gross = data.filter(r => !r.IsReturn);
      const rate = gross.length > 0 ? (returns.length / gross.length) * 100 : 0;
      const retRev = totalReturnRevenue(data);
      if (lang === 'en') {
        return `↩️ **Returns Summary**\n• Return transactions: ${fmtNum(returns.length, lang)}\n• Return rate: **${fmtPct(rate, lang)}**\n• Revenue impact: ${fmtRevenue(retRev, lang)}`;
      }
      return `↩️ **ملخص المرتجعات**\n• معاملات المرتجعات: ${fmtNum(returns.length, lang)}\n• نسبة المرتجعات: **${fmtPct(rate, lang)}**\n• أثر على الإيرادات: ${fmtRevenue(retRev, lang)}`;
    },
  },
  {
    id: 'CUSTOMER_COUNT',
    keywords_en: ['how many customers', 'number of customers', 'customer count', 'active customers', 'total customers'],
    keywords_ar: ['كم عدد العملاء', 'عدد العملاء', 'العملاء النشطين', 'إجمالي العملاء'],
    handler: (data, lang) => {
      const count = uniqueCount(data.filter(r => !r.IsReturn), 'CustomerName');
      if (lang === 'en') return `👥 Total Active Customers: **${fmtNum(count, lang)}**`;
      return `👥 إجمالي العملاء النشطين: **${fmtNum(count, lang)}**`;
    },
  },
  {
    id: 'PRODUCT_COUNT',
    keywords_en: ['how many products', 'number of products', 'product count', 'total products', 'how many items'],
    keywords_ar: ['كم عدد المنتجات', 'عدد المنتجات', 'إجمالي المنتجات', 'كم منتج'],
    handler: (data, lang) => {
      const count = uniqueCount(data.filter(r => !r.IsReturn), 'ItemName');
      if (lang === 'en') return `📦 Total Products in Portfolio: **${fmtNum(count, lang)}**`;
      return `📦 إجمالي المنتجات في المحفظة: **${fmtNum(count, lang)}**`;
    },
  },
  {
    id: 'SALESMAN_COUNT',
    keywords_en: ['how many salesmen', 'number of salespeople', 'sales team size', 'sales reps count'],
    keywords_ar: ['كم مندوب', 'عدد المندوبين', 'حجم فريق المبيعات', 'مندوبي المبيعات'],
    handler: (data, lang) => {
      const count = uniqueCount(data.filter(r => !r.IsReturn), 'SalesmanName');
      if (lang === 'en') return `👤 Sales Team Size: **${fmtNum(count, lang)} reps**`;
      return `👤 حجم فريق المبيعات: **${fmtNum(count, lang)} مندوب**`;
    },
  },
  {
    id: 'AVG_TRANSACTION',
    keywords_en: ['average transaction', 'avg revenue', 'average order value', 'avg order'],
    keywords_ar: ['متوسط المعاملة', 'متوسط الإيراد', 'متوسط قيمة الطلب', 'متوسط الفاتورة'],
    handler: (data, lang) => {
      const sales = data.filter(r => !r.IsReturn);
      const avg = sales.length > 0 ? totalGrossRevenue(data) / sales.length : 0;
      if (lang === 'en') return `💳 Average Transaction Value: **${fmtRevenue(avg, lang)}**`;
      return `💳 متوسط قيمة المعاملة: **${fmtRevenue(avg, lang)}**`;
    },
  },
  {
    id: 'TOP_CUSTOMER_VOLUME',
    keywords_en: ['top customer volume', 'customer volume', 'customer quantity', 'most units customer'],
    keywords_ar: ['أكبر عميل كمية', 'حجم العميل', 'كمية العميل'],
    handler: (data, lang, args) => {
      const n = extractTopN(args);
      const top = groupByVolume(data, 'CustomerName').slice(0, n);
      if (top.length === 0) return lang === 'en' ? 'No customer data.' : 'لا توجد بيانات عملاء.';
      const header = lang === 'en' ? `📦 Top ${n} Customers by Volume:` : `📦 أفضل ${n} عملاء من حيث الكمية:`;
      const lines = top.map(([name, vol], i) => `${i + 1}. **${name}** — ${fmtNum(vol, lang)} units`);
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'BEST_MONTH',
    keywords_en: ['best month', 'highest month', 'peak month', 'top month', 'which month'],
    keywords_ar: ['أفضل شهر', 'أعلى شهر', 'أكثر شهر', 'ذروة الشهر'],
    handler: (data, lang) => {
      const monthly = getMonthlyRevenue(data);
      const sorted = Object.entries(monthly).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return lang === 'en' ? 'No data.' : 'لا توجد بيانات.';
      const [key, rev] = sorted[0];
      if (lang === 'en') return `🌟 Best Month: **${monthLabel(key, lang)}** with ${fmtRevenue(rev, lang)}`;
      return `🌟 أفضل شهر: **${monthLabel(key, lang)}** بإيرادات ${fmtRevenue(rev, lang)}`;
    },
  },
  {
    id: 'WORST_MONTH',
    keywords_en: ['worst month', 'lowest month', 'weakest month'],
    keywords_ar: ['أسوأ شهر', 'أدنى شهر', 'أضعف شهر'],
    handler: (data, lang) => {
      const monthly = getMonthlyRevenue(data);
      const sorted = Object.entries(monthly).sort((a, b) => a[1] - b[1]);
      if (sorted.length === 0) return lang === 'en' ? 'No data.' : 'لا توجد بيانات.';
      const [key, rev] = sorted[0];
      if (lang === 'en') return `📉 Weakest Month: **${monthLabel(key, lang)}** with ${fmtRevenue(rev, lang)}`;
      return `📉 أضعف شهر: **${monthLabel(key, lang)}** بإيرادات ${fmtRevenue(rev, lang)}`;
    },
  },
  {
    id: 'REVENUE_BY_YEAR',
    keywords_en: ['revenue by year', 'yearly revenue', 'annual revenue', 'each year', 'per year'],
    keywords_ar: ['الإيرادات السنوية', 'إيرادات كل سنة', 'سنوياً', 'حسب السنة'],
    handler: (data, lang) => {
      const map: Record<string, number> = {};
      for (const row of data) {
        if (!row.IsReturn) {
          const yr = String(row.DateObj.getFullYear());
          map[yr] = (map[yr] || 0) + row.Revenue;
        }
      }
      const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
      if (sorted.length === 0) return lang === 'en' ? 'No data.' : 'لا توجد بيانات.';
      const header = lang === 'en' ? '📅 Annual Revenue:' : '📅 الإيرادات السنوية:';
      const lines = sorted.map(([yr, rev]) => `• **${yr}**: ${fmtRevenue(rev, lang)}`);
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'YOY_GROWTH',
    keywords_en: ['year over year', 'yoy', 'annual growth', 'year growth', 'growth rate'],
    keywords_ar: ['النمو السنوي', 'نمو عام على عام', 'معدل النمو السنوي'],
    handler: (data, lang) => {
      const map: Record<string, number> = {};
      for (const row of data) {
        if (!row.IsReturn) {
          const yr = String(row.DateObj.getFullYear());
          map[yr] = (map[yr] || 0) + row.Revenue;
        }
      }
      const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
      if (sorted.length < 2) return lang === 'en' ? 'Need at least 2 years of data.' : 'تحتاج سنتين على الأقل من البيانات.';
      const header = lang === 'en' ? '📈 Year-over-Year Revenue Growth:' : '📈 نمو الإيرادات عاماً بعام:';
      const lines: string[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const [yr, rev] = sorted[i];
        const [, prevRev] = sorted[i - 1];
        const change = prevRev > 0 ? ((rev - prevRev) / prevRev) * 100 : 0;
        const arrow = change >= 0 ? '↑' : '↓';
        lines.push(`• **${yr}**: ${fmtRevenue(rev, lang)} (${arrow} ${fmtPct(change, lang)})`);
      }
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'SALESMAN_PERF',
    keywords_en: ['salesperson performance', 'rep performance', 'sales performance', 'salesmen performance'],
    keywords_ar: ['أداء المندوبين', 'أداء المبيعات', 'أداء المندوب'],
    handler: (data, lang) => {
      const top = groupByRevenue(data, 'SalesmanName').slice(0, 8);
      if (top.length === 0) return lang === 'en' ? 'No salesman data.' : 'لا توجد بيانات مندوبين.';
      const total = top.reduce((s, [, r]) => s + r, 0);
      const header = lang === 'en' ? '👤 Salesperson Performance:' : '👤 أداء المندوبين:';
      const lines = top.map(([name, rev], i) => {
        const pct = total > 0 ? ((rev / total) * 100).toFixed(1) : '0';
        return `${i + 1}. **${name}**: ${fmtRevenue(rev, lang)} (${pct}%)`;
      });
      return header + '\n' + lines.join('\n');
    },
  },
  {
    id: 'B2B_PERFORMANCE',
    keywords_en: ['b2b', 'b2b sales', 'b2b revenue', 'b2b office'],
    keywords_ar: ['b2b', 'مبيعات b2b', 'إيرادات b2b'],
    handler: (data, lang) => {
      const b2b = data.filter(r => r.SalesOffice === 'B2B' && !r.IsReturn);
      const rev = b2b.reduce((s, r) => s + r.Revenue, 0);
      const vol = b2b.reduce((s, r) => s + r.Volume, 0);
      if (lang === 'en') return `🏢 **B2B Performance**\n• Revenue: **${fmtRevenue(rev, lang)}**\n• Volume: ${fmtNum(vol, lang)} units`;
      return `🏢 **أداء B2B**\n• الإيرادات: **${fmtRevenue(rev, lang)}**\n• الكمية: ${fmtNum(vol, lang)} وحدة`;
    },
  },
  {
    id: 'HORECA_PERFORMANCE',
    keywords_en: ['horeca', 'hotel', 'restaurant', 'cafe', 'hospitality'],
    keywords_ar: ['هوريكا', 'فندق', 'مطعم', 'كافيه', 'ضيافة'],
    handler: (data, lang) => {
      const horeca = data.filter(r => r.SalesOffice === 'Horeca Team' && !r.IsReturn);
      const rev = horeca.reduce((s, r) => s + r.Revenue, 0);
      const vol = horeca.reduce((s, r) => s + r.Volume, 0);
      if (lang === 'en') return `🍽️ **HORECA Performance**\n• Revenue: **${fmtRevenue(rev, lang)}**\n• Volume: ${fmtNum(vol, lang)} units`;
      return `🍽️ **أداء HORECA**\n• الإيرادات: **${fmtRevenue(rev, lang)}**\n• الكمية: ${fmtNum(vol, lang)} وحدة`;
    },
  },
  {
    id: 'MY_PERFORMANCE',
    keywords_en: ['my performance', 'my revenue', 'my sales', 'how am i doing', 'my results'],
    keywords_ar: ['أدائي', 'إيراداتي', 'مبيعاتي', 'نتائجي', 'كيف أدائي'],
    handler: (data, lang) => {
      const rev = totalGrossRevenue(data);
      const vol = totalVolume(data);
      const customers = uniqueCount(data.filter(r => !r.IsReturn), 'CustomerName');
      if (lang === 'en') {
        return `🎯 **Your Performance**\n• Revenue: **${fmtRevenue(rev, lang)}**\n• Volume: ${fmtNum(vol, lang)} units\n• Active Customers: ${fmtNum(customers, lang)}`;
      }
      return `🎯 **أدائك**\n• الإيرادات: **${fmtRevenue(rev, lang)}**\n• الكمية: ${fmtNum(vol, lang)} وحدة\n• العملاء النشطون: ${fmtNum(customers, lang)}`;
    },
  },
  {
    id: 'OVERVIEW',
    keywords_en: ['overview', 'summary', 'dashboard summary', 'quick summary', 'snapshot', 'tell me everything'],
    keywords_ar: ['نظرة عامة', 'ملخص', 'ملخص سريع', 'نظرة شاملة', 'أخبرني كل شيء'],
    handler: (data, lang) => {
      const gross = totalGrossRevenue(data);
      const net = totalNetRevenue(data);
      const vol = totalVolume(data);
      const customers = uniqueCount(data.filter(r => !r.IsReturn), 'CustomerName');
      const products = uniqueCount(data.filter(r => !r.IsReturn), 'ItemName');
      const salesmen = uniqueCount(data.filter(r => !r.IsReturn), 'SalesmanName');
      const months = getLastTwoMonths(data);
      const growth = months && months.prev.rev > 0 ? ((months.cur.rev - months.prev.rev) / months.prev.rev) * 100 : null;
      if (lang === 'en') {
        return `📊 **Dashboard Snapshot**\n• Gross Revenue: **${fmtRevenue(gross, lang)}**\n• Net Revenue: **${fmtRevenue(net, lang)}**\n• Total Volume: ${fmtNum(vol, lang)} units\n• Customers: ${fmtNum(customers, lang)}\n• Products: ${fmtNum(products, lang)}\n• Sales Reps: ${fmtNum(salesmen, lang)}${growth !== null ? `\n• MoM Growth: **${fmtPct(growth, lang)}**` : ''}`;
      }
      return `📊 **لمحة عامة عن لوحة التحكم**\n• الإيرادات الإجمالية: **${fmtRevenue(gross, lang)}**\n• صافي الإيرادات: **${fmtRevenue(net, lang)}**\n• إجمالي الكمية: ${fmtNum(vol, lang)} وحدة\n• العملاء: ${fmtNum(customers, lang)}\n• المنتجات: ${fmtNum(products, lang)}\n• المندوبون: ${fmtNum(salesmen, lang)}${growth !== null ? `\n• النمو الشهري: **${fmtPct(growth, lang)}**` : ''}`;
    },
  },
  {
    id: 'HELP',
    keywords_en: ['help', 'what can you do', 'what can you answer', 'how to use', 'what do you know', 'capabilities'],
    keywords_ar: ['مساعدة', 'ماذا تستطيع', 'ما الذي يمكنك', 'كيفية الاستخدام', 'ماذا تعرف', 'إمكانياتك'],
    handler: (_data, lang) => {
      if (lang === 'en') {
        return `🤖 **I can answer questions about:**\n• Total & net revenue\n• Top products, customers, salespeople\n• Month-over-month & year-over-year growth\n• Segment & regional breakdowns\n• Return rates & volumes\n• Team & portfolio statistics\n\nTry: "top 5 products", "compare months", "best salesman", "show segments"`;
      }
      return `🤖 **يمكنني الإجابة عن:**\n• الإيرادات الإجمالية والصافية\n• أفضل المنتجات والعملاء والمندوبين\n• النمو الشهري والسنوي\n• تفصيل القطاعات والمناطق\n• معدلات المرتجعات والكميات\n• إحصائيات الفريق والمحفظة\n\nجرب: "أفضل 5 منتجات"، "مقارنة الأشهر"، "أفضل مندوب"`;
    },
  },
  {
    id: 'GREETING',
    keywords_en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
    keywords_ar: ['مرحبا', 'السلام عليكم', 'أهلا', 'صباح الخير', 'مساء الخير'],
    handler: (_data, lang) => {
      if (lang === 'en') return `👋 Hello! I'm your **Apex Dashboard Assistant**. Ask me anything about revenue, products, customers, or performance.\n\nType "help" to see what I can do!`;
      return `👋 مرحباً! أنا **مساعد لوحة تحكم أبيكس**. اسألني أي شيء عن الإيرادات والمنتجات والعملاء والأداء.\n\nاكتب "مساعدة" لترى ما يمكنني فعله!`;
    },
  },
  {
    id: 'THANKS',
    keywords_en: ['thank you', 'thanks', 'great', 'awesome', 'perfect', 'good job'],
    keywords_ar: ['شكراً', 'شكرا', 'ممتاز', 'رائع', 'عظيم', 'أحسنت'],
    handler: (_data, lang) => {
      if (lang === 'en') return `😊 You're welcome! Feel free to ask anything else.`;
      return `😊 على الرحب والسعة! لا تتردد في طرح أي سؤال آخر.`;
    },
  },
  {
    id: 'SIDE_BY_SIDE',
    keywords_en: ['compare', 'vs', 'versus', 'side by side', 'compare products', 'compare salesmen', 'compare customers', 'compare regions'],
    keywords_ar: ['مقارنة', 'مقابل', 'جنباً لجنب', 'قارن المنتجات', 'قارن المندوبين', 'قارن العملاء', 'قارن المناطق'],
    handler: (data, lang, args) => {
      const query = args.toLowerCase();
      const products = Array.from(new Set(data.map(r => r.ItemName).filter(Boolean)));
      const salesmen = Array.from(new Set(data.map(r => r.SalesmanName).filter((v): v is string => Boolean(v))));
      const customers = Array.from(new Set(data.map(r => r.CustomerName).filter(Boolean)));
      const offices = Array.from(new Set(data.map(r => r.SalesOffice).filter((v): v is string => Boolean(v))));
      
      let entityType: keyof ProcessedRow = 'ItemName';
      let entity1: string = '';
      let entity2: string = '';
      
      for (const p of products) {
        if (query.includes(p.toLowerCase())) {
          entityType = 'ItemName';
          entity1 = p;
          break;
        }
      }
      if (!entity1) {
        for (const s of salesmen) {
          if (query.includes(s.toLowerCase())) {
            entityType = 'SalesmanName';
            entity1 = s;
            break;
          }
        }
      }
      if (!entity1) {
        for (const c of customers) {
          if (query.includes(c.toLowerCase())) {
            entityType = 'CustomerName';
            entity1 = c;
            break;
          }
        }
      }
      if (!entity1) {
        for (const o of offices) {
          if (query.includes(o.toLowerCase())) {
            entityType = 'SalesOffice';
            entity1 = o;
            break;
          }
        }
      }
      
      const vsMatch = query.match(/(?:vs|versus|compare|and|مقابل|وقارن)\s+(.+)$/i);
      if (vsMatch) {
        const rest = vsMatch[1].trim();
        if (entityType === 'ItemName') {
          for (const p of products) {
            if (rest.includes(p.toLowerCase()) && p !== entity1) { entity2 = p; break; }
          }
        } else if (entityType === 'SalesmanName') {
          for (const s of salesmen) {
            if (rest.includes(s.toLowerCase()) && s !== entity1) { entity2 = s; break; }
          }
        } else if (entityType === 'CustomerName') {
          for (const c of customers) {
            if (rest.includes(c.toLowerCase()) && c !== entity1) { entity2 = c; break; }
          }
        } else if (entityType === 'SalesOffice') {
          for (const o of offices) {
            if (rest.includes(o.toLowerCase()) && o !== entity1) { entity2 = o; break; }
          }
        }
      }
      
      if (!entity1) {
        return lang === 'en' 
          ? 'Please specify what to compare. Example: "compare Product A vs Product B" or "compare Ahmed vs Mohamed"'
          : 'يرجى تحديد ما تريد مقارنته. مثال: "قارن منتج أ مقابل منتج ب" أو "قارن أحمد مقابل محمد"';
      }
      
      if (!entity2) {
        const grouped = groupByRevenue(data, entityType as keyof ProcessedRow);
        const other = grouped.find(([name]) => name !== entity1);
        if (other) entity2 = other[0];
      }
      
      if (!entity2) {
        return lang === 'en' ? `Need a second ${entityType} to compare.` : `بحاجة إلى ${entityType} ثاني للمقارنة.`;
      }
      
      const getData = (entity: string) => {
        const filtered = data.filter(r => r[entityType as keyof ProcessedRow] === entity && !r.IsReturn);
        const rev = filtered.reduce((s, r) => s + r.Revenue, 0);
        const vol = filtered.reduce((s, r) => s + r.Volume, 0);
        const custs = new Set(filtered.map(r => r.CustomerName)).size;
        const avgOrder = filtered.length > 0 ? rev / filtered.length : 0;
        const monthlyRev: Record<string, number> = {};
        for (const row of filtered) {
          const key = `${row.DateObj.getFullYear()}-${String(row.DateObj.getMonth() + 1).padStart(2, '0')}`;
          monthlyRev[key] = (monthlyRev[key] || 0) + row.Revenue;
        }
        return { rev, vol, custs, avgOrder, monthlyRev, count: filtered.length };
      };
      
      const d1 = getData(entity1);
      const d2 = getData(entity2);
      
      const revDiff = d1.rev > 0 ? ((d1.rev - d2.rev) / d1.rev) * 100 : 0;
      
      const chartData = [
        { label: entity1, value: d1.rev },
        { label: entity2, value: d2.rev }
      ];
      
      const labelMap: Record<string, string> = {
        ItemName: lang === 'en' ? 'Product' : 'منتج',
        SalesmanName: lang === 'en' ? 'Salesman' : 'مندوب',
        CustomerName: lang === 'en' ? 'Customer' : 'عميل',
        SalesOffice: lang === 'en' ? 'Office' : 'مكتب'
      };
      const typeLabel = labelMap[entityType] || entityType;
      
      if (lang === 'en') {
        return {
          text: `⚖️ **Compare ${typeLabel}s: ${entity1} vs ${entity2}**\n\n` +
            `**${entity1}**\n` +
            `• Revenue: **${fmtRevenue(d1.rev, lang)}**\n` +
            `• Volume: ${fmtNum(d1.vol, lang)} units\n` +
            `• Customers: ${fmtNum(d1.custs, lang)}\n` +
            `• Avg Order: ${fmtRevenue(d1.avgOrder, lang)}\n` +
            `• Transactions: ${fmtNum(d1.count, lang)}\n\n` +
            `**${entity2}**\n` +
            `• Revenue: **${fmtRevenue(d2.rev, lang)}**\n` +
            `• Volume: ${fmtNum(d2.vol, lang)} units\n` +
            `• Customers: ${fmtNum(d2.custs, lang)}\n` +
            `• Avg Order: ${fmtRevenue(d2.avgOrder, lang)}\n` +
            `• Transactions: ${fmtNum(d2.count, lang)}\n\n` +
            `📊 **Revenue Difference: ${revDiff >= 0 ? '+' : ''}${fmtPct(revDiff, lang)}**`,
          chart: { data: chartData, valueFormatter: 'revenue' }
        };
      }
      return {
        text: `⚖️ **مقارنة ${typeLabel}ين: ${entity1} مقابل ${entity2}**\n\n` +
          `**${entity1}**\n` +
          `• الإيرادات: **${fmtRevenue(d1.rev, lang)}**\n` +
          `• الكمية: ${fmtNum(d1.vol, lang)} وحدة\n` +
          `• العملاء: ${fmtNum(d1.custs, lang)}\n` +
          `• متوسط الطلب: ${fmtRevenue(d1.avgOrder, lang)}\n` +
          `• المعاملات: ${fmtNum(d1.count, lang)}\n\n` +
          `**${entity2}**\n` +
          `• الإيرادات: **${fmtRevenue(d2.rev, lang)}**\n` +
          `• الكمية: ${fmtNum(d2.vol, lang)} وحدة\n` +
          `• العملاء: ${fmtNum(d2.custs, lang)}\n` +
          `• متوسط الطلب: ${fmtRevenue(d2.avgOrder, lang)}\n` +
          `• المعاملات: ${fmtNum(d2.count, lang)}\n\n` +
          `📊 **فرق الإيرادات: ${revDiff >= 0 ? '+' : ''}${fmtPct(revDiff, lang)}**`,
        chart: { data: chartData, valueFormatter: 'revenue' }
      };
    }
  }
];

export function parseFilters(query: string, data: ProcessedRow[], lang: 'en' | 'ar'): { filteredData: ProcessedRow[], filterSummary: string[] } {
  const q = query.toLowerCase();
  let filteredData = [...data];
  const summary: string[] = [];

  const yearMatch = q.match(/\b(202\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    filteredData = filteredData.filter(r => r.DateObj.getFullYear() === year);
    summary.push(lang === 'en' ? `Year: ${year}` : `السنة: ${year}`);
  }

  const uniqueItems = Array.from(new Set(data.map(r => r.ItemName)));
  const uniqueGroups = Array.from(new Set(data.map(r => r.ItemGroup || '')));
  
  let foundProduct = false;
  for (const item of uniqueItems) {
    if (q.includes(item.toLowerCase())) {
      filteredData = filteredData.filter(r => r.ItemName === item);
      summary.push(lang === 'en' ? `Product: ${item}` : `المنتج: ${item}`);
      foundProduct = true;
      break;
    }
  }
  
  if (!foundProduct) {
    for (const group of uniqueGroups) {
      if (group && q.includes(group.toLowerCase())) {
        filteredData = filteredData.filter(r => r.ItemGroup === group);
        summary.push(lang === 'en' ? `Category: ${group}` : `الفئة: ${group}`);
        break;
      }
    }
  }

  const uniqueOffices = Array.from(new Set(data.map(r => r.SalesOffice || '')));
  for (const office of uniqueOffices) {
    if (office && q.includes(office.toLowerCase())) {
      filteredData = filteredData.filter(r => r.SalesOffice === office);
      summary.push(lang === 'en' ? `Office: ${office}` : `المكتب: ${office}`);
      break;
    }
  }

  return { filteredData, filterSummary: summary };
}

export function matchIntent(query: string, lang: 'en' | 'ar'): Intent | null {
  const q = query.toLowerCase().trim();
  for (const intent of INTENTS) {
    const keywords = lang === 'ar' ? intent.keywords_ar : intent.keywords_en;
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) return intent;
  }
  for (const intent of INTENTS) {
    const allKw = [...intent.keywords_en, ...intent.keywords_ar];
    if (allKw.some(kw => q.includes(kw.toLowerCase()))) return intent;
  }
  return null;
}

export function getSuggestedQuestions(lang: 'en' | 'ar', role: string): string[] {
  const base_en = [
    'Show me total revenue',
    'Top 5 products by revenue',
    'Best salesman',
    'Data storytelling',
    'Compare months',
    'Compare years',
    'Revenue by region',
    'Segment performance',
  ];
  const base_ar = [
    'إجمالي الإيرادات',
    'أفضل 5 منتجات',
    'أفضل مندوب',
    'قصة البيانات',
    'مقارنة الأشهر',
    'مقارنة السنوات',
    'الإيرادات حسب المنطقة',
    'أداء القطاعات',
  ];
  if (role === 'salesperson') {
    if (lang === 'en') return ['My performance', 'My top customers', 'My top products', 'Show monthly revenue'];
    return ['أدائي', 'أفضل عملائي', 'أفضل منتجاتي', 'الإيرادات الشهرية'];
  }
  return lang === 'ar' ? base_ar : base_en;
}

export interface ProactiveInsight {
  id: string;
  type: 'decline' | 'growth' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  actionLabel: string;
  actionQuery: string;
  severity: 'high' | 'medium' | 'low';
  dataRef?: any;
}

export function generateProactiveInsights(data: ProcessedRow[], language: 'en' | 'ar'): ProactiveInsight[] {
  const insights: ProactiveInsight[] = [];
  const monthly = getMonthlyRevenue(data);
  const sortedMonths = Object.entries(monthly).sort((a, b) => a[0].localeCompare(b[0]));
  
  if (sortedMonths.length < 2) return insights;

  const topProducts = groupByRevenue(data, 'ItemName');
  if (topProducts.length > 0) {
    const topProduct = topProducts[0][0];
    const productData = data.filter(r => r.ItemName === topProduct && !r.IsReturn);
    const productMonthly: Record<string, number> = {};
    for (const row of productData) {
      const key = `${row.DateObj.getFullYear()}-${String(row.DateObj.getMonth() + 1).padStart(2, '0')}`;
      productMonthly[key] = (productMonthly[key] || 0) + row.Revenue;
    }
    const productSorted = Object.entries(productMonthly).sort((a, b) => a[0].localeCompare(b[0]));
    if (productSorted.length >= 3) {
      const last3 = productSorted.slice(-3);
      const trend = last3[2][1] - last3[0][1];
      const pctChange = last3[0][1] > 0 ? (trend / last3[0][1]) * 100 : 0;
      
      if (pctChange < -15) {
        insights.push({
          id: `decline-${topProduct}`,
          type: 'decline' as const,
          title: language === 'en' ? `⚠️ ${topProduct} declining` : `⚠️ ${topProduct} في تراجع`,
          description: language === 'en'
            ? `Your top product dropped ${Math.abs(pctChange).toFixed(0)}% over last 3 months (${fmtRevenue(last3[0][1], language)} → ${fmtRevenue(last3[2][1], language)})`
            : `منتجك الأول انخفض ${Math.abs(pctChange).toFixed(0)}% خلال 3 أشهر (${fmtRevenue(last3[0][1], language)} → ${fmtRevenue(last3[2][1], language)})`,
          actionLabel: language === 'en' ? 'Analyze product' : 'تحليل المنتج',
          actionQuery: language === 'en' ? `trend for ${topProduct}` : `اتجاه ${topProduct}`,
          severity: pctChange < -30 ? 'high' as const : 'medium' as const,
          dataRef: { product: topProduct, change: pctChange }
        });
      }
    }
  }

  const lastTwo = sortedMonths.slice(-2);
  if (lastTwo.length === 2 && lastTwo[0][1] > 0) {
    const momChange = ((lastTwo[1][1] - lastTwo[0][1]) / lastTwo[0][1]) * 100;
    if (momChange < -10) {
      insights.push({
        id: 'overall-decline',
        type: 'decline' as const,
        title: language === 'en' ? '📉 Revenue dropping' : '📉 الإيرادات تنخفض',
        description: language === 'en'
          ? `Month-over-month revenue fell ${Math.abs(momChange).toFixed(1)}% (${fmtRevenue(lastTwo[0][1], language)} → ${fmtRevenue(lastTwo[1][1], language)})`
          : `الإيرادات انخفضت ${Math.abs(momChange).toFixed(1)}% شهرياً (${fmtRevenue(lastTwo[0][1], language)} → ${fmtRevenue(lastTwo[1][1], language)})`,
        actionLabel: language === 'en' ? 'View monthly breakdown' : 'عرض التفصيل الشهري',
        actionQuery: language === 'en' ? 'monthly breakdown' : 'تفصيل شهري',
        severity: momChange < -20 ? 'high' as const : 'medium' as const,
        dataRef: { change: momChange }
      });
    } else if (momChange > 15) {
      insights.push({
        id: 'overall-growth',
        type: 'growth' as const,
        title: language === 'en' ? '📈 Strong growth!' : '📈 نمو قوي!',
        description: language === 'en'
          ? `Revenue jumped ${momChange.toFixed(1)}% MoM (${fmtRevenue(lastTwo[0][1], language)} → ${fmtRevenue(lastTwo[1][1], language)})`
          : `الإيرادات قفزت ${momChange.toFixed(1)}% شهرياً (${fmtRevenue(lastTwo[0][1], language)} → ${fmtRevenue(lastTwo[1][1], language)})`,
        actionLabel: language === 'en' ? 'See what drove it' : 'رؤية المحرك',
        actionQuery: language === 'en' ? 'top products this month' : 'أفضل منتجات هذا الشهر',
        severity: 'medium' as const,
        dataRef: { change: momChange }
      });
    }
  }

  const returns = data.filter(r => r.IsReturn);
  const sales = data.filter(r => !r.IsReturn);
  if (sales.length > 0) {
    const returnRate = (returns.length / sales.length) * 100;
    if (returnRate > 5) {
      insights.push({
        id: 'high-returns',
        type: 'anomaly' as const,
        title: language === 'en' ? `↩️ High return rate: ${returnRate.toFixed(1)}%` : `↩️ معدل مرتجعات عالي: ${returnRate.toFixed(1)}%`,
        description: language === 'en'
          ? `${returns.length} return transactions out of ${sales.length} sales. Revenue impact: ${fmtRevenue(totalReturnRevenue(data), language)}`
          : `${returns.length} معاملة مرتجع من ${sales.length} مبيعات. أثر على الإيرادات: ${fmtRevenue(totalReturnRevenue(data), language)}`,
        actionLabel: language === 'en' ? 'Analyze returns' : 'تحليل المرتجعات',
        actionQuery: language === 'en' ? 'return rate' : 'معدل المرتجعات',
        severity: returnRate > 10 ? 'high' as const : 'medium' as const,
        dataRef: { rate: returnRate }
      });
    }
  }

  return insights.slice(0, 3);
}
