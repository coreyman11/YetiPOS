
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

interface TransactionHeaderProps {
  hasPendingTransactions: boolean;
  isOnline: boolean;
  onSyncClick: () => void;
}

export const TransactionHeader = ({
  hasPendingTransactions,
  isOnline,
  onSyncClick
}: TransactionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      {(hasPendingTransactions && isOnline) && (
        <Button onClick={onSyncClick}>
          Sync Offline Transactions
        </Button>
      )}
    </div>
  );
};
