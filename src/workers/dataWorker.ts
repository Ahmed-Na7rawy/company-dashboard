// Web Worker for asynchronous background data processing & filtering off the main thread

export interface RawRow {
  Date: string;
  CustomerName: string;
  CustomerCode?: string;
  Segment: string;
  ItemName: string;
  MaterialCode?: string;
  Quantity: number;
  NetQuantity?: number;
  BillType: string;
  SalesmanName?: string;
  ItemGroup?: string;
  SalesOffice?: string;
  Revenue: number;
}

export interface WorkerFilterParams {
  canAccessApexOffice: boolean;
  role?: string;
  salesmanName?: string;
  salesOffice?: string;
  username?: string;
  debouncedSearchTerm: string;
  timePeriod: string;
  customStartDate: string;
  customEndDate: string;
  selectedYear: string;
  selectedMonth: string;
  selectedQuarter: string;
}

export function processRow(row: RawRow) {
  const btLower = row.BillType ? row.BillType.toLowerCase() : '';
  const isReturn =
    row.BillType === 'Return' ||
    btLower.includes('return') ||
    btLower.includes('credit') ||
    btLower.startsWith('re ') ||
    btLower.startsWith('cm ') ||
    row.Quantity < 0 ||
    (row.NetQuantity !== undefined && row.NetQuantity < 0) ||
    row.Revenue < 0;
  const qty = Math.abs(row.Quantity || 0);
  const netQty =
    row.NetQuantity !== undefined
      ? isReturn
        ? -Math.abs(row.NetQuantity)
        : Math.abs(row.NetQuantity)
      : qty * (isReturn ? -1 : 1);

  const dateTimestamp = Date.parse(row.Date);
  if (isNaN(dateTimestamp)) return null;

  return {
    ...row,
    dateTimestamp,
    DateStr: row.Date,
    Volume: qty,
    NetQuantity: netQty,
    IsReturn: !!isReturn,
  };
}

if (typeof self !== 'undefined') {
  self.onmessage = (e: MessageEvent<{ type: string; rawData: RawRow[]; params: WorkerFilterParams }>) => {
    const { type, rawData, params } = e.data;

    if (type === 'PROCESS_DATA') {
      const startTime = performance.now();
      
      // 1. Initial mapping & return calculation
      const mapped = rawData
        .map(processRow)
        .filter((row): row is NonNullable<ReturnType<typeof processRow>> => row !== null);

      // 2. Office confidentiality filter
      let filtered = mapped;
      if (!params.canAccessApexOffice) {
        filtered = filtered.filter((row) => row.SalesOffice !== 'Apex HQ');
      }

      // 3. User role & sales office filter
      if (params.role === 'salesperson' && params.salesmanName) {
        filtered = filtered.filter((row) => row.SalesmanName === params.salesmanName);
      } else if (params.role === 'sales_b2b') {
        filtered = filtered.filter((row) => row.SalesOffice === 'B2B');
      } else if (params.role === 'sales_b2c') {
        filtered = filtered.filter((row) =>
          ['B2C', 'Modern Trade', 'Alex Office', 'Dist. Office', 'LG Office', 'E-Commerce'].includes(row.SalesOffice || '')
        );
      } else if (params.role === 'sales_horeca') {
        filtered = filtered.filter((row) => row.SalesOffice === 'Horeca Team');
      }

      // 4. Search term filter
      if (params.debouncedSearchTerm && params.debouncedSearchTerm.trim() !== '') {
        const term = params.debouncedSearchTerm.toLowerCase();
        filtered = filtered.filter(
          (row) =>
            row.CustomerName?.toLowerCase().includes(term) ||
            row.CustomerCode?.toLowerCase().includes(term) ||
            row.ItemName?.toLowerCase().includes(term) ||
            row.MaterialCode?.toLowerCase().includes(term) ||
            row.SalesmanName?.toLowerCase().includes(term) ||
            row.Segment?.toLowerCase().includes(term) ||
            row.ItemGroup?.toLowerCase().includes(term)
        );
      }

      // Calculate max date for time period calculations
      let maxTimestamp = Date.parse('2022-01-01');
      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i].dateTimestamp > maxTimestamp) {
          maxTimestamp = filtered[i].dateTimestamp;
        }
      }
      const maxDate = new Date(maxTimestamp);

      // 5. Time period filter
      if (params.timePeriod === 'Custom') {
        if (params.customStartDate) {
          const start = Date.parse(params.customStartDate);
          filtered = filtered.filter((row) => row.dateTimestamp >= start);
        }
        if (params.customEndDate) {
          const end = Date.parse(params.customEndDate);
          filtered = filtered.filter((row) => row.dateTimestamp <= end);
        }
      } else if (params.timePeriod !== 'All') {
        const cutoff = new Date(maxDate);
        if (params.timePeriod === '3M') cutoff.setMonth(maxDate.getMonth() - 3);
        else if (params.timePeriod === '6M') cutoff.setMonth(maxDate.getMonth() - 6);
        else if (params.timePeriod === '12M') cutoff.setMonth(maxDate.getMonth() - 12);
        const cutoffTime = cutoff.getTime();
        filtered = filtered.filter((row) => row.dateTimestamp >= cutoffTime);
      }

      // 6. Year, Month, Quarter filters
      if (params.selectedYear !== 'All') {
        const yrNum = parseInt(params.selectedYear);
        filtered = filtered.filter((row) => new Date(row.dateTimestamp).getFullYear() === yrNum);
      }

      if (params.selectedMonth !== 'All') {
        const moNum = parseInt(params.selectedMonth);
        filtered = filtered.filter((row) => new Date(row.dateTimestamp).getMonth() + 1 === moNum);
      }

      if (params.selectedQuarter !== 'All') {
        const qtrNum = parseInt(params.selectedQuarter);
        filtered = filtered.filter((row) => {
          const month = new Date(row.dateTimestamp).getMonth();
          const qtr = Math.floor(month / 3) + 1;
          return qtr === qtrNum;
        });
      }

      const duration = performance.now() - startTime;

      self.postMessage({
        type: 'PROCESS_DATA_SUCCESS',
        processedCount: filtered.length,
        duration,
        data: filtered,
      });
    }
  };
};
