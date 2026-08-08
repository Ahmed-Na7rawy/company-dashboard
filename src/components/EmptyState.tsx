import React from 'react';
import { Search, Filter, RefreshCw, Download, Upload, Plus, AlertTriangle, Info, Mail, ExternalLink, Database, Shield } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'search' | 'filter' | 'data' | 'offline' | 'permission' | 'error';
  className?: string;
}

const illustrations = {
  search: (
    <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="22" cy="22" r="16" />
      <path d="M42 42 L54 54" strokeLinecap="round" />
      <path d="M22 14 L22 6 M14 22 L6 22 M30 22 L38 22 M22 30 L22 38" strokeWidth="1" opacity="0.3" />
    </svg>
  ),
  filter: (
    <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 14 L22 28 L36 14 L50 28" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 38 L28 52 L42 38 L56 52" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <path d="M32 6 L32 58" strokeWidth="1" opacity="0.2" />
    </svg>
  ),
  data: (
    <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="8" y="12" width="48" height="40" rx="4" />
      <path d="M8 24 L56 24" />
      <path d="M20 32 L44 32" strokeWidth="1" opacity="0.5" />
      <path d="M20 40 L40 40" strokeWidth="1" opacity="0.3" />
      <path d="M20 48 L36 48" strokeWidth="1" opacity="0.2" />
    </svg>
  ),
  offline: (
    <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="32" cy="32" r="24" />
      <path d="M32 16 L32 28 M24 32 L40 32 M32 36 L32 48" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  permission: (
    <svg className="w-24 h-24 text-slate-300 dark:text-slate-700 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="14" width="44" height="36" rx="4" />
      <path d="M24 22 L30 28 L40 20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 14 L32 6 M32 50 L32 58 M14 32 L6 32 M50 32 L58 32" strokeWidth="1" opacity="0.3" />
    </svg>
  ),
  error: (
    <svg className="w-24 h-24 text-rose-400/50 mx-auto" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="32" cy="32" r="24" />
      <path d="M32 18 L32 30 M32 36 L32 46" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'data',
  className = ''
}: EmptyStateProps) {
  const actionVariants = {
    primary: 'bg-gradient-to-r from-[#128d46] to-[#117a3c] hover:from-[#117a3c] hover:to-[#0f6b35] text-white shadow-md',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
    outline: 'border-2 border-[#128d46] text-[#128d46] hover:bg-[#128d46]/5',
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {/* Illustration */}
      <div className="mb-6">
        {icon || illustrations[illustration]}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          {action && (
            <button
              onClick={action.onClick}
              className={`
                flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128d46] focus-visible:ring-offset-2
                ${actionVariants[action.variant || 'primary']}
              `}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`
                flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2
                bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700
              `}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Helpful hints */}
      {illustration === 'filter' && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl max-w-md text-left">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
            <Info className="w-4 h-4" />
            <span className="font-semibold text-sm">Tips</span>
          </div>
          <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
            <li>• Try clearing filters or expanding date range</li>
            <li>• Check if data exists for selected period</li>
            <li>• Verify your channel/office permissions</li>
          </ul>
        </div>
      )}

      {illustration === 'permission' && (
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl max-w-md text-left">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="font-semibold text-sm">Access Level</span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Your current role doesn't have access to this view. Contact your administrator if you believe this is an error.
          </p>
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export const EmptyStates = {
  noData: (onRefresh?: () => void) => (
    <EmptyState
      illustration="data"
      title="No Data Available"
      description="There are no records matching your current filters. Try adjusting your search criteria or time period."
      action={onRefresh ? { label: 'Refresh Data', onClick: onRefresh, icon: <RefreshCw className="w-4 h-4" /> } : undefined}
    />
  ),

  noSearchResults: (onClear?: () => void) => (
    <EmptyState
      illustration="search"
      title="No Results Found"
      description="Your search didn't match any records. Try different keywords or clear the search."
      action={onClear ? { label: 'Clear Search', onClick: onClear, icon: <Filter className="w-4 h-4" />, variant: 'outline' } : undefined}
    />
  ),

  noFilterResults: (onClearFilters?: () => void) => (
    <EmptyState
      illustration="filter"
      title="No Matching Records"
      description="Current filters return no results. Try adjusting your filter criteria or clearing all filters."
      action={onClearFilters ? { label: 'Clear All Filters', onClick: onClearFilters, icon: <Filter className="w-4 h-4" /> } : undefined}
      secondaryAction={{ label: 'Modify Filters', onClick: () => {} }}
    />
  ),

  offline: (onRetry?: () => void) => (
    <EmptyState
      illustration="offline"
      title="You're Offline"
      description="Unable to connect to the server. Data may be stale. Changes will sync when connection is restored."
      action={onRetry ? { label: 'Retry Connection', onClick: onRetry, icon: <RefreshCw className="w-4 h-4" /> } : undefined}
    />
  ),

  noPermission: () => (
    <EmptyState
      illustration="permission"
      title="Access Restricted"
      description="Your current role doesn't have permission to view this section. Please contact your administrator for access."
    />
  ),

  error: (message: string, onRetry?: () => void) => (
    <EmptyState
      illustration="error"
      title="Something Went Wrong"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry, icon: <RefreshCw className="w-4 h-4" /> } : undefined}
    />
  ),

  firstTime: (title: string, description: string, actionLabel: string, onAction: () => void) => (
    <EmptyState
      illustration="data"
      title={title}
      description={description}
      action={{ label: actionLabel, onClick: onAction, icon: <Plus className="w-4 h-4" /> }}
    />
  ),
};