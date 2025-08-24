import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Database } from "@/types/supabase";
import { RefundDialog } from "./RefundDialog";
import { transactionsApi } from "@/services";
import { toast } from "sonner";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

type Refund = Database['public']['Tables']['refunds']['Row'];

interface TransactionDetailProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionDetail = ({
  transaction,
  open,
  onOpenChange
}: TransactionDetailProps) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  useEffect(() => {
    if (transaction && open) {
      loadRefunds();
    }
  }, [transaction, open]);

  const loadRefunds = async () => {
    if (!transaction) return;
    
    try {
      const refundData = await transactionsApi.getRefundsByTransactionId(transaction.id);
      setRefunds(refundData);
    } catch (error) {
      console.error("Error loading refunds:", error);
      toast.error("Failed to load refund history");
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const handleRefundComplete = () => {
    loadRefunds();
  };

  if (!transaction) return null;

  const maxRefundAmount = Number(transaction.total_amount) - Number(transaction.refunded_amount || 0);
  const hasRefunds = (transaction.refunded_amount || 0) > 0;
  const isFullyRefunded = maxRefundAmount <= 0;
  const hasDiscount = transaction.discount_total && transaction.discount_total > 0;
  const discountPercentage = hasDiscount && transaction.subtotal > 0 
    ? Math.round((transaction.discount_total / transaction.subtotal) * 100) 
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Transaction #{transaction.id}</DialogTitle>
            <DialogDescription>
              View transaction details and process refunds if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-lg font-medium">Transaction Details</h3>
              <Separator className="my-2" />
              
              <dl className="divide-y divide-gray-200">
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="text-sm text-right">{formatDateTime(transaction.created_at)}</dd>
                </div>
                
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Customer</dt>
                  <dd className="text-sm text-right">{transaction.customers?.name || 'Walk-in Customer'}</dd>
                </div>
                
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="text-sm text-right capitalize">{transaction.payment_method}</dd>
                </div>
                
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                  <dd className="text-sm text-right">${transaction.subtotal.toFixed(2)}</dd>
                </div>
                
                {hasDiscount && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-green-600">Discount ({discountPercentage}%)</dt>
                    <dd className="text-sm font-medium text-green-600 text-right">-${transaction.discount_total.toFixed(2)}</dd>
                  </div>
                )}
                
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Tax ({transaction.tax_rate}%)</dt>
                  <dd className="text-sm text-right">${transaction.tax_amount.toFixed(2)}</dd>
                </div>
                
                <div className="py-2 flex justify-between">
                  <dt className="text-sm font-semibold">Total</dt>
                  <dd className="text-sm font-semibold text-right">${transaction.total_amount.toFixed(2)}</dd>
                </div>
                
                {hasRefunds && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-medium text-red-500">Refunded</dt>
                    <dd className="text-sm font-medium text-red-500 text-right">-${(transaction.refunded_amount || 0).toFixed(2)}</dd>
                  </div>
                )}
                
                {hasRefunds && (
                  <div className="py-2 flex justify-between">
                    <dt className="text-sm font-semibold">Final Amount</dt>
                    <dd className="text-sm font-semibold text-right">${(transaction.total_amount - (transaction.refunded_amount || 0)).toFixed(2)}</dd>
                  </div>
                )}
              </dl>
              
              {!isFullyRefunded && (
                <div className="mt-4">
                  <Button 
                    onClick={() => setRefundDialogOpen(true)}
                    variant="destructive"
                  >
                    Process Refund
                  </Button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Items</h3>
              <Separator className="my-2" />
              
              <ul className="divide-y divide-gray-200">
                {transaction.transaction_items.map(item => {
                  const itemName = item.services?.name || item.inventory?.name || 'Unknown Item';
                  return (
                    <li key={`${item.services?.id || item.inventory?.id}-${itemName}`} className="py-2">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-sm">{itemName}</span>
                          <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>
                        </div>
                        <span className="text-sm">${Number(item.price).toFixed(2)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {hasRefunds && refunds.length > 0 && (
              <div>
                <h3 className="text-lg font-medium">Refund History</h3>
                <Separator className="my-2" />
                
                <ul className="divide-y divide-gray-200">
                  {refunds.map(refund => (
                    <li key={refund.id} className="py-2">
                      <div className="flex justify-between">
                        <div className="text-sm">{formatDateTime(refund.refunded_at)}</div>
                        <div className="text-sm text-red-500">-${refund.refund_amount.toFixed(2)}</div>
                      </div>
                      {refund.notes && (
                        <div className="text-xs text-gray-500 mt-1">{refund.notes}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <RefundDialog
        transaction={transaction}
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onRefundComplete={handleRefundComplete}
      />
    </>
  );
};
