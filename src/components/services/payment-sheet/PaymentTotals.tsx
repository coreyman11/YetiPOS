import React from "react";
import { SplitPayment } from "@/pages/services/hooks/payment/types";

interface PaymentTotalsProps {
  subtotal: number;
  usePoints: boolean;
  canRedeemPoints: boolean;
  loyaltyDiscount: number;
  taxRate: number;
  taxAmount: number;
  finalTotal: number;
  splitPayments?: SplitPayment[];
  remainingAmount?: number;
  discountAmount?: number;
  discountName?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

export const PaymentTotals = ({
  subtotal,
  usePoints,
  canRedeemPoints,
  loyaltyDiscount,
  taxRate,
  taxAmount,
  finalTotal,
  splitPayments = [],
  remainingAmount = 0,
  discountAmount = 0,
  discountName = '',
  discountType,
  discountValue = 0
}: PaymentTotalsProps) => {
  const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate the pre-tax subtotal for display
  const preTaxSubtotal = subtotal - taxAmount;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-lg font-semibold">
        <span>Subtotal:</span>
        <span>${preTaxSubtotal.toFixed(2)}</span>
      </div>
      {usePoints && canRedeemPoints && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Points Redemption:</span>
          <span>-${loyaltyDiscount.toFixed(2)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Discount {discountName ? `(${discountName})` : ''}: 
            {discountType === 'percentage' ? ` ${discountValue}%` : ''}
          </span>
          <span className="text-red-500">-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span>Tax ({taxRate}%):</span>
        <span>${taxAmount.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-lg font-semibold border-t pt-2">
        <span>Final Total:</span>
        <span>${finalTotal.toFixed(2)}</span>
      </div>
      
      {splitPayments.length > 0 && (
        <>
          <div className="border-t pt-2">
            <div className="text-sm font-medium pb-1">Applied Payments:</div>
            {splitPayments.map((payment, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {payment.payment_method === 'gift_card' 
                    ? `Gift Card (${payment.gift_card_number?.substring(0, 8)}...)` 
                    : payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                </span>
                <span>-${payment.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-md font-semibold border-t pt-2">
            <span>Remaining:</span>
            <span>${remainingAmount.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
};
