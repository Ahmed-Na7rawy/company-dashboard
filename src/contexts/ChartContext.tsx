import React, { createContext, useContext, useState } from 'react';

type ChartMetric = 'revenue' | 'volume';

interface ChartContextProps {
  globalChartMetric: ChartMetric;
  setGlobalChartMetric: (val: ChartMetric) => void;
  globalCompareMode: boolean;
  setGlobalCompareMode: (val: boolean) => void;
}

const ChartContext = createContext<ChartContextProps>({
  globalChartMetric: 'revenue',
  setGlobalChartMetric: () => {},
  globalCompareMode: false,
  setGlobalCompareMode: () => {},
});

export const useChartContext = () => useContext(ChartContext);

export const ChartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalChartMetric, setGlobalChartMetric] = useState<ChartMetric>('revenue');
  const [globalCompareMode, setGlobalCompareMode] = useState<boolean>(false);

  return (
    <ChartContext.Provider value={{ globalChartMetric, setGlobalChartMetric, globalCompareMode, setGlobalCompareMode }}>
      {children}
    </ChartContext.Provider>
  );
};
