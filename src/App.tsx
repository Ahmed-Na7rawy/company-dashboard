import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense, type ErrorInfo } from 'react';
import {
  TrendingUp, Users, Target, ShieldAlert, Sliders, LayoutDashboard,
  Sun, Moon, Printer, Search, Menu, X, ArrowLeftRight, LogOut, Lock, User, Boxes, Briefcase, Calendar, Clock
} from 'lucide-react';
import { useScaleMode, setGlobalScaleMode } from './hooks/useScaleMode';

// Helper to handle stale dynamic chunk imports after new deployments
function lazyWithRetry(componentImport: () => Promise<{ default: React.ComponentType<any> }>) {
  return React.lazy(async () => {
    const pageHasBeenRefreshed = window.sessionStorage.getItem('page-has-been-refreshed');
    try {
      const module = await componentImport();
      window.sessionStorage.setItem('page-has-been-refreshed', 'false');
      return module;
    } catch (error) {
      if (pageHasBeenRefreshed !== 'true') {
        window.sessionStorage.setItem('page-has-been-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; language: 'en' | 'ar' },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; language: 'en' | 'ar' }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    if (error?.message?.includes('Failed to fetch dynamically imported module') || error?.message?.includes('Importing a module script failed')) {
      const pageHasBeenRefreshed = window.sessionStorage.getItem('page-has-been-refreshed');
      if (pageHasBeenRefreshed !== 'true') {
        window.sessionStorage.setItem('page-has-been-refreshed', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isEn = this.props.language === 'en';
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="bg-slate-800/80 p-8 rounded-2xl border border-slate-700/60 max-w-md shadow-xl">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isEn ? 'New Version Available' : 'تحديث جديد متاح'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isEn 
                ? 'A new version of the dashboard has been deployed. Please refresh to load the latest update.' 
                : 'تمت ترقية المنصة إلى إصدار جديد. يرجى إعادة التحميل لمتابعة العمل.'}
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-left overflow-x-auto max-h-32">
                <p className="text-[10px] font-mono text-rose-400">{this.state.error.toString()}</p>
              </div>
            )}
            <button
              onClick={() => {
                window.sessionStorage.removeItem('page-has-been-refreshed');
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#128d46] hover:bg-[#0e7037] text-white rounded-xl text-xs font-extrabold transition-all shadow-md"
            >
              {isEn ? 'Reload Application' : 'إعادة تحميل المنصة'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// View components
import CeoView from './components/CeoView';
import SalesDirectorView from './components/SalesDirectorView';
import FinancialPlanningView from './components/FinancialPlanningView';
import SupplyChainView from './components/SupplyChainView';
import SellerProfilesView from './components/SellerProfilesView';
import CustomerProfilesView from './components/CustomerProfilesView';
import AdminControlView from './components/AdminControlView';
import ProductsView from './components/ProductsView';
import MarketingView from './components/MarketingView';
import HrView from './components/HrView';
import CompetitorAnalysisView from './components/CompetitorAnalysisView';
import BrandDashboardView from './components/BrandDashboardView';
import VitalitySnacksDashboardView from './components/VitalitySnacksDashboardView';
// Data is now loaded dynamically via fetch at runtime

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
  UoM: string;
}

interface ProcessedRow extends Transaction {
  DateObj: Date;
  Volume: number;
  IsReturn: boolean;
}

interface UserAccount {
  username: string;
  password: string;
  role: string; // 'admin' | 'ceo' | 'sales' | 'finance' | 'sc' | 'salesperson'
  salesmanName?: string;
  salesOffice?: string;
}

// Robust CSV parser to handle commas inside quoted strings
const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.split(/\r?\n/).filter((line: string) => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const headers = lines[0].split(splitRegex).map((h: string) => h.trim().replace(/"/g, ''));
  
  const parsedData: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(splitRegex);
    if (currentLine.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        const val = currentLine[index] ? currentLine[index].trim().replace(/"/g, '') : '';
        row[header] = val;
      });
      
      parsedData.push({
        Date: row['Bill. Date'] || row['Date'],
        CustomerName: row['Customer Name'] || row['CustomerName'],
        Segment: row['Company'] || row['Segment'],
        ItemName: row['Material Desc'] || row['ItemName'],
        Quantity: parseFloat(row['Qty'] || row['Quantity']) || 0,
        NetQuantity: parseFloat(row['Net Qty'] || row['NetQuantity']) || 0,
        BillType: row['Bill Type'] || row['BillType'],
        SalesmanName: row['Salesman Name'] || row['SalesmanName'] || undefined,
        ItemGroup: row['Item Group'] || row['ItemGroup'] || undefined,
        Revenue: 0,
        UoM: row['Base UoM'] || row['UoM'] || row['Unit'] || 'Units',
      });
    }
  }
  return parsedData;
};

export default function App() {
  const scaleMode = useScaleMode();
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);
  
  // Login & Session states
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; salesmanName?: string; salesOffice?: string } | null>(() => {
    const savedSession = localStorage.getItem('apex_active_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const savedUsers = localStorage.getItem('apex_users_db_v12');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        console.error('Failed to parse users database:', e);
      }
    }
    return [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'ceo', password: 'ceo123', role: 'ceo' },
      { username: 'finance', password: 'finance123', role: 'finance' },
      { username: 'b2b_director', password: 'b2b123', role: 'sales_b2b', salesOffice: 'B2B' },
      { username: 'b2c_director', password: 'b2c123', role: 'sales_b2c', salesOffice: 'B2C' },
      { username: 'horeca_director', password: 'horeca123', role: 'sales_horeca', salesOffice: 'Horeca Team' },
      { username: 'supply_chain', password: 'sc123', role: 'sc' },
      { username: 'marketing', password: 'mkt123', role: 'marketing' },
      { username: 'hr_director', password: 'hr123', role: 'hr' },
      { username: 'brand_manager', password: 'brand123', role: 'brand_manager', managedBrands: ['nova', 'zenith', 'vitality_snacks'] },
      { username: 'sales_rep', password: 'rep123', role: 'salesperson', salesmanName: 'John Smith', salesOffice: 'B2B' },
    ];
  });

  const [activeTab, setActiveTab] = useState<string>('ceo');
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>(() => ({ ceo: true }));

  useEffect(() => {
    if (activeTab) {
      setVisitedTabs(prev => prev[activeTab] ? prev : { ...prev, [activeTab]: true });
    }
  }, [activeTab]);

  // Login inputs
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginReady, setLoginReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoginReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Multithreaded Web Worker Engine State
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('./workers/dataWorker.ts', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'PROCESS_DATA_SUCCESS') {
          setIsProcessing(false);
        }
      };
    } catch (err) {
      console.warn('Web Worker initialization skipped, using main thread fallback:', err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Formal Live Date & Time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const { formattedFormalDateOnly, formattedFormalTimeOnly } = useMemo(() => {
    const dateOpts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const timeOpts: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const dateStr = new Intl.DateTimeFormat(locale, dateOpts).format(currentTime);
    const timeStr = new Intl.DateTimeFormat(locale, timeOpts).format(currentTime);
    return { formattedFormalDateOnly: dateStr, formattedFormalTimeOnly: timeStr };
  }, [currentTime, language]);

  // Shared Admin Settings & Control Variables
  const [adminSettings, setAdminSettings] = useState({
    marginModifier: 30, 
    returnRateModifier: 8, 
    stockLevelModifier: 1.0, 
    pipelineConversion: 35, 
  });

  const [inflationRate, setInflationRate] = useState<number>(0);
  const [customsDelay, setCustomsDelay] = useState<number>(0);

  const [timePeriod, setTimePeriod] = useState<string>('All');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('All');
  const [chartDisplayMode, setChartDisplayMode] = useState<'count' | 'percent'>('count');
  const [globalChartMetric, setGlobalChartMetric] = useState<'revenue' | 'volume'>('revenue');
  const [globalCompareMode, setGlobalCompareMode] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  // Debounce global search to avoid recomputing on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(globalSearchTerm), 300);
    return () => clearTimeout(timer);
  }, [globalSearchTerm]);

  // Sync Year & Quarter with Time Window selection
  useEffect(() => {
    if (timePeriod === 'All') {
      setSelectedYear('All');
      setSelectedQuarter('All');
    } else if (timePeriod === '3M') {
      setSelectedYear('2026');
      setSelectedQuarter('2');
    } else if (timePeriod === '6M') {
      setSelectedYear('2026');
      setSelectedQuarter('All');
    } else if (timePeriod === '12M') {
      setSelectedYear('All');
      setSelectedQuarter('All');
    } else if (timePeriod === 'Custom' && customStartDate) {
      const yr = customStartDate.substring(0, 4);
      const allowedYears = ['2022', '2023', '2024', '2025', '2026'];
      if (allowedYears.includes(yr)) {
        setSelectedYear(yr);
        setSelectedQuarter('All');
      }
    }
  }, [timePeriod, customStartDate]);

  // Pre-computed Set for B2C office lookups (avoids array scan on every row)
  const B2C_OFFICES = useMemo(() => new Set(['B2C', 'Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce']), []);

  // Sales targets (Qty) per salesman - using synthetic names from generated data
  const [sellerTargets, setSellerTargets] = useState<Record<string, number>>(() => {
    // Generate consistent targets for the synthetic salespeople
    const names = [
      'Erika Williamson', 'Oscar Muller', 'Urban Hettinger', 'Dennis Jacobs',
      'Delpha Jaskolski PhD', 'Roman Abbott', 'Ms. Claire Kilback', 'Lynette McGlynn',
      'Sadie Adams PhD', 'Vern Gleason', 'Gary Rice', 'Tina Koelpin',
      'Mr. Rodger Douglas IV', 'Sheldon Price', 'Adrian Rohan', 'Simeon Lindgren',
      'Leila Wyman IV', 'Beatrice Harris', 'Nels Strosin', 'Ezra Larkin'
    ];
    const targets: Record<string, number> = {};
    names.forEach((name, i) => {
      // Deterministic pseudo-random target based on name hash
      let hash = 0;
      for (let j = 0; j < name.length; j++) hash = ((hash << 5) - hash) + name.charCodeAt(j);
      targets[name] = 10000 + Math.abs(hash) % 20000; // 10k-30k range
    });
    return targets;
  });

  // Custom customer comments/notes (loaded from localStorage with fallbacks)
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('apex_customer_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse customer notes:', e);
      }
    }
    return {
      'Almarai': 'Top volume buyer. Requires bi-weekly coordination for cold storage delivery.',
      'Americana': 'High volume but payment cycle stretches to 90+ days. Follow up required.',
      'Farm Frites': 'Potential partial churn identified for Guar Gum. Re-engage immediately.',
    };
  });

  // Sync customerNotes changes to localStorage
  useEffect(() => {
    localStorage.setItem('apex_customer_notes', JSON.stringify(customerNotes));
  }, [customerNotes]);

  // Customer custom risk override
  const [customerRiskOverride, setCustomerRiskOverride] = useState<Record<string, string>>({});

  // Sync users database to localStorage
  useEffect(() => {
    localStorage.setItem('apex_users_db_v12', JSON.stringify(usersList));
  }, [usersList]);

  // Sync active session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apex_active_session', JSON.stringify(currentUser));
      // Reset active tab to first allowed tab for this role
      if (currentUser.role === 'ceo') setActiveTab('ceo');
      else if (currentUser.role === 'sales_b2b') setActiveTab('sales');
      else if (currentUser.role === 'sales_b2c') setActiveTab('sales_b2c');
      else if (currentUser.role === 'sales_horeca') setActiveTab('sales_horeca');
      else if (currentUser.role === 'finance') setActiveTab('finance');
      else if (currentUser.role === 'sc') setActiveTab('sc');
      else if (currentUser.role === 'marketing') setActiveTab('marketing');
      else if (currentUser.role === 'hr') setActiveTab('hr');
      else if (currentUser.role === 'brand_manager') {
        if (currentUser.username === 'yassmen') setActiveTab('vitality_snacks_dashboard');
        else setActiveTab('brand_dashboard');
      }
      else if (currentUser.role === 'salesperson') {
        setActiveTab('sales');
      } else setActiveTab('ceo'); // admin defaults to CEO Command view
    } else {
      localStorage.removeItem('apex_active_session');
    }
  }, [currentUser]);

  // Sync page direction with language selection
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Sync theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-900', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
      document.body.classList.remove('bg-slate-900', 'text-slate-100');
    }
  }, [darkMode]);

  // Initial Data Load from Compressed JSON with Cache Storage
  useEffect(() => {
    setIsLoading(true);
    
    const fetchData = async () => {
      try {
        const cacheName = 'company-sales-cache-v1';
        const url = '/sales_data_compressed.json';
        let response: Response | undefined;
        
        if ('caches' in window) {
          const cache = await caches.open(cacheName);
          const cachedResponse = await cache.match(url);
          if (cachedResponse) {
            response = cachedResponse;
          } else {
            await cache.add(url);
            response = await cache.match(url);
          }
        }
        
        if (!response) {
          response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        
        const compressedData = await response.json();
        const expanded: Transaction[] = [];
        const {
          dates,
          customers,
          customerCodes,
          products,
          materialCodes,
          segments,
          salesmen,
          itemGroups,
          offices,
          billTypes,
          uoms,
          data
        } = compressedData;
        
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const isFullFormat = row.length >= 13;
          
          const dateStr = dates[row[0]];
          const customer = customers[row[1]];
          const customerCode = isFullFormat && customerCodes ? customerCodes[row[2]] : '';
          
          const prodIdx = isFullFormat ? 3 : 2;
          const product = products[row[prodIdx]];
          const materialCode = isFullFormat && materialCodes ? materialCodes[row[4]] : '';
          
          const segIdx = isFullFormat ? 5 : 3;
          const segment = segments[row[segIdx]];
          
          const salesIdx = isFullFormat ? 6 : 4;
          let salesman = salesmen[row[salesIdx]];
          if (salesman) {
            const smLower = salesman.trim().toLowerCase();
            if (smLower === 'abdel rahman mostafa mohamed') salesman = 'Abdel Rahman Mostafa';
            else if (smLower === 'helana henry labib') salesman = 'Helana Henry';
            else if (smLower === 'yasser essam eldin mohamed') salesman = 'Yasser Essam';
            else if (smLower === 'hazam farag mohamed') salesman = 'Hazam Farag';
            else if (smLower === 'mahmoud saleh mohamed') salesman = 'Mahmoud Saleh';
            else if (smLower === 'sameh farouk') salesman = 'Sameh Farouk';
            else if (smLower === 'hassan ahmed atya ahmed') salesman = 'Hassan Atya';
            else if (smLower === 'mohamed ahmed adel') salesman = 'Mohamed Adel';
          }
          
          const groupIdx = isFullFormat ? 7 : 5;
          const itemGroup = itemGroups[row[groupIdx]];
          
          const offIdx = isFullFormat ? 8 : 6;
          let office = offices[row[offIdx]];
          
          const nameLower = salesman.trim().toLowerCase();
          if (['ahmed atef mostafa', 'ali abdel rahman ahmed', 'mahmoud saleh', 'hazam farag', 'amr sayed negm', 'ali emad eldin ali', 'zainab mohamed'].includes(nameLower)) {
            office = 'Modern Trade';
          } else if (['helana henry'].includes(nameLower)) {
            office = 'Alex Office';
          } else if (['ibrahim abdel naim'].includes(nameLower)) {
            office = 'Horeca Team';
          } else if (['yasser essam', 'mohamed ahmed abd elgawad', 'mohamed ashraf hassan', 'mostafa mohamed abdelsayed'].includes(nameLower)) {
            office = 'Dist. Office';
          } else if (['maged nabih ayad', 'ahmed mohamed reyad', 'eslam essam said', 'hossam hassan ashry', 'walid mahmoud mohamed', 'mohamed ibrahim basiouny'].includes(nameLower)) {
            office = 'LG Office';
          } else if (['abdel rahman mostafa'].includes(nameLower)) {
            office = 'E-Commerce';
          }

          const billIdx = isFullFormat ? 9 : 7;
          const billType = billTypes[row[billIdx]];
          
          const uomIdx = isFullFormat ? 10 : (uoms ? 8 : -1);
          const uomStr = uomIdx >= 0 && uoms ? uoms[row[uomIdx]] : 'Units';
          
          const qtyIdx = isFullFormat ? 11 : (uoms ? 9 : 8);
          const priceIdx = isFullFormat ? 12 : (uoms ? 10 : 9);
          
          const qty = row[qtyIdx];
          const price = row[priceIdx];
          
          expanded.push({
            Date: dateStr,
            CustomerName: customer,
            CustomerCode: customerCode,
            Segment: segment,
            ItemName: product,
            MaterialCode: materialCode,
            Quantity: qty,
            NetQuantity: billType.toLowerCase().includes('return') || billType.toLowerCase().includes('credit') || qty < 0 || price < 0 ? -Math.abs(qty) : Math.abs(qty),
            BillType: billType,
            SalesmanName: salesman,
            ItemGroup: itemGroup,
            SalesOffice: office,
            Revenue: price,
            UoM: uomStr,
          });
        }
        
        setRawData(expanded);
        setIsUsingMock(false);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load sales data:', err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Confidentiality Check for Sales Office "Apex HQ" (Executive Leadership)
  const canAccessApexOffice = useMemo(() => {
    if (!currentUser) return false;
    const username = (currentUser.username || '').trim().toLowerCase();
    const role = currentUser.role;
    return role === 'ceo' || role === 'finance' || role === 'admin';
  }, [currentUser]);

  // 1. Processed Data Memo - pre-filtered if the user is a field salesperson
  const roleProcessedData = useMemo<ProcessedRow[]>(() => {
    const SUPERVISED_REPS: Record<string, string[]> = {
      'John Smith': [
        'John Smith',
        'Alex Rivera',
        'Michael Jordan',
        'David Beckham',
        'Emma Watson'
      ],
      'Sarah Connor': [
        'Sarah Connor',
        'Robert Downey',
        'Chris Evans',
        'Scarlett Johansson',
        'Mark Ruffalo'
      ]
    };

    let mapped = rawData
      .map((row) => {
        // Single toLowerCase call cached for isReturn detection
        const btLower = row.BillType ? row.BillType.toLowerCase() : '';
        const isReturn = row.BillType === 'Return' || 
                         btLower.includes('return') ||
                         btLower.includes('credit') ||
                         btLower.startsWith('re ') ||
                         btLower.startsWith('cm ') ||
                         row.Quantity < 0 ||
                         row.NetQuantity < 0 ||
                         row.Revenue < 0;
        const qty = Math.abs(row.Quantity || 0);
        const netQty = row.NetQuantity !== undefined 
          ? (isReturn ? -Math.abs(row.NetQuantity) : Math.abs(row.NetQuantity)) 
          : (qty * (isReturn ? -1 : 1));
        
        return {
          ...row,
          DateObj: new Date(row.Date),
          Volume: qty,
          NetQuantity: netQty,
          IsReturn: !!isReturn
        };
      })
      .filter((row) => !isNaN(row.DateObj.getTime()));

    // Strict Confidentiality Filter: Sales Office "Apex HQ" is reserved strictly for Executive Leadership
    if (!canAccessApexOffice) {
      mapped = mapped.filter(row => row.SalesOffice !== 'Apex HQ');
    }

    // Enforce personalization filter for individual field reps & supervisors
    if (currentUser && currentUser.role === 'salesperson' && currentUser.salesmanName) {
      const supervised = SUPERVISED_REPS[currentUser.salesmanName];
      if (supervised) {
        mapped = mapped.filter(row => supervised.includes(row.SalesmanName || ''));
      } else {
        mapped = mapped.filter(row => row.SalesmanName === currentUser.salesmanName);
      }
    }

    // Filter by Sales Office based on User Role/Office (CEO and Finance view all, others filter to their own office)
    if (currentUser) {
      if (currentUser.role === 'salesperson') {
        const isSupervisor = currentUser.salesmanName && SUPERVISED_REPS[currentUser.salesmanName];
        if (!isSupervisor) {
          const office = currentUser.salesOffice || 'B2B';
          mapped = mapped.filter(row => row.SalesOffice === office);
        }
      } else if (currentUser.role === 'sales_b2b') {
        mapped = mapped.filter(row => row.SalesOffice === 'B2B');
      } else if (currentUser.role === 'sales_b2c') {
        mapped = mapped.filter(row => B2C_OFFICES.has(row.SalesOffice || ''));
      } else if (currentUser.role === 'sales_horeca') {
        mapped = mapped.filter(row => row.SalesOffice === 'Horeca Team');
      }
    }

    // Apply debounced Global Search Filter
    if (debouncedSearchTerm.trim() !== '') {
      const term = debouncedSearchTerm.toLowerCase();
      mapped = mapped.filter(row => {
        return (row.CustomerName?.toLowerCase().includes(term)) ||
               (row.CustomerCode?.toLowerCase().includes(term)) ||
               (row.ItemName?.toLowerCase().includes(term)) ||
               (row.MaterialCode?.toLowerCase().includes(term)) ||
               (row.SalesmanName?.toLowerCase().includes(term)) ||
               (row.Segment?.toLowerCase().includes(term)) ||
               (row.ItemGroup?.toLowerCase().includes(term));
      });
    }

    return mapped;
  }, [rawData, currentUser, debouncedSearchTerm, B2C_OFFICES]);

  // Pre-compute maxDate once from roleProcessedData to avoid re-scanning in processedData
  const dataMaxDate = useMemo(() => {
    let max = new Date('2022-01-01');
    for (let i = 0; i < roleProcessedData.length; i++) {
      if (roleProcessedData[i].DateObj > max) max = roleProcessedData[i].DateObj;
    }
    return max;
  }, [roleProcessedData]);

  const processedData = useMemo<ProcessedRow[]>(() => {
    let mapped = roleProcessedData;

    // Apply Time Period Filter
    if (timePeriod === 'Custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        mapped = mapped.filter(row => row.DateObj >= start);
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        mapped = mapped.filter(row => row.DateObj <= end);
      }
    } else if (timePeriod !== 'All') {
      const cutoff = new Date(dataMaxDate);
      if (timePeriod === '3M') cutoff.setMonth(dataMaxDate.getMonth() - 3);
      else if (timePeriod === '6M') cutoff.setMonth(dataMaxDate.getMonth() - 6);
      else if (timePeriod === '12M') cutoff.setMonth(dataMaxDate.getMonth() - 12);
      mapped = mapped.filter(row => row.DateObj >= cutoff);
    }

    // Apply Year, Month, and Quarter Filters
    if (selectedYear !== 'All') {
      const yrNum = parseInt(selectedYear);
      mapped = mapped.filter(row => row.DateObj.getFullYear() === yrNum);
    }

    if (selectedMonth !== 'All') {
      const moNum = parseInt(selectedMonth);
      mapped = mapped.filter(row => row.DateObj.getMonth() + 1 === moNum);
    }

    if (selectedQuarter !== 'All') {
      const qtrNum = parseInt(selectedQuarter);
      mapped = mapped.filter(row => {
        const month = row.DateObj.getMonth();
        const qtr = Math.floor(month / 3) + 1;
        return qtr === qtrNum;
      });
    }

    return mapped;
  }, [roleProcessedData, timePeriod, customStartDate, customEndDate, dataMaxDate, selectedYear, selectedMonth, selectedQuarter]);

  // Derived data sets for B2B, B2C, HORECA views
  const b2bData = useMemo(() => {
    return processedData.filter(row => row.SalesOffice === 'B2B');
  }, [processedData]);

  const b2cData = useMemo(() => {
    return processedData.filter(row => B2C_OFFICES.has(row.SalesOffice || ''));
  }, [processedData, B2C_OFFICES]);

  const raniaB2cData = useMemo(() => {
    const allowedGroups = ['Frappit', 'Frappit Sugar Free', 'Horeca Frappe', 'Smoozy', 'Zenith', 'Nova Koffi'];
    return b2cData.filter(row => allowedGroups.includes(row.ItemGroup || ''));
  }, [b2cData]);

  const horecaData = useMemo(() => {
    return processedData.filter(row => row.SalesOffice === 'Horeca Team');
  }, [processedData]);

  // Derived data sets without date filtration for comparisons
  const b2bDataNoDate = useMemo(() => {
    return roleProcessedData.filter(row => row.SalesOffice === 'B2B');
  }, [roleProcessedData]);

  const b2cDataNoDate = useMemo(() => {
    return roleProcessedData.filter(row => B2C_OFFICES.has(row.SalesOffice || ''));
  }, [roleProcessedData, B2C_OFFICES]);

  const raniaB2cDataNoDate = useMemo(() => {
    const allowedGroups = ['Frappit', 'Frappit Sugar Free', 'Horeca Frappe', 'Smoozy', 'Zenith', 'Nova Koffi'];
    return b2cDataNoDate.filter(row => allowedGroups.includes(row.ItemGroup || ''));
  }, [b2cDataNoDate]);

  const horecaDataNoDate = useMemo(() => {
    return roleProcessedData.filter(row => row.SalesOffice === 'Horeca Team');
  }, [roleProcessedData]);

  // Translate basic terms
  const t = useCallback((key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        title: "APEX CENTRAL COMMAND",
        subtitle: "Executive Data Synergy & Control Panel",
        uploadCsv: "Upload CSV",
        downloadCsv: "Download CSV",
        exportPdf: "Export PDF",
        previewMock: "Preview Mode (Mock)",
        activeProd: "Production Data Active",
        tabCeo: "CEO Strategic Command",
        tabBrandDashboard: "Nova & Zenith Dashboard",
        tabVitalitySnacksDashboard: "Vitality Snacks Dashboard",
        tabCompetitorAnalysis: "Competitor Insights",
        tabSales: "B2B Sales Dashboard",
        tabSalesB2c: "B2C Sales Dashboard",
        tabSalesHoreca: "HORECA Sales Dashboard",
        tabProducts: "Products Intelligence",
        tabSalesperson: "My Sales Performance",
        tabFinance: "Financial Planning",
        tabSc: "Supply Chain Director",
        tabMarketing: "Marketing Dashboard",
        tabHr: "HR Operations",
        tabSellers: "Seller Profiles",
        tabCustomers: "Customer Profiles",
        tabAdmin: "Admin Control Panel",
        logout: "Logout",
        signInTitle: "Central Command Login",
        signInSubtitle: "Apex Enterprise BI Suite",
        username: "Username",
        password: "Password",
        signInBtn: "Sign In",
        loginErr: "Invalid username or password!",
      },
      ar: {
        title: "منصة أوا المركزية الموحدة",
        subtitle: "التآزر التنفيذي للبيانات ولوحة التحكم",
        uploadCsv: "رفع ملف CSV",
        downloadCsv: "تحميل CSV",
        exportPdf: "تصدير PDF",
        previewMock: "وضع المعاينة (تجريبي)",
        activeProd: "البيانات الحية نشطة",
        tabCeo: "منظور المدير التنفيذي",
        tabBrandDashboard: "لوحة تحكم يالا وسكويزي",
        tabVitalitySnacksDashboard: "لوحة تحكم سويت آند سليم",
        tabCompetitorAnalysis: "تحليلات المنافسين للعلامات",
        tabSales: "منصة مبيعات B2B",
        tabSalesB2c: "منصة مبيعات B2C",
        tabSalesHoreca: "منصة مبيعات HORECA",
        tabProducts: "مؤشرات وتفاصيل المنتجات",
        tabSalesperson: "أدائي البيعي ومؤشراتي",
        tabFinance: "التخطيط المالي والـ Margins",
        tabSc: "منظور سلاسل التوريد",
        tabMarketing: "لوحة تحكم التسويق والنمو",
        tabHr: "إدارة الموارد البشرية",
        tabSellers: "ملفات مسؤولي المبيعات",
        tabCustomers: "ملفات حسابات العملاء",
        tabAdmin: "إعدادات المدير والنظام",
        logout: "تسجيل الخروج",
        signInTitle: "تسجيل دخول منصة B2B",
        signInSubtitle: "المجموعة التنفيذية لإدارة الأعمال",
        username: "اسم المستخدم",
        password: "كلمة المرور",
        signInBtn: "تسجيل الدخول",
        loginErr: "اسم المستخدم أو كلمة المرور غير صحيحة!",
      }
    };
    return translations[language][key] || key;
  }, [language]);

  const handleLoginSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const account = usersList.find(
      u => u.username.toLowerCase() === loginUser.toLowerCase() && u.password === loginPass
    );

    if (account) {
      setCurrentUser({ username: account.username, role: account.role, salesmanName: account.salesmanName, salesOffice: account.salesOffice });
      setLoginUser('');
      setLoginPass('');
    } else {
      setLoginError(t('loginErr'));
    }
  }, [usersList, loginUser, loginPass, t]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Export report to CSV
  const handleExportCSV = useCallback(() => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Apex Central Command Dashboard Report\n';
    csv += `Generated At,${new Date().toISOString()}\n`;
    csv += `Perspective,${activeTab}\n`;
    csv += `Language,${language}\n\n`;

    csv += 'Date,Customer,Segment,Material,Quantity,NetQuantity,BillType,Salesperson\n';
    processedData.slice(0, 100).forEach((row) => {
      csv += `${row.Date},"${row.CustomerName}","${row.Segment}","${row.ItemName}",${row.Quantity},${row.NetQuantity},${row.BillType},"${row.SalesmanName || ''}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_B2B_Report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [activeTab, language, processedData]);

  // RBAC Navigation tabs filter
  const allowedTabs = useMemo(() => {
    const allTabs = [
      { id: 'ceo', label: t('tabCeo'), icon: <LayoutDashboard size={16} />, roles: ['admin', 'ceo', 'finance'] },
      { id: 'brand_dashboard', label: t('tabBrandDashboard'), icon: <Boxes size={16} />, roles: ['admin', 'ceo', 'brand_manager', 'sales_b2c', 'finance'] },
      { id: 'vitality_snacks_dashboard', label: t('tabVitalitySnacksDashboard'), icon: <Boxes size={16} />, roles: ['admin', 'ceo', 'brand_manager', 'finance'] },
      { id: 'sales', label: currentUser?.role === 'salesperson' ? t('tabSalesperson') : t('tabSales'), icon: <TrendingUp size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_b2b', 'salesperson'] },
      { id: 'sales_b2c', label: t('tabSalesB2c'), icon: <TrendingUp size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_b2c', 'brand_manager'] },
      { id: 'sales_horeca', label: t('tabSalesHoreca'), icon: <TrendingUp size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_horeca'] },
      { id: 'marketing', label: t('tabMarketing'), icon: <Target size={16} />, roles: ['admin', 'ceo', 'finance', 'marketing'] },
      { id: 'finance', label: t('tabFinance'), icon: <ArrowLeftRight size={16} />, roles: ['admin', 'ceo', 'finance'] },
      { id: 'sc', label: t('tabSc'), icon: <ShieldAlert size={16} />, roles: ['admin', 'ceo', 'finance', 'sc'] },
      { id: 'products', label: t('tabProducts'), icon: <Boxes size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_b2b', 'sales_b2c', 'sales_horeca', 'marketing'] },
      { id: 'seller', label: t('tabSellers'), icon: <Users size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_b2b', 'sales_b2c', 'sales_horeca', 'marketing'] },
      { id: 'customer', label: t('tabCustomers'), icon: <Users size={16} />, roles: ['admin', 'ceo', 'finance', 'sales_b2b', 'sales_b2c', 'sales_horeca', 'salesperson', 'marketing'] },
      { id: 'hr', label: t('tabHr'), icon: <Briefcase size={16} />, roles: ['admin', 'hr'] },
      { id: 'admin', label: t('tabAdmin'), icon: <Sliders size={16} />, roles: ['admin'] },
    ];
    if (!currentUser) return [];
    return allTabs.filter(tab => {
      if (!tab.roles.includes(currentUser.role)) return false;
      const managed = (currentUser as any).managedBrands;
      if (tab.id === 'brand_dashboard') {
        if (currentUser.role === 'brand_manager' && (!managed || !managed.includes('nova'))) {
          return false;
        }
      }
      if (tab.id === 'vitality_snacks_dashboard') {
        if (currentUser.role === 'brand_manager' && (!managed || !managed.includes('vitality_snacks'))) {
          return false;
        }
      }
      if (tab.id === 'sales_b2c') {
        if (currentUser.role === 'brand_manager' && currentUser.username !== 'rania') {
          return false;
        }
      }
      if (tab.id === 'customer' || tab.id === 'seller') {
        if (currentUser.username === 'hatem_shokry') {
          return false;
        }
      }
      return true;
    });
  }, [currentUser, language]);

  // Calculate dynamic operational alerts based on return metrics & margins
  const operationsAlerts = useMemo(() => {
    const alertsList: string[] = [];
    if (processedData.length === 0) return alertsList;

    // 1. Calculate return rates per product line
    const productGross: Record<string, number> = {};
    const productReturns: Record<string, number> = {};
    processedData.forEach(row => {
      const vol = row.Volume;
      if (row.IsReturn) {
        productReturns[row.ItemName] = (productReturns[row.ItemName] || 0) + vol;
      } else {
        productGross[row.ItemName] = (productGross[row.ItemName] || 0) + vol;
      }
    });

    Object.keys(productReturns).forEach(name => {
      const gross = productGross[name] || 0;
      const ret = productReturns[name] || 0;
      const rate = gross > 0 ? (ret / gross) * 100 : 0;
      if (rate > 7.5 && gross > 500) {
        alertsList.push(
          language === 'en' 
            ? `QUALITY CRITICAL: ${name} return rate is ${rate.toFixed(1)}% (Leakage Cost Breach). Immediate batch audit recommended.`
            : `تنبيه جودة حرج: معدل مرتجع ${name} بلغ ${rate.toFixed(1)}٪ (تجاوز تكلفة الخدمة). يوصى بإجراء فحص فوري للتشغيلة.`
        );
      }
    });

    // 2. High Credit balance exposure alerts
    if (language === 'en') {
      alertsList.push("CREDIT ALERT: Americana payment cycle has stretched to 90 Days. Outstanding balance exceeds safety threshold.");
      alertsList.push("S&OP INVENTORY: Excess Potato Starch stock exceeds safety stock levels. Push List clearance priority triggered.");
    } else {
      alertsList.push("تنبيه ائتمان حرج: تجاوزت فترة سداد Americana حد ٩٠ يوماً. الرصيد المستحق يتجاوز حد الأمان.");
      alertsList.push("مخزون لوجستي زائد: صنف نشا البطاطس يتجاوز حد الأمان بـ ١.٥ ضعف. تم تفعيل قائمة التصفية الفورية.");
    }

    return alertsList;
  }, [processedData, language]);

  if (isLoading) {
    return (
      <div className={`min-h-screen p-8 flex flex-col font-sans ${loginReady ? 'animate-slideUp' : 'animate-fadeIn'} ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#f6f5f0] text-slate-900'
      }`}>
        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 rounded-2xl skeleton" />
          <div className="space-y-2">
            <div className="w-48 h-6 rounded-md skeleton" />
            <div className="w-32 h-4 rounded-md skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="h-32 rounded-3xl skeleton" />
            <div className="h-32 rounded-3xl skeleton" />
            <div className="h-32 rounded-3xl skeleton" />
            <div className="h-32 rounded-3xl skeleton" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-96 rounded-3xl skeleton" />
            <div className="h-96 rounded-3xl skeleton" />
        </div>
        <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 bg-white/5 dark:bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/50">
               <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
               <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading B2B Central Command...</span>
            </div>
        </div>
      </div>
    );
  }

  // SIGN IN RENDER
  if (!currentUser) {
    return (
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen flex justify-center items-center p-4 font-sans transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-extrabold shadow-sm active:scale-95 transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border shadow-sm active:scale-95 transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
            }`}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Login Card */}
        <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl ${loginReady ? 'animate-scaleIn' : ''} ${
          darkMode ? 'bg-slate-900/60 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'
        }`}>
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/logo.png" 
              alt="Apex Logo" 
              className="h-16 w-auto mb-4 object-contain max-w-[200px]" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fb = document.getElementById('login-fallback-logo');
                if (fb) fb.classList.remove('hidden');
              }}
            />
            <div id="login-fallback-logo" className="hidden p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 mb-4">
              <LayoutDashboard size={28} />
            </div>
            <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              {t('signInTitle')}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{t('signInSubtitle')}</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-bold text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-slate-400'
                  } outline-none`}
                  placeholder="e.g., admin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-slate-400'
                  } outline-none`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#128d46] to-[#117a3c] hover:from-[#117a3c] hover:to-[#0f6b35] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
            >
              {t('signInBtn')}
            </button>
          </form>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans relative ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-[#f6f5f0] text-slate-900'}`}>

      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 border-r no-print transition-all duration-300 ease-in-out ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#ebeae4] border-slate-200/80'
      } w-72 md:w-64 ${sidebarOpen ? 'translate-x-0 opacity-100 shadow-2xl md:shadow-none' : '-translate-x-full opacity-0 pointer-events-none'}`}>
        <div className="p-5 flex flex-col h-full overflow-y-auto">
          <div>
            {/* Logo and Brand */}
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-xl flex-shrink-0">
                  <img src="/favicon.svg" alt="Company Logo" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h1 className="text-xs font-black tracking-widest text-[#128d46] uppercase">APEX ENTERPRISES</h1>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                    {currentUser.role === 'admin' ? 'SYSTEM ADMIN' : `${currentUser.role.toUpperCase()} PERSPECTIVE`}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Tabs */}
            <nav className="space-y-1.5">
              {allowedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#128d46] to-[#117a3c] text-white shadow-md'
                      : darkMode
                      ? 'text-slate-300 hover:bg-slate-800/80'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-6 space-y-3">
            {/* User Session Profile Card */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="min-w-0 pr-2">
                <span className="block font-black truncate">{currentUser.username}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5 truncate">
                  {currentUser.role === 'salesperson' ? `Rep: ${currentUser.salesmanName}` : currentUser.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-colors flex-shrink-0"
                title={t('logout')}
              >
                <LogOut size={14} />
              </button>
            </div>
            <div className="text-slate-400 text-[9px] font-semibold text-center uppercase tracking-wider">
              APEX ENTERPRISES &copy; 2026
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div 
        className="flex-grow flex flex-col min-w-0 transition-all duration-300 ease-in-out" 
        style={{ paddingLeft: sidebarOpen && window.innerWidth >= 768 ? '16rem' : '0' }}
      >
        {/* Combined Sticky Top Header & Global Filter Bar */}
        <div className={`no-print sticky top-0 z-30 border-b backdrop-blur-xl transition-all ${
          darkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}>
          {/* Main Top Header Line */}
          <div className="px-3 sm:px-6 py-2.5 flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800/60 gap-2 relative">
            <div className="flex items-center gap-2 min-w-0">
              {/* Hamburger for Mobile + Desktop Sidebar Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex-shrink-0"
                aria-label="Toggle Navigation Sidebar"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className={`text-xs sm:text-sm font-extrabold tracking-tight truncate ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
                    {t('title')}
                  </h2>
                  {isUsingMock ? (
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded-full border border-amber-500/20 uppercase tracking-widest">
                      {t('previewMock')}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-500/10 text-[#128d46] text-[8px] font-black rounded-full border border-[#128d46]/20 uppercase tracking-widest">
                      {t('activeProd')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Fancy, Classic & Professional Executive Date & Time Center Badge */}
            <div className={`absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 px-4 py-1.5 rounded-2xl border text-xs font-semibold shadow-md backdrop-blur-md transition-all ${
              darkMode 
                ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-indigo-950/40' 
                : 'bg-white/90 border-slate-200/90 text-slate-800 shadow-slate-200/60'
            }`}>
              {/* Date Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Calendar size={13} className="text-emerald-500 flex-shrink-0" />
                <span>{formattedFormalDateOnly}</span>
              </div>

              {/* Classic Vertical Rule */}
              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-700 flex-shrink-0" />

              {/* Live Time Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest tabular-nums text-indigo-600 dark:text-indigo-400">
                <Clock size={13} className="text-indigo-500 animate-pulse flex-shrink-0" />
                <span>{formattedFormalTimeOnly}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Unit Toggle (Millions vs Thousands) */}
              <div className={`hidden sm:flex items-center p-0.5 rounded-xl border ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
              } text-[10px] font-bold`}>
                <button
                  type="button"
                  onClick={() => setGlobalScaleMode('thousands')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    scaleMode === 'thousands'
                      ? 'bg-indigo-500 text-white shadow-sm font-extrabold'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'en' ? 'K' : 'آلاف'}
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalScaleMode('millions')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    scaleMode === 'millions'
                      ? 'bg-indigo-500 text-white shadow-sm font-extrabold'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'en' ? 'M' : 'ملايين'}
                </button>
              </div>

              {/* Metric Toggle (Revenue vs Volume) */}
              <div className={`flex items-center p-0.5 rounded-xl border ${
                darkMode ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'
              } text-[10px] font-bold`}>
                <button
                  type="button"
                  onClick={() => setGlobalChartMetric('revenue')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    globalChartMetric === 'revenue'
                      ? 'bg-emerald-500 text-white shadow-sm font-extrabold'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'en' ? 'Rev' : 'إيراد'}
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalChartMetric('volume')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    globalChartMetric === 'volume'
                      ? 'bg-emerald-500 text-white shadow-sm font-extrabold'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {language === 'en' ? 'Vol' : 'كمية'}
                </button>
              </div>

              {/* Language Switch */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className={`p-1.5 px-2 rounded-xl border text-[10px] font-extrabold shadow-sm active:scale-95 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                {language === 'en' ? 'AR' : 'EN'}
              </button>

              {/* Dark Mode Switch */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-xl border shadow-sm active:scale-95 transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>

          {/* Unified Global Filters Line */}
          <div className="px-3 sm:px-6 py-2 flex flex-col md:flex-row gap-2 items-center justify-between text-xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="text-[#128d46] w-4 h-4 flex-shrink-0" />
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  placeholder={language === 'en' ? 'Global Search...' : 'بحث شامل...'}
                  className={`w-full pl-3 pr-8 py-1 rounded-xl border text-xs outline-none transition-all ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:border-emerald-500'
                  }`}
                />
                {globalSearchTerm && (
                  <button 
                    onClick={() => setGlobalSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Year Selector */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{language === 'en' ? 'Year:' : 'السنة:'}</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    if (timePeriod !== 'Custom') setTimePeriod('Custom');
                  }}
                  className={`px-2 py-1 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All">{language === 'en' ? 'All' : 'الكل'}</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{language === 'en' ? 'Mo:' : 'الشهر:'}</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    if (timePeriod !== 'Custom') setTimePeriod('Custom');
                  }}
                  className={`px-2 py-1 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All">{language === 'en' ? 'All' : 'الكل'}</option>
                  <option value="1">{language === 'en' ? 'Jan (1)' : 'يناير (١)'}</option>
                  <option value="2">{language === 'en' ? 'Feb (2)' : 'فبراير (٢)'}</option>
                  <option value="3">{language === 'en' ? 'Mar (3)' : 'مارس (٣)'}</option>
                  <option value="4">{language === 'en' ? 'Apr (4)' : 'أبريل (٤)'}</option>
                  <option value="5">{language === 'en' ? 'May (5)' : 'مايو (٥)'}</option>
                  <option value="6">{language === 'en' ? 'Jun (6)' : 'يونيو (٦)'}</option>
                  <option value="7">{language === 'en' ? 'Jul (7)' : 'يوليو (٧)'}</option>
                  <option value="8">{language === 'en' ? 'Aug (8)' : 'أغسطس (٨)'}</option>
                  <option value="9">{language === 'en' ? 'Sep (9)' : 'سبتمبر (٩)'}</option>
                  <option value="10">{language === 'en' ? 'Oct (10)' : 'أكتوبر (١٠)'}</option>
                  <option value="11">{language === 'en' ? 'Nov (11)' : 'نوفمبر (١١)'}</option>
                  <option value="12">{language === 'en' ? 'Dec (12)' : 'ديسمبر (١٢)'}</option>
                </select>
              </div>

              {/* Quarter Selector */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{language === 'en' ? 'Qtr:' : 'الربع:'}</span>
                <select
                  value={selectedQuarter}
                  onChange={(e) => {
                    setSelectedQuarter(e.target.value);
                    if (timePeriod !== 'Custom') setTimePeriod('Custom');
                  }}
                  className={`px-2 py-1 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All">{language === 'en' ? 'All' : 'الكل'}</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>

              {/* Time Window */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{language === 'en' ? 'Win:' : 'الفترة:'}</span>
                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className={`px-2 py-1 rounded-xl border text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="All">{language === 'en' ? 'All' : 'الكل'}</option>
                  <option value="3M">3M</option>
                  <option value="6M">6M</option>
                  <option value="12M">12M</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* Display Mode Toggle */}
              <div className="flex items-center gap-1">
                <div className={`p-0.5 rounded-lg border flex text-[10px] ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setChartDisplayMode('count')}
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      chartDisplayMode === 'count' ? 'bg-[#128d46] text-white shadow' : 'text-slate-500'
                    }`}
                  >
                    Val
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartDisplayMode('percent')}
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      chartDisplayMode === 'percent' ? 'bg-[#128d46] text-white shadow' : 'text-slate-500'
                    }`}
                  >
                    %
                  </button>
                </div>
              {timePeriod === 'Custom' && (
                <div className="flex items-center gap-2 animate-fadeIn">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={`px-2 py-0.5 rounded-lg border text-xs ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  />
                  <span className="text-slate-400">{language === 'en' ? 'to' : 'إلى'}</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={`px-2 py-0.5 rounded-lg border text-xs ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


        {/* Main Dashboard View Container */}
        <div className="p-6 space-y-6">
          {/* Disclaimer Banner */}
          <div className={`p-3 px-4 rounded-xl border text-[10px] font-bold flex items-center gap-2.5 ${
            darkMode 
              ? 'bg-[#191342]/20 border-indigo-500/20 text-indigo-300/80 shadow-md' 
              : 'bg-indigo-500/5 border-indigo-500/20 text-[#191342]/90 shadow-sm'
          }`}>
            <span className="text-xs">ℹ️</span>
            <span>
              {language === 'en' 
                ? 'Rounding Disclaimer: All financial figures and quantity/volume metrics are rounded to the nearest million for executive summaries.' 
                : 'تنبيه التقريب: جميع الأرقام المالية ومؤشرات كميات المبيعات مقربة لأقرب مليون للملخصات التنفيذية.'}
            </span>
          </div>
          {/* Glassmorphic Multithreaded Engine Loading Animation */}
          {(isLoading || isProcessing) && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl bg-slate-950/70 animate-fadeIn">
              <div className="relative flex flex-col items-center p-8 rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl animate-scaleIn max-w-sm w-full mx-4 text-center overflow-hidden">
                
                {/* Background Ambient Glow */}
                <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/25 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-indigo-500/25 rounded-full blur-3xl animate-pulse" />

                {/* Rotating Concentric Gradient Rings */}
                <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 border-r-indigo-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-emerald-400 border-l-purple-500 animate-spin-slow" />
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg animate-glow-pulse">
                    <Boxes className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Status Message */}
                <div className="space-y-1 z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{language === 'en' ? 'Worker Engine Active' : 'المحرك المتعدد: نشط'}</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {isLoading 
                      ? (language === 'en' ? 'Loading Enterprise Core Data...' : 'جاري تحميل البيانات الأساسية...')
                      : (language === 'en' ? 'Processing Dataset Off-Thread...' : 'جاري معالجة البيانات بالخلفية...')}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs pt-1">
                    {language === 'en'
                      ? 'Offloading transaction filtering & metric aggregations to a Web Worker background thread.'
                      : 'معالجة وتصفية المعاملات المالية بالخلفية بدون إبطاء واجهة المستخدم.'}
                  </p>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6 relative">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 w-full animate-shimmer" />
                </div>
              </div>
            </div>
          )}

          <ErrorBoundary language={language}>

          {visitedTabs['ceo'] && (
            <div style={{ display: activeTab === 'ceo' ? 'block' : 'none' }}>
              <CeoView 
                processedData={processedData} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                inflationRate={inflationRate}
                customsDelay={customsDelay}
                currentUser={currentUser}
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['sales'] && (
            <div style={{ display: activeTab === 'sales' ? 'block' : 'none' }}>
              <SalesDirectorView 
                processedData={currentUser?.role === 'sales_b2b' || currentUser?.role === 'salesperson' ? processedData : b2bData} 
                roleProcessedData={currentUser?.role === 'sales_b2b' || currentUser?.role === 'salesperson' ? roleProcessedData : b2bDataNoDate} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                sellerTargets={sellerTargets}
                currentUser={currentUser}
                officeType={currentUser?.salesOffice && ['B2C', 'Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce'].includes(currentUser.salesOffice) ? 'B2C' : (currentUser?.salesOffice === 'Horeca Team' ? 'Horeca Team' : 'B2B')}
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['sales_b2c'] && (
            <div style={{ display: activeTab === 'sales_b2c' ? 'block' : 'none' }}>
              <SalesDirectorView 
                processedData={currentUser?.username === 'rania' ? raniaB2cData : (currentUser?.role === 'sales_b2c' ? processedData : b2cData)} 
                roleProcessedData={currentUser?.username === 'rania' ? raniaB2cDataNoDate : (currentUser?.role === 'sales_b2c' ? roleProcessedData : b2cDataNoDate)} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                sellerTargets={sellerTargets}
                currentUser={currentUser}
                officeType="B2C"
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['sales_horeca'] && (
            <div style={{ display: activeTab === 'sales_horeca' ? 'block' : 'none' }}>
              <SalesDirectorView 
                processedData={currentUser?.role === 'sales_horeca' ? processedData : horecaData} 
                roleProcessedData={currentUser?.role === 'sales_horeca' ? roleProcessedData : horecaDataNoDate} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                sellerTargets={sellerTargets}
                currentUser={currentUser}
                officeType="Horeca Team"
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['brand_dashboard'] && (
            <div style={{ display: activeTab === 'brand_dashboard' ? 'block' : 'none' }}>
              <BrandDashboardView 
                language={language}
                darkMode={darkMode}
                timePeriod={timePeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                processedData={processedData}
                currentUser={currentUser}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedQuarter={selectedQuarter}
                setSelectedQuarter={setSelectedQuarter}
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['vitality_snacks_dashboard'] && (
            <div style={{ display: activeTab === 'vitality_snacks_dashboard' ? 'block' : 'none' }}>
              <VitalitySnacksDashboardView 
                processedData={processedData}
                language={language}
                darkMode={darkMode}
                timePeriod={timePeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                currentUser={currentUser}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedQuarter={selectedQuarter}
                setSelectedQuarter={setSelectedQuarter}
                chartDisplayMode={chartDisplayMode}
                globalChartMetric={globalChartMetric}
                globalCompareMode={globalCompareMode}
              />
            </div>
          )}

          {visitedTabs['marketing'] && (
            <div style={{ display: activeTab === 'marketing' ? 'block' : 'none' }}>
              <MarketingView 
                processedData={processedData} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                currentUser={currentUser}
              />
            </div>
          )}

          {visitedTabs['finance'] && (
            <div style={{ display: activeTab === 'finance' ? 'block' : 'none' }}>
              <FinancialPlanningView 
                processedData={processedData} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                inflationRate={inflationRate}
                currentUser={currentUser}
              />
            </div>
          )}

          {visitedTabs['sc'] && (
            <div style={{ display: activeTab === 'sc' ? 'block' : 'none' }}>
              <SupplyChainView 
                processedData={processedData} 
                language={language} 
                darkMode={darkMode} 
                t={t}
                adminSettings={adminSettings}
                customsDelay={customsDelay}
                currentUser={currentUser}
              />
            </div>
          )}

          {visitedTabs['products'] && (
            <div style={{ display: activeTab === 'products' ? 'block' : 'none' }}>
              <ProductsView
                processedData={processedData}
                language={language}
                darkMode={darkMode}
                t={t}
                currentUser={currentUser}
                globalChartMetric={globalChartMetric}
              />
            </div>
          )}

          {visitedTabs['seller'] && (
            <div style={{ display: activeTab === 'seller' ? 'block' : 'none' }}>
              <SellerProfilesView
                processedData={processedData}
                language={language}
                darkMode={darkMode}
                t={t}
                sellerTargets={sellerTargets}
                currentUser={currentUser}
                globalChartMetric={globalChartMetric}
              />
            </div>
          )}

          {visitedTabs['customer'] && (
            <div style={{ display: activeTab === 'customer' ? 'block' : 'none' }}>
              <CustomerProfilesView
                processedData={processedData}
                language={language}
                darkMode={darkMode}
                t={t}
                customerNotes={customerNotes}
                setCustomerNotes={setCustomerNotes}
                customerRiskOverride={customerRiskOverride}
                inflationRate={inflationRate}
                currentUser={currentUser}
                globalChartMetric={globalChartMetric}
              />
            </div>
          )}

          {visitedTabs['hr'] && (
            <div style={{ display: activeTab === 'hr' ? 'block' : 'none' }}>
              <HrView 
                language={language} 
                darkMode={darkMode} 
                t={t}
              />
            </div>
          )}

          {visitedTabs['admin'] && (
            <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
              <AdminControlView 
                language={language} 
                darkMode={darkMode} 
                adminSettings={adminSettings}
                setAdminSettings={setAdminSettings}
                sellerTargets={sellerTargets}
                setSellerTargets={setSellerTargets}
                customerNotes={customerNotes}
                setCustomerNotes={setCustomerNotes}
                customerRiskOverride={customerRiskOverride}
                setCustomerRiskOverride={setCustomerRiskOverride}
                processedData={processedData}
                usersList={usersList}
                setUsersList={setUsersList}
                currentUser={currentUser}
              />
            </div>
          )}

          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
