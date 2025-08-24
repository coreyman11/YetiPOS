
import { useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { NetworkStatus } from "@/types/realtime";
import { invalidateRevenueCache } from "@/services/transactions/revenue";

export const useReportRefresh = (
  networkStatus: NetworkStatus,
  queryClient: QueryClient
) => {
  // Set up regular refresh for reports data
  useEffect(() => {
    const reportRefreshInterval = setInterval(() => {
      if (networkStatus.online) {
        console.log('🔄 Regular refresh: Updating reports data');
        
        // Invalidate revenue cache
        invalidateRevenueCache();
        
        // Core reports - reduce frequency of invalidations
        queryClient.invalidateQueries({ queryKey: ['comprehensive-report'] });
        
        // Only refresh these every minute
        queryClient.invalidateQueries({ queryKey: ['daily-revenue'] });
        queryClient.invalidateQueries({ queryKey: ['daily-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
        
        // These are only invalidated on explicit user actions or realtime events
        // rather than constant polling
      }
    }, 120 * 1000); // 2 minutes - doubled from previous interval

    return () => {
      clearInterval(reportRefreshInterval);
    };
  }, [queryClient, networkStatus.online]);
};
