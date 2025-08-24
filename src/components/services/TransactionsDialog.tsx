import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/types/supabase";
import { transactionsApi } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionContent } from "@/components/transactions/TransactionContent";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOffline } from "@/contexts/offline-context";
import { useRealtime } from "@/contexts/realtime-context";

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: Array<{
    services: Database['public']['Tables']['services']['Row'] | null;
    inventory: Database['public']['Tables']['inventory']['Row'] | null;
    quantity: number;
    price: number;
  }>;
};

interface TransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransactionsDialog = ({ open, onOpenChange }: TransactionsDialogProps) => {
  const { hasPendingTransactions, syncPendingTransactions } = useOffline();
  const { networkStatus } = useRealtime();
  const queryClient = useQueryClient();
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
    enabled: open, // Only fetch when dialog is open
  });

  const handleRefundComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl md:max-w-6xl max-w-[95vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl md:max-w-6xl max-w-[95vw] h-[80vh]">
        <DialogHeader>
          <DialogTitle>Transactions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <TransactionContent
            transactions={transactions}
            hasPendingTransactions={hasPendingTransactions}
            isOnline={networkStatus.online}
            onSyncTransactions={syncPendingTransactions}
            onRefundComplete={handleRefundComplete}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};