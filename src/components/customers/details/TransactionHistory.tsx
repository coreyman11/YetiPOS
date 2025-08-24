
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
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";

type TransactionItem = {
  service_id: number | null;
  services: {
    id?: number;
    name: string;
    price?: number;
    created_at?: string;
  } | null;
  inventory_id: number | null;
  inventory: {
    id?: number;
    name: string;
    description?: string;
    quantity?: number;
  } | null;
  quantity: number;
  price: number;
};

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: TransactionItem[];
};

type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

interface TransactionHistoryProps {
  transactions: Transaction[];
  customerId?: number;
  loyaltyTransactions?: LoyaltyTransaction[];
}

export const TransactionHistory = ({
  transactions,
  customerId,
  loyaltyTransactions = []
}: TransactionHistoryProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filter transactions by customer if customerId is provided
  const filteredTransactions = customerId
    ? transactions.filter((t) => t.customer_id === customerId)
    : transactions;

  // Create a map of loyalty transactions by transaction_id for quick lookup
  const loyaltyByTransactionId = loyaltyTransactions.reduce((acc, loyalty) => {
    if (loyalty.transaction_id) {
      acc[loyalty.transaction_id] = loyalty;
    }
    return acc;
  }, {} as Record<number, LoyaltyTransaction>);

  if (!filteredTransactions.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No transaction history available.
      </div>
    );
  }

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailOpen(true);
  };

  const getLoyaltyPointsDisplay = (transactionId: number) => {
    const loyaltyTransaction = loyaltyByTransactionId[transactionId];
    
    if (!loyaltyTransaction) {
      return <span className="text-muted-foreground">-</span>;
    }

    if (loyaltyTransaction.points_earned && loyaltyTransaction.points_earned > 0) {
      return (
        <span className="text-green-600 font-medium">
          +{loyaltyTransaction.points_earned}
        </span>
      );
    }

    if (loyaltyTransaction.points_redeemed && loyaltyTransaction.points_redeemed > 0) {
      return (
        <span className="text-red-600 font-medium">
          -{loyaltyTransaction.points_redeemed}
        </span>
      );
    }

    return <span className="text-muted-foreground">-</span>;
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Transaction #</TableHead>
            <TableHead>Original Amount</TableHead>
            {!customerId && <TableHead>Customer</TableHead>}
            <TableHead>Refunded</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Loyalty Points</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.map((transaction) => {
            const refundedAmount = Number(transaction.refunded_amount || 0);
            const originalAmount = Number(transaction.total_amount) + refundedAmount;
            const hasRefund = refundedAmount > 0;
            
            return (
              <TableRow 
                key={transaction.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(transaction)}
              >
                <TableCell>
                  {format(new Date(transaction.created_at), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>${originalAmount.toFixed(2)}</TableCell>
                {!customerId && (
                  <TableCell>
                    {transaction.customers?.name || "Walk-in Customer"}
                  </TableCell>
                )}
                <TableCell>
                  {hasRefund ? (
                    <span className="text-red-600">
                      -${refundedAmount.toFixed(2)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>${Number(transaction.total_amount).toFixed(2)}</TableCell>
                <TableCell>
                  {getLoyaltyPointsDisplay(transaction.id)}
                </TableCell>
                <TableCell className="capitalize">
                  {transaction.payment_method}
                </TableCell>
                <TableCell>
                  {hasRefund ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                      Partially Refunded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                      {transaction.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction as any}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </div>
  );
};
