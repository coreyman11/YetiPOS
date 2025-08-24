
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { giftCardsApi } from "@/services/gift-cards";
import { CreateGiftCardForm } from "@/components/gift-cards/CreateGiftCardForm";
import { GiftCardBalanceChecker } from "@/components/gift-cards/GiftCardBalanceChecker";
import { GiftCardsList } from "@/components/gift-cards/GiftCardsList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CreditCard, Search } from "lucide-react";

const GiftCards = () => {
  const { data: giftCards = [], isLoading } = useQuery({
    queryKey: ['gift-cards'],
    queryFn: giftCardsApi.getAll,
  });

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load the gift cards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex gap-4 mb-6">
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Gift Card
        </Button>
        
        <Button 
          className="bg-black hover:bg-gray-800 text-white"
          onClick={() => setBalanceDialogOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Check Gift Card Balance
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4"></h2>
        <GiftCardsList giftCards={giftCards} />
      </div>

      {/* Create Gift Card Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Gift Card</DialogTitle>
          </DialogHeader>
          <CreateGiftCardForm onSuccess={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Check Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check Gift Card Balance</DialogTitle>
          </DialogHeader>
          <GiftCardBalanceChecker />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GiftCards;
