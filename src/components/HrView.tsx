import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, ClipboardList, CheckCircle, XCircle, Clock, Briefcase, 
  Search, Calendar, UserCheck, Bell, AlertCircle, Trash2, ArrowRight
} from 'lucide-react';

interface Candidate {
  id: number;
  name: string;
  position: string;
  department: string;
  stage: 'Screening' | '1st Interview' | '2nd Interview' | '3rd Interview' | 'Hired' | 'Rejected';
  hiringDate?: string;
  manager?: string;
  probationStatus?: 'Under Review' | 'Continuing' | 'Terminated';
}

interface HrViewProps {
  language: 'en' | 'ar';
  darkMode: boolean;
  t: (key: string) => string;
}

function HrView({ language, darkMode, t }: HrViewProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    try {
      const saved = localStorage.getItem('apex_hr_candidates');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse candidates:', e);
    }
    return [
      {
        id: 1,
        name: 'Ahmed Aly',
        position: 'Junior Accountant',
        department: 'Finance',
        stage: 'Screening'
      },
      {
        id: 2,
        name: 'Sherif Osman',
        position: 'B2B Sales Representative',
        department: 'Sales',
        stage: '2nd Interview'
      },
      {
        id: 3,
        name: 'Amira Youssef',
        position: 'Logistics Coordinator',
        department: 'Supply Chain',
        stage: 'Hired',
        hiringDate: '2026-05-15',
        manager: 'Basant Adel',
        probationStatus: 'Under Review'
      },
      {
        id: 4,
        name: 'Mostafa Mahmoud',
        position: 'Food Stabilizer Scientist',
        department: 'R&D',
        stage: 'Hired',
        hiringDate: '2026-04-01',
        manager: 'Dr. Haitham',
        probationStatus: 'Under Review'
      }
    ];
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('apex_hr_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Form states
  const [newCustName, setNewCustName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newDept, setNewDept] = useState('Sales');
  
  // Hiring Modal/Input state
  const [hiringCandidateId, setHiringCandidateId] = useState<number | null>(null);
  const [hiringDateInput, setHiringDateInput] = useState('2026-06-30');
  const [managerInput, setManagerInput] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Reference date for simulation: June 30, 2026
  const refDate = useMemo(() => new Date('2026-06-30'), []);

  // Check if hiring date is more than 2 months ago (60 days)
  const isProbationDue = (hiringDateStr?: string) => {
    if (!hiringDateStr) return false;
    const hDate = new Date(hiringDateStr);
    const timeDiff = refDate.getTime() - hDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff >= 60; // 60 days ~ 2 months
  };

  // Add Candidate handler
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newPosition.trim()) return;

    const newCandidate: Candidate = {
      id: Date.now(),
      name: newCustName.trim(),
      position: newPosition.trim(),
      department: newDept,
      stage: 'Screening'
    };

    setCandidates(prev => [newCandidate, ...prev]);
    setNewCustName('');
    setNewPosition('');
  };

  // Move candidate to next stage
  const advanceStage = (id: number) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c;
      let nextStage: Candidate['stage'] = c.stage;
      if (c.stage === 'Screening') nextStage = '1st Interview';
      else if (c.stage === '1st Interview') nextStage = '2nd Interview';
      else if (c.stage === '2nd Interview') nextStage = '3rd Interview';
      else if (c.stage === '3rd Interview') {
        // Trigger hiring date entry modal/form
        setHiringCandidateId(id);
        setManagerInput('');
        setHiringDateInput('2026-06-29');
        return c; // Wait for form completion to transition to Hired
      }
      return { ...c, stage: nextStage };
    }));
  };

  // Reject Candidate
  const rejectCandidate = (id: number) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, stage: 'Rejected', probationStatus: undefined };
      }
      return c;
    }));
  };

  // Finalize Hiring date and manager details
  const submitHiringDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (hiringCandidateId === null || !managerInput.trim() || !hiringDateInput) return;

    setCandidates(prev => prev.map(c => {
      if (c.id === hiringCandidateId) {
        return { 
          ...c, 
          stage: 'Hired', 
          hiringDate: hiringDateInput, 
          manager: managerInput.trim(),
          probationStatus: 'Under Review' 
        };
      }
      return c;
    }));

    setHiringCandidateId(null);
  };

  // Update probation review status
  const updateProbationStatus = (id: number, status: 'Continuing' | 'Terminated') => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, probationStatus: status };
      }
      return c;
    }));
  };

  // Remove candidate
  const removeCandidate = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split datasets
  const activeCandidates = filteredCandidates.filter(c => c.stage !== 'Hired' && c.stage !== 'Rejected');
  const employees = filteredCandidates.filter(c => c.stage === 'Hired');
  const rejectedCount = candidates.filter(c => c.stage === 'Rejected').length;

  // Count alerts (hired for >2 months and still "Under Review")
  const alertEmployees = employees.filter(emp => isProbationDue(emp.hiringDate) && emp.probationStatus === 'Under Review');

  const isEn = language === 'en';

  const stagesList: Candidate['stage'][] = ['Screening', '1st Interview', '2nd Interview', '3rd Interview'];

  return (
    <div className="space-y-8 animate-fadeIn text-xs">
      {/* Header */}
      <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'HR Operations Command' : 'إدارة عمليات الموارد البشرية'}
          </h2>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn ? 'Welcome Rahma Tarek. Manage candidate pipelines, onboarding cycles, and employee probation tasks.' : 'مرحباً رحمة طارق. إدارة خطوط التعيين، دورات التهيئة، ومهام تثبيت الموظفين الجدد.'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className={`px-4 py-2 rounded-xl text-center border ${
            darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">{isEn ? 'Active Candidates' : 'المرشحون النشطون'}</span>
            <span className="text-base font-black text-indigo-500">{candidates.filter(c => c.stage !== 'Hired' && c.stage !== 'Rejected').length}</span>
          </div>
          <div className={`px-4 py-2 rounded-xl text-center border ${
            darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">{isEn ? 'Active Employees' : 'الموظفون الحاليون'}</span>
            <span className="text-base font-black text-emerald-500">{employees.length}</span>
          </div>
        </div>
      </div>

      {/* Action alerts panel for Probation reviews */}
      {alertEmployees.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/35 bg-rose-500/5 text-rose-500 flex items-start gap-3">
          <Bell className="flex-shrink-0 animate-bounce mt-0.5" size={16} />
          <div className="space-y-1.5">
            <h4 className="font-bold text-rose-500 text-[13px]">{isEn ? 'Probation Reviews Required' : 'تقييمات فترة الاختبار المطلوبة'}</h4>
            <p className={darkMode ? 'text-rose-200' : 'text-rose-800'}>
              {isEn 
                ? `You have ${alertEmployees.length} employees who reached the 2-month threshold. Please contact their managers to perform probation reviews:` 
                : `لديك عدد ${alertEmployees.length} موظفاً تجاوزوا فترة الاختبار (شهرين). يرجى التنسيق مع مدرائهم للتقييم:`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {alertEmployees.map(emp => (
                <div key={emp.id} className={`px-2.5 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1.5 ${
                  darkMode ? 'bg-slate-900/60 border-rose-500/20 text-rose-200' : 'bg-white border-rose-200 text-rose-700'
                }`}>
                  <AlertCircle size={12} />
                  <span>{emp.name} ({emp.position})</span>
                  <span className="text-[8px] opacity-75">➔ Mgr: {emp.manager}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Add Candidate (Screening) & Active Candidates Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screening addition form */}
        <div className={`p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
        } shadow-sm space-y-4`}>
          <h3 className={`text-sm font-bold border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            <UserPlus size={16} className="text-indigo-500" />
            {isEn ? 'Add Candidate in Screening' : 'إضافة مرشح جديد (Screening)'}
          </h3>

          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div>
              <label className="text-slate-400 block mb-1 font-bold">{isEn ? 'Candidate Name' : 'اسم المرشح'}</label>
              <input 
                type="text" 
                required
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder={isEn ? 'e.g. Aly Tarek' : 'مثال: علي طارق'}
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500/50 ${
                  darkMode ? 'bg-slate-900/60 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              />
            </div>
            
            <div>
              <label className="text-slate-400 block mb-1 font-bold">{isEn ? 'Target Position' : 'الوظيفة المستهدفة'}</label>
              <input 
                type="text" 
                required
                value={newPosition}
                onChange={e => setNewPosition(e.target.value)}
                placeholder={isEn ? 'e.g. Sales Coordinator' : 'مثال: منسق مبيعات'}
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500/50 ${
                  darkMode ? 'bg-slate-900/60 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-bold">{isEn ? 'Department' : 'القسم'}</label>
              <select
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-indigo-500/50 ${
                  darkMode ? 'bg-slate-900/60 border-slate-700/60 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'
                }`}
              >
                <option value="Sales">Sales (B2B)</option>
                <option value="Finance">Finance</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="R&D">R&D</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md transition-all duration-200 active:scale-95 flex justify-center items-center gap-1.5"
            >
              <UserPlus size={14} />
              {isEn ? 'Register Candidate' : 'تسجيل المرشح'}
            </button>
          </form>
        </div>

        {/* Recruitment Pipeline Tracker */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${
          darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
        } shadow-sm flex flex-col`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 dark:border-slate-700 pb-3 mb-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
              <ClipboardList size={16} className="text-indigo-500" />
              {isEn ? 'Active Recruitment Pipelines' : 'متابعة مراحل التوظيف النشطة'}
            </h3>
            <div className="relative w-full sm:w-48">
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isEn ? 'Search candidates...' : 'بحث عن مرشح...'}
                className={`w-full py-1.5 pl-7 pr-3 rounded-lg border text-[10px] focus:outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-55 border-slate-300'
                }`}
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {activeCandidates.length === 0 ? (
              <p className="text-slate-400 text-center py-12 italic">{isEn ? 'No active candidates found.' : 'لا يوجد مرشحون نشطون حالياً.'}</p>
            ) : (
              <table className="w-full text-left border-collapse border-slate-200 dark:border-slate-700">
                <thead>
                  <tr className={`border-b ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold`}>
                    <th className="p-3">{isEn ? 'Candidate' : 'المرشح'}</th>
                    <th className="p-3">{isEn ? 'Role' : 'الوظيفة'}</th>
                    <th className="p-3">{isEn ? 'Cycle Progress' : 'دورة المقابلات'}</th>
                    <th className="p-3 text-right">{isEn ? 'Actions' : 'الإجراءات'}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCandidates.map(cand => (
                    <tr key={cand.id} className={`border-b ${darkMode ? 'border-slate-800/60 hover:bg-slate-800/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <td className="p-3">
                        <span className="font-bold block text-[13px]">{cand.name}</span>
                        <span className="text-[10px] opacity-75 text-indigo-500 font-bold">{cand.department}</span>
                      </td>
                      <td className="p-3 font-semibold">{cand.position}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {stagesList.map((stage, idx) => {
                            const isCurrent = cand.stage === stage;
                            const isPassed = stagesList.indexOf(cand.stage) > idx;
                            return (
                              <div key={idx} className="flex items-center">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                                  isCurrent 
                                    ? 'bg-indigo-500 text-white scale-105 border border-indigo-400' 
                                    : isPassed 
                                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                      : 'bg-slate-200 dark:bg-slate-900 text-slate-400 dark:text-slate-600'
                                }`}>
                                  {isEn 
                                    ? (stage === 'Screening' ? 'Screening' : stage === '1st Interview' ? '1st' : stage === '2nd Interview' ? '2nd' : '3rd') 
                                    : (stage === 'Screening' ? 'فرز' : stage === '1st Interview' ? 'أولى' : stage === '2nd Interview' ? 'ثانية' : 'ثالثة')}
                                </span>
                                {idx < 3 && <ArrowRight size={10} className="mx-0.5 text-slate-400" />}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => advanceStage(cand.id)}
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-black rounded-lg border border-indigo-500/20 active:scale-95 transition-all"
                          >
                            {cand.stage === '3rd Interview' 
                              ? (isEn ? 'Hire' : 'تعيين') 
                              : (isEn ? 'Pass' : 'تمرير')}
                          </button>
                          <button
                            onClick={() => rejectCandidate(cand.id)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-black rounded-lg border border-rose-500/20 active:scale-95 transition-all"
                          >
                            {isEn ? 'Reject' : 'رفض'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal/Form: Enter hiring date & manager once candidate is accepted */}
      {hiringCandidateId !== null && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-2xl border w-full max-w-sm space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          } shadow-2xl animate-scaleUp`}>
            <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <UserCheck size={16} className="text-emerald-500" />
                {isEn ? 'Finalize Candidate Hiring' : 'اعتماد وتثبيت تعيين مرشح'}
              </h3>
              <button 
                onClick={() => setHiringCandidateId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <XCircle size={16} />
              </button>
            </div>

            <form onSubmit={submitHiringDetails} className="space-y-4">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">{isEn ? 'Onboarding Hiring Date' : 'تاريخ المباشرة / التعيين'}</label>
                <input 
                  type="date"
                  required
                  value={hiringDateInput}
                  onChange={e => setHiringDateInput(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">{isEn ? 'Reporting Line / Manager' : 'المدير المسؤول المباشر'}</label>
                <input 
                  type="text"
                  required
                  value={managerInput}
                  onChange={e => setManagerInput(e.target.value)}
                  placeholder={isEn ? 'e.g. Eng. Wael' : 'مثال: م. وائل'}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all"
                >
                  {isEn ? 'Confirm Hire' : 'تأكيد التعيين'}
                </button>
                <button
                  type="button"
                  onClick={() => setHiringCandidateId(null)}
                  className={`flex-1 py-2 font-bold rounded-xl border transition-all ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-105 border-slate-300 text-slate-600'
                  }`}
                >
                  {isEn ? 'Cancel' : 'إلغاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees Database & Probation Reviews List */}
      <div className={`p-6 rounded-2xl border ${
        darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
      } shadow-sm`}>
        <h3 className={`text-sm font-bold border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'} pb-3 mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          <UserCheck size={16} className="text-emerald-500" />
          {isEn ? 'Employee Database & Probation Tracker' : 'قاعدة بيانات الموظفين ومتابعة فترة الاختبار'}
        </h3>

        <div className="overflow-x-auto">
          {employees.length === 0 ? (
            <p className="text-slate-400 text-center py-12 italic">{isEn ? 'No employees recorded in B2B database.' : 'لا يوجد موظفون مسجلون حالياً.'}</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} font-bold`}>
                  <th className="p-3">{isEn ? 'Employee Name' : 'اسم الموظف'}</th>
                  <th className="p-3">{isEn ? 'Position' : 'الوظيفة'}</th>
                  <th className="p-3">{isEn ? 'Hiring Date' : 'تاريخ التعيين'}</th>
                  <th className="p-3">{isEn ? 'Reporting Manager' : 'المدير المسؤول'}</th>
                  <th className="p-3">{isEn ? 'Probation Threshold' : 'حالة فترة الاختبار'}</th>
                  <th className="p-3 text-right">{isEn ? 'Manager Confirmation' : 'اعتماد التقييم'}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const isDue = isProbationDue(emp.hiringDate);
                  return (
                    <tr key={emp.id} className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} hover:bg-slate-100/50`}>
                      <td className="p-3 font-bold text-[13px]">{emp.name}</td>
                      <td className="p-3 font-semibold">{emp.position}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="font-semibold">{emp.hiringDate}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-500 dark:text-slate-400">{emp.manager}</td>
                      <td className="p-3">
                        {isDue ? (
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded-md animate-pulse ${
                            emp.probationStatus === 'Under Review' 
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : emp.probationStatus === 'Continuing'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {emp.probationStatus === 'Under Review'
                              ? (isEn ? 'Review Due (>2m)' : 'تقييم مستحق (>شهران)')
                              : emp.probationStatus === 'Continuing'
                                ? (isEn ? 'Probation Passed' : 'تجاوز فترة الاختبار')
                                : (isEn ? 'Terminated' : 'غير مستمر')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-md text-[9px] font-bold">
                            {isEn ? 'Under Probation' : 'في فترة التقييم'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isDue && emp.probationStatus === 'Under Review' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => updateProbationStatus(emp.id, 'Continuing')}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold rounded-lg border border-emerald-500/20 active:scale-95 transition-all text-[10px]"
                            >
                              {isEn ? 'Continuing' : 'مستمر'}
                            </button>
                            <button
                              onClick={() => updateProbationStatus(emp.id, 'Terminated')}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-lg border border-rose-500/20 active:scale-95 transition-all text-[10px]"
                            >
                              {isEn ? 'Terminate' : 'غير مستمر'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {emp.probationStatus === 'Continuing' && (isEn ? '✓ Confirmed Active' : '✓ تم التثبيت بالخدمة')}
                            {emp.probationStatus === 'Terminated' && (isEn ? '✗ Separation Logged' : '✗ تم إنهاء التعاقد')}
                            {emp.probationStatus === 'Under Review' && !isDue && (isEn ? 'Awaiting Timeframe' : 'بانتظار انقضاء الفترة')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Rejected/Archive stats panel */}
      {rejectedCount > 0 && (
        <div className={`p-4 rounded-xl border flex justify-between items-center text-xs ${
          darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-slate-400">
            <XCircle size={14} />
            <span>{isEn ? `Recruitment Archive holds ${rejectedCount} rejected applicant profiles.` : `أرشيف التوظيف يحتوي على عدد ${rejectedCount} ملفات غير متجاوزة.`}</span>
          </div>
          <button 
            onClick={() => setCandidates(prev => prev.filter(c => c.stage !== 'Rejected'))}
            className="text-[9px] font-black text-rose-500 uppercase hover:underline"
          >
            {isEn ? 'Clear Archive' : 'تفريغ الأرشيف'}
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(HrView);
