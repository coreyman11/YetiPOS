
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GiftCardVerifierProps {
  giftCardNumber: string;
  onGiftCardNumberChange: (value: string) => void;
  onGiftCardCheck: () => void;
  giftCardError: string | null;
}

export const GiftCardVerifier = ({
  giftCardNumber,
  onGiftCardNumberChange,
  onGiftCardCheck,
  giftCardError,
}: GiftCardVerifierProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGiftCardCheck();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm font-medium">Gift Card Details</div>
      <div className="flex space-x-2">
        <Input
          placeholder="Enter gift card number"
          value={giftCardNumber}
          onChange={(e) => onGiftCardNumberChange(e.target.value)}
        />
        <Button 
          type="submit" 
          disabled={!giftCardNumber}
        >
          Verify
        </Button>
      </div>
      {giftCardError && (
        <div className="text-sm text-destructive">{giftCardError}</div>
      )}
    </form>
  );
};
