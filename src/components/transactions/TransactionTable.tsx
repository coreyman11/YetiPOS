
import { format, toZonedTime } from "date-fns-tz";
import { Database } from "@/types/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
}

export const TransactionTable = ({
  transactions,
  onRowClick
}: TransactionTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const hasRefund = (transaction.refunded_amount || 0) > 0;
          const isFullyRefunded = (transaction.refunded_amount || 0) >= transaction.total_amount;
          const finalAmount = transaction.total_amount - (transaction.refunded_amount || 0);
          const usedLoyaltyPoints = transaction.use_loyalty_points === true;
          
          // Determine payment method display
          let paymentDisplay = transaction.payment_method;
          if (usedLoyaltyPoints) {
            if (finalAmount === 0) {
              paymentDisplay = "Loyalty Points";
            } else {
              paymentDisplay = `${transaction.payment_method} + Points`;
            }
          }
          
          return (
            <TableRow 
              key={transaction.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(transaction)}
            >
              <TableCell className="font-mono text-sm">
                #{transaction.id}
              </TableCell>
              <TableCell>
                {format(
                  toZonedTime(new Date(transaction.created_at), 'America/New_York'),
                  "PPP p",
                  { timeZone: 'America/New_York' }
                )}
              </TableCell>
              <TableCell>{transaction.customers?.name || 'Walk-in Customer'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {transaction.source || 'In-Store'}
                </Badge>
              </TableCell>
              <TableCell>
                {transaction.transaction_items.map((item) => (
                  <div key={item.services?.id || item.inventory?.id}>
                    {item.services?.name || item.inventory?.name}
                  </div>
                ))}
              </TableCell>
              <TableCell className="text-right">
                {hasRefund ? (
                  <div>
                    <span className="line-through text-muted-foreground mr-2">
                      ${Number(transaction.total_amount).toFixed(2)}
                    </span>
                    <span>${finalAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <span>${Number(transaction.total_amount).toFixed(2)}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {isFullyRefunded && !usedLoyaltyPoints ? (
                  <Badge variant="destructive">Refunded</Badge>
                ) : hasRefund ? (
                  <Badge variant="outline">Partial Refund</Badge>
                ) : finalAmount === 0 && usedLoyaltyPoints ? (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Loyalty Points</Badge>
                ) : (
                  <Badge variant="outline">Completed</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
