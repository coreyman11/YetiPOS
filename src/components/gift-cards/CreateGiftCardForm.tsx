
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { giftCardsApi } from "@/services/gift-cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gift, Plus } from "lucide-react";

interface CreateGiftCardFormProps {
  onSuccess?: () => void;
}

export const CreateGiftCardForm = ({ onSuccess }: CreateGiftCardFormProps = {}) => {
  const [newCardBalance, setNewCardBalance] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardNotes, setNewCardNotes] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const queryClient = useQueryClient();

  const createGiftCardMutation = useMutation({
    mutationFn: ({ balance, notes, cardNumber }: { balance: number, notes: string, cardNumber?: string }) => 
      giftCardsApi.create({ 
        initialBalance: balance, 
        notes, 
        manualCardNumber: cardNumber 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      setNewCardBalance("");
      setNewCardNumber("");
      setNewCardNotes("");
      toast.success("Gift card created successfully!");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create gift card");
      console.error("Create gift card error:", error);
    }
  });

  const handleCreateGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(newCardBalance);
    if (isNaN(balance) || balance <= 0) {
      toast.error("Please enter a valid balance");
      return;
    }
    if (isManualEntry && !newCardNumber) {
      toast.error("Please enter a gift card number");
      return;
    }
    createGiftCardMutation.mutate({ 
      balance, 
      notes: newCardNotes,
      cardNumber: isManualEntry ? newCardNumber : undefined 
    });
  };

  return (
    <form onSubmit={handleCreateGiftCard} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="manualEntry"
            checked={isManualEntry}
            onChange={(e) => setIsManualEntry(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="manualEntry">Enter gift card number manually</Label>
        </div>
      </div>
      
      {isManualEntry && (
        <div className="space-y-2">
          <Label htmlFor="cardNumber">Gift Card Number</Label>
          <Input
            id="cardNumber"
            value={newCardNumber}
            onChange={(e) => setNewCardNumber(e.target.value)}
            placeholder="Enter gift card number"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="balance">Initial Balance ($)</Label>
        <Input
          id="balance"
          type="number"
          step="0.01"
          min="0"
          value={newCardBalance}
          onChange={(e) => setNewCardBalance(e.target.value)}
          placeholder="Enter initial balance"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={newCardNotes}
          onChange={(e) => setNewCardNotes(e.target.value)}
          placeholder="Add notes about this gift card"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-black hover:bg-gray-800 text-white"
        disabled={createGiftCardMutation.isPending}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Gift Card
      </Button>
    </form>
  );
};
