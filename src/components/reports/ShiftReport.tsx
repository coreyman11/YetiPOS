import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShiftsApi, transactionsApi } from "@/services";
import { ShiftSalesByMethod } from "@/services/transactions/index";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRealtime } from "@/contexts/realtime-context";
import { ExportButton } from "@/components/reports/ExportButton";

export const ShiftReport = () => {
  const { networkStatus } = useRealtime();
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  const { data: allShifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ['all-shifts-for-report'],
    queryFn: () => ShiftsApi.getAll(),
    enabled: networkStatus.online,
  });

  const { data: shiftDetails, isLoading: isLoadingShiftDetails } = useQuery({
    queryKey: ['shift-details', selectedShiftId],
    queryFn: () => ShiftsApi.getShiftById(selectedShiftId as number),
    enabled: !!selectedShiftId && networkStatus.online,
  });

  const { data: shiftTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['shift-transactions', selectedShiftId],
    queryFn: () => ShiftsApi.getShiftTransactions(selectedShiftId as number),
    enabled: !!selectedShiftId && activeTab === "transactions" && networkStatus.online,
  });

  const { data: shiftSales, isLoading: isLoadingShiftSales } = useQuery({
    queryKey: ['shift-sales', selectedShiftId],
    queryFn: () => transactionsApi.getShiftSales(selectedShiftId as number),
    enabled: !!selectedShiftId && networkStatus.online,
  });

  useEffect(() => {
    if (allShifts.length > 0 && !selectedShiftId) {
      setSelectedShiftId(allShifts[0].id);
    }
  }, [allShifts, selectedShiftId]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
  };

  const prepareShiftDetailsForExport = () => {
    if (!shiftDetails || !shiftSales) return [];
    
    return [{
      'Shift Name': shiftDetails.name,
      'Cashier': shiftDetails.user_profile?.full_name || 'Unknown',
      'Start Time': formatDateTime(shiftDetails.start_time),
      'End Time': formatDateTime(shiftDetails.end_time),
      'Status': shiftDetails.status,
      'Opening Balance': formatCurrency(shiftDetails.opening_balance),
      'Closing Balance': formatCurrency(shiftDetails.closing_balance),
      'Cash Discrepancy': formatCurrency(shiftDetails.cash_discrepancy),
      'Cash Sales': formatCurrency(shiftSales.cash),
      'Credit Sales': formatCurrency(shiftSales.credit),
      'Gift Card Sales': formatCurrency(shiftSales.gift_card),
      'Other Sales': formatCurrency(shiftSales.other),
      'Refunds': formatCurrency(shiftSales.refunds),
      'Net Sales': formatCurrency(
        (shiftSales.cash || 0) + 
        (shiftSales.credit || 0) + 
        (shiftSales.gift_card || 0) + 
        (shiftSales.other || 0) - 
        (shiftSales.refunds || 0)
      )
    }];
  };

  const prepareTransactionsForExport = () => {
    if (!shiftTransactions) return [];
    
    return shiftTransactions.map(transaction => ({
      'ID': transaction.id,
      'Time': formatDateTime(transaction.created_at),
      'Customer': transaction.customers?.name || 'Walk-in',
      'Payment Method': transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1),
      'Amount': formatCurrency(transaction.total_amount),
      'Refunded Amount': transaction.refunded_amount > 0 ? formatCurrency(transaction.refunded_amount) : '-',
      'Status': transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
    }));
  };

  if (isLoadingShifts) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-xs" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (allShifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Shifts Found</CardTitle>
          <CardDescription>
            There are no shifts recorded in the system yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Start a new shift to begin tracking sales and transactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shift-select">Select Shift</Label>
        <Select
          value={selectedShiftId?.toString() || ""}
          onValueChange={(value) => setSelectedShiftId(Number(value))}
        >
          <SelectTrigger id="shift-select" className="w-full max-w-xs">
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {allShifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.name} - {format(parseISO(shift.start_time), 'MMM d, yyyy')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedShiftId && (
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="details">Shift Details</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <ExportButton
              data={activeTab === "details" ? prepareShiftDetailsForExport() : prepareTransactionsForExport()}
              filename={`shift-${selectedShiftId}-${activeTab}`}
              disabled={isLoadingShiftDetails || isLoadingTransactions || (activeTab === "details" && !shiftDetails) || (activeTab === "transactions" && shiftTransactions.length === 0)}
            />
          </div>
          
          <TabsContent value="details" className="space-y-4">
            {isLoadingShiftDetails ? (
              <Skeleton className="h-[300px] w-full" />
            ) : shiftDetails ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Shift Information</CardTitle>
                    <CardDescription>
                      Basic details about the selected shift
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium">Shift Name:</dt>
                        <dd>{shiftDetails.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Cashier:</dt>
                        <dd>{shiftDetails.user_profile?.full_name || 'Unknown'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Start Time:</dt>
                        <dd>{formatDateTime(shiftDetails.start_time)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">End Time:</dt>
                        <dd>{formatDateTime(shiftDetails.end_time)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Status:</dt>
                        <dd className="capitalize">{shiftDetails.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Opening Balance:</dt>
                        <dd>{formatCurrency(shiftDetails.opening_balance)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Closing Balance:</dt>
                        <dd>{formatCurrency(shiftDetails.closing_balance)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Cash Discrepancy:</dt>
                        <dd className={shiftDetails.cash_discrepancy && shiftDetails.cash_discrepancy < 0 ? 'text-red-600' : ''}>
                          {formatCurrency(shiftDetails.cash_discrepancy)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {shiftDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shift Sales</CardTitle>
                      <CardDescription>
                        Sales breakdown by payment method
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {/* Cash Sales */}
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="font-medium">Cash Sales</span>
                          <span>{formatCurrency(shiftSales?.cash || 0)}</span>
                        </div>
                        
                        {/* Credit Card Sales */}
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="font-medium">Credit Card Sales</span>
                          <span>{formatCurrency(shiftSales?.credit || 0)}</span>
                        </div>
                        
                        {/* Gift Card Sales */}
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="font-medium">Gift Card Sales</span>
                          <span>{formatCurrency(shiftSales?.gift_card || 0)}</span>
                        </div>
                        
                        {/* Other Sales */}
                        {(shiftSales?.other || 0) > 0 && (
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="font-medium">Other Sales</span>
                            <span>{formatCurrency(shiftSales?.other || 0)}</span>
                          </div>
                        )}
                        
                        {/* Refunds - Add this section */}
                        {(shiftSales?.refunds || 0) > 0 && (
                          <div className="flex justify-between items-center py-1 border-b text-red-600">
                            <span className="font-medium">Refunds</span>
                            <span>-{formatCurrency(shiftSales?.refunds || 0)}</span>
                          </div>
                        )}
                        
                        {/* Total Sales */}
                        <div className="flex justify-between items-center py-1 pt-2 font-bold">
                          <span>Net Sales</span>
                          <span>{formatCurrency(
                            (shiftSales?.cash || 0) + 
                            (shiftSales?.credit || 0) + 
                            (shiftSales?.gift_card || 0) + 
                            (shiftSales?.other || 0) - 
                            (shiftSales?.refunds || 0)
                          )}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Select a shift to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="transactions">
            {isLoadingTransactions ? (
              <Skeleton className="h-[400px] w-full" />
            ) : shiftTransactions.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Shift Transactions</CardTitle>
                  <CardDescription>
                    All transactions processed during this shift
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.id}</TableCell>
                          <TableCell>{formatDateTime(transaction.created_at)}</TableCell>
                          <TableCell>{transaction.customers?.name || 'Walk-in'}</TableCell>
                          <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                          <TableCell>
                            {formatCurrency(transaction.total_amount)}
                            {transaction.refunded_amount > 0 && (
                              <span className="text-xs text-red-600 ml-1">
                                (Refunded: {formatCurrency(transaction.refunded_amount)})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{transaction.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Transactions</CardTitle>
                  <CardDescription>
                    No transactions were processed during this shift.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    This shift has no recorded transactions.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
