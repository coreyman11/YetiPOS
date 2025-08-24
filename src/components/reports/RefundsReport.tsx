
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { format, isWithinInterval, subDays } from "date-fns";
import { RefreshCw, DollarSign, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRealtime } from "@/contexts/realtime-context";
import { ExportButton } from "@/components/reports/ExportButton";

export function RefundsReport() {
  const { networkStatus } = useRealtime();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState("all");

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ from: start, to: end });
  };

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsApi.getAll(),
    staleTime: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });

  const { data: allRefunds, isLoading: isLoadingRefunds } = useQuery({
    queryKey: ['refunds'],
    queryFn: () => transactionsApi.getAllRefunds(),
    staleTime: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });

  const transactionsWithRefunds = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.refunded_amount && t.refunded_amount > 0);
  }, [transactions]);

  const filteredRefunds = useMemo(() => {
    if (!allRefunds) return [];
    return allRefunds.filter(refund => {
      const refundDate = new Date(refund.refunded_at);
      return isWithinInterval(refundDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [allRefunds, dateRange.from, dateRange.to]);

  const refundSummary = useMemo(() => {
    if (!filteredRefunds.length) {
      return {
        totalRefunded: 0,
        count: 0,
        byMethod: {
          cash: { count: 0, amount: 0 },
          card: { count: 0, amount: 0 },
          'gift_card': { count: 0, amount: 0 },
        }
      };
    }

    const byMethod: Record<string, { count: number, amount: number }> = {};
    
    byMethod.cash = { count: 0, amount: 0 };
    byMethod.card = { count: 0, amount: 0 };
    byMethod.gift_card = { count: 0, amount: 0 };
    
    let totalRefunded = 0;
    
    filteredRefunds.forEach(refund => {
      const amount = Number(refund.refund_amount);
      totalRefunded += amount;
      
      const method = refund.payment_method;
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, amount: 0 };
      }
      
      byMethod[method].count += 1;
      byMethod[method].amount += amount;
    });
    
    return {
      totalRefunded,
      count: filteredRefunds.length,
      byMethod
    };
  }, [filteredRefunds]);

  const renderPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'gift_card':
        return 'Gift Card';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  // Prepare data for export
  const prepareRefundsForExport = () => {
    if (activeTab === "all") {
      return filteredRefunds.map(refund => ({
        'Date': format(new Date(refund.refunded_at), "MMM dd, yyyy h:mm a"),
        'Transaction ID': refund.transaction_id,
        'Amount': `$${Number(refund.refund_amount).toFixed(2)}`,
        'Payment Method': renderPaymentMethodName(refund.payment_method),
        'Status': refund.status === 'completed' ? 'Completed' : 'Pending',
        'Notes': refund.notes || '-'
      }));
    } else {
      return transactionsWithRefunds.map(transaction => {
        const originalAmount = Number(transaction.total_amount) + Number(transaction.refunded_amount);
        const refundedAmount = Number(transaction.refunded_amount);
        const refundPercentage = (refundedAmount / originalAmount) * 100;
        
        return {
          'Date': format(new Date(transaction.created_at), "MMM dd, yyyy"),
          'Transaction ID': transaction.id,
          'Original Amount': `$${originalAmount.toFixed(2)}`,
          'Refunded Amount': `$${refundedAmount.toFixed(2)}`,
          'Refund %': `${refundPercentage.toFixed(0)}%`,
          'Payment Method': renderPaymentMethodName(transaction.payment_method),
          'Customer': transaction.customers ? transaction.customers.name : 'Guest'
        };
      });
    }
  };

  if (isLoading || isLoadingRefunds) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <DateRangePicker 
          dateRange={dateRange}
          onUpdate={setDateRange}
          onDateRangeChange={handleDateRangeChange}
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={!networkStatus.online}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <ExportButton
            data={prepareRefundsForExport()}
            filename={`refunds-report-${activeTab}`}
            disabled={activeTab === "all" ? filteredRefunds.length === 0 : transactionsWithRefunds.length === 0}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Refunded
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${refundSummary.totalRefunded.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {refundSummary.count} refunds processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cash Refunds
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${refundSummary.byMethod.cash.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {refundSummary.byMethod.cash.count} cash refunds
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Card Refunds
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${refundSummary.byMethod.card.amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {refundSummary.byMethod.card.count} card refunds
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Refund Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Refunds</TabsTrigger>
              <TabsTrigger value="transactions">By Transaction</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {filteredRefunds.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No refunds found in the selected date range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>{format(new Date(refund.refunded_at), "MMM dd, yyyy h:mm a")}</TableCell>
                        <TableCell>{refund.transaction_id}</TableCell>
                        <TableCell>${Number(refund.refund_amount).toFixed(2)}</TableCell>
                        <TableCell>{renderPaymentMethodName(refund.payment_method)}</TableCell>
                        <TableCell>
                          <Badge variant={refund.status === 'completed' ? 'secondary' : 'outline'} className={refund.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                            {refund.status === 'completed' ? 'Completed' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{refund.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4">
              {transactionsWithRefunds.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No transactions with refunds found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Original Amount</TableHead>
                      <TableHead>Refunded Amount</TableHead>
                      <TableHead>Refund %</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsWithRefunds.map((transaction) => {
                      const originalAmount = Number(transaction.total_amount) + Number(transaction.refunded_amount);
                      const refundedAmount = Number(transaction.refunded_amount);
                      const refundPercentage = (refundedAmount / originalAmount) * 100;
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.created_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>${originalAmount.toFixed(2)}</TableCell>
                          <TableCell>${refundedAmount.toFixed(2)}</TableCell>
                          <TableCell>{refundPercentage.toFixed(0)}%</TableCell>
                          <TableCell>{renderPaymentMethodName(transaction.payment_method)}</TableCell>
                          <TableCell>
                            {transaction.customers ? transaction.customers.name : 'Guest'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
