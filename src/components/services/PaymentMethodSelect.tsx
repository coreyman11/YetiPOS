
import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, DollarSign, Gift, Smartphone } from "lucide-react";
import { PaymentMethod } from "@/pages/services/hooks/payment/types";

interface PaymentMethodSelectProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
}

export const PaymentMethodSelect = ({
  paymentMethod,
  onPaymentMethodChange,
}: PaymentMethodSelectProps) => {
  const paymentMethods = [
    { id: "cash", label: "Cash", icon: DollarSign },
    { id: "credit", label: "Credit Card", icon: CreditCard },
    { id: "card_reader", label: "Card Reader", icon: Smartphone },
    { id: "gift_card", label: "Gift Card", icon: Gift },
  ] as const;

  return (
    <div className="space-y-2">
      <Label>Payment Method</Label>
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Button
              key={method.id}
              variant={paymentMethod === method.id ? "default" : "outline"}
              className={cn(
                "h-12 flex items-center justify-center gap-2",
                paymentMethod === method.id && "ring-2 ring-primary"
              )}
              onClick={() => onPaymentMethodChange(method.id as PaymentMethod)}
            >
              <Icon className="h-4 w-4" />
              {method.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
