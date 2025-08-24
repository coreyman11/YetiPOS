
import { useEffect, useState, useCallback, useRef } from 'react';
import { inventoryApi } from '@/services/inventory-api';
import { Database } from '@/types/supabase';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface UseBarcodeScannerProps {
  onScan?: (item: InventoryItem | null) => void;
  enabled?: boolean;
  resetAfterScan?: boolean;
  ref?: React.MutableRefObject<any>;
}

export const useBarcodeScanner = ({ 
  onScan, 
  enabled = true, 
  resetAfterScan = true,
  ref
}: UseBarcodeScannerProps = {}) => {
  const [barcode, setBarcode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  
  // Use refs to avoid stale closures in event listeners
  const barcodeRef = useRef<string>('');
  const isScanningRef = useRef<boolean>(false);
  const timeoutRef = useRef<number | null>(null);
  const lastBarcodeRef = useRef<string>('');
  const processingRef = useRef<boolean>(false);

  // Configuration settings
  const scannerConfig = {
    enterKey: 'Enter',       // Most barcode scanners send Enter after scanning
    timeout: 100,            // Reduced timeout for faster response
    minLength: 4,            // Minimum valid barcode length
    maxLength: 30,           // Maximum valid barcode length
    debounceDelay: 500       // Debounce delay to prevent duplicate scans
  };

  const findItemByBarcode = useCallback(async (barcode: string) => {
    if (processingRef.current) return null;
    
    try {
      processingRef.current = true;
      console.log("Finding inventory by barcode:", barcode);
      const { data, error } = await inventoryApi.findByBarcode(barcode);
      
      if (error) {
        console.error("Error in findByBarcode:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error finding item by barcode:', error);
      return null;
    } finally {
      processingRef.current = false;
    }
  }, []);

  const processCompletedBarcode = useCallback(async (barcode: string) => {
    if (!barcode || barcode.length < scannerConfig.minLength) {
      console.log("Ignoring invalid barcode:", barcode);
      return;
    }
    
    // Prevent duplicate processing of the same barcode within debounce window
    if (barcode === lastBarcodeRef.current) {
      const now = Date.now();
      const elapsed = now - (timeoutRef.current || 0);
      if (elapsed < scannerConfig.debounceDelay) {
        console.log("Debouncing duplicate barcode scan:", barcode);
        return;
      }
    }
    
    console.log("Processing complete barcode:", barcode);
    lastBarcodeRef.current = barcode;
    timeoutRef.current = Date.now();
    
    // Find item with this barcode
    const item = await findItemByBarcode(barcode);
    setLastScannedItem(item);
    
    // Call the onScan handler if provided
    if (onScan && item) {
      onScan(item);
    } else if (onScan && !item) {
      console.log("No item found for barcode:", barcode);
      onScan(null);
    }
    
    // Reset the barcode buffer if needed
    if (resetAfterScan) {
      setBarcode('');
      barcodeRef.current = '';
    }
  }, [findItemByBarcode, onScan, resetAfterScan, scannerConfig.minLength, scannerConfig.debounceDelay]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Clear existing timeout on each keystroke
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    // If not scanning yet, start a new scan session
    if (!isScanningRef.current) {
      console.log("Starting new barcode scan");
      isScanningRef.current = true;
      setIsScanning(true);
      barcodeRef.current = '';
    }
    
    // Handle Enter key (end of barcode)
    if (e.key === scannerConfig.enterKey) {
      e.preventDefault();
      console.log("Barcode scan complete:", barcodeRef.current);
      
      // Process the completed barcode
      processCompletedBarcode(barcodeRef.current);
      
      // Reset scanning state
      isScanningRef.current = false;
      setIsScanning(false);
      return;
    }
    
    // Only add standard characters to barcode buffer
    if (e.key.length === 1) {
      barcodeRef.current += e.key;
      setBarcode(barcodeRef.current);
    }
    
    // Set timeout to reset scanning state if no input is received within the timeout period
    timeoutRef.current = window.setTimeout(() => {
      if (isScanningRef.current && barcodeRef.current) {
        console.log("Scan timeout - resetting barcode buffer");
        barcodeRef.current = '';
        isScanningRef.current = false;
        setBarcode('');
        setIsScanning(false);
      }
    }, scannerConfig.timeout);
  }, [enabled, processCompletedBarcode, scannerConfig.enterKey, scannerConfig.timeout]);

  // Force a reset of the scanner state
  const resetScanner = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    barcodeRef.current = '';
    isScanningRef.current = false;
    lastBarcodeRef.current = '';
    setBarcode('');
    setIsScanning(false);
    setLastScannedItem(null);
    console.log("Barcode scanner reset");
  }, []);

  // Expose the scanner methods via ref if provided
  useEffect(() => {
    if (ref) {
      ref.current = {
        resetScanner,
        clearBarcode: () => {
          barcodeRef.current = '';
          setBarcode('');
        },
        getBarcode: () => barcode,
        isScanning: isScanning
      };
    }
  }, [ref, resetScanner, barcode, isScanning]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleKeyDown]);

  return {
    barcode,
    isScanning,
    lastScannedItem,
    resetScanner,
    clearBarcode: () => {
      barcodeRef.current = '';
      setBarcode('');
    }
  };
};
