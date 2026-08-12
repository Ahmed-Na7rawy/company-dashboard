import React from 'react';
import { X, Send, Bot, RotateCcw, Copy, Download, FileText, BarChart2, AlertTriangle, Zap } from 'lucide-react';
import type { ChatMessage, ProactiveInsight, ChartConfig } from './index';
import { fmtRevenue, fmtNum, getSuggestedQuestions } from './intents';
import { exportChatToPDF, exportChatToCSV, exportChartAsPNG } from './exportUtils';

interface ChatWindowProps {
  isOpen: boolean;
  handleClose: () => void;
  messages: ChatMessage[];
  isTyping: boolean;
  suggestedQuestions: string[];
  handleSend: (query: string) => void;
  handleClear: () => void;
  handleCopyMessage: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  proactiveInsights: ProactiveInsight[];
  dismissInsight: (id: string) => void;
  language: 'en' | 'ar';
  darkMode: boolean;
  isRTL: boolean;
  role: string;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedOffice: string;
  setSelectedOffice: (o: string) => void;
  selectedProduct: string;
  setSelectedProduct: (p: string) => void;
  filterOptions: {
    years: string[];
    months: string[];
    offices: string[];
    products: string[];
  };
}

function MiniBarChart({ config, lang }: { config: ChartConfig; lang: 'en' | 'ar' }) {
  const maxVal = Math.max(...config.data.map(d => d.value), 1);
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

function MessageText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
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

export const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  handleClose,
  messages,
  isTyping,
  suggestedQuestions,
  handleSend,
  handleClear,
  handleCopyMessage,
  messagesEndRef,
  proactiveInsights,
  dismissInsight,
  language,
  darkMode,
  isRTL,
  role,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedOffice,
  setSelectedOffice,
  selectedProduct,
  setSelectedProduct,
  filterOptions
}) => {
  const panel = darkMode ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';
  const header = darkMode ? 'bg-gradient-to-r from-[#0e7037] to-[#128d46]' : 'bg-gradient-to-r from-[#128d46] to-[#16a854]';
  const msgArea = darkMode ? 'bg-slate-950/40' : 'bg-slate-50/80';

  const [inputVal, setInputVal] = React.useState('');

  const onSendSubmit = () => {
    if (inputVal.trim()) {
      handleSend(inputVal.trim());
      setInputVal('');
    }
  };

  return (
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
          {messages.length > 0 && (
            <>
              <button
                onClick={() => handleCopyMessage(messages.map(m => `${m.role === 'user' ? 'You' : 'Bot'}: ${m.text}`).join('\n\n'))}
                title={language === 'en' ? 'Copy chat' : 'نسخ المحادثة'}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => exportChatToCSV(messages, language)}
                title={language === 'en' ? 'Export CSV' : 'تصدير CSV'}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => exportChatToPDF(messages, language, darkMode)}
                title={language === 'en' ? 'Export PDF' : 'تصدير PDF'}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}
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
        {/* Proactive Insights Banner */}
        {proactiveInsights.length > 0 && (
          <div className="flex flex-col gap-2 mb-3 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl animate-slide-in">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{language === 'en' ? 'Smart Insights' : 'رؤى ذكية'}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {proactiveInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-2 p-2 bg-white/5 dark:bg-slate-900/30 rounded-lg border border-emerald-500/10">
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    insight.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    insight.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {insight.type === 'decline' && <AlertTriangle className="w-3 h-3" />}
                    {insight.type === 'growth' && <BarChart2 className="w-3 h-3" />}
                    {insight.type === 'anomaly' && <AlertTriangle className="w-3 h-3" />}
                    {insight.type === 'opportunity' && <Zap className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-slate-200 dark:text-slate-100">{insight.title}</div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{insight.description}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleSend(insight.actionQuery)}
                      className="text-[9px] px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors whitespace-nowrap"
                    >
                      {insight.actionLabel}
                    </button>
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="text-[9px] p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title={language === 'en' ? 'Dismiss' : 'تجاهل'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              {msg.chart && (
                <>
                  <MiniBarChart config={msg.chart} lang={language} />
                  <button
                    onClick={() => exportChartAsPNG(msg.chart!, language)}
                    className="mt-2 text-[9px] px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                    title={language === 'en' ? 'Export chart as PNG' : 'تصدير الرسم كصورة'}
                  >
                    <Download className="w-2.5 h-2.5" />
                    <span>{language === 'en' ? 'Save Chart' : 'حفظ الرسم'}</span>
                  </button>
                </>
              )}
              <div className={`flex items-center gap-1 mt-1 ${msg.role === 'user' ? 'text-emerald-200' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="text-[9px]">
                  {msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                {msg.role === 'bot' && (
                  <button
                    onClick={() => handleCopyMessage(msg.text)}
                    className="p-0.5 rounded hover:bg-white/10 dark:hover:bg-slate-700 transition-colors"
                    title={language === 'en' ? 'Copy message' : 'نسخ الرسالة'}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
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

      {/* Input box */}
      <div className={`p-3 flex gap-2 border-t ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendSubmit()}
          placeholder={language === 'en' ? 'Ask a question...' : 'اسأل سؤالاً...'}
          className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none transition-all ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
          }`}
        />
        <button
          onClick={onSendSubmit}
          className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
