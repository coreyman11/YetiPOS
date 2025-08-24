
import { WifiOff } from "lucide-react";

export const TransactionOfflineIndicator = () => {
  return (
    <div className="flex items-center text-yellow-600 ml-4">
      <WifiOff className="h-4 w-4 mr-2" />
      <span>You're offline. Only cached transactions are shown.</span>
    </div>
  );
};
