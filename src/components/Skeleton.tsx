import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width = '100%',
  height = '1rem',
  count = 1
}: SkeletonProps) {
  const baseStyle = {
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '0.5rem',
  };

  const darkStyle = {
    background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '0.5rem',
  };

  const styles = {
    text: { width, height, borderRadius: '0.25rem' },
    circular: { width, height, borderRadius: '9999px' },
    rectangular: { width, height, borderRadius: '0.5rem' },
    card: { width: '100%', height: '100%', borderRadius: '1rem' },
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${className}`}
      style={{
        ...baseStyle,
        ...styles[variant],
      }}
    />
  ));

  return count === 1 ? items[0] : <div className="space-y-3">{items}</div>;
}

// Pre-built skeleton components for common UI patterns
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-2xl border ${className} skeleton`} style={{
      minHeight: '200px',
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderColor: '#e2e8f0',
    }}>
      <div className="space-y-4">
        <Skeleton variant="text" width="30%" height="1.5rem" />
        <Skeleton variant="text" width="60%" height="1rem" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Skeleton variant="rectangular" height="80px" />
          <Skeleton variant="rectangular" height="80px" />
          <Skeleton variant="rectangular" height="80px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700/40 rounded-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800 border-b font-bold uppercase tracking-wider">
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="p-3">
                <Skeleton variant="text" width="80%" height="0.75rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} className="border-b border-slate-200/60 dark:border-slate-800/60">
              {Array.from({ length: columns }, (_, col) => (
                <td key={col} className="p-3">
                  <Skeleton variant="text" width="90%" height="1rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="skeleton" style={{
      width: '100%',
      height: `${height}px`,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '1rem',
    }} />
  );
}

export function SkeletonKPI({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-5 rounded-2xl border skeleton" style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderColor: '#e2e8f0',
        }}>
          <Skeleton variant="text" width="30%" height="0.75rem" className="mb-2" />
          <Skeleton variant="text" width="50%" height="2rem" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChartGrid({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-6 rounded-2xl border skeleton" style={{
          minHeight: '300px',
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderColor: '#e2e8f0',
        }} />
      ))}
    </div>
  );
}

export function SkeletonTabs({ tabCount = 4, contentHeight = 200 }: { tabCount?: number; contentHeight?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {Array.from({ length: tabCount }, (_, i) => (
          <button
            key={i}
            className="px-4 py-2.5 text-xs font-bold border-b-2 border-transparent text-slate-400 skeleton"
            disabled
            style={{
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <SkeletonChart height={contentHeight} />
    </div>
  );
}

export function SkeletonSelect() {
  return (
    <select className="skeleton w-full px-3 py-2 rounded-xl border text-xs font-semibold" disabled style={{
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderColor: '#e2e8f0',
      color: 'transparent',
    }}>
      <option disabled>Loading...</option>
    </select>
  );
}

export function SkeletonSearchInput() {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 skeleton" style={{
        borderRadius: '50%',
      }} />
      <input
        type="text"
        className="skeleton w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none"
        disabled
        style={{
          background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderColor: '#e2e8f0',
          color: 'transparent',
        }}
      />
    </div>
  );
}