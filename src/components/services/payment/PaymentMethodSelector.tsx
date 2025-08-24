
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, DollarSign, Gift, KeyRound, Wifi } from "lucide-react";
import { PaymentMethod } from "@/pages/services/hooks/payment/types";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base">Select Payment Method</Label>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-2 gap-4 pt-2"
      >
        <div>
          <RadioGroupItem
            value="cash"
            id="cash"
            className="peer sr-only"
          />
          <Label
            htmlFor="cash"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <DollarSign className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Cash</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem
            value="credit"
            id="credit"
            className="peer sr-only"
          />
          <Label
            htmlFor="credit"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <CreditCard className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Card (Manual)</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem
            value="gift_card"
            id="gift_card"
            className="peer sr-only"
          />
          <Label
            htmlFor="gift_card"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Gift className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Gift Card</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem
            value="card_reader"
            id="card_reader"
            className="peer sr-only"
          />
          <Label
            htmlFor="card_reader"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Wifi className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Card Reader</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem
            value="manual_credit"
            id="manual_credit"
            className="peer sr-only"
          />
          <Label
            htmlFor="manual_credit"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-300 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <KeyRound className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Manual Entry</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
