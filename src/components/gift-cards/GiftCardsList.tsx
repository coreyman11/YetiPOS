
import { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database } from "@/types/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { GiftCardDetailsDialog } from "./GiftCardDetailsDialog";

type GiftCard = Database['public']['Tables']['gift_cards']['Row'] & {
  gift_card_transactions: Database['public']['Tables']['gift_card_transactions']['Row'][];
};

interface GiftCardsListProps {
  giftCards: GiftCard[];
}

export const GiftCardsList = ({ giftCards }: GiftCardsListProps) => {
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };

  const getCardStatus = (card: GiftCard) => {
    if (!card.is_active) return "Inactive";
    if (card.current_balance <= 0) return "Used";
    if (card.expiration_date && new Date(card.expiration_date) < new Date()) return "Expired";
    return "Active";
  };

  const handleRowClick = (card: GiftCard) => {
    setSelectedCard(card);
    setDialogOpen(true);
  };

  // Get current balance from most recent transaction
  const getCurrentBalance = (card: GiftCard) => {
    // Ensure gift_card_transactions exists and is an array
    if (!card.gift_card_transactions || !Array.isArray(card.gift_card_transactions)) {
      return card.current_balance;
    }

    // If there are transactions, get the most recent balance
    if (card.gift_card_transactions.length > 0) {
      const sortedTransactions = [...card.gift_card_transactions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return sortedTransactions[0].balance_after;
    }

    return card.current_balance;
  };

  // Get the most recent transaction date as last used date
  const getLastUsedDate = (card: GiftCard) => {
    // If there's a stored last_used_at date, use that as a fallback
    if (card.last_used_at) {
      return card.last_used_at;
    }
    
    // Check if card has any transactions
    if (card.gift_card_transactions && card.gift_card_transactions.length > 0) {
      // Sort transactions by created_at in descending order
      const sortedTransactions = [...card.gift_card_transactions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Return the created_at date of the most recent transaction
      return sortedTransactions[0].created_at;
    }
    
    // If no transactions, return null (will display as N/A)
    return null;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Card Number</TableHead>
              <TableHead>Initial Balance</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {giftCards.map((card) => (
              <TableRow 
                key={card.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(card)}
              >
                <TableCell className="font-mono">{card.card_number}</TableCell>
                <TableCell>${card.initial_balance.toFixed(2)}</TableCell>
                <TableCell>${getCurrentBalance(card).toFixed(2)}</TableCell>
                <TableCell>{getCardStatus(card)}</TableCell>
                <TableCell>{formatDate(card.created_at)}</TableCell>
                <TableCell>{formatDate(getLastUsedDate(card))}</TableCell>
                <TableCell>{card.notes || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GiftCardDetailsDialog
        giftCard={selectedCard}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
