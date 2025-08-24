
import { format } from "date-fns";
import { SalesSummary, SalesReportFilters, ComprehensiveReport } from "@/types/reports";
import * as XLSX from 'xlsx';
import { formatCurrency } from "@/lib/utils";

export const exportToCSV = (salesData: SalesSummary, filters: SalesReportFilters) => {
  const csvContent = [
    ['Date Range', `${format(filters.startDate, 'PP')} - ${format(filters.endDate, 'PP')}`],
    ['Total Sales', `$${salesData.totalSales.toFixed(2)}`],
    ['Total Transactions', salesData.totalTransactions],
    ['Average per Transaction', `$${salesData.averagePerTransaction.toFixed(2)}`],
    [],
    ['Payment Method', 'Count', 'Total'],
    ...salesData.paymentMethodBreakdown.map(breakdown => [
      breakdown.method,
      breakdown.count,
      `$${breakdown.total.toFixed(2)}`
    ]),
    [],
    ['Employee', 'Transactions', 'Total'],
    ...(salesData.employeeSales?.map(employee => [
      employee.employeeName,
      employee.transactions,
      `$${employee.total.toFixed(2)}`
    ]) || [])
  ];

  const csv = csvContent.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-report-${format(filters.startDate, 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const exportComprehensiveReportToExcel = (report: ComprehensiveReport, filters: SalesReportFilters) => {
  const wb = XLSX.utils.book_new();
  
  // Overview sheet
  const overviewData = [
    ['Comprehensive Sales Report', ''],
    [`Date Range: ${format(filters.startDate, 'PP')} to ${format(filters.endDate, 'PP')}`, ''],
    ['', ''],
    ['Summary', ''],
    ['Total Sales', formatCurrency(report.totalSales)],
    ['Total Transactions', report.totalTransactions],
    ['Average Per Transaction', formatCurrency(report.averagePerTransaction)],
    ['New Customers', report.newCustomers],
    ['Repeat Customers', report.repeatCustomers],
    ['Total Tax Collected', formatCurrency(report.totalTaxCollected)],
    ['', ''],
    ['Payment Methods', ''],
    ['Method', 'Count', 'Total'],
    ...report.paymentMethodBreakdown.map(pm => [
      pm.method.charAt(0).toUpperCase() + pm.method.slice(1),
      pm.count,
      formatCurrency(pm.total)
    ])
  ];
  
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
  
  // Products sheet
  const productsData = [
    ['Top Products', '', ''],
    ['Product', 'Quantity', 'Revenue'],
    ...report.topProducts.map(p => [p.name, p.quantity, formatCurrency(p.revenue)]),
    ['', '', ''],
    ['Low Performing Products', '', ''],
    ['Product', 'Quantity', 'Revenue'],
    ...report.lowPerformingProducts.map(p => [p.name, p.quantity, formatCurrency(p.revenue)]),
    ['', '', ''],
    ['Top Categories', '', ''],
    ['Category', 'Count', 'Total'],
    ...report.topCategories.map(c => [c.name, c.count, formatCurrency(c.total)])
  ];
  
  const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
  
  // Gift Cards sheet
  const giftCardsData = [
    ['Gift Card Summary', '', ''],
    ['Gift Card Sales', formatCurrency(report.giftCardSales.total), report.giftCardSales.count],
    ['Gift Card Redemptions', formatCurrency(report.giftCardRedemptions.total), report.giftCardRedemptions.count],
    ['Gift Card Balances', formatCurrency(report.giftCardBalances.total), report.giftCardBalances.count],
    ['', '', ''],
    ['Monthly Gift Card Activity', '', ''],
    ['Month', 'Sales', 'Redemptions', 'Net Change'],
    ...(report.giftCardDetails?.monthly?.map(m => [
      m.month, 
      formatCurrency(m.sales), 
      formatCurrency(m.redemptions), 
      formatCurrency(m.netChange)
    ]) || [])
  ];
  
  const wsGiftCards = XLSX.utils.aoa_to_sheet(giftCardsData);
  XLSX.utils.book_append_sheet(wb, wsGiftCards, 'Gift Cards');
  
  // Customers sheet
  const customersData = [
    ['Customer Summary', '', ''],
    ['New Customers', report.newCustomers, ''],
    ['Repeat Customers', report.repeatCustomers, ''],
    ['Retention Rate', `${report.customerRetention.retentionRate}%`, ''],
    ['', '', ''],
    ['High Value Customers', '', ''],
    ['Customer', 'Transactions', 'Total Spent'],
    ...report.highValueCustomers.map(c => [
      c.name, 
      c.transactionCount, 
      formatCurrency(c.totalSpent)
    ])
  ];
  
  const wsCustomers = XLSX.utils.aoa_to_sheet(customersData);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers');
  
  // Tax Data sheet
  const taxData = [
    ['Tax Summary', '', ''],
    ['Total Tax Collected', formatCurrency(report.totalTaxCollected), ''],
    ['', '', ''],
    ['Tax by Rate', '', ''],
    ['Rate', 'Amount', ''],
    ...report.taxByRate.map(t => [
      `${t.rate}%`, 
      formatCurrency(t.amount), 
      ''
    ]),
    ['', '', ''],
    ['Monthly Tax Details', '', ''],
    ['Month', 'Tax Amount', 'Sales Amount', 'Effective Rate'],
    ...(report.taxDetailsByMonth?.map(t => [
      t.month, 
      formatCurrency(t.taxAmount), 
      formatCurrency(t.salesAmount), 
      `${t.effectiveRate}%`
    ]) || [])
  ];
  
  const wsTax = XLSX.utils.aoa_to_sheet(taxData);
  XLSX.utils.book_append_sheet(wb, wsTax, 'Tax');
  
  // Stores sheet
  const storesData = [
    ['Store Performance', '', ''],
    ['Store', 'Transactions', 'Total Sales'],
    ...report.storePerformance.map(s => [
      s.name, 
      s.transactionCount, 
      formatCurrency(s.totalSales)
    ])
  ];
  
  const wsStores = XLSX.utils.aoa_to_sheet(storesData);
  XLSX.utils.book_append_sheet(wb, wsStores, 'Stores');
  
  // Auto-size columns for all sheets
  ['Overview', 'Products', 'Gift Cards', 'Customers', 'Tax', 'Stores'].forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    const colWidths = {};
    
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10; // Default minimum width
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
        if (cell && cell.v) {
          const cellText = String(cell.v);
          maxWidth = Math.max(maxWidth, cellText.length + 2);
        }
      }
      
      colWidths[C] = maxWidth;
    }
    
    ws['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] }));
  });
  
  // Export the workbook
  XLSX.writeFile(wb, `comprehensive-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  
  return true;
};
