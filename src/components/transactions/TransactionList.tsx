
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionTable } from "./TransactionTable";
import { TransactionPagination } from "./TransactionPagination";
import { Database } from "@/types/supabase";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

interface TransactionListProps {
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

export const TransactionList = ({
  transactions,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPreviousPage,
  onNextPage,
  onSelectTransaction
}: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No transactions found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No transactions have been made yet or match your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionTable 
          transactions={transactions} 
          onRowClick={onSelectTransaction}
        />
        
        <TransactionPagination
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </CardContent>
    </Card>
  );
};
