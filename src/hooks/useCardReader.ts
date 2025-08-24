import { useState, useCallback, useEffect, useRef } from 'react';
import { CardReader } from '@/types/hardware';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { terminalApi, StripeTerminalReader } from '@/services/terminal-api';

// Interface for reader configuration
interface ReaderConfig {
  id: string;
  location_id: string;
  reader_id: string;
  model: string;
  is_default: boolean;
  last_connection_time?: string;
  created_at?: string;
}

export const useCardReader = (locationId?: string) => {
  const [reader, setReader] = useState<CardReader | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [savedReaders, setSavedReaders] = useState<ReaderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationCode, setRegistrationCode] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [availableReaders, setAvailableReaders] = useState<StripeTerminalReader[]>([]);
  const [isDiscoveringReaders, setIsDiscoveringReaders] = useState(false);
  
  const pollingIntervalRef = useRef<number | null>(null);

  // Load saved reader configurations
  useEffect(() => {
    if (!locationId) return;
    
    const loadSavedReaders = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('card_reader_configurations')
          .select('*')
          .eq('location_id', locationId);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSavedReaders(data);
          
          const defaultReader = data.find(r => r.is_default);
          if (defaultReader) {
            setReader({
              id: defaultReader.reader_id,
              model: defaultReader.model || '',
              connectionStatus: 'disconnected',
              batteryStatus: 0,
              lastConnectionTime: defaultReader.last_connection_time,
              isDefault: defaultReader.is_default
            });
          }
        }
      } catch (error) {
        console.error('Error loading saved readers:', error);
        toast.error('Failed to load saved readers');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedReaders();
  }, [locationId]);

  // Discover available readers
  const discoverReaders = useCallback(async () => {
    if (!locationId) {
      toast.error('No location selected');
      return;
    }

    try {
      setIsDiscoveringReaders(true);
      const readers = await terminalApi.listReaders();
      setAvailableReaders(readers);
      
      if (readers.length === 0) {
        toast.warning('No readers found. Make sure they are powered on and connected to the network.');
      } else {
        toast.success(`Found ${readers.length} reader(s)`);
      }
      
      return readers;
    } catch (error) {
      console.error('Error discovering readers:', error);
      toast.error('Failed to discover readers');
      return [];
    } finally {
      setIsDiscoveringReaders(false);
    }
  }, [locationId]);

  // Connect to a reader
  const connectReader = useCallback(async (readerId?: string) => {
    if (!locationId) {
      toast.error('No location selected');
      return;
    }

    try {
      setIsConnecting(true);
      
      // If no readerId is provided, discover readers first
      let targetReaderId = readerId;
      if (!targetReaderId) {
        const readers = await discoverReaders();
        if (readers && readers.length > 0) {
          targetReaderId = readers[0].id;
        } else {
          throw new Error('No readers available to connect');
        }
      }
      
      // Get the reader details
      const stripeReader = await terminalApi.getReader(targetReaderId);
      const cardReader = terminalApi.convertToCardReader(stripeReader);
      
      // Set the reader in state with connected status
      cardReader.connectionStatus = 'connected';
      setReader(cardReader);
      
      // Save the reader configuration to the database
      const { error } = await supabase.from('card_reader_configurations').upsert({
        location_id: locationId,
        reader_id: cardReader.id,
        model: cardReader.model,
        is_default: true,
        last_connection_time: new Date().toISOString()
      });
      
      if (error) {
        throw error;
      }
      
      // Start polling for reader status updates
      startPolling(cardReader.id);
      
      toast.success('Card reader connected successfully');
      return cardReader;
    } catch (error) {
      console.error('Error connecting reader:', error);
      toast.error('Failed to connect card reader');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [locationId, discoverReaders]);

  // Register a new reader - fixed the number of parameters
  const registerReader = useCallback(async (code: string, label?: string) => {
    if (!locationId) {
      toast.error('No location selected');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Register the reader with Stripe - removed the third parameter (locationId)
      const stripeReader = await terminalApi.registerReader(code, label);
      const cardReader = terminalApi.convertToCardReader(stripeReader);
      
      // Save the reader configuration to the database
      const { error } = await supabase.from('card_reader_configurations').upsert({
        location_id: locationId,
        reader_id: cardReader.id,
        model: cardReader.model,
        is_default: true,
        last_connection_time: new Date().toISOString()
      });
      
      if (error) {
        throw error;
      }
      
      setReader(cardReader);
      setShowRegistration(false);
      setRegistrationCode('');
      
      toast.success('Card reader registered successfully');
      return cardReader;
    } catch (error) {
      console.error('Error registering reader:', error);
      toast.error('Failed to register card reader');
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [locationId]);

  // Disconnect reader
  const disconnectReader = useCallback(async () => {
    try {
      if (!reader) return;
      
      // Disconnect from Stripe Terminal API
      if (reader.id.startsWith('tmr_')) {
        await terminalApi.disconnectReader(reader.id);
      }
      
      // Stop polling
      stopPolling();
      
      // Update the reader status in state
      setReader({
        ...reader,
        connectionStatus: 'disconnected',
        lastConnectionTime: new Date().toISOString(),
      });

      // Update the last connection time in the database
      if (locationId) {
        const { error } = await supabase
          .from('card_reader_configurations')
          .update({
            last_connection_time: new Date().toISOString()
          })
          .eq('reader_id', reader.id)
          .eq('location_id', locationId);

        if (error) {
          console.error('Error updating reader configuration:', error);
        }
      }
      
      toast.success('Card reader disconnected');
    } catch (error) {
      console.error('Error disconnecting reader:', error);
      toast.error('Failed to disconnect card reader');
    }
  }, [reader, locationId]);

  // Test reader
  const testReader = useCallback(async () => {
    if (!reader) {
      toast.error('No reader connected');
      return;
    }

    try {
      setIsTesting(true);
      
      // Test payment with a small amount
      await terminalApi.processPayment(reader.id, 100, 'Test payment');
      
      toast.success('Test payment successful');
    } catch (error) {
      console.error('Error testing reader:', error);
      toast.error('Test payment failed');
    } finally {
      setIsTesting(false);
    }
  }, [reader]);

  // Set default reader
  const setDefaultReader = useCallback(async () => {
    if (!reader || !locationId) return;
    
    try {
      // Update local state
      setReader(prev => prev ? { ...prev, isDefault: true } : null);
      
      // Update database - set current reader as default
      const { error } = await supabase
        .from('card_reader_configurations')
        .update({ is_default: true })
        .eq('reader_id', reader.id)
        .eq('location_id', locationId);
      
      if (error) throw error;
      
      // If there are other readers, set them as non-default
      if (savedReaders.length > 1) {
        await supabase
          .from('card_reader_configurations')
          .update({ is_default: false })
          .eq('location_id', locationId)
          .neq('reader_id', reader.id);
      }
      
      toast.success('Set as default reader');
    } catch (error) {
      console.error('Error setting default reader:', error);
      toast.error('Failed to set default reader');
    }
  }, [reader, locationId, savedReaders]);

  // Start polling for reader status updates
  const startPolling = (readerId: string) => {
    stopPolling(); // Clear any existing interval
    
    // Poll every 30 seconds
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const updatedReader = await terminalApi.pollReaderStatus(readerId);
        if (updatedReader) {
          setReader(prevReader => ({
            ...prevReader!,
            ...updatedReader,
            isDefault: prevReader?.isDefault || false
          }));
        }
      } catch (error) {
        console.error("Error polling reader status:", error);
      }
    }, 30000) as unknown as number;
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    reader,
    isConnecting,
    isTesting,
    isLoading,
    savedReaders,
    connectReader,
    disconnectReader,
    testReader,
    setDefaultReader,
    availableReaders,
    isDiscoveringReaders,
    discoverReaders,
    registrationCode,
    setRegistrationCode,
    showRegistration,
    setShowRegistration,
    registerReader
  };
};
