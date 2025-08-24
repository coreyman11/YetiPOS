
import React, { createContext, useContext } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeContextType } from "./types";
import { useNetworkStatus } from "./useNetworkStatus";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import { useReportRefresh } from "./useReportRefresh";

// Create context
const RealtimeContext = createContext<RealtimeContextType | null>(null);

// Provider component
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  // Set up network status monitoring
  const networkStatus = useNetworkStatus(queryClient);
  
  // Set up realtime database subscriptions
  useRealtimeSubscription(networkStatus, queryClient);
  
  // Set up regular report refresh
  useReportRefresh(networkStatus, queryClient);

  const value = {
    networkStatus
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Hook for easy context use
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
