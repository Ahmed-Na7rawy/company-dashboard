import React from 'react';

export class ErrorBoundary extends React.Component<
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
