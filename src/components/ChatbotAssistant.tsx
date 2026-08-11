import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, X, Send, Bot, ChevronDown, Sparkles, RotateCcw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProcessedRow {
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
  UoM: string;
  DateObj: Date;
  Volume: number;
  IsReturn: boolean;
}

interface ChartConfig {
  data: { label: string; value: number }[];
  valueFormatter: 'revenue' | 'volume';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  chart?: ChartConfig;
  timestamp: Date;
}

interface ChatbotAssistantProps {
  processedData: ProcessedRow[];
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  language: 'en' | 'ar';
  darkMode: boolean;
}

// ─── Formatting Utilities ────────────────────────────────────────────────────

function fmtRevenue(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  if (val >= 1_000_000) return (val / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 }) + (lang === 'ar' ? ' م.ج' : 'M EGP');
  if (val >= 1_000) return (val / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 }) + (lang === 'ar' ? ' ألف ج' : 'K EGP');
  return val.toLocaleString(locale, { maximumFractionDigits: 0 }) + (lang === 'ar' ? ' ج' : ' EGP');
}

function fmtNum(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  return val.toLocaleString(locale, { maximumFractionDigits: 0 });
}

function fmtPct(val: number, lang: 'en' | 'ar'): string {
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
  const sign = val >= 0 ? '+' : '';
  return sign + val.toLocaleString(locale, { maximumFractionDigits: 1 }) + '%';
}

// ─── Intent Engine ───────────────────────────────────────────────────────────

type IntentResponse = string | { text: string; chart?: ChartConfig };

type AnswerFn = (data: ProcessedRow[], lang: 'en' | 'ar', args: string, ctx?: { year: string, month: string, office: string, product: string }) => IntentResponse;

interface Intent {
  id: string;
  keywords_en: string[];
  keywords_ar: string[];
  handler: AnswerFn;
}

// Helper: group by field, sum revenue
function groupByRevenue(data: ProcessedRow[], field: keyof ProcessedRow): [string, number][] {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = String(row[field] || 'Unknown');
      map[key] = (map[key] || 0) + row.Revenue;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// Helper: group by field, sum volume
function groupByVolume(data: ProcessedRow[], field: keyof ProcessedRow): [string, number][] {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = String(row[field] || 'Unknown');
      map[key] = (map[key] || 0) + row.Volume;
    }
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// Helper: extract number from query like "top 3", "أفضل 5"
function extractTopN(query: string): number {
  const m = query.match(/\d+/);
  return m ? Math.min(parseInt(m[0]), 20) : 5;
}

// Helper: get monthly breakdown
function getMonthlyRevenue(data: ProcessedRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of data) {
    if (!row.IsReturn) {
      const key = `${row.DateObj.getFullYear()}-${String(row.DateObj.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + row.Revenue;
    }
  }
  return map;
}

// Helper: get last two months
function getLastTwoMonths(data: ProcessedRow[]): { cur: { label: string; rev: number }; prev: { label: string; rev: number } } | null {
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

// Helper: generate trend story
function generateTrendStory(data: ProcessedRow[], lang: 'en' | 'ar'): string {
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
  } else {
    return `📈 **قصة البيانات وتحليل الاتجاهات**\n\nدعونا نلقي نظرة على القصة وراء بياناتك. خلال الفترة التي تم تحليلها، بلغ إجمالي صافي الإيرادات **${fmtRevenue(net, lang)}**.\n\nكان أقوى شهر هو **${monthLabel(bestMonth[0], lang)}** بإيرادات بلغت ${fmtRevenue(bestMonth[1], lang)}، بينما كان **${monthLabel(worstMonth[0], lang)}** هو الأضعف بـ ${fmtRevenue(worstMonth[1], lang)}.\n\n${recentGrowthStr}`;
  }
}

// Helper: monthly labels for display
function monthLabel(key: string, lang: 'en' | 'ar'): string {
  const [yr, mo] = key.split('-');
  const date = new Date(Number(yr), Number(mo) - 1, 1);
  return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
}

// Helper: total net revenue (sales - returns)
function totalNetRevenue(data: ProcessedRow[]): number {
  return data.reduce((acc, row) => acc + (row.IsReturn ? -row.Revenue : row.Revenue), 0);
}

function totalGrossRevenue(data: ProcessedRow[]): number {
  return data.filter(r => !r.IsReturn).reduce((acc, r) => acc + r.Revenue, 0);
}

function totalReturnRevenue(data: ProcessedRow[]): number {
  return data.filter(r => r.IsReturn).reduce((acc, r) => acc + r.Revenue, 0);
}

function totalVolume(data: ProcessedRow[]): number {
  return data.filter(r => !r.IsReturn).reduce((acc, r) => acc + r.Volume, 0);
}

function uniqueCount(data: ProcessedRow[], field: keyof ProcessedRow): number {
  return new Set(data.map(r => r[field])).size;
}

// ─── Intent Definitions ──────────────────────────────────────────────────────

const INTENTS: Intent[] = [
  // 1. Total Revenue
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
  // 2. Net Revenue
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
  // 3. Top Product by Revenue
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
  // 4. Top Product by Volume
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
  // 5. Top Customer by Revenue
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
  // 6. Top Salesman
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
  // 7. Month-over-Month Comparison
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
  // 7.5. Yearly Comparison
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
  // 8. Monthly Revenue Breakdown
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
  // 9. Trends and Storytelling
  {
    id: 'TRENDS_STORY',
    keywords_en: ['trend', 'trends', 'story', 'storytelling', 'narrative', 'how are we doing', 'performance summary', 'analyze per month', 'monthly analysis', 'month analysis'],
    keywords_ar: ['اتجاه', 'اتجاهات', 'قصة', 'سرد', 'أداء', 'كيف حالنا', 'ملخص الأداء', 'تحليل شهري', 'تحليل الشهور'],
    handler: (data, lang) => {
      return generateTrendStory(data, lang);
    }
  },
  // 9. Segment Performance
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
  // 10. Regional/Office Breakdown
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
  // 11. Item Group Performance
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
  // 12. Total Volume / Quantity
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
  // 13. Return Rate
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
  // 14. Number of Customers
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
  // 15. Number of Products
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
  // 16. Number of Salespeople
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
  // 17. Average Revenue per Transaction
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
  // 18. Top Customer by Volume
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
  // 19. Best Month
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
  // 20. Worst Month
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
  // 21. Revenue by Year
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
  // 22. Revenue growth year over year
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
  // 23. Salesperson performance
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
  // 24. B2B data
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
  // 25. HORECA
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
  // 26. My performance (for salesperson role)
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
  // 27. Data summary / overview
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
  // 28. What can you do / help
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
  // 29. Greeting
  {
    id: 'GREETING',
    keywords_en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
    keywords_ar: ['مرحبا', 'السلام عليكم', 'أهلا', 'صباح الخير', 'مساء الخير'],
    handler: (_data, lang) => {
      if (lang === 'en') return `👋 Hello! I'm your **Apex Dashboard Assistant**. Ask me anything about revenue, products, customers, or performance.\n\nType "help" to see what I can do!`;
      return `👋 مرحباً! أنا **مساعد لوحة تحكم أبيكس**. اسألني أي شيء عن الإيرادات والمنتجات والعملاء والأداء.\n\nاكتب "مساعدة" لترى ما يمكنني فعله!`;
    },
  },
  // 30. Thanks
  {
    id: 'THANKS',
    keywords_en: ['thank you', 'thanks', 'great', 'awesome', 'perfect', 'good job'],
    keywords_ar: ['شكراً', 'شكرا', 'ممتاز', 'رائع', 'عظيم', 'أحسنت'],
    handler: (_data, lang) => {
      if (lang === 'en') return `😊 You're welcome! Feel free to ask anything else.`;
      return `😊 على الرحب والسعة! لا تتردد في طرح أي سؤال آخر.`;
    },
  },
];

// ─── Filter Parser ────────────────────────────────────────────────────────────

function parseFilters(query: string, data: ProcessedRow[], lang: 'en' | 'ar'): { filteredData: ProcessedRow[], filterSummary: string[] } {
  const q = query.toLowerCase();
  let filteredData = [...data];
  const summary: string[] = [];

  // 1. Time range filter (years)
  const yearMatch = q.match(/\b(202\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    filteredData = filteredData.filter(r => r.DateObj.getFullYear() === year);
    summary.push(lang === 'en' ? `Year: ${year}` : `السنة: ${year}`);
  }

  // 2. Product filter (ItemName or ItemGroup)
  const uniqueItems = Array.from(new Set(data.map(r => r.ItemName)));
  const uniqueGroups = Array.from(new Set(data.map(r => r.ItemGroup || '')));
  
  let foundProduct = false;
  for (const item of uniqueItems) {
    if (q.includes(item.toLowerCase())) {
      filteredData = filteredData.filter(r => r.ItemName === item);
      summary.push(lang === 'en' ? `Product: ${item}` : `المنتج: ${item}`);
      foundProduct = true;
      break; // Only filter by one product at a time
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

  // 3. Office filter (SalesOffice)
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

// ─── Match Intent ─────────────────────────────────────────────────────────────

function matchIntent(query: string, lang: 'en' | 'ar'): Intent | null {
  const q = query.toLowerCase().trim();
  for (const intent of INTENTS) {
    const keywords = lang === 'ar' ? intent.keywords_ar : intent.keywords_en;
    if (keywords.some(kw => q.includes(kw.toLowerCase()))) return intent;
  }
  // Fallback: try all keywords regardless of current language
  for (const intent of INTENTS) {
    const allKw = [...intent.keywords_en, ...intent.keywords_ar];
    if (allKw.some(kw => q.includes(kw.toLowerCase()))) return intent;
  }
  return null;
}

// ─── Suggested Questions ──────────────────────────────────────────────────────

function getSuggestedQuestions(lang: 'en' | 'ar', role: string): string[] {
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

// ─── Mini Chart Component ────────────────────────────────────────────────────

function MiniBarChart({ config, lang }: { config: ChartConfig; lang: 'en' | 'ar' }) {
  const maxVal = Math.max(...config.data.map(d => d.value), 1); // Avoid div by 0
  
  return (
    <div className="mt-3 flex flex-col gap-2 w-full">
      {config.data.map((item, i) => {
        const pct = Math.max((item.value / maxVal) * 100, 2);
        const formattedVal = config.valueFormatter === 'revenue' 
          ? fmtRevenue(item.value, lang) 
          : fmtNum(item.value, lang);
          
        return (
          <div key={i} className="flex flex-col text-[10px]">
            <div className="flex justify-between text-slate-500 dark:text-slate-300 mb-1 px-0.5">
              <span className="truncate max-w-[120px] font-medium" title={item.label}>{item.label}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formattedVal}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                style={{ width: `${pct}%`, transition: 'width 1s ease-out' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Message Renderer (handles **bold** and newlines) ────────────────────────

function MessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Parse **bold** markdown
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i}>
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatbotAssistant({ processedData, currentUser, language, darkMode }: ChatbotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedOffice, setSelectedOffice] = useState<string>('All');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filterOptions = useMemo(() => {
    const years = Array.from(new Set(processedData.map(r => r.DateObj.getFullYear().toString()))).sort();
    const months = Array.from(new Set(processedData.map(r => r.DateObj.getMonth().toString()))).sort((a, b) => parseInt(a) - parseInt(b));
    const offices = Array.from(new Set(processedData.map(r => r.SalesOffice))).filter(Boolean).sort();
    
    let filteredForProducts = processedData;
    if (selectedOffice !== 'All') {
      filteredForProducts = processedData.filter(r => r.SalesOffice === selectedOffice);
    }
    const products = Array.from(new Set(filteredForProducts.map(r => r.ItemName))).filter(Boolean).sort();
    
    return { years, months, products, offices };
  }, [processedData, selectedOffice]);

  useEffect(() => {
    if (selectedProduct !== 'All' && !filterOptions.products.includes(selectedProduct)) {
      setSelectedProduct('All');
    }
  }, [filterOptions.products, selectedProduct]);

  const isRTL = language === 'ar';
  const role = currentUser?.role || 'admin';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);



  // Show welcome message on first open
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!hasOpened) {
      setHasOpened(true);
      const greeting: ChatMessage = {
        id: 'welcome',
        role: 'bot',
        text: language === 'en'
          ? `👋 Hello **${currentUser?.username || 'there'}**! I'm your **Apex Dashboard Assistant**.\n\nAsk me anything about your sales data — revenue, products, customers, or performance. Type "help" for a full list of capabilities.`
          : `👋 مرحباً **${currentUser?.username || ''}**! أنا **مساعد لوحة تحكم أبيكس**.\n\nاسألني أي شيء عن بيانات مبيعاتك — الإيرادات والمنتجات والعملاء والأداء. اكتب "مساعدة" لقائمة كاملة.`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [hasOpened, language, currentUser]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    setHasOpened(false);
  }, []);

  const handleSend = useCallback((query: string) => {
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate async "thinking"
    setTimeout(() => {
      let filteredData = [...processedData];
      const filterSummary: string[] = [];

      const intent = matchIntent(query, language);
      const ignoreTimeFilters = intent?.id === 'YEARLY_COMPARISON';
      const ignoreMonthFilter = intent?.id === 'MOM_COMPARISON' || ignoreTimeFilters;

      if (selectedYear !== 'All' && !ignoreTimeFilters) {
        filteredData = filteredData.filter(r => r.DateObj.getFullYear().toString() === selectedYear);
        filterSummary.push(language === 'en' ? `Year: ${selectedYear}` : `السنة: ${selectedYear}`);
      }
      if (selectedMonth !== 'All' && !ignoreMonthFilter) {
        filteredData = filteredData.filter(r => r.DateObj.getMonth().toString() === selectedMonth);
        const m = new Date(2000, parseInt(selectedMonth), 1).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' });
        filterSummary.push(language === 'en' ? `Month: ${m}` : `الشهر: ${m}`);
      }
      if (selectedOffice !== 'All') {
        filteredData = filteredData.filter(r => r.SalesOffice === selectedOffice);
        filterSummary.push(language === 'en' ? `Office: ${selectedOffice}` : `المكتب: ${selectedOffice}`);
      }
      if (selectedProduct !== 'All') {
        filteredData = filteredData.filter(r => r.ItemName === selectedProduct);
        filterSummary.push(language === 'en' ? `Product: ${selectedProduct}` : `المنتج: ${selectedProduct}`);
      }
      
      if (ignoreTimeFilters && (selectedYear !== 'All' || selectedMonth !== 'All')) {
        filterSummary.push(language === 'en' ? '(Comparing relative to selected Year)' : '(مقارنة بالنسبة للسنة المحددة)');
      } else if (ignoreMonthFilter && selectedMonth !== 'All') {
        filterSummary.push(language === 'en' ? '(Comparing relative to selected Month)' : '(مقارنة بالنسبة للشهر المحدد)');
      }

      let responseText: string;
      let chartConfig: ChartConfig | undefined;
      
      if (intent) {
        const intentRes = intent.handler(filteredData, language, query, { year: selectedYear, month: selectedMonth, office: selectedOffice, product: selectedProduct });
        if (typeof intentRes === 'string') {
          responseText = intentRes;
        } else {
          responseText = intentRes.text;
          chartConfig = intentRes.chart;
        }
        
        if (filterSummary.length > 0) {
          const prefix = language === 'en' 
            ? `_Filtered for: ${filterSummary.join(', ')}_\n\n`
            : `_تم التصفية حسب: ${filterSummary.join('، ')}_\n\n`;
          responseText = prefix + responseText;
        }
      } else {
        responseText = language === 'en'
          ? `🤔 I didn't quite understand that. Try asking about revenue, products, customers, or salespeople. Type "help" for examples.`
          : `🤔 لم أفهم ذلك جيداً. حاول السؤال عن الإيرادات أو المنتجات أو العملاء أو المندوبين. اكتب "مساعدة" لأمثلة.`;
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: responseText,
        chart: chartConfig,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 400);
  }, [isTyping, language, processedData, selectedYear, selectedMonth, selectedProduct, selectedOffice]);

  const suggestedQuestions = useMemo(() => getSuggestedQuestions(language, role), [language, role]);

  // ── Theming helpers ────────────────────────────────────────────────────────
  const panel = darkMode
    ? 'bg-slate-900 border-slate-700/60'
    : 'bg-white border-slate-200';

  const header = darkMode
    ? 'bg-gradient-to-r from-[#0e7037] to-[#128d46]'
    : 'bg-gradient-to-r from-[#128d46] to-[#16a854]';

  const msgArea = darkMode ? 'bg-slate-950/40' : 'bg-slate-50/80';

  const inputBg = darkMode
    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-emerald-500'
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#128d46]';

  const sendBtn = 'bg-[#128d46] hover:bg-[#0e7037] text-white';

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        id="chatbot-bubble"
        onClick={handleOpen}
        className={`chatbot-bubble no-print fixed bottom-6 z-[9999] shadow-xl transition-all duration-300 ${isRTL ? 'left-6' : 'right-6'} ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open chat assistant"
      >
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#128d46] to-[#0e7037] flex items-center justify-center shadow-lg shadow-emerald-900/40">
          <MessageCircle className="w-6 h-6 text-white" />
          <span className="chatbot-pulse absolute inset-0 rounded-full bg-[#128d46] opacity-60" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
      </button>

      {/* ── Chat Panel ── */}
      <div
        id="chatbot-panel"
        className={`chatbot-panel no-print fixed z-[9998] ${isRTL ? 'left-4' : 'right-4'} bottom-4
          w-[360px] max-w-[calc(100vw-2rem)]
          rounded-2xl border shadow-2xl shadow-black/20 flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          ${panel}
          ${isOpen ? 'chatbot-panel-open' : 'chatbot-panel-closed pointer-events-none'}`}
        style={{ height: isOpen ? '520px' : '0px', maxHeight: 'calc(100dvh - 2rem)' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className={`${header} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white text-xs font-bold leading-tight">
                {language === 'en' ? 'Apex Assistant' : 'مساعد أبيكس'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              title={language === 'en' ? 'Clear chat' : 'مسح المحادثة'}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              title={language === 'en' ? 'Close' : 'إغلاق'}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-3 space-y-3 ${msgArea} chatbot-messages`}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-slate-800' : 'bg-emerald-50'}`}>
                <Bot className="w-6 h-6 text-[#128d46]" />
              </div>
              <p className={`text-xs text-center font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'en' ? 'Ask me anything about your dashboard data' : 'اسألني أي شيء عن بيانات لوحتك'}
              </p>
              <div className="flex flex-col gap-1.5 w-full">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className={`w-full text-left text-[10px] px-3 py-2 rounded-xl border font-medium transition-all hover:scale-[1.01]
                      ${darkMode
                        ? 'border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-700 hover:bg-slate-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#128d46]/40 hover:bg-emerald-50/50'
                      }`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === 'user' ? (isRTL ? 'flex-row-reverse justify-end' : 'justify-end') : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#128d46] to-[#0e7037] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] text-[11px] leading-relaxed px-3 py-2 rounded-2xl shadow-sm
                  ${msg.role === 'user'
                    ? 'bg-[#128d46] text-white rounded-br-sm'
                    : darkMode
                      ? 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-sm'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'
                  }`}
              >
                <MessageText text={msg.text} />
                {msg.chart && <MiniBarChart config={msg.chart} lang={language} />}
                <div className={`text-[9px] mt-1 ${msg.role === 'user' ? 'text-emerald-200' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#128d46] to-[#0e7037] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className={`px-3 py-2.5 rounded-2xl rounded-bl-sm border text-xs flex items-center gap-1.5
                ${darkMode ? 'bg-slate-800 border-slate-700/60' : 'bg-white border-slate-200'}`}>
                <span className="chatbot-dot" />
                <span className="chatbot-dot" style={{ animationDelay: '0.2s' }} />
                <span className="chatbot-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Filter Dropdowns */}
        <div className={`px-3 py-2 grid grid-cols-2 gap-2 border-t flex-shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-white/90'}`}>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className={`text-[10px] p-1.5 rounded-lg border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="All">{language === 'en' ? 'All Years' : 'كل السنوات'}</option>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className={`text-[10px] p-1.5 rounded-lg border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="All">{language === 'en' ? 'All Months' : 'كل الشهور'}</option>
            {filterOptions.months.map(m => (
              <option key={m} value={m}>
                {new Date(2000, parseInt(m), 1).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' })}
              </option>
            ))}
          </select>
          <select value={selectedOffice} onChange={e => setSelectedOffice(e.target.value)} className={`text-[10px] p-1.5 rounded-lg border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="All">{language === 'en' ? 'All Offices' : 'كل المكاتب'}</option>
            {filterOptions.offices.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className={`text-[10px] p-1.5 rounded-lg border outline-none cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <option value="All">{language === 'en' ? 'All Products' : 'كل المنتجات'}</option>
            {filterOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Buttons Grid */}
        <div className={`px-3 py-2.5 flex flex-wrap gap-1.5 border-t flex-shrink-0 ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
          {getSuggestedQuestions(language, role).map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              disabled={isTyping}
              className={`text-[10px] font-medium px-2 py-1.5 rounded-lg border transition-all
                ${darkMode
                  ? 'border-slate-700 text-slate-300 hover:bg-emerald-900/30 hover:border-emerald-700 hover:text-emerald-400 bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-600 hover:text-emerald-700 bg-white'
                } disabled:opacity-50`}
            >
              {q}
            </button>
          ))}
          <button
            onClick={() => handleSend(language === 'en' ? 'help' : 'مساعدة')}
            disabled={isTyping}
            className={`text-[10px] font-medium px-2 py-1.5 rounded-lg border transition-all
              ${darkMode
                ? 'border-slate-700 text-slate-400 hover:border-emerald-700 hover:text-emerald-400 bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:border-[#128d46]/40 hover:text-[#128d46] bg-white'
              } disabled:opacity-50`}
          >
            {language === 'en' ? '? Help' : '? مساعدة'}
          </button>
        </div>
      </div>
    </>
  );
}
