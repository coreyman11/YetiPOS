import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { servicesApi, inventoryApi, ShiftsApi } from "@/services";
import { useCart } from "@/hooks/useCart";
import { RegisterContent } from "./components/RegisterContent";
import { RegisterPaymentModals } from "./components/RegisterPaymentModals";
import { usePaymentProcessing } from "./hooks/usePaymentProcessing";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Customer, SplitPayment, PaymentMethod } from "./hooks/payment/types";
import { supabase } from "@/lib/supabase";
import { setupSecureLogging } from "@/utils/secure-logging";

interface RegisterPageProps {
  selectedCashier: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: (collapsed: boolean) => void;
  onCloseRegister?: () => void;
}

const RegisterPage = ({ 
  selectedCashier, 
  sidebarCollapsed = false,
  onToggleSidebar,
  onCloseRegister
}: RegisterPageProps) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: activeShift, refetch: refetchActiveShift } = useQuery({
    queryKey: ['active-shift', userProfile?.id],
    queryFn: async () => {
      console.log("Fetching active shift for user:", userProfile?.id);
      try {
        let shift = await ShiftsApi.getActiveShift(userProfile?.id);
        
        if (!shift) {
          console.log("No user-specific shift found, trying any active shift");
          shift = await ShiftsApi.getActiveShift();
          console.log("Found general active shift:", shift?.id);
        }
        
        return shift;
      } catch (error) {
        console.error('Error fetching active shift in RegisterPage:', error);
        return null;
      }
    },
    staleTime: 0,
    refetchInterval: 10000,
    enabled: true
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchActiveShift();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetchActiveShift]);
  
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => await servicesApi.getAll(),
  });

  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await inventoryApi.getAll(),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [lastCompletedTransactionId, setLastCompletedTransactionId] = useState<number | null>(null);
  const [cashReceivedAmount, setCashReceivedAmount] = useState<number | null>(null);
  const { cart, total, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  
  const { 
    isPaymentSheetOpen, setIsPaymentSheetOpen,
    isCardModalOpen, setIsCardModalOpen,
    showReceiptDialog, setShowReceiptDialog,
    selectedCustomer, setSelectedCustomer,
    lastTransactionId,
    paymentMethod, setPaymentMethod,
    isProcessing,
    clientSecret,
    pendingCardTransaction,
    handlePayment,
    handleCardPaymentSuccess,
    handlePaymentMethodSelect,
    taxRate,
    selectedDiscount,
    setSelectedDiscount,
    calculateTotals,
    resetPaymentStates
  } = usePaymentProcessing({ 
    cart, 
    clearCart,
    onCompleteTransaction: (transactionId) => {
      if (barcodeScannerRef.current) {
        barcodeScannerRef.current.resetScanner();
      }
      inventoryApi.clearBarcodeCache();
      
      setIsPaymentSheetOpen(false);
      setLastCompletedTransactionId(transactionId);
      setShowReceiptDialog(true);
      toast.success("Payment completed successfully!");
    },
    activeShift,
    defaultCashierId: selectedCashier
  });

  const barcodeScannerRef = useRef(null);
  
  const handleBarcodeScanned = useCallback(async (item) => {
    try {
      if (!item) {
        toast.error("Item not found for scanned barcode");
        return;
      }
      
      addToCart(item, 'inventory');
      toast.success(`Added: ${item.name}`);
    } catch (error) {
      console.error('Error handling barcode scan:', error);
      toast.error('Failed to process barcode scan');
    }
  }, [addToCart]);

  useEffect(() => {
    const transactionChannel = supabase.channel('transaction-inserts', {
      config: {
        broadcast: { self: false },
      }
    });

    transactionChannel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction inserted:', payload.new.id);
          
          // Invalidate transactions query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          
          if (!showReceiptDialog && payload.new.status === 'completed') {
            setLastCompletedTransactionId(payload.new.id);
            setShowReceiptDialog(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transactionChannel);
    };
  }, [showReceiptDialog, queryClient]);

  useEffect(() => {
    const pendingBarcode = sessionStorage.getItem("pending-barcode");
    if (pendingBarcode) {
      const processPendingBarcode = async () => {
        try {
          const { data: item, error } = await inventoryApi.findByBarcode(pendingBarcode);
          
          if (error || !item) {
            toast.error(`No item found with barcode: ${pendingBarcode}`);
            return;
          }
          
          addToCart(item, 'inventory');
          toast.success(`Added: ${item.name}`);
        } catch (error) {
          console.error('Error processing pending barcode:', error);
        } finally {
          sessionStorage.removeItem("pending-barcode");
        }
      };
      
      processPendingBarcode();
    }
  }, [addToCart]);

  const { resetScanner } = useBarcodeScanner({
    onScan: handleBarcodeScanned,
    enabled: true,
    resetAfterScan: true,
    ref: barcodeScannerRef
  });

  useEffect(() => {
    inventoryApi.clearBarcodeCache();
    
    return () => {
      inventoryApi.clearBarcodeCache();
    };
  }, []);

  useEffect(() => {
    if (!showReceiptDialog) {
      inventoryApi.clearBarcodeCache();
      resetScanner();
    }
  }, [showReceiptDialog, resetScanner]);

  useEffect(() => {
    setupSecureLogging();
  }, []);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    
    if (isCardModalOpen) {
      setIsCardModalOpen(false);
    }
  };

  const handleSubmitPayment = (
    customerId: number | null,
    usePoints?: boolean,
    cashierId?: string,
    giftCardId?: number,
    splitPayments?: SplitPayment[],
    cashReceived?: number | null
  ) => {
    console.log("RegisterPage - handleSubmitPayment - cashReceived:", cashReceived);
    console.log("RegisterPage - handleSubmitPayment - total:", totals.finalTotal);
    
    setCashReceivedAmount(cashReceived);
    
    handlePayment({
      customerId,
      usePoints: usePoints || false,
      cashierId,
      giftCardId,
      splitPayments,
      cashReceived,
      discountAmount: totals.discountAmount
    });
  };

  const totals = calculateTotals ? calculateTotals() : {
    subtotal: total, 
    discountAmount: 0,
    afterDiscount: total,
    taxAmount: (total * taxRate) / 100, 
    finalTotal: total + (total * taxRate) / 100
  };

  if (isLoadingServices || isLoadingInventory) {
    return (
      <div className="animate-fadeIn">
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Loading POS System...</h2>
            <p className="text-muted-foreground">Please wait while we load your data.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCloseRegister = () => {
    if (onCloseRegister) {
      onCloseRegister();
    }
  };

  return (
    <div className="animate-fadeIn h-screen flex flex-col bg-gray-100">
      <RegisterContent
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        total={total}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        services={services}
        inventoryItems={inventoryItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddToCart={(item, type) => addToCart(item, type)}
        activeShift={activeShift}
        isSidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={collapsed => onToggleSidebar?.(collapsed)}
        calculatedTotals={totals}
        onCloseRegister={handleCloseRegister}
      />

      <RegisterPaymentModals
        isPaymentSheetOpen={isPaymentSheetOpen}
        setIsPaymentSheetOpen={setIsPaymentSheetOpen}
        total={totals.finalTotal}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        isProcessing={isProcessing}
        onSubmit={handleSubmitPayment}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={setSelectedCustomer}
        isCardModalOpen={isCardModalOpen}
        onCloseCardModal={() => setIsCardModalOpen(false)}
        onCardSuccess={handleCardPaymentSuccess}
        clientSecret={clientSecret}
        pendingTransactionAmount={pendingCardTransaction?.amount || 0}
        showReceiptDialog={showReceiptDialog}
        onCloseReceiptDialog={() => {
          setShowReceiptDialog(false);
          resetScanner();
          inventoryApi.clearBarcodeCache();
          setCashReceivedAmount(null);
          setLastCompletedTransactionId(null);
        }}
        transactionId={lastTransactionId || 0}
        selectedDiscount={selectedDiscount}
        discountAmount={totals.discountAmount}
        onDiscountSelect={setSelectedDiscount}
        cashReceived={cashReceivedAmount}
      />
    </div>
  );
};

export default RegisterPage;
