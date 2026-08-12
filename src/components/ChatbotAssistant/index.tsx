import React, { useState, useCallback, useMemo } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useChatbot } from './useChatbot';
import { ChatWindow } from './ChatWindow';
import { getSuggestedQuestions } from './intents';

export interface ProcessedRow {
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

export interface ChartConfig {
  data: { label: string; value: number }[];
  valueFormatter: 'revenue' | 'volume';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  chart?: ChartConfig;
  timestamp: Date;
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

interface ChatbotAssistantProps {
  processedData: ProcessedRow[];
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
  language: 'en' | 'ar';
  darkMode: boolean;
}

export default function ChatbotAssistant({
  processedData,
  currentUser,
  language,
  darkMode
}: ChatbotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);

  const chatbot = useChatbot({
    processedData,
    currentUser,
    language,
    isOpen
  });

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    chatbot.handleOpenWelcome();
  }, [chatbot]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const isRTL = language === 'ar';
  const role = currentUser?.role || 'admin';
  const suggestedQuestions = useMemo(() => getSuggestedQuestions(language, role), [language, role]);

  return (
    <>
      {/* Floating Bubble */}
      <button
        id="chatbot-bubble"
        onClick={handleOpen}
        className={`chatbot-bubble no-print fixed bottom-6 z-[9999] shadow-xl transition-all duration-300 ${
          isRTL ? 'left-6' : 'right-6'
        } ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
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

      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        handleClose={handleClose}
        messages={chatbot.messages}
        isTyping={chatbot.isTyping}
        suggestedQuestions={suggestedQuestions}
        handleSend={chatbot.handleSend}
        handleClear={chatbot.handleClear}
        handleCopyMessage={chatbot.handleCopyMessage}
        messagesEndRef={chatbot.messagesEndRef}
        proactiveInsights={chatbot.proactiveInsights}
        dismissInsight={chatbot.dismissInsight}
        language={language}
        darkMode={darkMode}
        isRTL={isRTL}
        role={role}
        selectedYear={chatbot.selectedYear}
        setSelectedYear={chatbot.setSelectedYear}
        selectedMonth={chatbot.selectedMonth}
        setSelectedMonth={chatbot.setSelectedMonth}
        selectedOffice={chatbot.selectedOffice}
        setSelectedOffice={chatbot.setSelectedOffice}
        selectedProduct={chatbot.selectedProduct}
        setSelectedProduct={chatbot.setSelectedProduct}
        filterOptions={chatbot.filterOptions}
      />
    </>
  );
}
export { ChatbotAssistant };
