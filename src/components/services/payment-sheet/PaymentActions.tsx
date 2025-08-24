
import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, Gift, KeyRound, Wifi } from "lucide-react";
import { PaymentMethod } from "@/pages/services/hooks/payment/types";

interface PaymentActionsProps {
  isProcessing: boolean;
  disabled: boolean;
  paymentMethod: PaymentMethod;
  isSplitPayment: boolean;
  onClick: () => void;
  showPaymentButton?: boolean;
}

export const PaymentActions = ({
  isProcessing,
  disabled,
  paymentMethod,
  isSplitPayment,
  onClick,
  showPaymentButton = true,
}: PaymentActionsProps) => {
  // Only hide the button if explicitly told to hide it, or
  // if we're in split payment mode with cash (where the CashPaymentForm handles it)
  // But always show the button for final payment (remaining amount is 0)
  if (!showPaymentButton) {
    return null;
  }
  
  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={onClick}
      disabled={disabled}
    >
      {isProcessing ? (
        "Processing..."
      ) : (
        <>
          {paymentMethod === 'credit' ? <CreditCard className="mr-2 h-4 w-4" /> :
           paymentMethod === 'manual_credit' ? <KeyRound className="mr-2 h-4 w-4" /> :
           paymentMethod === 'card_reader' ? <Wifi className="mr-2 h-4 w-4" /> :
           paymentMethod === 'gift_card' ? <Gift className="mr-2 h-4 w-4" /> :
           <DollarSign className="mr-2 h-4 w-4" />}
          {isSplitPayment ? 'Complete Split Payment' : 
           paymentMethod === 'credit' ? 'Process Card Payment' :
           paymentMethod === 'manual_credit' ? 'Process Manual Card Payment' :
           paymentMethod === 'card_reader' ? 'Process Card Reader Payment' :
           paymentMethod === 'gift_card' ? 'Process Gift Card Payment' :
           'Complete Cash Payment'}
        </>
      )}
    </Button>
  );
};
