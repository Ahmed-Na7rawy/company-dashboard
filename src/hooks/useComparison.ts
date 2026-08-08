import { useState, useCallback, useMemo } from 'react';

export type CompareType = 'quarter' | 'custom';

export interface QuarterCompareState {
  q1Year: number;
  q1Num: number;
  q2Year: number;
  q2Num: number;
}

export interface CustomCompareState {
  baseStart: string;
  baseEnd: string;
  compStart: string;
  compEnd: string;
}

export interface ComparisonConfig {
  enabled: boolean;
  type: CompareType;
  quarter: QuarterCompareState;
  custom: CustomCompareState;
}

export type ComparisonReturn = ReturnType<typeof useComparison>;

const defaultQuarterState: QuarterCompareState = {
  q1Year: 2026,
  q1Num: 1,
  q2Year: 2026,
  q2Num: 2,
};

const defaultCustomState: CustomCompareState = {
  baseStart: '2025-01-01',
  baseEnd: '2025-06-30',
  compStart: '2026-01-01',
  compEnd: '2026-06-30',
};

function createInitialConfig(initialEnabled: boolean, initialType: CompareType): ComparisonConfig {
  return {
    enabled: initialEnabled,
    type: initialType,
    quarter: defaultQuarterState,
    custom: defaultCustomState,
  };
}

export function useComparison(
  initialEnabled: boolean = false,
  initialType: CompareType = 'quarter'
) {
  const [config, setConfig] = useState<ComparisonConfig>(() =>
    createInitialConfig(initialEnabled, initialType)
  );

  const toggle = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setType = useCallback((type: CompareType) => {
    setConfig(prev => ({ ...prev, type }));
  }, []);

  const setQuarter = useCallback((field: keyof QuarterCompareState, value: number) => {
    setConfig(prev => ({
      ...prev,
      quarter: { ...prev.quarter, [field]: value }
    }));
  }, []);

  const setCustom = useCallback((field: keyof CustomCompareState, value: string) => {
    setConfig(prev => ({
      ...prev,
      custom: { ...prev.custom, [field]: value }
    }));
  }, []);

  const reset = useCallback(() => {
    setConfig(createInitialConfig(false, 'quarter'));
  }, []);

  // Computed comparison labels
  const labels = useMemo(() => ({
    base: config.type === 'custom'
      ? `Base (${config.custom.baseStart} / ${config.custom.baseEnd})`
      : `Base: Q${config.quarter.q1Num} ${config.quarter.q1Year}`,
    compare: config.type === 'custom'
      ? `Compare (${config.custom.compStart} / ${config.custom.compEnd})`
      : `Compare: Q${config.quarter.q2Num} ${config.quarter.q2Year}`,
  }), [config]);

  return {
    ...config,
    toggle,
    setType,
    setQuarter,
    setCustom,
    reset,
    labels,
  };
}

export function useMultiComparison(
  names: string[],
  initialEnabled: boolean = false
) {
  // Use a single state object to hold all comparison configs
  const [configs, setConfigs] = useState<Record<string, ComparisonConfig>>(() => {
    const initial: Record<string, ComparisonConfig> = {};
    names.forEach(name => {
      initial[name] = createInitialConfig(initialEnabled, 'quarter');
    });
    return initial;
  });

  const toggle = useCallback((name: string) => {
    setConfigs(prev => ({
      ...prev,
      [name]: { ...prev[name], enabled: !prev[name]?.enabled }
    }));
  }, []);

  const setType = useCallback((name: string, type: CompareType) => {
    setConfigs(prev => ({
      ...prev,
      [name]: { ...prev[name], type }
    }));
  }, []);

  const setQuarter = useCallback((name: string, field: keyof QuarterCompareState, value: number) => {
    setConfigs(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        quarter: { ...prev[name].quarter, [field]: value }
      }
    }));
  }, []);

  const setCustom = useCallback((name: string, field: keyof CustomCompareState, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        custom: { ...prev[name].custom, [field]: value }
      }
    }));
  }, []);

  const reset = useCallback((name: string) => {
    setConfigs(prev => ({
      ...prev,
      [name]: createInitialConfig(false, 'quarter')
    }));
  }, []);

  const comparisons = useMemo(() => {
    const obj: Record<string, ComparisonReturn> = {};
    names.forEach(name => {
      const config = configs[name] || createInitialConfig(initialEnabled, 'quarter');
      obj[name] = {
        ...config,
        toggle: () => toggle(name),
        setType: (type: CompareType) => setType(name, type),
        setQuarter: (field: keyof QuarterCompareState, value: number) => setQuarter(name, field, value),
        setCustom: (field: keyof CustomCompareState, value: string) => setCustom(name, field, value),
        reset: () => reset(name),
        labels: {
          base: config.type === 'custom'
            ? `Base (${config.custom.baseStart} / ${config.custom.baseEnd})`
            : `Base: Q${config.quarter.q1Num} ${config.quarter.q1Year}`,
          compare: config.type === 'custom'
            ? `Compare (${config.custom.compStart} / ${config.custom.compEnd})`
            : `Compare: Q${config.quarter.q2Num} ${config.quarter.q2Year}`,
        }
      };
    });
    return obj;
  }, [names.join(','), configs, toggle, setType, setQuarter, setCustom, reset, initialEnabled]);

  return comparisons;
}