
import { useState, useEffect } from "react";
import { TransactionHeader } from "./TransactionHeader";
import { TransactionSearch } from "./TransactionSearch";
import { TransactionList } from "./TransactionList";
import { TransactionDetail } from "./TransactionDetail";
import { TransactionOfflineIndicator } from "./TransactionOfflineIndicator";
import { useTransactionSearch } from "@/hooks/useTransactionSearch";
import { usePagination } from "@/hooks/usePagination";
import { Database } from "@/types/supabase";
import { useRealtime } from "@/contexts/realtime-context";
import { invalidateRevenueCache } from "@/services/transactions/revenue";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

interface TransactionContentProps {
  transactions: Transaction[];
  hasPendingTransactions: boolean;
  isOnline: boolean;
  onSyncTransactions: () => void;
  onRefundComplete: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const TransactionContent = ({
  transactions,
  hasPendingTransactions,
  isOnline,
  onSyncTransactions,
  onRefundComplete
}: TransactionContentProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { networkStatus } = useRealtime();
  
  const { searchQuery, setSearchQuery, searchedData } = useTransactionSearch(transactions);
  
  // Use either searched data or all transactions
  const displayedTransactions = searchQuery ? searchedData : transactions;
  
  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage
  } = usePagination({
    totalItems: displayedTransactions.length,
    initialPageSize: 25
  });
  
  // Get current page of transactions
  const paginatedTransactions = displayedTransactions.slice(startIndex, endIndex);
  
  // When a transaction is completed or refunded, invalidate revenue cache
  useEffect(() => {
    if (onRefundComplete) {
      invalidateRevenueCache();
    }
  }, [onRefundComplete]);
  
  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const handleDetailsClose = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      // When closing the details, trigger a refresh to ensure we have the latest data
      onRefundComplete();
    }
  };
  
  return (
    <div className="space-y-8 animate-fadeIn">
      <TransactionHeader
        hasPendingTransactions={hasPendingTransactions}
        isOnline={isOnline}
        onSyncClick={onSyncTransactions}
      />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <TransactionSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
          
          {!isOnline && <TransactionOfflineIndicator />}
        </div>
        
        <TransactionList
          transactions={paginatedTransactions}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={Math.min(endIndex, displayedTransactions.length)}
          totalItems={displayedTransactions.length}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onSelectTransaction={handleTransactionSelect}
        />
      </div>
      
      <TransactionDetail
        transaction={selectedTransaction}
        open={detailsOpen}
        onOpenChange={handleDetailsClose}
      />
    </div>
  );
};
