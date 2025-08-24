import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "./DateRangePicker";
import { ExportButton } from "./ExportButton";
import { ReportTable } from "./ReportTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services";
import { useRealtime } from "@/contexts/realtime-context";
import { format, isToday, isYesterday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CreditCard, ShoppingBag, Users, TrendingUp, Activity, ArrowUpDown, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/lib/supabase";

// Helper function to format numbers with commas
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
export const FinancialReport = () => {
  const { networkStatus } = useRealtime();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date()
  });
  const [reportView, setReportView] = useState<"summary" | "detailed">("summary");
  const reportRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: `Financial Report ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
    contentRef: reportRef,
  });
  useEffect(() => {
    document.title = `Financial Report | ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  }, [dateRange]);
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions-financial', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => transactionsApi.getAll(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });
  
  const filteredTransactions = transactions?.filter(transaction => {
    const txDate = new Date(transaction.created_at);
    return txDate >= dateRange.from && txDate <= dateRange.to;
  }) || [];
  
  const calculateMetrics = () => {
    if (!filteredTransactions.length) {
      return {
        totalSales: 0,
        netSales: 0,
        taxesCollected: 0,
        cashPayments: 0,
        cardPayments: 0,
        giftCardRedemptions: 0,
        giftCardSales: 0,
        otherPayments: 0,
        transactionCount: 0,
        uniqueCustomers: 0,
        avgTicketSize: 0,
        totalRefunds: 0,
        refundCount: 0,
        refundRate: 0,
      };
    }
    
    // Separate gift card sales from gift card redemptions
    const giftCardSalesTransactions = filteredTransactions.filter(tx => 
      tx.transaction_items?.some(item => item.services?.name?.toLowerCase().includes('gift card'))
    );
    const giftCardRedemptionTransactions = filteredTransactions.filter(tx => 
      tx.payment_method === 'gift_card'
    );
    
    // Calculate sales excluding gift card redemptions (since those aren't new revenue)
    const regularTransactions = filteredTransactions.filter(tx => tx.payment_method !== 'gift_card');
    const totalSales = regularTransactions.reduce((sum, tx) => 
      sum + Number(tx.total_amount) + Number(tx.refunded_amount || 0), 0) +
      giftCardSalesTransactions.reduce((sum, tx) => 
        sum + Number(tx.total_amount) + Number(tx.refunded_amount || 0), 0);
    
    const totalRefunds = filteredTransactions.reduce((sum, tx) => 
      sum + Number(tx.refunded_amount || 0), 0);
    const netSales = totalSales - totalRefunds;
    const taxesCollected = filteredTransactions.reduce((sum, tx) => sum + Number(tx.tax_amount), 0);
    
    const refundCount = filteredTransactions.filter(tx => Number(tx.refunded_amount || 0) > 0).length;
    const refundRate = (refundCount / filteredTransactions.length) * 100;
    
    const paymentTypes = filteredTransactions.reduce((acc, tx) => {
      const method = tx.payment_method;
      const amount = Number(tx.total_amount);
      
      if (method === 'cash') {
        acc.cash += amount;
      } else if (method === 'card' || method === 'credit') {
        acc.card += amount;
      } else if (method === 'gift_card') {
        acc.giftCardRedemptions += amount; // Track redemptions separately
      } else {
        acc.other += amount;
      }
      
      return acc;
    }, { cash: 0, card: 0, giftCardRedemptions: 0, other: 0 });
    
    // Calculate gift card sales from service items
    const giftCardSales = giftCardSalesTransactions.reduce((sum, tx) => 
      sum + Number(tx.total_amount), 0);
    
    const uniqueCustomerIds = new Set(
      filteredTransactions
        .filter(tx => tx.customer_id)
        .map(tx => tx.customer_id)
    );
    
    return {
      totalSales,
      netSales,
      taxesCollected,
      cashPayments: paymentTypes.cash,
      cardPayments: paymentTypes.card,
      giftCardRedemptions: paymentTypes.giftCardRedemptions,
      giftCardSales,
      otherPayments: paymentTypes.other,
      transactionCount: filteredTransactions.length,
      uniqueCustomers: uniqueCustomerIds.size,
      avgTicketSize: filteredTransactions.length ? netSales / filteredTransactions.length : 0,
      totalRefunds,
      refundCount,
      refundRate,
    };
  };
  
  const metrics = calculateMetrics();
  
  const summaryData = [
    { name: 'Total Sales (Gross)', value: formatCurrency(metrics.totalSales), icon: <DollarSign className="h-4 w-4" /> },
    { name: 'Net Sales', value: formatCurrency(metrics.netSales), icon: <TrendingUp className="h-4 w-4" /> },
    { name: 'Total Refunds', value: formatCurrency(metrics.totalRefunds), icon: <ArrowUpDown className="h-4 w-4" /> },
    { name: 'Refund Rate', value: `${metrics.refundRate.toFixed(1)}%`, icon: <RefreshCw className="h-4 w-4" /> },
    { name: 'Taxes Collected', value: formatCurrency(metrics.taxesCollected), icon: <DollarSign className="h-4 w-4" /> },
    { name: 'Cash Payments', value: formatCurrency(metrics.cashPayments), icon: <DollarSign className="h-4 w-4" /> },
    { name: 'Card Payments', value: formatCurrency(metrics.cardPayments), icon: <CreditCard className="h-4 w-4" /> },
    { name: 'Gift Card Sales', value: formatCurrency(metrics.giftCardSales), icon: <CreditCard className="h-4 w-4" /> },
    { name: 'Gift Card Redemptions', value: formatCurrency(metrics.giftCardRedemptions), icon: <CreditCard className="h-4 w-4 text-muted-foreground" /> },
    { name: 'Transaction Count', value: formatNumber(metrics.transactionCount), icon: <ShoppingBag className="h-4 w-4" /> },
    { name: 'Unique Customers', value: formatNumber(metrics.uniqueCustomers), icon: <Users className="h-4 w-4" /> },
    { name: 'Average Ticket Size', value: formatCurrency(metrics.avgTicketSize), icon: <Activity className="h-4 w-4" /> },
  ];
  
  const detailedData = filteredTransactions.map(tx => {
    const txDate = new Date(tx.created_at);
    let dateDisplay = format(txDate, 'MMM dd, yyyy h:mm a');
    
    if (isToday(txDate)) {
      dateDisplay = `Today at ${format(txDate, 'h:mm a')}`;
    } else if (isYesterday(txDate)) {
      dateDisplay = `Yesterday at ${format(txDate, 'h:mm a')}`;
    }
    
    const refundedAmount = Number(tx.refunded_amount || 0);
    const originalAmount = Number(tx.total_amount) + refundedAmount;
    const netAmount = Number(tx.total_amount);
    
    return {
      id: tx.id,
      date: dateDisplay,
      raw_date: tx.created_at,
      total: originalAmount.toFixed(2),
      net: netAmount.toFixed(2),
      refunded: refundedAmount > 0 ? refundedAmount.toFixed(2) : '0.00',
      tax: Number(tx.tax_amount).toFixed(2),
      subtotal: Number(tx.subtotal).toFixed(2),
      payment: tx.payment_method,
      customer: tx.customers?.name || 'Walk-in',
      items: tx.transaction_items?.length || 0,
      hasRefund: refundedAmount > 0,
    };
  });
  
  const columns = [
    { key: 'id', header: 'Transaction #' },
    { key: 'date', header: 'Date' },
    { key: 'total', header: 'Original Amount', cell: (row) => `$${row.total}` },
    { key: 'refunded', header: 'Refunded', cell: (row) => 
      row.refunded !== '0.00' ? 
      `$${row.refunded}` : 
      '-' 
    },
    { key: 'net', header: 'Net Amount', cell: (row) => `$${row.net}` },
    { key: 'subtotal', header: 'Subtotal', cell: (row) => `$${row.subtotal}` },
    { key: 'tax', header: 'Tax', cell: (row) => `$${row.tax}` },
    { key: 'payment', header: 'Payment Method', cell: (row) => 
      row.payment.charAt(0).toUpperCase() + row.payment.slice(1)
    },
    { key: 'customer', header: 'Customer' },
    { key: 'items', header: 'Items' },
  ];

  const transformDataForExport = (data: any[]) => {
    return data.map(tx => ({
      'Transaction #': tx.id,
      'Date': format(new Date(tx.raw_date), 'MMM dd, yyyy h:mm a'),
      'Original Amount': `$${tx.total}`,
      'Refunded': tx.refunded !== '0.00' ? `$${tx.refunded}` : '-',
      'Net Amount': `$${tx.net}`,
      'Subtotal': `$${tx.subtotal}`,
      'Tax': `$${tx.tax}`,
      'Payment Method': tx.payment.charAt(0).toUpperCase() + tx.payment.slice(1),
      'Customer': tx.customer,
      'Items': tx.items,
    }));
  };

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ from: start, to: end });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Financial Report</h3>
          <p className="text-sm text-muted-foreground">
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker 
            dateRange={dateRange}
            onUpdate={setDateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={!networkStatus.online}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <ExportButton 
            data={detailedData} 
            filename="financial-report" 
            transformData={transformDataForExport}
          />
          <ExportButton 
            data={summaryData} 
            filename="financial-summary" 
            format="pdf"
            pdfData={{
              title: "Financial Report - Income Statement",
              dateRange,
              metrics
            }}
          />
        </div>
      </div>

      <Tabs value={reportView} onValueChange={(value) => setReportView(value as "summary" | "detailed")}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No transactions found for the selected date range.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="print:shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Income Statement</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(dateRange.from, 'MMM dd, yyyy')} – {format(dateRange.to, 'MMM dd, yyyy')}
                </p>
              </CardHeader>
              <CardContent>
                <article ref={reportRef}>
                  <section aria-labelledby="revenue-heading" className="space-y-2">
                    <h4 id="revenue-heading" className="text-sm font-medium text-muted-foreground">Revenue</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">Gross Sales</div>
                      <div className="text-right font-medium">{formatCurrency(metrics.totalSales)}</div>
                      <div className="text-sm">Less: Refunds</div>
                      <div className="text-right text-destructive">-{formatCurrency(metrics.totalRefunds)}</div>
                    </div>
                    <div className="border-t mt-2 pt-2 flex items-center justify-between">
                      <div className="font-semibold">Net Sales</div>
                      <div className="font-semibold">{formatCurrency(metrics.netSales)}</div>
                    </div>
                  </section>

                  <div className="h-4" />

                  <section aria-labelledby="taxes-heading" className="space-y-2">
                    <h4 id="taxes-heading" className="text-sm font-medium text-muted-foreground">Taxes</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Taxes Collected</div>
                      <div className="font-medium">{formatCurrency(metrics.taxesCollected)}</div>
                    </div>
                  </section>

                  <div className="h-4" />

                  <section aria-labelledby="payments-heading" className="space-y-2">
                    <h4 id="payments-heading" className="text-sm font-medium text-muted-foreground">Payment Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">Cash</div>
                      <div className="text-right">{formatCurrency(metrics.cashPayments)}</div>
                      <div className="text-sm">Card</div>
                      <div className="text-right">{formatCurrency(metrics.cardPayments)}</div>
                      <div className="text-sm">Gift Card Sales</div>
                      <div className="text-right">{formatCurrency(metrics.giftCardSales)}</div>
                      <div className="text-sm">Other</div>
                      <div className="text-right">{formatCurrency(metrics.otherPayments)}</div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Gift Card Activity (Non-Revenue)</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs text-muted-foreground">Gift Card Redemptions</div>
                        <div className="text-right text-xs text-muted-foreground">{formatCurrency(metrics.giftCardRedemptions)}</div>
                      </div>
                    </div>
                  </section>

                  <div className="h-4" />

                  <section aria-labelledby="ops-heading" className="space-y-2">
                    <h4 id="ops-heading" className="text-sm font-medium text-muted-foreground">Operational Metrics</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">Transactions</div>
                      <div className="text-right">{formatNumber(metrics.transactionCount)}</div>
                      <div className="text-sm">Average Ticket</div>
                      <div className="text-right">{formatCurrency(metrics.avgTicketSize)}</div>
                      <div className="text-sm">Unique Customers</div>
                      <div className="text-right">{formatNumber(metrics.uniqueCustomers)}</div>
                    </div>
                  </section>

                  <div className="border-t mt-6 pt-3 text-xs text-muted-foreground">
                    Generated {format(new Date(), 'MMM dd, yyyy h:mm a')}
                  </div>
                </article>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="detailed">
          <ReportTable 
            data={detailedData} 
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No transaction data for the selected period."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
