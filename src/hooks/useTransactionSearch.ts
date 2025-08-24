
import { useEffect, useRef, useState } from "react";
import { format, toZonedTime } from "date-fns-tz";
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

export const useTransactionSearch = (transactions: Transaction[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedData, setSearchedData] = useState<Transaction[]>([]);
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery) {
      setSearchedData([]);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const searchLower = searchQuery.toLowerCase();
      
      const filtered = transactions.filter((transaction) => {
        // Search by transaction ID
        const transactionId = transaction.id.toString();
        if (transactionId.includes(searchQuery)) return true;
        
        const customerName = transaction.customers?.name?.toLowerCase() || 'walk-in customer';
        if (customerName.includes(searchLower)) return true;
        
        const hasMatchingItems = transaction.transaction_items.some(item => {
          const serviceName = item.services?.name?.toLowerCase() || '';
          const inventoryName = item.inventory?.name?.toLowerCase() || '';
          return serviceName.includes(searchLower) || inventoryName.includes(searchLower);
        });
        if (hasMatchingItems) return true;
        
        const transactionDate = format(
          toZonedTime(new Date(transaction.created_at), 'America/New_York'),
          "PPP p",
          { timeZone: 'America/New_York' }
        ).toLowerCase();
        if (transactionDate.includes(searchLower)) return true;
        
        const amount = transaction.total_amount.toString();
        if (amount.includes(searchQuery)) return true;
        
        return false;
      });

      setSearchedData(filtered);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, transactions]);

  return {
    searchQuery,
    setSearchQuery,
    searchedData,
  };
};
