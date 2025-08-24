
import { Button } from "@/components/ui/button";
import { CartItem } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { Database } from "@/types/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShiftStartDialog } from "@/components/services/ShiftStartDialog";

type PaymentMethod = "cash" | "credit" | "gift_card";
type Shift = Database['public']['Tables']['shifts']['Row'];
type Discount = Database['public']['Tables']['discounts']['Row'];

interface OrderSummaryProps {
  total: number;
  cart: CartItem[];
  onPaymentMethodSelect: (method: PaymentMethod) => void;
  activeShift?: Shift | null;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export const OrderSummary = ({ 
  total, 
  cart, 
  onPaymentMethodSelect,
  activeShift,
  subtotal,
  taxAmount,
  discountAmount = 0
}: OrderSummaryProps) => {
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  
  const handlePaymentMethodClick = (method: PaymentMethod) => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    if (!activeShift) {
      toast.error("No active shift. Please start a shift before processing transactions.");
      return;
    }
    
    onPaymentMethodSelect(method);
  };
  
  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="flex flex-col mb-4">
        {subtotal !== undefined && (
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-500">Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        )}
        
        
        {taxAmount !== undefined && (
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-500">Tax:</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">Items: {cart.length}</span>
          <span className="text-lg font-medium">Total: {formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="bg-gray-100 hover:bg-gray-200 text-black"
          onClick={() => handlePaymentMethodClick("cash")}
          disabled={cart.length === 0 || !activeShift}
        >
          Cash
        </Button>
        
        <Button 
          className="bg-[#161b22] hover:bg-[#21262e] text-white"
          onClick={() => handlePaymentMethodClick("credit")}
          disabled={cart.length === 0 || !activeShift}
        >
          Pay
        </Button>
      </div>
      
      {!activeShift && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Need to start a shift</p>
              <p className="text-xs text-amber-700 mb-2">Start a shift to process transactions</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 bg-white border-amber-300 hover:bg-amber-100 text-amber-800"
                onClick={() => setIsShiftDialogOpen(true)}
              >
                <Clock className="h-4 w-4 mr-1" />
                Start New Shift
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <ShiftStartDialog
        isOpen={isShiftDialogOpen}
        onClose={() => setIsShiftDialogOpen(false)}
      />
    </div>
  );
};

