
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database } from "@/types/supabase";

type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

interface LoyaltyPointsHistoryProps {
  loyaltyTransactions: LoyaltyTransaction[];
}

export const LoyaltyPointsHistory = ({
  loyaltyTransactions,
}: LoyaltyPointsHistoryProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Loyalty Points History</h3>
      <div className="space-y-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loyaltyTransactions.map((transaction) => {
              const isEarned = transaction.points_earned !== null;
              const points = isEarned ? transaction.points_earned : transaction.points_redeemed;
              
              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell 
                    className={
                      isEarned ? "text-green-600 font-medium" : "text-red-600 font-medium"
                    }
                  >
                    {isEarned ? '+' : '-'}{points}
                  </TableCell>
                  <TableCell>{transaction.points_balance}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
