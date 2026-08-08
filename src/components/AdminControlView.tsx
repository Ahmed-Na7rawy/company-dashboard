import React, { useState, useMemo } from 'react';
import { 
  Sliders, Target, Users, ShieldCheck, RefreshCw, FileText, Trash2, UserPlus
} from 'lucide-react';

interface UserAccount {
  username: string;
  password: string;
  role: string; // 'admin' | 'ceo' | 'sales' | 'sales_b2c' | 'sales_horeca' | 'finance' | 'sc' | 'salesperson'
  salesmanName?: string;
  salesOffice?: string;
}

interface AdminControlViewProps {
  language: 'en' | 'ar';
  darkMode: boolean;
  adminSettings: {
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  };
  setAdminSettings: React.Dispatch<React.SetStateAction<{
    marginModifier: number;
    returnRateModifier: number;
    stockLevelModifier: number;
    pipelineConversion: number;
  }>>;
  sellerTargets: Record<string, number>;
  setSellerTargets: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  customerNotes: Record<string, string>;
  setCustomerNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  customerRiskOverride: Record<string, string>;
  setCustomerRiskOverride: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  processedData: any[];
  usersList: UserAccount[];
  setUsersList: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: { username: string; role: string; salesmanName?: string; salesOffice?: string } | null;
}

function AdminControlView({ 
  language, 
  darkMode, 
  adminSettings, 
  setAdminSettings,
  sellerTargets,
  setSellerTargets,
  customerNotes,
  setCustomerNotes,
  customerRiskOverride,
  setCustomerRiskOverride,
  processedData,
  usersList,
  setUsersList,
  currentUser
}: AdminControlViewProps) {

  // Extract unique customers
  const customers = useMemo(() => {
    const list = new Set<string>();
    processedData.forEach(row => {
      if (row.CustomerName) list.add(row.CustomerName);
    });
    return Array.from(list).sort();
  }, [processedData]);

  // Extract unique salesmen
  const salesmenList = useMemo(() => {
    const list = new Set<string>();
    processedData.forEach(row => {
      if (row.SalesmanName) list.add(row.SalesmanName);
    });
    return Array.from(list).sort();
  }, [processedData]);

  const [activeTab, setActiveTab] = useState<'modifiers' | 'targets' | 'customers' | 'users'>('modifiers');

  // Local state for editing notes/risk status
  const [selectedCust, setSelectedCust] = useState(customers[0] || 'Almarai');
  const [noteText, setNoteText] = useState(customerNotes[selectedCust] || '');
  const [riskValue, setRiskValue] = useState(customerRiskOverride[selectedCust] || 'Auto');

  // Local state for adding new users
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('sales');
  const [newSalesmanName, setNewSalesmanName] = useState(salesmenList[0] || 'Hassan Atya');
  const [newSalesOffice, setNewSalesOffice] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [confirmAction, setConfirmAction] = useState<{msg: string, onConfirm: () => void} | null>(null);

  const handleModifierChange = (key: keyof typeof adminSettings, value: number) => {
    setAdminSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTargetChange = (name: string, value: number) => {
    setSellerTargets(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCustomerSettings = () => {
    setCustomerNotes(prev => ({ ...prev, [selectedCust]: noteText }));
    setCustomerRiskOverride(prev => ({ ...prev, [selectedCust]: riskValue }));
    showToast(language === 'en' ? 'Customer Profile settings updated successfully!' : 'تم تحديث إعدادات ملف العميل بنجاح!', 'success');
  };

  const syncCustomerInputs = (custName: string) => {
    setSelectedCust(custName);
    setNoteText(customerNotes[custName] || '');
    setRiskValue(customerRiskOverride[custName] || 'Auto');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast(language === 'en' ? 'Please fill in all user fields!' : 'يرجى ملء جميع الحقول للمستخدم الجديد!', 'error');
      return;
    }

    // Check if user already exists
    if (usersList.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      showToast(language === 'en' ? 'Username already exists!' : 'اسم المستخدم موجود بالفعل!', 'warning');
      return;
    }

    const newUser: UserAccount = {
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      salesmanName: newRole === 'salesperson' ? newSalesmanName : undefined,
      salesOffice: newSalesOffice || undefined
    };

    setUsersList(prev => [...prev, newUser]);
    setNewUsername('');
    setNewPassword('');
    showToast(language === 'en' ? 'New user account created successfully!' : 'تم إنشاء حساب المستخدم الجديد بنجاح!', 'success');
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (currentUser && currentUser.username === usernameToDelete) {
      showToast(language === 'en' ? 'You cannot delete your own active session!' : 'لا يمكنك حذف حسابك الحالي الذي تستخدمه لتسجيل الدخول!', 'error');
      return;
    }

    setConfirmAction({
      msg: language === 'en' ? `Are you sure you want to delete user "${usernameToDelete}"?` : `هل أنت متأكد من حذف المستخدم "${usernameToDelete}"؟`,
      onConfirm: () => {
        setUsersList(prev => prev.filter(u => u.username !== usernameToDelete));
        setConfirmAction(null);
        showToast(language === 'en' ? 'User deleted successfully!' : 'تم حذف المستخدم بنجاح!', 'success');
      }
    });
  };

  const getRoleDisplayName = (role: string): string => {
    const rolesMap: Record<string, { en: string; ar: string }> = {
      admin: { en: 'Admin', ar: 'المدير العام' },
      ceo: { en: 'CEO Strategic Command', ar: 'المدير التنفيذي' },
      sales: { en: 'B2B Sales Director', ar: 'مدير مبيعات B2B' },
      sales_b2c: { en: 'B2C Sales Director', ar: 'مدير مبيعات B2C' },
      sales_horeca: { en: 'HORECA Sales Director', ar: 'مدير مبيعات HORECA' },
      finance: { en: 'Financial Manager', ar: 'المدير المالي' },
      sc: { en: 'SC Director', ar: 'مدير سلاسل التوريد' },
      salesperson: { en: 'Salesperson (Field Rep)', ar: 'مندوب مبيعات ميداني' }
    };
    return language === 'en' ? rolesMap[role]?.en || role : rolesMap[role]?.ar || role;
  };

  return (
    <div className="space-y-8 animate-fadeIn no-print">
      {/* View Header */}
      <div>
        <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          <Sliders className="text-[#128d46]" />
          {language === 'en' ? 'Admin Central Control Panel' : 'لوحة التحكم والإعدادات المركزية للمدير'}
        </h2>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
          {language === 'en' 
            ? 'Override operational metrics, configure seller targets, and customize customer status overrides.' 
            : 'تعديل المعاملات التشغيلية، وضبط المستهدفات للمندوبين، وتخصيص حالات المخاطر للعملاء.'}
        </p>
      </div>

      {/* Toast Notifications */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-bold animate-slideIn ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white border-green-600' : 
          toastMessage.type === 'error' ? 'bg-rose-500 text-white border-rose-600' : 
          'bg-amber-500 text-white border-amber-600'
        }`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl w-full max-w-sm ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <p className="text-sm font-bold mb-6">{confirmAction.msg}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmAction(null)} 
                className="flex-1 py-2 rounded-xl text-xs bg-slate-200 dark:bg-slate-700 font-bold"
              >
                {language === 'en' ? 'Cancel' : 'إلغاء'}
              </button>
              <button 
                onClick={confirmAction.onConfirm} 
                className="flex-1 py-2 rounded-xl text-xs bg-rose-500 text-white font-bold"
              >
                {language === 'en' ? 'Confirm' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('modifiers')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'modifiers'
              ? 'border-[#128d46] text-[#128d46]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'en' ? 'Modifiers & Variables' : 'المعاملات والمتغيرات'}
        </button>
        <button
          onClick={() => setActiveTab('targets')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'targets'
              ? 'border-[#128d46] text-[#128d46]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'en' ? 'Seller Target Settings' : 'أهداف المندوبين'}
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'customers'
              ? 'border-[#128d46] text-[#128d46]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'en' ? 'Customer Profile Editor' : 'محرر ملفات العملاء'}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-[#128d46] text-[#128d46]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          {language === 'en' ? 'User Accounts Control' : 'حسابات المستخدمين والصلاحيات'}
        </button>
      </div>

      {/* Modifier Tab */}
      {activeTab === 'modifiers' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sliders size={16} />
            {language === 'en' ? 'Adjust Global Factors & Sliders' : 'ضبط المتغيرات ونسب التحوير للمخزون والمالية'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Margin Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{language === 'en' ? 'Average Margin Scale Factor' : 'عامل ضبط هوامش الأرباح'}</span>
                <span className="text-[#128d46]">{adminSettings.marginModifier}</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={adminSettings.marginModifier}
                onChange={(e) => handleModifierChange('marginModifier', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#128d46]"
              />
              <p className="text-[10px] text-slate-400">
                {language === 'en' ? 'Modifies corporate gross profit margins weighted values.' : 'يتحكم في رفع وخفض هوامش ربح المبيعات بشكل عام.'}
              </p>
            </div>

            {/* Return Rate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{language === 'en' ? 'Return Logistics Scale factor' : 'مضاعف المرتجعات اللوجستية'}</span>
                <span className="text-rose-500">{adminSettings.returnRateModifier}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={adminSettings.returnRateModifier}
                onChange={(e) => handleModifierChange('returnRateModifier', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[10px] text-slate-400">
                {language === 'en' ? 'Modifies return frequency factors for operational logistics.' : 'يتحكم في نسبة المرتجعات المضافة لعمليات التوريد.'}
              </p>
            </div>

            {/* Stock Level Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{language === 'en' ? 'Stock Safety Level Multiplier' : 'عامل أمان المخزون المتوافر'}</span>
                <span className="text-blue-500">{adminSettings.stockLevelModifier}x</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={adminSettings.stockLevelModifier * 10}
                onChange={(e) => handleModifierChange('stockLevelModifier', parseFloat(e.target.value) / 10)}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-[10px] text-slate-400">
                {language === 'en' ? 'Scales mock stock level quantities against lead time factors.' : 'يتحكم في مستويات وفرة البضاعة بالمخازن وأوقات التوريد.'}
              </p>
            </div>

            {/* Pipeline conversion */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{language === 'en' ? 'Pipeline Funnel Conversion Prob.' : 'احتمالية تحويل صفقات المبيعات'}</span>
                <span className="text-indigo-500">{adminSettings.pipelineConversion}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={adminSettings.pipelineConversion}
                onChange={(e) => handleModifierChange('pipelineConversion', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                {language === 'en' ? 'Adjusts conversion ratios from Quote -> closed sales.' : 'يتحكم في فرص تحويل الصفقات المحتملة إلى مبيعات مؤكدة.'}
              </p>
            </div>
          </div>

          {/* Automated Push List Dispatch Pipeline */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[#128d46] uppercase tracking-wider">
                {language === 'en' ? 'S&OP Weekly Push List automated export pipeline' : 'نظام التصدير والإرسال الأسبوعي التلقائي لقائمة الترويج'}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'en' 
                  ? 'Simulate the background Node.js pipeline exporting surplus stock items (> 1.5x safety stock) to representative inboxes and publishing to the corporate SharePoint repository.'
                  : 'محاكاة نظام العمل الخلفي في Node.js لتصدير قائمة السحب الفوري (المنتجات فائضة المخزون عن حد الأمان بـ ١.٥ ضعف) وإرسالها للمندوبين ونشرها في SharePoint.'}
              </p>
            </div>
            <button
              onClick={() => {
                showToast(language === 'en' 
                  ? 'Weekly Push List dispatch pipeline successfully run! Dispatch log: scripts/generate_push_list.js executed.' 
                  : 'تم تفعيل نظام إرسال قائمة الترويج الأسبوعية بنجاح! تم تشغيل scripts/generate_push_list.js بنجاح.', 'success');
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#128d46] to-[#117a3c] hover:from-[#117a3c] hover:to-[#0f6b35] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>{language === 'en' ? 'Trigger Weekly Dispatch Pipeline' : 'بدء تشغيل خط أنابيب الإرسال الأسبوعي'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Target Tab */}
      {activeTab === 'targets' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Target size={16} />
            {language === 'en' ? 'Set Representative Targets (Qty)' : 'تعديل مستهدف المبيعات للمندوبين (الكمية)'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(sellerTargets).map(([name, target]) => (
              <div key={name} className="space-y-2">
                <label className="text-xs font-bold">{name}</label>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => handleTargetChange(name, parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} outline-none`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Editor Tab */}
      {activeTab === 'customers' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FileText size={16} />
            {language === 'en' ? 'Edit Customer Settings & Status' : 'تعديل تعليقات وأوضاع العملاء التشغيلية'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border-r border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold block mb-2">{language === 'en' ? 'Select Customer:' : 'اختر العميل:'}</label>
              {customers.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => syncCustomerInputs(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors block ${
                    selectedCust === c 
                      ? 'bg-[#128d46]/10 text-[#128d46]' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-xs font-bold block mb-1">
                  {language === 'en' ? 'Active Customer:' : 'العميل المختار:'} <strong className="text-indigo-500">{selectedCust}</strong>
                </span>
              </div>

              {/* Risk Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold block">{language === 'en' ? 'Risk override status:' : 'تعديل رتبة المخاطر يدوياً:'}</label>
                <select
                  value={riskValue}
                  onChange={(e) => setRiskValue(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                >
                  <option value="Auto">{language === 'en' ? 'Auto (Calculate RFM)' : 'تلقائي (حساب RFM)'}</option>
                  <option value="Champion">Champion</option>
                  <option value="Loyal">Loyal</option>
                  <option value="Medium Risk">Medium Risk</option>
                  <option value="High Risk">High Risk</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              {/* Comment text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold block">{language === 'en' ? 'Operational Notes / Actions:' : 'ملاحظات وتوجيهات تشغيلية:'}</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} outline-none`}
                  placeholder={language === 'en' ? 'Enter comments...' : 'أدخل التوجيهات...'}
                />
              </div>

              <button
                onClick={handleSaveCustomerSettings}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                {language === 'en' ? 'Save Changes' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Accounts Tab */}
      {activeTab === 'users' && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
          <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users size={16} />
              {language === 'en' ? 'Active User Accounts' : 'حسابات المستخدمين التشغيلية'}
            </h3>
          </div>

          {/* Users List Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200'} border-b font-bold`}>
                  <th className="p-3.5">{language === 'en' ? 'Username' : 'اسم المستخدم'}</th>
                  <th className="p-3.5">{language === 'en' ? 'Password' : 'كلمة المرور'}</th>
                  <th className="p-3.5">{language === 'en' ? 'Access Role' : 'الصلاحية الممنوحة'}</th>
                  <th className="p-3.5">{language === 'en' ? 'Linked Salesperson' : 'المندوب المرتبط'}</th>
                  <th className="p-3.5">{language === 'en' ? 'Sales Office' : 'مكتب المبيعات'}</th>
                  <th className="p-3.5 text-center">{language === 'en' ? 'Actions' : 'إجراءات'}</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user, idx) => (
                  <tr key={idx} className={`border-b ${darkMode ? 'border-slate-800/80 hover:bg-slate-800/30' : 'border-slate-200 hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3.5 font-bold">{user.username}</td>
                    <td className="p-3.5 font-mono">{user.password}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        user.role === 'admin' 
                          ? 'bg-[#128d46]/10 text-[#128d46]' 
                          : user.role === 'ceo' 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : user.role.startsWith('sales_') || user.role === 'sales'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-500 dark:text-slate-400">
                      {user.salesmanName || '-'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-500 dark:text-slate-400">
                      {user.salesOffice || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        disabled={currentUser?.username === user.username}
                        className={`p-1.5 rounded-lg transition-colors ${
                          currentUser?.username === user.username 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-rose-500 hover:bg-rose-500/10'
                        }`}
                        title={language === 'en' ? 'Delete User' : 'حذف المستخدم'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Form */}
          <div className={`p-5 rounded-xl border mt-6 ${darkMode ? 'bg-slate-900/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-bold mb-4 flex items-center gap-1.5 text-indigo-500">
              <UserPlus size={14} />
              {language === 'en' ? 'Create New User Account' : 'إنشاء حساب مستخدم جديد'}
            </h4>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold block">{language === 'en' ? 'Username' : 'اسم المستخدم'}</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-white border-slate-300 text-slate-700 focus:border-slate-400'} outline-none`}
                    placeholder="e.g., hassan"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold block">{language === 'en' ? 'Password' : 'كلمة المرور'}</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-slate-500' : 'bg-white border-slate-300 text-slate-700 focus:border-slate-400'} outline-none`}
                    placeholder="e.g., pass123"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold block">{language === 'en' ? 'Access Role' : 'الدور/الصلاحية'}</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                  >
                    <option value="admin">{language === 'en' ? 'Admin' : 'المدير العام'}</option>
                    <option value="ceo">{language === 'en' ? 'CEO Strategic Command' : 'المدير التنفيذي'}</option>
                    <option value="sales">{language === 'en' ? 'B2B Sales Director' : 'مدير مبيعات B2B'}</option>
                    <option value="sales_b2c">{language === 'en' ? 'B2C Sales Director' : 'مدير مبيعات B2C'}</option>
                    <option value="sales_horeca">{language === 'en' ? 'HORECA Sales Director' : 'مدير مبيعات HORECA'}</option>
                    <option value="finance">{language === 'en' ? 'Financial Manager' : 'المدير المالي'}</option>
                    <option value="sc">{language === 'en' ? 'SC Director' : 'مدير سلاسل التوريد'}</option>
                    <option value="salesperson">{language === 'en' ? 'Salesperson (Field Rep)' : 'مندوب مبيعات ميداني'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  {newRole === 'salesperson' ? (
                    <>
                      <label className="text-[10px] font-bold block">{language === 'en' ? 'Link Salesperson Name' : 'ربط باسم مندوب المبيعات'}</label>
                      <select
                        value={newSalesmanName}
                        onChange={(e) => setNewSalesmanName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                      >
                        {salesmenList.map((sm, idx) => (
                          <option key={idx} value={sm}>{sm}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic py-2.5">
                      {language === 'en' ? 'Linked Salesperson not required' : 'الربط بمندوب مبيعات غير مطلوب'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(newRole === 'salesperson' || newRole === 'sales' || newRole === 'sales_b2c' || newRole === 'sales_horeca') ? (
                    <>
                      <label className="text-[10px] font-bold block">{language === 'en' ? 'Sales Office / Channel' : 'مكتب المبيعات / القناة'}</label>
                      <select
                        value={newSalesOffice}
                        onChange={(e) => setNewSalesOffice(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                      >
                        <option value="B2B">B2B</option>
                        <option value="B2C">B2C</option>
                        <option value="Horeca Team">Horeca Team</option>
                        <option value="Pharma">Pharma</option>
                        <option value="Export">Export</option>
                        <option value="SME">SME</option>
                        <option value="Sisters Companies">Sisters Companies</option>
                        {(currentUser?.role === 'ceo' || currentUser?.role === 'admin' || currentUser?.role === 'finance' || ['wael', 'mahmoud', 'mahmoud_gamal'].includes((currentUser?.username || '').toLowerCase())) && (
                          <option value="Apex HQ">Apex HQ</option>
                        )}
                        <option value="Digital Marketing">Digital Marketing</option>
                      </select>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic py-2.5">
                      {language === 'en' ? 'Sales office assignment not required' : 'تحديد مكتب المبيعات غير مطلوب'}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-[#128d46] to-[#117a3c] hover:from-[#117a3c] hover:to-[#0f6b35] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    {language === 'en' ? 'Create User Account' : 'إنشاء حساب مستخدم'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(AdminControlView);
