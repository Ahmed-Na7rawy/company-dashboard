import { useEffect, useRef } from 'react';

// Type extensions for performance entries
interface PerformanceLongTaskTiming extends PerformanceEntry {
  duration: number;
  startTime: number;
  name: string;
  attribution?: PerformanceLongTaskAttribution[];
}

interface PerformanceLayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: PerformanceEntry[];
}

interface PerformanceFirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface PerformanceLongTaskAttribution {
  name: string;
  attribution: string;
}

export function usePerformanceMonitor() {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const measurementsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Track long tasks
    if ('PerformanceLongTaskTiming' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTaskEntry = entry as PerformanceLongTaskTiming;
          if (longTaskEntry.duration > 50) {
            console.warn(`[Perf] Long task: ${longTaskEntry.duration.toFixed(1)}ms`, {
              startTime: longTaskEntry.startTime,
              name: longTaskEntry.name,
              attribution: longTaskEntry.attribution,
            });
          }
        }
      });
      observerRef.current.observe({ type: 'longtask', buffered: true });
    }

    // Track layout shifts
    if ('LayoutShift' in window) {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceLayoutShiftEntry;
          if (layoutShiftEntry.hadRecentInput) continue;
          if (layoutShiftEntry.value > 0.1) {
            console.warn(`[Perf] Layout shift: ${layoutShiftEntry.value.toFixed(3)}`, {
              sources: layoutShiftEntry.sources,
            });
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    }

    // Track first input delay
    if ('first-input' in PerformanceObserver.supportedEntryTypes) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInputEntry = entry as PerformanceFirstInputEntry;
          const delay = firstInputEntry.processingStart - firstInputEntry.startTime;
          if (delay > 100) {
            console.warn(`[Perf] First Input Delay: ${delay.toFixed(1)}ms`);
          }
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Mark start of async operation
  const markStart = (name: string) => {
    performance.mark(`${name}-start`);
    measurementsRef.current.set(name, performance.now());
  };

  // Mark end and log duration
  const markEnd = (name: string) => {
    const start = measurementsRef.current.get(name);
    if (start) {
      const duration = performance.now() - start;
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      if (duration > 100) {
        console.warn(`[Perf] ${name}: ${duration.toFixed(1)}ms`);
      }
      measurementsRef.current.delete(name);
      return duration;
    }
    return 0;
  };

  // Wrap async function with timing
  const measureAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
    markStart(name);
    try {
      return await fn();
    } finally {
      markEnd(name);
    }
  };

  // Measure component render time
  const measureRender = (name: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) {
        console.warn(`[Perf] Render ${name}: ${duration.toFixed(1)}ms`);
      }
    };
  };

  return {
    markStart,
    markEnd,
    measureAsync,
    measureRender,
  };
}

