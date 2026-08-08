import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  darkMode: boolean;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastIcons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles: Record<ToastType, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-300',
  error: 'bg-rose-500/10 border-rose-500/20 text-rose-400 dark:text-rose-300',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400 dark:text-amber-300',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400 dark:text-blue-300',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Sync with document dark mode class
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id } as Toast;
    setToasts(prev => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration ?? 5000);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, darkMode }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        {toasts.map(toast => {
          const Icon = toastIcons[toast.type];
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-lg
                min-w-[300px] max-w-[450px] animate-slideInRight
                ${toastStyles[toast.type]}
                ${darkMode ? 'bg-slate-900/90' : 'bg-white/90'}
                backdrop-blur-sm
              `}
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs opacity-80 mt-0.5">{toast.message}</p>
                )}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-2 text-xs font-semibold underline hover:no-underline"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      showToast: () => '',
      hideToast: () => {},
      darkMode: false
    };
  }
  return context;
}