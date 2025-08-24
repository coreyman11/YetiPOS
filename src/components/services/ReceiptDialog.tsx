
import React, { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Printer } from "lucide-react";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { useReactToPrint } from 'react-to-print';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { printerApi } from "@/services/printer-api";
import { receiptSettingsApi } from "@/services/receipt-settings-api";
import { useAuth } from "@/contexts/auth-context";

interface ReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  transactionId: number;
  additionalContent?: React.ReactNode;
}

export const ReceiptDialog = ({
  isOpen,
  onOpenChange,
  onClose,
  transactionId,
  additionalContent
}: ReceiptDialogProps) => {
  const componentRef = useRef(null);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const { selectedStore } = useAuth();
  
  // Fix the useReactToPrint hook to use the correct options format
  const handlePrint = useReactToPrint({
    documentTitle: `Receipt-${transactionId}`,
    onAfterPrint: () => console.log('Print completed'),
    // Use the contentRef property instead of content
    contentRef: componentRef,
  });

  // First, check if a receipt exists for this transaction
  const { data: receipt, isLoading: receiptLoading, error: receiptError } = useQuery({
    queryKey: ['receipt', transactionId],
    queryFn: async () => {
      console.log("Fetching receipt for transaction", transactionId);
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching receipt:", error);
        throw error;
      }
      console.log("Receipt data:", data);
      return data;
    },
    enabled: !!transactionId && isOpen,
  });

  // Get receipt settings for current location/store
  const { data: receiptSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['receipt-settings', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return null;
      return await receiptSettingsApi.getSettings(selectedStore.id);
    },
    enabled: !!selectedStore?.id && isOpen,
  });

  useEffect(() => {
    if (receiptError) {
      toast.error(`Error loading receipt: ${receiptError.message}`);
    }
  }, [receiptError]);

  // Modified query to avoid the user_profiles join that's causing issues
  const { data: transaction, isLoading: transactionLoading, error: transactionError } = useQuery({
    queryKey: ['transaction-details', transactionId],
    queryFn: async () => {
      console.log("Fetching transaction", transactionId);
      
      // First get the transaction with basic relationships
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          customers (*),
          transaction_items (
            *,
            services (*),
            inventory (*)
          )
        `)
        .eq('id', transactionId)
        .single();
        
      if (transactionError) {
        console.error("Error fetching transaction:", transactionError);
        throw transactionError;
      }
      
      // Separately fetch user data if there's an assigned_user_id
      if (transactionData.assigned_user_id) {
        const { data: userData, error: userError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, employee_code')
          .eq('id', transactionData.assigned_user_id)
          .single();
          
        if (!userError && userData) {
          // Attach user data to transaction
          transactionData.user_data = userData;
        }
      }
      
      console.log("Transaction data:", transactionData);
      return transactionData;
    },
    enabled: !!transactionId && isOpen,
  });

  useEffect(() => {
    if (transactionError) {
      toast.error(`Error loading transaction: ${transactionError.message}`);
    }
  }, [transactionError]);

  // Get configured printers - fixed by removing onError
  const { data: printers, isLoading: printersLoading } = useQuery({
    queryKey: ['printers'],
    queryFn: async () => {
      try {
        return await printerApi.getConfigurations();
      } catch (error) {
        console.error("Error loading printers:", error);
        // Don't show toast for this error as it's not critical
        return [];
      }
    },
    enabled: isOpen
  });

  // Get printer server status - fixed by removing onError
  const { data: serverStatus } = useQuery({
    queryKey: ['print-server-status'],
    queryFn: async () => {
      try {
        return await printerApi.getPrintServerStatus();
      } catch (error) {
        console.error("Error checking print server status:", error);
        // Don't show toast for this error as it's not critical
        return { connected: false, availablePrinters: [] };
      }
    },
    enabled: isOpen
  });

  // Set default printer if available
  useEffect(() => {
    if (printers && printers.length > 0 && !selectedPrinter) {
      // Find default printer or use the first one
      const availablePrinters = printers.filter(p => p.status !== 'deleted');
      const defaultPrinter = availablePrinters.find(p => p.is_default) || availablePrinters[0];
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.id.toString());
      }
    }
  }, [printers, selectedPrinter]);

  const isLoading = receiptLoading || transactionLoading || settingsLoading;

  const formatPaymentMethod = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
  };

  // Direct print to selected printer
  const handleDirectPrint = async () => {
    if (!transaction || !selectedPrinter) return;
    
    setIsPrinting(true);
    try {
      // Get the receipt content
      const receiptContent = document.getElementById('receipt-content')?.innerHTML;
      
      if (!receiptContent) {
        throw new Error("Failed to get receipt content");
      }
      
      // Send to printer
      await printerApi.printReceipt(parseInt(selectedPrinter), receiptContent);
      toast.success("Receipt sent to printer");
    } catch (error) {
      console.error("Print error:", error);
      toast.error(`Failed to print: ${error.message}`);
      
      // Fallback to browser print if direct printing fails
      handlePrint();
    } finally {
      setIsPrinting(false);
    }
  };

  // Generate receipt HTML using the custom template from settings
  const getReceiptContent = () => {
    if (!transaction) return '';
    
    // If receipt settings exist, use the template
    if (receiptSettings) {
      const transactionData = {
        id: transaction.id,
        date: format(new Date(transaction.created_at), 'MMM dd, yyyy h:mm a'),
        total: `$${transaction.total_amount.toFixed(2)}`,
        subtotal: `$${transaction.subtotal.toFixed(2)}`,
        tax: `$${transaction.tax_amount.toFixed(2)}`,
        discount: transaction.discount_total ? `$${transaction.discount_total.toFixed(2)}` : "$0.00",
        items: transaction.transaction_items.map(item => ({
          name: item.services?.name || item.inventory?.name || "Unknown Item",
          quantity: item.quantity,
          price: `$${item.price.toFixed(2)}`
        })),
        customer: transaction.customers ? {
          name: transaction.customers.name,
          email: transaction.customers.email,
          phone: transaction.customers.phone
        } : null,
        staff: transaction.user_data ? {
          name: transaction.user_data.full_name || transaction.user_data.email || 'Staff',
          code: transaction.user_data.employee_code
        } : null,
        payment_method: formatPaymentMethod(transaction.payment_method)
      };
      
      // Generate custom receipt using the settings
      return receiptSettingsApi.generatePreview(receiptSettings, transactionData);
    }
    
    // Fallback to basic receipt if no settings
    return `
      <div class="space-y-6">
        <div class="space-y-1">
          ${transaction.user_data ? `
            <div class="text-sm">
              <span class="font-semibold">Staff: </span>
              ${transaction.user_data.full_name || transaction.user_data.email || 'Unnamed Staff'}
              ${transaction.user_data.employee_code ? ` (${transaction.user_data.employee_code})` : ''}
            </div>
          ` : ''}
          
          <div class="text-sm">
            <span class="font-semibold">Customer:</span> ${transaction.customers?.name || "Guest"}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Date:</span> ${format(new Date(transaction.created_at), 'MMM dd, yyyy h:mm a')}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Payment Method:</span> ${formatPaymentMethod(transaction.payment_method)}
          </div>
          <div class="text-sm">
            <span class="font-semibold">Total:</span> $${transaction.total_amount.toFixed(2)}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold">Items:</h3>
          <ul class="mt-2 space-y-1">
            ${transaction.transaction_items?.map(item => `
              <li class="text-sm">
                ${item.services?.name || item.inventory?.name} x ${item.quantity} - $${item.price.toFixed(2)}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt #{transactionId}</DialogTitle>
          <DialogDescription>
            {transaction ? 
              `${new Date(transaction.created_at).toLocaleDateString()} - ${new Date(transaction.created_at).toLocaleTimeString()}` 
              : 'Loading...'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading receipt...</p>
          </div>
        ) : !receipt && !transaction ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">Receipt not found</p>
            <p className="text-xs text-muted-foreground mt-1">Transaction ID: {transactionId}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div 
              id="receipt-content" 
              className="space-y-6 border p-4 rounded-md overflow-auto max-h-96" 
              ref={componentRef}
              dangerouslySetInnerHTML={{ __html: getReceiptContent() }}
            />
            
            {/* Add the additional content here */}
            {additionalContent}
            
            {/* Printer selection and print buttons */}
            <div className="border-t pt-4">
              {/* Show printer selection only if we have configured printers */}
              {printers && printers.filter(p => p.status !== 'deleted').length > 0 && (
                <div className="mb-4 space-y-2">
                  <label className="text-sm font-medium">Select Printer</label>
                  <Select
                    value={selectedPrinter || ''}
                    onValueChange={setSelectedPrinter}
                    disabled={isPrinting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a printer" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers
                        .filter(printer => printer.status !== 'deleted')
                        .map(printer => (
                          <SelectItem key={printer.id} value={printer.id.toString()}>
                            {printer.name} {printer.status === 'connected' ? '(Connected)' : ''}
                            {printer.is_default ? ' (Default)' : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {/* Show direct print button if printer is selected and server is connected */}
          {selectedPrinter && serverStatus?.connected && printers?.some(p => 
            p.id.toString() === selectedPrinter && 
            p.status === 'connected'
          ) ? (
            <Button 
              onClick={handleDirectPrint} 
              disabled={isLoading || !transaction || isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Print
            </Button>
          ) : (
            /* Fallback to browser print */
            <Button 
              onClick={() => handlePrint()} 
              disabled={isLoading || !transaction}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
