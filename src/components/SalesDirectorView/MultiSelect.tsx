import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  language: 'en' | 'ar';
  darkMode: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
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
