
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface ChangeDueScreenProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onShowReceipt: () => void;
  transactionId: number;
  cashReceived: number | null;
  totalAmount: number;
}

export const ChangeDueScreen = ({
  isOpen,
  onOpenChange,
  onClose,
  onShowReceipt,
  transactionId,
  cashReceived,
  totalAmount,
}: ChangeDueScreenProps) => {
  console.log("ChangeDueScreen - totalAmount:", totalAmount);
  console.log("ChangeDueScreen - cashReceived:", cashReceived);
  
  // Make sure totalAmount is a valid number and not 0
  const numericTotal = typeof totalAmount === 'number' && !isNaN(totalAmount) ? 
    totalAmount : 0;
  
  // Ensure cashReceived is properly formatted - default to same as total if null
  const numericCashReceived = cashReceived !== null && typeof cashReceived === 'number' ? 
    cashReceived : numericTotal;
    
  // Calculate change as cash received minus total
  const changeAmount = Math.max(0, numericCashReceived - numericTotal);
  
  console.log("ChangeDueScreen - Calculated values:", {
    numericTotal,
    numericCashReceived,
    changeAmount
  });
  
  // Format all currency values consistently
  const formattedTotal = formatCurrency(numericTotal);
  const formattedCashReceived = formatCurrency(numericCashReceived);
  const formattedChange = formatCurrency(changeAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center text-xl font-semibold text-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            Payment Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className={cn(
          "mt-4 p-6 border-2 rounded-lg bg-green-50 border-green-100",
          "animate-fade-in flex flex-col items-center"
        )}>
          <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">Change Due</h2>
          
          <div className="grid grid-cols-2 gap-3 w-full text-lg mb-6">
            <div className="text-green-700">Total Amount:</div>
            <div className="text-right font-medium">{formattedTotal}</div>
            
            <div className="text-green-700">Cash Received:</div>
            <div className="text-right font-medium">{formattedCashReceived}</div>
            
            <div className="text-green-700 font-bold text-xl">Change:</div>
            <div className="text-right font-bold text-green-800 text-xl">{formattedChange}</div>
          </div>
          
          <p className="text-center text-green-600 text-sm mb-4">
            Transaction #{transactionId} completed successfully
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 mt-4">
          <Button 
            onClick={onShowReceipt}
            className="w-full"
            variant="outline"
          >
            <Printer className="mr-2 h-4 w-4" />
            View Receipt
          </Button>
          
          <Button
            onClick={onClose}
            className="w-full"
            variant="default"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
