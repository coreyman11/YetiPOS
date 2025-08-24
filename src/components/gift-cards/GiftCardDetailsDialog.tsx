
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database } from "@/types/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";

type GiftCard = Database['public']['Tables']['gift_cards']['Row'] & {
  gift_card_transactions: Database['public']['Tables']['gift_card_transactions']['Row'][];
};

interface GiftCardDetailsDialogProps {
  giftCard: GiftCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GiftCardDetailsDialog = ({
  giftCard,
  open,
  onOpenChange,
}: GiftCardDetailsDialogProps) => {
  if (!giftCard) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  // Sort transactions by date, most recent first
  const sortedTransactions = [...giftCard.gift_card_transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Get the most recent balance
  const currentBalance = sortedTransactions.length > 0 
    ? sortedTransactions[0].balance_after 
    : giftCard.current_balance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gift Card Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-1">Card Number</h4>
              <p className="font-mono">{giftCard.card_number}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Current Balance</h4>
              <p className="text-lg font-semibold">${currentBalance.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Initial Balance</h4>
              <p>${giftCard.initial_balance.toFixed(2)}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Created</h4>
              <p>{formatDate(giftCard.created_at)}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Transaction History</h4>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell className="text-right">
                        ${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${transaction.balance_after.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
