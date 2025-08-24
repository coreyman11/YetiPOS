import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from './DateRangePicker';
import { ExportButton } from './ExportButton';
import { TransactionTable } from '../transactions/TransactionTable';
import { TransactionPagination } from '../transactions/TransactionPagination';
import { TransactionDetail } from '../transactions/TransactionDetail';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, RefreshCw, Printer } from 'lucide-react';
import { transactionsApi } from '@/services';
import { usePagination } from '@/hooks/usePagination';
import { useReactToPrint } from 'react-to-print';
import { Database } from '@/types/supabase';
import { subDays } from 'date-fns';

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

export const TransactionReport = () => {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date()
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions-report', dateRange.from, dateRange.to],
    queryFn: () => transactionsApi.getAll(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  // Filter transactions by date range
  const filteredTransactions = transactions?.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
  }) || [];

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage
  } = usePagination({
    totalItems: filteredTransactions.length,
    initialPageSize: 25
  });

  // Get current page of transactions
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleDateRangeUpdate = (newDateRange: { from: Date; to: Date }) => {
    setDateRange(newDateRange);
    setCurrentPage(1); // Reset to first page when date range changes
  };

  // Transform data for export
  const transformDataForExport = (data: Transaction[]) => {
    return data.map(tx => {
      // Determine payment method display
      let paymentMethod = tx.payment_method;
      if (tx.use_loyalty_points) {
        if (tx.total_amount === 0 || (tx.refunded_amount && tx.refunded_amount >= tx.total_amount)) {
          paymentMethod = "Loyalty Points";
        } else {
          paymentMethod = `${tx.payment_method} + Points`;
        }
      }
      
      return {
        'ID': tx.id,
        'Date': new Date(tx.created_at).toLocaleDateString(),
        'Time': new Date(tx.created_at).toLocaleTimeString(),
        'Customer': tx.customers?.name || 'Walk-in',
        'Amount': `$${Number(tx.total_amount).toFixed(2)}`,
        'Payment Method': paymentMethod,
        'Status': tx.use_loyalty_points && tx.total_amount === 0 ? 'Loyalty Points' : tx.status,
        'Items': tx.transaction_items?.length || 0,
        'Tax': `$${Number(tx.tax_amount || 0).toFixed(2)}`,
        'Refunded': tx.refunded_amount ? `$${Number(tx.refunded_amount).toFixed(2)}` : '$0.00'
      };
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">
            Error loading transactions report. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={printRef} className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            <h3 className="text-2xl font-bold">Transaction Report</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <DateRangePicker 
              dateRange={dateRange}
              onUpdate={handleDateRangeUpdate}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrint()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <ExportButton 
              data={filteredTransactions} 
              filename="transactions-report" 
              transformData={transformDataForExport}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transactions ({filteredTransactions.length} total)</span>
              <span className="text-sm font-normal text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found for the selected date range.</p>
              </div>
            ) : (
              <>
                <TransactionTable 
                  transactions={paginatedTransactions} 
                  onRowClick={handleTransactionSelect}
                />
                
                <TransactionPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={Math.min(endIndex, filteredTransactions.length)}
                  totalItems={filteredTransactions.length}
                  onPreviousPage={handlePreviousPage}
                  onNextPage={handleNextPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetail
        transaction={selectedTransaction}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};