
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CashPaymentFormProps {
  totalAmount: number;
  isProcessing: boolean;
  onSubmit: (cashReceived: number | null) => void;
  showSubmitButton?: boolean;
}

export const CashPaymentForm = ({
  totalAmount,
  isProcessing,
  onSubmit,
  showSubmitButton = true,
}: CashPaymentFormProps) => {
  const [cashReceived, setCashReceived] = useState<string>("");
  
  // Fix the TypeScript error by ensuring totalAmount is treated as a number
  const parsedTotal = typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount)) || 0;
  
  // Calculate change with proper number parsing
  const parsedCashAmount = cashReceived ? parseFloat(cashReceived) : 0;
  const change = cashReceived ? Math.max(0, parsedCashAmount - parsedTotal).toFixed(2) : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If cash amount is empty or invalid, use the total amount as default
    // This ensures the cash received is always populated with at least the total amount
    const amount = cashReceived && !isNaN(parseFloat(cashReceived)) ? 
      parseFloat(cashReceived) : parsedTotal;
    
    onSubmit(amount);
  };

  const handleDenominationClick = (amount: number) => {
    setCashReceived(amount.toFixed(2));
  };

  // Handle input change with proper validation
  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty value or valid numeric input
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setCashReceived(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cash-received" className="text-sm font-medium">
          Cash Received (optional)
        </label>
        <Input
          id="cash-received"
          type="text"
          value={cashReceived}
          onChange={handleCashAmountChange}
          placeholder="Enter amount received"
          className="mt-1"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => handleDenominationClick(20)}
        >
          $20
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => handleDenominationClick(50)}
        >
          $50
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => handleDenominationClick(100)}
        >
          $100
        </Button>
      </div>
      
      {parseFloat(cashReceived) > 0 && parsedTotal > 0 && (
        <div className="bg-muted p-3 rounded-md">
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div>Total:</div>
            <div className="text-right">${parsedTotal.toFixed(2)}</div>
            <div>Cash Received:</div>
            <div className="text-right">${parseFloat(cashReceived).toFixed(2)}</div>
            <div className="font-medium">Change:</div>
            <div className="text-right font-medium">${change}</div>
          </div>
        </div>
      )}

      {showSubmitButton && (
        <Button
          type="submit"
          className="w-full"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : `Complete ${parsedTotal > 0 ? 'Cash ' : ''}Payment (${formatCurrency(parsedTotal)})`}
        </Button>
      )}
    </form>
  );
};
