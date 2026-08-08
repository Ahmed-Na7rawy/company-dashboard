import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Download, Search, ChevronLeft, Inbox } from 'lucide-react';

export interface ProcessedRow {
  Date: string;
  CustomerName: string;
  Segment: string;
  ItemName: string;
  Quantity: number;
  NetQuantity: number;
  BillType: string;
  SalesmanName?: string;
  ItemGroup?: string;
  SalesOffice?: string;
  Revenue: number;
  DateObj: Date;
  Volume: number;
  IsReturn: boolean;
}

interface CustomerMaterialTableProps {
  processedData: ProcessedRow[];
  language: 'en' | 'ar';
  darkMode: boolean;
}

const CustomerMaterialTable: React.FC<CustomerMaterialTableProps> = ({ processedData, language, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState<'customerName' | 'orderCount' | 'itemsCount' | 'totalQty' | 'totalRevenue'>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Text helpers based on language
  const text = {
    en: {
      title: "Customer Purchases & Material Details",
      subtitle: "Drilldown matrix showing each account's purchased products, transaction counts, volumes, and spent values.",
      searchPlaceholder: "Search customer name or item...",
      colCustomer: "Customer Account",
      colOrders: "Orders Count",
      colItems: "Unique Items",
      colQty: "Total Qty",
      colRevenue: "Total Revenue (EGP)",
      nestedTitle: "Materials Breakdown for",
      colMaterial: "Material Description",
      colMaterialQty: "Quantity",
      colMaterialRevenue: "Revenue (EGP)",
      exportBtn: "Export Table",
      showing: "Showing",
      of: "of",
      accounts: "accounts",
      noRecords: "No customer records found matching filters."
    },
    ar: {
      title: "مشتريات العملاء وتفاصيل المواد والأصناف",
      subtitle: "مصفوفة تفصيلية توضح المنتجات المشتراة لكل حساب عميل، وعدد المعاملات والكميات والقيم الإجمالية.",
      searchPlaceholder: "بحث باسم العميل أو الصنف...",
      colCustomer: "حساب العميل",
      colOrders: "عدد الطلبات",
      colItems: "الأصناف الفريدة",
      colQty: "إجمالي الكمية",
      colRevenue: "إجمالي الإيرادات (ج.م)",
      nestedTitle: "تفاصيل المواد والأصناف لـ",
      colMaterial: "وصف الصنف / المادة",
      colMaterialQty: "الكمية المطلوبة",
      colMaterialRevenue: "صافي القيمة (ج.م)",
      exportBtn: "تصدير الجدول",
      showing: "عرض",
      of: "من أصل",
      accounts: "حسابات عملاء",
      noRecords: "لم يتم العثور على أي سجلات مطابقة للبحث."
    }
  }[language === 'ar' ? 'ar' : 'en'];

  // Helper to format values as currency (rounded to the nearest million if >= 1M)
  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 1000000) {
      const rounded = Math.round(val / 1000000) * 1000000;
      try {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
          style: 'currency',
          currency: 'EGP',
          maximumFractionDigits: 0
        }).format(rounded);
      } catch (e) {
        return (language === 'ar' ? 'ج.م ' : 'EGP ') + rounded.toLocaleString();
      }
    } else {
      try {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
          style: 'currency',
          currency: 'EGP',
          maximumFractionDigits: 0
        }).format(val);
      } catch (e) {
        return (language === 'ar' ? 'ج.م ' : 'EGP ') + val.toLocaleString();
      }
    }
  };

  // Helper to format quantities (rounded to the nearest million if >= 1M)
  const formatQty = (qty: number) => {
    const absQty = Math.abs(qty);
    if (absQty >= 1000000) {
      const rounded = Math.round(qty / 1000000) * 1000000;
      return rounded.toLocaleString();
    }
    return qty.toLocaleString();
  };

  // Group and process the data based on active filters and search
  const aggregatedData = useMemo(() => {
    const customerMap: Record<string, {
      customerName: string;
      totalRevenue: number;
      totalQty: number;
      orderCount: number;
      materials: Record<string, {
        materialDesc: string;
        qty: number;
        revenue: number;
      }>;
    }> = {};

    // Filter by search term (searches customer name and items bought)
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    processedData.forEach(row => {
      const custName = row.CustomerName || 'Unknown Customer';
      const itemName = row.ItemName || 'Unknown Material';
      
      // Match search
      if (lowerSearch !== '') {
        const matchesCust = custName.toLowerCase().includes(lowerSearch);
        const matchesItem = itemName.toLowerCase().includes(lowerSearch);
        if (!matchesCust && !matchesItem) return;
      }

      if (!customerMap[custName]) {
        customerMap[custName] = {
          customerName: custName,
          totalRevenue: 0,
          totalQty: 0,
          orderCount: 0,
          materials: {}
        };
      }

      const cust = customerMap[custName];
      cust.totalRevenue += row.Revenue;
      cust.totalQty += row.NetQuantity;
      cust.orderCount += 1;

      if (!cust.materials[itemName]) {
        cust.materials[itemName] = {
          materialDesc: itemName,
          qty: 0,
          revenue: 0
        };
      }

      const mat = cust.materials[itemName];
      mat.qty += row.NetQuantity;
      mat.revenue += row.Revenue;
    });

    // Convert map to array and add counts
    const list = Object.values(customerMap).map(c => {
      const materialsList = Object.values(c.materials)
        .sort((a, b) => b.revenue - a.revenue);
      return {
        customerName: c.customerName,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        totalQty: Math.round(c.totalQty),
        orderCount: c.orderCount,
        itemsCount: materialsList.length,
        materialsList
      };
    });

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        const numA = valA as number;
        const numB = valB as number;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
    });

    return list;
  }, [processedData, searchTerm, sortField, sortDirection]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return aggregatedData.slice(start, start + pageSize);
  }, [aggregatedData, currentPage, pageSize]);

  const totalPages = Math.ceil(aggregatedData.length / pageSize);

  const toggleRow = (customerName: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // CSV Export helper
  const handleCSVExport = () => {
    let csv = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM for Arabic character rendering in Excel
    csv += `${text.title}\n`;
    csv += `${text.colCustomer},${text.colOrders},${text.colItems},${text.colQty},${text.colRevenue}\n`;

    aggregatedData.forEach(row => {
      const name = `"${row.customerName.replace(/"/g, '""')}"`;
      csv += `${name},${row.orderCount},${row.itemsCount},${row.totalQty},${row.totalRevenue}\n`;
      // Optionally list materials under customer
      row.materialsList.forEach(m => {
        const matName = `  -> "${m.materialDesc.replace(/"/g, '""')}"`;
        csv += `${matName},,,${m.qty},${m.revenue}\n`;
      });
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Customer_Purchases_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <span className="text-slate-700 dark:text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity">↕</span>;
    return sortDirection === 'asc' ? <span className="text-emerald-500 font-extrabold">↑</span> : <span className="text-emerald-500 font-extrabold">↓</span>;
  };

  return (
    <div className={`p-6 rounded-2xl border ${
      darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'
    } shadow-sm space-y-6 animate-fadeIn`}>
      
      {/* Header Info and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {text.title}
          </h3>
          <p className="text-[10px] text-slate-800 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {text.subtitle}
          </p>
        </div>
        <button
          onClick={handleCSVExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#128d46] to-[#117a3c] hover:from-[#117a3c] hover:to-[#0f6b35] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all active:scale-95 shrink-0"
        >
          <Download size={13} />
          <span>{text.exportBtn}</span>
        </button>
      </div>

      {/* Search Filter input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder={text.searchPlaceholder}
          className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none transition-all ${
            darkMode 
              ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-slate-500' 
              : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-slate-400'
          }`}
        />
      </div>

      {/* Main Table Grid */}
      <div className="overflow-x-auto border border-slate-200/60 dark:border-slate-700/40 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`${
              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-black'
            } border-b font-black uppercase tracking-wider`}>
              <th style={{ width: '40px' }} className="p-3"></th>
              <th className="p-3 text-left cursor-pointer group" onClick={() => handleSort('customerName')}>
                <div className="flex items-center gap-1">
                  <span>{text.colCustomer}</span>
                  {sortIcon('customerName')}
                </div>
              </th>
              <th className="p-3 text-right cursor-pointer group" onClick={() => handleSort('orderCount')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{text.colOrders}</span>
                  {sortIcon('orderCount')}
                </div>
              </th>
              <th className="p-3 text-right cursor-pointer group" onClick={() => handleSort('itemsCount')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{text.colItems}</span>
                  {sortIcon('itemsCount')}
                </div>
              </th>
              <th className="p-3 text-right cursor-pointer group" onClick={() => handleSort('totalQty')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{text.colQty}</span>
                  {sortIcon('totalQty')}
                </div>
              </th>
              <th className="p-3 text-right cursor-pointer group" onClick={() => handleSort('totalRevenue')}>
                <div className="flex items-center justify-end gap-1">
                  <span>{text.colRevenue}</span>
                  {sortIcon('totalRevenue')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <div className={`inline-flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/30 text-slate-400' : 'border-slate-300 bg-slate-50/50 text-slate-700'}`}>
                    <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <Inbox size={32} className={darkMode ? 'text-slate-500' : 'text-slate-600'} />
                    </div>
                    <span className="font-extrabold text-sm tracking-wide">{text.noRecords}</span>
                    <span className="text-[10px] mt-1 opacity-70 max-w-[200px] leading-tight">
                      {language === 'en' ? 'Try adjusting your search filters to find what you are looking for.' : 'حاول تعديل فلاتر البحث للعثور على ما تبحث عنه.'}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const isExpanded = !!expandedRows[row.customerName];
                return (
                  <React.Fragment key={idx}>
                    {/* Main Row */}
                    <tr 
                      onClick={() => toggleRow(row.customerName)}
                      className={`border-b cursor-pointer transition-colors ${
                        darkMode ? 'border-slate-800/60 hover:bg-slate-800/40' : 'border-slate-200 hover:bg-slate-50'
                      } ${isExpanded ? (darkMode ? 'bg-slate-800/30' : 'bg-slate-50/70') : ''}`}
                    >
                      <td className="p-3 text-center">
                        {isExpanded ? <ChevronDown size={14} className="text-emerald-500" /> : <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />}
                      </td>
                      <td className="p-3 font-extrabold text-black dark:text-slate-100">{row.customerName}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-200">{row.orderCount}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-200">{row.itemsCount}</td>
                      <td className="p-3 text-right font-extrabold text-black dark:text-slate-100">{formatQty(row.totalQty)}</td>
                      <td className="p-3 text-right font-black text-[#128d46]">{formatCurrency(row.totalRevenue)}</td>
                    </tr>

                    {/* Collapsible details subtable */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className={`p-0 ${darkMode ? 'bg-slate-900/45' : 'bg-slate-50/45'}`}>
                          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/50 animate-fadeIn space-y-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
                              <span>{text.nestedTitle} {row.customerName}</span>
                            </div>
                            <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden shadow-inner">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead>
                                  <tr className={`${
                                    darkMode ? 'bg-slate-800/40 text-slate-400' : 'bg-slate-200 text-black'
                                  } border-b font-black uppercase`}>
                                    <th className="p-2.5 pl-4">{text.colMaterial}</th>
                                    <th className="p-2.5 text-right w-1/4">{text.colMaterialQty}</th>
                                    <th className="p-2.5 text-right w-1/4 pr-4">{text.colMaterialRevenue}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.materialsList.map((m, mIdx) => (
                                    <tr 
                                      key={mIdx}
                                      className={`border-b border-slate-200/30 dark:border-slate-800/20 hover:bg-slate-500/5 transition-colors`}
                                    >
                                      <td className="p-2 pl-4 font-extrabold text-black dark:text-slate-200">{m.materialDesc}</td>
                                      <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-300">{formatQty(m.qty)}</td>
                                      <td className="p-2 text-right font-black text-black dark:text-slate-100 pr-4">{formatCurrency(m.revenue)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-slate-800 dark:text-slate-300 font-black uppercase tracking-wider">
            {text.showing} {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, aggregatedData.length)} {text.of} {aggregatedData.length} {text.accounts}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 border rounded-xl shadow-sm transition-all active:scale-95 ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                  : darkMode 
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={14} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
            
            <div className="flex items-center gap-0.5">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                // Show ellipsis or limited pages if totalPages is large
                if (totalPages > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={i} className="px-1 text-slate-700 dark:text-slate-400 text-xs">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-[#128d46] to-[#117a3c] text-white shadow-sm'
                        : darkMode
                          ? 'text-slate-400 hover:bg-slate-800'
                          : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 border rounded-xl shadow-sm transition-all active:scale-95 ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                  : darkMode 
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800' 
                    : 'border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ChevronLeft size={14} className={`rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(CustomerMaterialTable);
