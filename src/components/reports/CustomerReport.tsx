
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services";
import { ReportTable } from "./ReportTable";
import { DateRangePicker } from "./DateRangePicker";
import { ExportButton } from "./ExportButton";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/contexts/realtime-context";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const CustomerReport = () => {
  const { networkStatus } = useRealtime();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date()
  });
  
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['transactions-customer', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => transactionsApi.getAll(),
    staleTime: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });
  
  const filteredTransactions = transactions?.filter(transaction => {
    const txDate = new Date(transaction.created_at);
    return txDate >= dateRange.from && txDate <= dateRange.to && transaction.customer_id;
  }) || [];
  
  const customerTransactions = filteredTransactions.reduce((acc, tx) => {
    if (!tx.customer_id || !tx.customers) return acc;
    
    const customerId = tx.customer_id;
    
    if (!acc[customerId]) {
      acc[customerId] = {
        id: customerId,
        name: tx.customers.name,
        email: tx.customers.email || '-',
        phone: tx.customers.phone || '-',
        transactions: [],
        totalSpent: 0,
        netSpent: 0,
        totalRefunded: 0,
        refundCount: 0,
        loyaltyPoints: tx.customers.loyalty_points || 0
      };
    }
    
    const refundedAmount = Number(tx.refunded_amount || 0);
    const originalAmount = Number(tx.total_amount) + refundedAmount;
    
    acc[customerId].transactions.push(tx);
    acc[customerId].totalSpent += originalAmount;
    acc[customerId].netSpent += Number(tx.total_amount);
    
    if (refundedAmount > 0) {
      acc[customerId].totalRefunded += refundedAmount;
      acc[customerId].refundCount += 1;
    }
    
    return acc;
  }, {} as Record<string, any>);
  
  const customerData = Object.values(customerTransactions).map((customer: any) => ({
    ...customer,
    transactionCount: customer.transactions.length,
    averageOrderValue: customer.transactions.length ? 
      customer.netSpent / customer.transactions.length : 0,
    refundRate: customer.transactions.length ?
      (customer.refundCount / customer.transactions.length) * 100 : 0
  }));
  
  const customerColumns = [
    { key: 'name', header: 'Customer Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'transactionCount', header: 'Transactions' },
    { key: 'totalSpent', header: 'Total Spent', cell: (row) => `$${row.totalSpent.toFixed(2)}` },
    { key: 'totalRefunded', header: 'Total Refunded', cell: (row) => 
      row.totalRefunded > 0 ? `$${row.totalRefunded.toFixed(2)}` : '-'
    },
    { key: 'netSpent', header: 'Net Spent', cell: (row) => `$${row.netSpent.toFixed(2)}` },
    { key: 'refundRate', header: 'Refund Rate', cell: (row) => 
      row.refundRate > 0 ? `${row.refundRate.toFixed(1)}%` : '-'
    },
    { key: 'averageOrderValue', header: 'Avg Order', cell: (row) => `$${row.averageOrderValue.toFixed(2)}` },
    { key: 'loyaltyPoints', header: 'Loyalty Points' },
  ];
  
  const transformCustomerDataForExport = (data: any[]) => {
    return data.map(customer => ({
      'Customer Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Transactions': customer.transactionCount,
      'Total Spent': `$${customer.totalSpent.toFixed(2)}`,
      'Total Refunded': customer.totalRefunded > 0 ? `$${customer.totalRefunded.toFixed(2)}` : '-',
      'Net Spent': `$${customer.netSpent.toFixed(2)}`,
      'Refund Rate': customer.refundRate > 0 ? `${customer.refundRate.toFixed(1)}%` : '-',
      'Average Order Value': `$${customer.averageOrderValue.toFixed(2)}`,
      'Loyalty Points': customer.loyaltyPoints,
    }));
  };
  
  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ from: start, to: end });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Customer Report</h3>
          <p className="text-sm text-muted-foreground">
            Analyze customer purchasing behavior and loyalty
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
          <ExportButton 
            data={customerData} 
            filename="customer-report" 
            transformData={transformCustomerDataForExport}
          />
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      ) : (
        <ReportTable 
          data={customerData} 
          columns={customerColumns}
          isLoading={isLoading}
          emptyMessage="No customer data for the selected period."
        />
      )}
    </div>
  );
};
