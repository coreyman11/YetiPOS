import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { servicesApi, inventoryApi, ShiftsApi } from "@/services";
import { useCart } from "@/hooks/useCart";
import { ServicesContent } from "./components/ServicesContent";
import { ServicesPaymentModals } from "./components/ServicesPaymentModals";
import { usePaymentProcessing } from "./hooks/usePaymentProcessing";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { toast } from "sonner";
import { Database } from "@/types/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Customer } from "./hooks/payment/types";

interface ServicesPageProps {
  selectedCashier: string;
}

const ServicesPage = ({ selectedCashier }: ServicesPageProps) => {
  const { userProfile } = useAuth();
  
  const { data: activeShift } = useQuery({
    queryKey: ['activeShift', userProfile?.id],
    queryFn: async () => {
      try {
        return await ShiftsApi.getActiveShift(userProfile?.id);
      } catch (error) {
        console.error('Error fetching active shift in ServicePage:', error);
        return null;
      }
    },
    enabled: !!userProfile?.id,
    staleTime: 30000,
  });

  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => await servicesApi.getAll(),
  });

  const { data: inventoryItems = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await inventoryApi.getAll(),
  });

  const [searchTerm, setSearchTerm] = useState("");
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
    taxRate
  } = usePaymentProcessing({ 
    cart, 
    clearCart,
    onCompleteTransaction: (transactionId) => {
      if (barcodeScannerRef.current) {
        barcodeScannerRef.current.resetScanner();
      }
      inventoryApi.clearBarcodeCache();
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

  return (
    <div className="animate-fadeIn h-[calc(100vh-4rem)] flex flex-col bg-gray-100">
      <ServicesContent
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
      />

      <ServicesPaymentModals
        isPaymentSheetOpen={isPaymentSheetOpen}
        setIsPaymentSheetOpen={setIsPaymentSheetOpen}
        total={total}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={(method) => setPaymentMethod(method)}
        isProcessing={isProcessing}
        onSubmit={(customerId, usePoints, cashierId, giftCardId, splitPayments, cashReceived) => {
          handlePayment({
            customerId,
            usePoints: usePoints || false,
            cashierId,
            giftCardId,
            splitPayments,
            cashReceived
          });
        }}
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
        }}
        transactionId={lastTransactionId!}
      />
    </div>
  );
};

export default ServicesPage;
