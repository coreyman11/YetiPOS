
import { PaymentSheet } from "@/components/services/PaymentSheet";
import { CardModal } from "@/components/services/CardModal";
import { ReceiptDialog } from "@/components/services/ReceiptDialog";
import { Customer, PaymentMethod, SplitPayment } from "@/pages/services/hooks/payment/types";
import { Database } from "@/types/supabase";

type Discount = Database['public']['Tables']['discounts']['Row'];

interface ServicesPaymentModalsProps {
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
}

export const ServicesPaymentModals = ({
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
  discountAmount
}: ServicesPaymentModalsProps) => {
  return (
    <>
      <PaymentSheet
        isOpen={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        total={total}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={onPaymentMethodChange}
        isProcessing={isProcessing}
        onSubmit={onSubmit}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={onCustomerSelect}
        selectedDiscount={selectedDiscount}
        discountAmount={discountAmount}
      />

      <CardModal
        isOpen={isCardModalOpen}
        onOpenChange={onCloseCardModal}
        onClose={onCloseCardModal}
        clientSecret={clientSecret}
        amount={pendingTransactionAmount}
        onSuccess={onCardSuccess}
      />

      {transactionId > 0 && (
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
