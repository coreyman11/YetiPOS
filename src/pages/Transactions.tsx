
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/types/supabase";
import { transactionsApi } from "@/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffline } from "@/contexts/offline-context";
import { useRealtime } from "@/contexts/realtime-context";
import { TransactionContent } from "@/components/transactions/TransactionContent";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

const Transactions = () => {
  const { hasPendingTransactions, syncPendingTransactions } = useOffline();
  const { networkStatus } = useRealtime();
  const queryClient = useQueryClient();
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 60 * 1000, // Changed from 15 seconds to 60 seconds
    networkMode: networkStatus.online ? 'online' : 'always',
  });

  // Set up real-time listener for transactions table
  useEffect(() => {
    if (!networkStatus.online) return;

    console.log("Setting up real-time subscription for transactions");
    
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions' 
        },
        (payload) => {
          console.log("Real-time transaction update received:", payload);
          // Invalidate and refetch transactions when changes occur
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status: ${status}`);
      });

    // Cleanup subscription when component unmounts
    return () => {
      console.log("Cleaning up real-time subscription for transactions");
      supabase.removeChannel(channel);
    };
  }, [networkStatus.online, queryClient]);

  const handleRefundComplete = () => {
    // Invalidate the transactions query to refresh the data
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <TransactionContent
      transactions={transactions}
      hasPendingTransactions={hasPendingTransactions}
      isOnline={networkStatus.online}
      onSyncTransactions={syncPendingTransactions}
      onRefundComplete={handleRefundComplete}
    />
  );
};

export default Transactions;
