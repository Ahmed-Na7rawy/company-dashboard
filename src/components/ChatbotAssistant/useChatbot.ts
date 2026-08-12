import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { ProcessedRow, ChatMessage, ProactiveInsight } from './index';
import {
  matchIntent,
  generateProactiveInsights,
} from './intents';

export function useChatbot({
  processedData,
  currentUser,
  language,
  isOpen
}: {
  processedData: ProcessedRow[];
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  language: 'en' | 'ar';
  isOpen: boolean;
}) {
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
    const offices = Array.from(new Set(processedData.map(r => r.SalesOffice))).filter((o): o is string => Boolean(o)).sort();
    
    let filteredForProducts = processedData;
    if (selectedOffice !== 'All') {
      filteredForProducts = processedData.filter(r => r.SalesOffice === selectedOffice);
    }
    const products = Array.from(new Set(filteredForProducts.map(r => r.ItemName))).filter((p): p is string => Boolean(p)).sort();
    
    return { years, months, products, offices };
  }, [processedData, selectedOffice]);

  useEffect(() => {
    if (selectedProduct !== 'All' && !filterOptions.products.includes(selectedProduct)) {
      setSelectedProduct('All');
    }
  }, [filterOptions.products, selectedProduct]);

  // Proactive Insights
  const [proactiveInsights, setProactiveInsights] = useState<ProactiveInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const insights = generateProactiveInsights(processedData, language);
      setProactiveInsights(insights.filter(i => !dismissedInsights.has(i.id)));
    }
  }, [processedData, language, isOpen, messages.length, dismissedInsights]);

  const dismissInsight = useCallback((id: string) => {
    setDismissedInsights(prev => new Set([...prev, id]));
  }, []);

  const handleCopyMessage = useCallback((text: string) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, ''));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Show welcome message on first open
  const handleOpenWelcome = useCallback(() => {
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
      let chartConfig: any;
      
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

  return {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    hasOpened,
    setHasOpened,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedProduct,
    setSelectedProduct,
    selectedOffice,
    setSelectedOffice,
    messagesEndRef,
    filterOptions,
    proactiveInsights,
    dismissInsight,
    handleCopyMessage,
    handleOpenWelcome,
    handleClear,
    handleSend
  };
}
