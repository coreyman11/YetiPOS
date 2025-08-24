
import { useState } from "react";
import { giftCardsApi } from "@/services/gift-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search } from "lucide-react";

export const GiftCardBalanceChecker = () => {
  const [searchCardNumber, setSearchCardNumber] = useState("");

  const handleCheckBalance = async () => {
    if (!searchCardNumber) {
      toast.error("Please enter a gift card number");
      return;
    }
    try {
      const card = await giftCardsApi.getByCardNumber(searchCardNumber);
      
      // Get the most recent transaction's balance
      const currentBalance = card.gift_card_transactions.length > 0
        ? [...card.gift_card_transactions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          .balance_after
        : card.current_balance;

      toast.success(`Current balance: $${currentBalance.toFixed(2)}`);
      setSearchCardNumber(""); // Clear the input after successful check
    } catch (error) {
      toast.error("Gift card not found");
      console.error("Check balance error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber">Gift Card Number</Label>
        <div className="flex gap-2">
          <Input
            id="cardNumber"
            value={searchCardNumber}
            onChange={(e) => setSearchCardNumber(e.target.value)}
            placeholder="Enter gift card number"
          />
          <Button 
            onClick={handleCheckBalance}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <Search className="mr-2 h-4 w-4" />
            Check
          </Button>
        </div>
      </div>
    </div>
  );
};
