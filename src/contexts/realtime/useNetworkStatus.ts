
import { useState, useEffect } from "react";
import { NetworkStatus } from "@/types/realtime";
import { toast } from "sonner";
import { QueryClient } from "@tanstack/react-query";

export const useNetworkStatus = (queryClient: QueryClient) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    lastOnline: null,
    lastChanged: new Date()
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({ 
        online: true, 
        lastOnline: new Date(),
        lastChanged: new Date() 
      });
      toast.success("You're back online!");
      // Refresh all queries when we're back online
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setNetworkStatus({ 
        online: false, 
        lastOnline: networkStatus.lastOnline,
        lastChanged: new Date() 
      });
      toast.error("You're offline. Some features may be limited.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, networkStatus.lastOnline]);

  return networkStatus;
};
