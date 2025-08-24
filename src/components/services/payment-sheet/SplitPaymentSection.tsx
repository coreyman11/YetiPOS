
import React, { useState } from "react";
import { PaymentMethod, SplitPayment } from "@/pages/services/hooks/payment/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PaymentMethodSelector } from "../payment/PaymentMethodSelector";

interface SplitPaymentSectionProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  remainingAmount: number;
  giftCardNumber: string;
  onGiftCardNumberChange: (value: string) => void;
  onGiftCardCheck: () => void;
  giftCardError: string | null;
  splitPayments: SplitPayment[];
  onAddSplitPayment: (
    method: PaymentMethod,
    amount: number,
    giftCardId?: number,
    giftCardNumber?: string
  ) => void;
  onRemoveSplitPayment: (index: number) => void;
}

export const SplitPaymentSection: React.FC<SplitPaymentSectionProps> = ({
  paymentMethod,
  onPaymentMethodChange,
  remainingAmount,
  giftCardNumber,
  onGiftCardNumberChange,
  onGiftCardCheck,
  giftCardError,
  splitPayments,
  onAddSplitPayment,
  onRemoveSplitPayment,
}) => {
  const [splitAmount, setSplitAmount] = useState<number | "">("");

  const handleAddSplitPayment = () => {
    if (splitAmount === "" || Number(splitAmount) <= 0) return;
    const amount = Math.min(Number(splitAmount), remainingAmount);
    onAddSplitPayment(paymentMethod, amount);
    setSplitAmount("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Payment Methods</Label>
          <div className="text-sm font-medium">
            Remaining: ${remainingAmount.toFixed(2)}
          </div>
        </div>

        {splitPayments.map((payment, index) => (
          <div key={index} className="flex justify-between items-center p-2 border rounded">
            <div>
              {payment.payment_method === 'gift_card' 
                ? `Gift Card (${payment.gift_card_number?.substring(0, 8)}...)` 
                : payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
            </div>
            <div className="flex items-center gap-2">
              <span>${payment.amount.toFixed(2)}</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onRemoveSplitPayment(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Add Payment</Label>
        <PaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} />

        {paymentMethod === "gift_card" && (
          <div className="space-y-2">
            <Label htmlFor="giftCardNumber">Gift Card Number</Label>
            <div className="flex space-x-2">
              <Input
                id="giftCardNumber"
                value={giftCardNumber}
                onChange={(e) => onGiftCardNumberChange(e.target.value)}
                placeholder="Enter gift card number"
              />
              <Button onClick={onGiftCardCheck}>Verify</Button>
            </div>
            {giftCardError && <div className="text-sm text-red-500">{giftCardError}</div>}
          </div>
        )}

        {paymentMethod !== "gift_card" && remainingAmount > 0 && (
          <div className="space-y-2">
            <Label htmlFor="splitAmount">Amount</Label>
            <div className="flex space-x-2">
              <Input
                id="splitAmount"
                type="number"
                min="0.01"
                step="0.01"
                max={remainingAmount}
                value={splitAmount}
                onChange={(e) => setSplitAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`0.00 (max: $${remainingAmount.toFixed(2)})`}
              />
              <Button onClick={handleAddSplitPayment}>Add</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { type SplitPayment };
