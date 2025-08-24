
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { QueryClient } from "@tanstack/react-query";
import { NetworkStatus, RealtimeTable } from "@/types/realtime";
import { handleRealtimeChange } from "./utils";
import { REALTIME_TABLES } from "./types";
import { toast } from "sonner";

export const useRealtimeSubscription = (
  networkStatus: NetworkStatus,
  queryClient: QueryClient
) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 2000; // Start with 2 seconds
  const hasSetupRef = useRef(false); // Track if we've already set up the channel

  // Filter sensitive information from payload before logging
  const filterSensitiveInfo = (payload: any) => {
    if (!payload) return payload;
    
    const cleanPayload = { ...payload };
    
    // Filter access_token if present
    if (cleanPayload.payload && cleanPayload.payload.access_token) {
      cleanPayload.payload.access_token = '[REDACTED]';
    }
    
    return cleanPayload;
  };

  // Set up realtime subscriptions
  useEffect(() => {
    if (!networkStatus.online || hasSetupRef.current) return;

    const setupChannel = () => {
      // Clean up any existing channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create a channel with a unique ID to avoid duplicate channels
      const channelId = `realtime-updates-${Date.now()}`;
      const channel = supabase.channel(channelId, {
        config: {
          broadcast: { self: false },
          presence: { key: crypto.randomUUID() },
        }
      });

      // Subscribe to all tables we care about
      REALTIME_TABLES.forEach(table => {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            // Filter sensitive info before logging or processing
            const cleanPayload = filterSensitiveInfo(payload);
            handleRealtimeChange(cleanPayload.new as any, table, cleanPayload.eventType as any, queryClient);
          }
        );
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to realtime updates');
          reconnectCountRef.current = 0; // Reset count on successful connection
          hasSetupRef.current = true; // Mark as set up successfully
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error connecting to realtime updates');
          
          // Implement exponential backoff
          if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current);
            console.log(`🔄 Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectCountRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
            
            // Clear any existing timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              reconnectCountRef.current++;
              setupChannel();
            }, delay);
          } else {
            console.error('❌ Maximum reconnection attempts reached');
            toast.error('Real-time updates are currently unavailable. Please refresh the page.');
          }
        }
      });

      channelRef.current = channel;
    };

    setupChannel();

    // Clean up function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [networkStatus.online, queryClient]);
};
