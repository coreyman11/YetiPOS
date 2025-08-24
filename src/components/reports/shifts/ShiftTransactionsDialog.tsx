
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShiftsApi } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '../ExportButton';

// Define a local Transaction interface for use within this component
interface Transaction {
  id: number;
  created_at: string;
  total_amount: number;
  payment_method: string;
  status: string;
  customers?: {
    name: string;
  };
  transaction_items?: any[];
  refunded_amount?: number;
  [key: string]: any;
}

interface ShiftTransactionsDialogProps {
  shift: any;
  open: boolean;
  onClose: () => void;
}

export const ShiftTransactionsDialog: React.FC<ShiftTransactionsDialogProps> = ({ 
  shift, 
  open,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('transactions');
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['shift-transactions', shift?.id],
    queryFn: () => ShiftsApi.getShiftTransactions(shift.id),
    enabled: !!shift && open,
  });

  const formatPaymentMethod = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  const transformTransactionsForExport = (data: Transaction[]) => {
    return data.map(tx => ({
      'Transaction ID': tx.id,
      'Date': format(new Date(tx.created_at), 'MMM dd, yyyy h:mm a'),
      'Amount': `$${Number(tx.total_amount).toFixed(2)}`,
      'Status': tx.status.charAt(0).toUpperCase() + tx.status.slice(1),
      'Payment Method': formatPaymentMethod(tx.payment_method),
      'Customer': tx.customers?.name || 'Guest',
      'Items': tx.transaction_items?.length || 0,
    }));
  };

  // Get the cashier name using the same logic as in ShiftReport
  const getCashierName = () => {
    if (shift?.cashier_name) {
      return shift.cashier_name;
    }
    if (shift?.cashier?.name) {
      return shift.cashier.name;
    }
    if (shift?.user_profile?.full_name) {
      return shift.user_profile.full_name;
    }
    if (shift?.full_name) {
      return shift.full_name;
    }
    if (shift?.assigned_user_id) {
      return `User ID: ${shift.assigned_user_id.substring(0, 8)}...`;
    }
    return 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shift #{shift?.id} Transactions</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium">Cashier</p>
              <p className="text-sm">{getCashierName()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Shift Date</p>
              <p className="text-sm">{format(new Date(shift?.start_time), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Start Time</p>
              <p className="text-sm">{format(new Date(shift?.start_time), 'h:mm a')}</p>
            </div>
            <div>
              <p className="text-sm font-medium">End Time</p>
              <p className="text-sm">
                {shift?.end_time ? format(new Date(shift.end_time), 'h:mm a') : 'In Progress'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Sales</p>
              <p className="text-sm">${Number(shift?.total_sales || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Transaction Count</p>
              <p className="text-sm">{shift?.transaction_count || transactions?.length || 0}</p>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              {transactions && transactions.length > 0 && (
                <ExportButton 
                  data={transactions} 
                  filename={`shift-${shift.id}-transactions`}
                  transformData={transformTransactionsForExport}
                />
              )}
            </div>
            
            <TabsContent value="transactions">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : !transactions || transactions.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">No transactions found for this shift.</p>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction: Transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>#{transaction.id}</TableCell>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'h:mm a')}
                          </TableCell>
                          <TableCell>${Number(transaction.total_amount).toFixed(2)}</TableCell>
                          <TableCell>{formatPaymentMethod(transaction.payment_method)}</TableCell>
                          <TableCell>{transaction.customers?.name || 'Guest'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                transaction.status === 'completed' 
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' 
                                  : transaction.status === 'refunded' || transaction.refunded_amount
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                    : ''
                              }
                            >
                              {transaction.refunded_amount ? 'Partial Refund' : 
                               transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="summary">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Payment Methods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['cash', 'card', 'gift_card'].map(method => {
                      const methodTransactions = transactions?.filter(
                        (t: Transaction) => t.payment_method === method
                      ) || [];
                      
                      const total = methodTransactions.reduce(
                        (sum: number, t: Transaction) => sum + Number(t.total_amount), 
                        0
                      );
                      
                      return (
                        <div key={method} className="bg-background p-4 border rounded-lg">
                          <p className="text-sm font-medium">{formatPaymentMethod(method)}</p>
                          <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {methodTransactions.length} transactions
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
