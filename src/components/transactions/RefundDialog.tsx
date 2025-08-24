
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/types/supabase";
import { transactionsApi } from "@/services";
import { useAuth } from "@/contexts/auth-context";
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

interface RefundDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefundComplete: () => void;
}

export const RefundDialog = ({
  transaction,
  open,
  onOpenChange,
  onRefundComplete
}: RefundDialogProps) => {
  const { userProfile } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const maxRefundAmount = transaction 
    ? Number(transaction.total_amount) - Number(transaction.refunded_amount || 0) 
    : 0;
  
  const handleRefund = async () => {
    if (!transaction || !userProfile) return;
    
    const refundAmount = parseFloat(amount);
    
    if (isNaN(refundAmount) || refundAmount <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    
    if (refundAmount > maxRefundAmount) {
      toast.error(`Refund amount cannot exceed ${maxRefundAmount.toFixed(2)}`);
      return;
    }
    
    try {
      setIsProcessing(true);
      
      await transactionsApi.createRefund({
        transaction_id: transaction.id,
        refund_amount: refundAmount,
        payment_method: transaction.payment_method,
        refunded_by: userProfile.id,
        notes: notes || null,
        status: 'pending' // Start with pending status
      });
      
      toast.success("Refund processed successfully");
      onOpenChange(false);
      onRefundComplete(); // Refresh data after refund
      
      // Reset form
      setAmount("");
      setNotes("");
    } catch (error) {
      console.error("Refund error:", error);
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Enter the amount to refund for transaction #{transaction?.id}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div>
            <p className="text-sm mb-2">
              <span className="font-medium">Transaction Total:</span> ${transaction?.total_amount?.toFixed(2) || '0.00'}
            </p>
            {(transaction?.refunded_amount || 0) > 0 && (
              <p className="text-sm mb-2 text-destructive">
                <span className="font-medium">Already Refunded:</span> ${(transaction?.refunded_amount || 0).toFixed(2)}
              </p>
            )}
            <p className="text-sm mb-2 font-semibold">
              <span className="font-medium">Maximum Refund:</span> ${maxRefundAmount.toFixed(2)}
            </p>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center">
              <span className="mr-2">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefundAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right align-top pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              className="col-span-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for refund"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRefund} 
            disabled={!amount || isProcessing}
          >
            {isProcessing ? "Processing..." : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
