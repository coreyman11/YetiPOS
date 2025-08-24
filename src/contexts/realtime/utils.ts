
import { RealtimeTable } from "@/types/realtime";
import { QueryClient } from "@tanstack/react-query";
import { TABLE_TO_QUERY_KEYS } from "./types";
import { invalidateRevenueCache } from "@/services/transactions/revenue";

// Map table names to their React Query cache keys
export const getQueryKeyForTable = (table: RealtimeTable): string => {
  switch (table) {
    case 'inventory': return 'inventory';
    case 'transactions': return 'transactions';
    case 'customers': return 'customers';
    case 'services': return 'services';
    case 'gift_cards': return 'gift-cards';
    case 'loyalty_program_settings': return 'loyalty-programs';
    default: return table;
  }
};

// Track the last time each query key was invalidated to prevent excessive refreshes
const lastInvalidationTimes: Record<string, number> = {};
const DEBOUNCE_INTERVAL = 2000; // 2 seconds

// Handle realtime database changes with improved error handling
export const handleRealtimeChange = <T extends any>(
  record: T,
  table: RealtimeTable,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  queryClient: QueryClient
) => {
  try {
    console.log(`📡 Realtime ${event} in ${table}:`, record);

    if (!record && event !== 'DELETE') {
      console.warn(`Received ${event} event for ${table} with empty record data`);
      return;
    }

    // Get the associated React Query keys for this table
    const queryKeys = TABLE_TO_QUERY_KEYS[table] || [];
    const now = Date.now();
    
    // For transaction changes, invalidate the revenue cache
    if (table === 'transactions') {
      invalidateRevenueCache();
    }
    
    // Invalidate all relevant queries for this table change
    queryKeys.forEach(key => {
      // Check if we've recently invalidated this key to prevent repeated refreshes
      const lastInvalidation = lastInvalidationTimes[key] || 0;
      
      if (now - lastInvalidation > DEBOUNCE_INTERVAL) {
        console.log(`🔄 Invalidating query key: ${key}`);
        queryClient.invalidateQueries({ queryKey: [key] });
        lastInvalidationTimes[key] = now;
      } else {
        console.log(`⏱️ Skipping invalidation for ${key}: recently refreshed`);
      }
    });
    
    if (event === 'INSERT' || event === 'UPDATE') {
      // Update the React Query cache directly for specific cases
      const queryKey = getQueryKeyForTable(table);
      queryClient.setQueryData([queryKey], (oldData: T[] | undefined) => {
        if (!oldData) return [record];
        
        // For inserts, add to the list if it's not there
        if (event === 'INSERT') {
          // Check if the record already exists to prevent duplicates
          const exists = oldData.some(item => 
            // @ts-ignore - We know id exists on these records
            item.id === record.id
          );
          return exists ? oldData : [...oldData, record];
        }
        
        // For updates, replace the existing item
        return oldData.map(item => 
          // @ts-ignore - We know id exists on these records
          item.id === record.id ? record : item
        );
      });

      // Immediate UI updates for Dashboard when there's a new transaction
      if (table === 'transactions' && event === 'INSERT') {
        try {
          // Only force refresh these specific queries
          queryClient.refetchQueries({ queryKey: ['daily-revenue'] });
          queryClient.refetchQueries({ queryKey: ['daily-transactions'] });
        } catch (err) {
          console.error('Error refreshing transaction-related queries:', err);
        }
      }
    } else if (event === 'DELETE') {
      // For deletes, remove the item from cache
      const queryKey = getQueryKeyForTable(table);
      queryClient.setQueryData([queryKey], (oldData: T[] | undefined) => {
        if (!oldData) return [];
        // @ts-ignore - We know id exists on these records
        return oldData.filter(item => item.id !== record.id);
      });
    }
  } catch (error) {
    console.error('Error handling realtime change:', error);
  }
};
