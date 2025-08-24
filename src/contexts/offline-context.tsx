
import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "./realtime-context";
import { transactionsApi } from "@/services";
import { toast } from "sonner";
import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the transaction type
interface OfflineTransaction {
  id: number;
  transaction: any;
  items: any[];
  createdAt: Date;
  synced: boolean;
}

// Define cached query type
interface CachedQuery {
  data: any;
  timestamp: number;
  expiry: number;
}

// Define loyalty transaction cache type
interface LoyaltyTransactionsCache {
  customerId: number;
  transactions: any[];
  timestamp: number;
  expiry: number;
}

// Define our IndexedDB schema
interface POSDatabase extends DBSchema {
  offlineTransactions: {
    key: number;
    value: OfflineTransaction;
    indexes: { 'by-synced': number };  // Changed from boolean to number to match IDB expectations
  };
  cachedQueries: {
    key: string;
    value: CachedQuery;
  };
  loyaltyTransactions: {
    key: number; // customerId
    value: LoyaltyTransactionsCache;
  };
}

// Default cache expiry times (in milliseconds)
const CACHE_EXPIRY_SHORT = 1000 * 60 * 5; // 5 minutes
const CACHE_EXPIRY_LONG = 1000 * 60 * 60; // 1 hour

// Our context type
interface OfflineContextType {
  saveOfflineTransaction: (transaction: any, items: any[]) => Promise<void>;
  hasPendingTransactions: boolean;
  syncPendingTransactions: () => Promise<void>;
  db: IDBPDatabase<POSDatabase> | null;
  cacheLoyaltyTransactions: (customerId: number, data: any[]) => Promise<void>;
  getCachedLoyaltyTransactions: (customerId: number) => Promise<any[] | null>;
}

// Create context
const OfflineContext = createContext<OfflineContextType | null>(null);

// Provider component
export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { networkStatus } = useRealtime();
  const [db, setDb] = useState<IDBPDatabase<POSDatabase> | null>(null);
  const [hasPendingTransactions, setHasPendingTransactions] = useState(false);

  // Initialize the IndexedDB database
  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB<POSDatabase>('pos-offline-db', 1, {
          upgrade(db) {
            // Create stores if they don't exist
            if (!db.objectStoreNames.contains('offlineTransactions')) {
              const txStore = db.createObjectStore('offlineTransactions', { 
                keyPath: 'id', 
                autoIncrement: true 
              });
              txStore.createIndex('by-synced', 'synced');
            }
            
            if (!db.objectStoreNames.contains('cachedQueries')) {
              db.createObjectStore('cachedQueries', { keyPath: 'key' });
            }
            
            if (!db.objectStoreNames.contains('loyaltyTransactions')) {
              db.createObjectStore('loyaltyTransactions', { keyPath: 'customerId' });
            }
          },
        });
        
        setDb(database);
        
        // Check for pending transactions using cursor
        const tx = database.transaction('offlineTransactions', 'readonly');
        const index = tx.store.index('by-synced');
        const cursor = await index.openCursor(0); // Using 0 instead of false for indexing
        
        setHasPendingTransactions(cursor !== null);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
        toast.error('Failed to initialize offline storage');
      }
    };

    initDB();

    return () => {
      // Close the database connection when unmounting
      if (db) {
        db.close();
      }
    };
  }, []);

  // Auto-sync transactions when back online
  useEffect(() => {
    if (networkStatus.online && hasPendingTransactions && db) {
      syncPendingTransactions();
    }
  }, [networkStatus.online, hasPendingTransactions, db]);

  // Save an offline transaction to IndexedDB
  const saveOfflineTransaction = async (transaction: any, items: any[]) => {
    if (!db) {
      toast.error('Offline storage is not available');
      return;
    }

    try {
      await db.add('offlineTransactions', {
        id: Date.now(), // Use timestamp as temporary ID
        transaction,
        items,
        createdAt: new Date(),
        synced: false
      });
      
      toast.success("Transaction saved offline and will sync when you're online");
      setHasPendingTransactions(true);
    } catch (error) {
      console.error('Failed to save offline transaction:', error);
      toast.error('Failed to save transaction offline');
    }
  };

  // Cache loyalty transactions for a customer
  const cacheLoyaltyTransactions = async (customerId: number, data: any[]) => {
    if (!db) return null;
    
    try {
      await db.put('loyaltyTransactions', {
        customerId,
        transactions: data,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_EXPIRY_LONG // Cache for 1 hour
      });
      
      console.log(`Cached loyalty transactions for customer #${customerId}`);
    } catch (error) {
      console.error('Failed to cache loyalty transactions:', error);
    }
  };

  // Get cached loyalty transactions for a customer
  const getCachedLoyaltyTransactions = async (customerId: number): Promise<any[] | null> => {
    if (!db) return null;
    
    try {
      const cache = await db.get('loyaltyTransactions', customerId);
      
      if (!cache) {
        return null;
      }
      
      // Check if cache has expired
      if (cache.timestamp + cache.expiry < Date.now()) {
        console.log(`Loyalty transactions cache for customer #${customerId} has expired`);
        return null;
      }
      
      console.log(`Retrieved cached loyalty transactions for customer #${customerId}`);
      return cache.transactions;
    } catch (error) {
      console.error('Failed to get cached loyalty transactions:', error);
      return null;
    }
  };

  // Sync all pending transactions with the server
  const syncPendingTransactions = async () => {
    if (!db || !networkStatus.online) return;

    try {
      // Get all pending transactions using cursor
      const tx = db.transaction('offlineTransactions', 'readonly');
      const index = tx.store.index('by-synced');
      const cursor = await index.openCursor(0); // Using 0 instead of false for indexing
      
      const pendingTx: OfflineTransaction[] = [];
      let currentCursor = cursor;
      
      while (currentCursor) {
        pendingTx.push(currentCursor.value);
        currentCursor = await currentCursor.continue();
      }
      
      if (pendingTx.length === 0) {
        setHasPendingTransactions(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const record of pendingTx) {
        try {
          // Try to create the transaction on the server
          await transactionsApi.create(record.transaction, record.items);
          
          // Mark as synced
          await db.put('offlineTransactions', { ...record, synced: true });
          successCount++;
        } catch (error) {
          console.error('Failed to sync transaction:', error);
          failCount++;
        }
      }

      // Update cache if we synced any transactions
      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        // Also invalidate loyalty transactions cache
        queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
        toast.success(`Synced ${successCount} offline transactions`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to sync ${failCount} transactions`);
      }

      // Check if we still have pending transactions
      const checkTx = db.transaction('offlineTransactions', 'readonly');
      const checkIndex = checkTx.store.index('by-synced');
      const checkCursor = await checkIndex.openCursor(0); // Using 0 instead of false for indexing
      
      setHasPendingTransactions(checkCursor !== null);
    } catch (error) {
      console.error('Transaction sync failed:', error);
      toast.error('Failed to sync offline transactions');
    }
  };

  const value = {
    saveOfflineTransaction,
    hasPendingTransactions,
    syncPendingTransactions,
    db,
    cacheLoyaltyTransactions,
    getCachedLoyaltyTransactions
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

// Hook for easy context use
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
