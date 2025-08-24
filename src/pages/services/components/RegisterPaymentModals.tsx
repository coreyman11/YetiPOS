import { PaymentSheet } from "@/components/services/PaymentSheet";
import { CardModal } from "@/components/services/CardModal";
import { ReceiptDialog } from "@/components/services/ReceiptDialog";
import { CashReceiptDialog } from "@/components/services/CashReceiptDialog";
import { ChangeDueScreen } from "@/components/services/ChangeDueScreen";
import { SplitPayment, PaymentMethod } from "@/pages/services/hooks/payment/types";
import { Database } from "@/types/supabase";
import { useState, useEffect } from "react";
import { CardReaderPaymentModal } from "@/components/services/payment-sheet/CardReaderPaymentModal";

type Customer = Database['public']['Tables']['customers']['Row'];
type Discount = Database['public']['Tables']['discounts']['Row'];

interface RegisterPaymentModalsProps {
  isPaymentSheetOpen: boolean;
  setIsPaymentSheetOpen: (isOpen: boolean) => void;
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isProcessing: boolean;
  onSubmit: (
    customerId: number | null, 
    usePoints?: boolean, 
    cashierId?: string,
    giftCardId?: number,
    splitPayments?: SplitPayment[],
    cashReceived?: number | null
  ) => void;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  isCardModalOpen: boolean;
  onCloseCardModal: () => void;
  onCardSuccess: () => void;
  clientSecret: string | null;
  pendingTransactionAmount: number;
  showReceiptDialog: boolean;
  onCloseReceiptDialog: () => void;
  transactionId: number;
  selectedDiscount?: Discount | null;
  discountAmount?: number;
  onDiscountSelect?: (discount: Discount | null) => void;
  cashReceived?: number | null;
  isCardReaderModalOpen?: boolean;
  onCloseCardReaderModal?: () => void;
}

export const RegisterPaymentModals = ({
  isPaymentSheetOpen,
  setIsPaymentSheetOpen,
  total,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing,
  onSubmit,
  selectedCustomer,
  onCustomerSelect,
  isCardModalOpen,
  onCloseCardModal,
  onCardSuccess,
  clientSecret,
  pendingTransactionAmount,
  showReceiptDialog,
  onCloseReceiptDialog,
  transactionId,
  selectedDiscount,
  discountAmount,
  onDiscountSelect,
  cashReceived,
  isCardReaderModalOpen = false,
  onCloseCardReaderModal = () => {}
}: RegisterPaymentModalsProps) => {
  const [showChangeDueScreen, setShowChangeDueScreen] = useState(true);
  const [showReceiptAfterChange, setShowReceiptAfterChange] = useState(false);
  const [transactionTotal, setTransactionTotal] = useState<number>(0);
  
  console.log("RegisterPaymentModals - total:", total);
  console.log("RegisterPaymentModals - cashReceived:", cashReceived);
  
  useEffect(() => {
    if (showReceiptDialog && total > 0) {
      setTransactionTotal(total);
    }
  }, [showReceiptDialog, total]);
  
  const handleShowReceipt = () => {
    setShowChangeDueScreen(false);
    setShowReceiptAfterChange(true);
  };
  
  const handleCloseAll = () => {
    setShowChangeDueScreen(false);
    setShowReceiptAfterChange(false);
    onCloseReceiptDialog();
  };

  const displayTotal = showReceiptDialog ? (transactionTotal > 0 ? transactionTotal : total) : total;
  
  const parsedTotal = typeof displayTotal === 'number' ? displayTotal : parseFloat(String(displayTotal)) || 0;
  
  const parsedCashReceived = cashReceived === null ? null : 
    (typeof cashReceived === 'number' ? cashReceived : parseFloat(String(cashReceived)) || 0);
  
  console.log("RegisterPaymentModals - parsedTotal for display:", parsedTotal);
  
  return (
    <>
      <PaymentSheet
        isOpen={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        total={parsedTotal}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        isProcessing={isProcessing}
        onSubmit={onSubmit}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={onCustomerSelect}
        selectedDiscount={selectedDiscount}
        discountAmount={discountAmount}
        onDiscountSelect={onDiscountSelect}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onOpenChange={onCloseCardModal}
        onClose={onCloseCardModal}
        clientSecret={clientSecret}
        amount={pendingTransactionAmount}
        onSuccess={onCardSuccess}
      />
      
      <CardReaderPaymentModal
        isOpen={isCardReaderModalOpen}
        onOpenChange={onCloseCardReaderModal}
        onClose={onCloseCardReaderModal}
        amount={pendingTransactionAmount}
        onSuccess={onCardSuccess}
      />

      {transactionId > 0 && paymentMethod === "cash" ? (
        <>
          <ChangeDueScreen
            isOpen={showReceiptDialog && showChangeDueScreen}
            onOpenChange={(open) => {
              if (!open) handleCloseAll();
            }}
            onClose={handleCloseAll}
            onShowReceipt={handleShowReceipt}
            transactionId={transactionId}
            cashReceived={parsedCashReceived}
            totalAmount={parsedTotal}
          />
          
          <CashReceiptDialog
            isOpen={showReceiptAfterChange}
            onOpenChange={(open) => {
              if (!open) handleCloseAll();
            }}
            onClose={handleCloseAll}
            transactionId={transactionId}
            cashReceived={parsedCashReceived}
            totalAmount={parsedTotal}
          />
        </>
      ) : transactionId > 0 && (
        <ReceiptDialog
          isOpen={showReceiptDialog}
          onOpenChange={onCloseReceiptDialog}
          onClose={onCloseReceiptDialog}
          transactionId={transactionId}
        />
      )}
    </>
  );
};
