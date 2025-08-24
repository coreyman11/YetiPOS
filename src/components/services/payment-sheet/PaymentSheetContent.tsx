import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "../payment/PaymentMethodSelector";
import { CashPaymentForm } from "../payment/CashPaymentForm";
import { toast } from "sonner";
import { SplitPaymentSection } from "./SplitPaymentSection"; 
import { PaymentTotals } from "./PaymentTotals";
import { PaymentActions } from "./PaymentActions";
import { CustomerSection } from "./CustomerSection";
import { StaffSelector } from "./StaffSelector";
import { GiftCardVerifier } from "./GiftCardVerifier";
import { DiscountSelector } from "@/components/services/DiscountSelector";
import { Database } from "@/types/supabase";
import { giftCardsApi } from "@/services";
import { PaymentMethod, SplitPayment } from "@/pages/services/hooks/payment/types";
import { useStorefrontCustomerSession } from "@/hooks/useStorefrontCustomerSession";
import { StorefrontCustomerIndicator } from "@/components/services/StorefrontCustomerIndicator";

type Customer = Database['public']['Tables']['customers']['Row'];

interface PaymentSheetContentProps {
  customers: Customer[];
  users: any[];
  activePrograms: any[];
  activeTaxes: any[];
  currentUserId?: string;
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  isProcessing: boolean;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onSubmit: (
    customerId: number | null, 
    usePoints?: boolean, 
    cashierId?: string, 
    giftCardId?: number,
    splitPayments?: SplitPayment[],
    cashReceived?: number | null
  ) => void;
  selectedDiscount?: Database['public']['Tables']['discounts']['Row'] | null;
  discountAmount?: number;
  onDiscountSelect?: (discount: Database['public']['Tables']['discounts']['Row'] | null) => void;
}

export const PaymentSheetContent = ({
  customers,
  users,
  activePrograms,
  activeTaxes,
  currentUserId,
  total,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing,
  selectedCustomer,
  onCustomerSelect,
  onSubmit,
  selectedDiscount = null,
  discountAmount = 0,
  onDiscountSelect
}: PaymentSheetContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<string>("");
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardId, setGiftCardId] = useState<number | undefined>();
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [remainingAmount, setRemainingAmount] = useState(0);
  
  // Track storefront customer session
  const { activeCustomer } = useStorefrontCustomerSession();

  const activeTax = activeTaxes?.find(tax => tax.is_active);
  const taxRate = activeTax ? activeTax.rate : 0;
  const defaultProgram = activePrograms?.[0];
  
  const canRedeemPoints = selectedCustomer && 
    defaultProgram && 
    selectedCustomer.loyalty_points >= defaultProgram.minimum_points_redeem;
    
  // Fix points value calculation - ensure we use correct program settings
  const pointsValue = selectedCustomer && defaultProgram ? 
    (selectedCustomer.loyalty_points * (defaultProgram.points_value_cents || 1)) / 100 : 0;

  const subtotal = total;
  
  const maxLoyaltyDiscount = subtotal - discountAmount;
  const rawLoyaltyDiscount = usePoints && canRedeemPoints ? pointsValue : 0;
  const loyaltyDiscount = Math.min(maxLoyaltyDiscount, rawLoyaltyDiscount);
  
  const afterLoyalty = subtotal - loyaltyDiscount - discountAmount;
  const taxAmount = (afterLoyalty * taxRate) / 100;
  const finalTotal = afterLoyalty + taxAmount;

  useEffect(() => {
    if (currentUserId) {
      setSelectedCashier(currentUserId);
    }
  }, [currentUserId]);

  useEffect(() => {
    const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const newRemainingAmount = parseFloat((finalTotal - totalPaid).toFixed(2));
    setRemainingAmount(Math.max(0, newRemainingAmount));
  }, [splitPayments, finalTotal]);

  const handleGiftCardCheck = async () => {
    try {
      setGiftCardError(null);
      
      const giftCard = await giftCardsApi.getByCardNumber(giftCardNumber);
      
      if (!giftCard) {
        setGiftCardError("Invalid gift card number");
        setGiftCardId(undefined);
        return;
      }

      if (!giftCard.is_active) {
        setGiftCardError("Gift card is not active");
        return;
      }

      if (isSplitPayment) {
        if (giftCard.current_balance <= 0) {
          setGiftCardError("Gift card has no balance");
          return;
        }
        
        const amountToUse = Math.min(giftCard.current_balance, remainingAmount);
        const formattedAmount = parseFloat(amountToUse.toFixed(2));
        
        handleAddSplitPayment(
          "gift_card", 
          formattedAmount, 
          giftCard.id, 
          giftCardNumber
        );
        
        toast.success(`Added $${formattedAmount.toFixed(2)} from gift card`);
        return;
      }

      if (giftCard.current_balance < finalTotal) {
        setGiftCardError(`Insufficient balance. Available: $${giftCard.current_balance.toFixed(2)}. Consider using split payment.`);
        setGiftCardId(undefined);
        return;
      }

      setGiftCardId(giftCard.id);
      toast.success("Gift card verified successfully!");
    } catch (error) {
      console.error('Gift card verification error:', error);
      setGiftCardError("Error verifying gift card");
      setGiftCardId(undefined);
    }
  };

  const handleAddSplitPayment = (
    method: PaymentMethod, 
    amount: number, 
    giftCardId?: number,
    giftCardNumber?: string
  ) => {
    if (amount <= 0 || amount > remainingAmount) {
      toast.error("Invalid amount");
      return;
    }

    setSplitPayments([...splitPayments, {
      payment_method: method,
      amount: parseFloat(amount.toFixed(2)),
      gift_card_id: giftCardId,
      gift_card_number: giftCardNumber
    }]);

    if (method === "gift_card") {
      setGiftCardNumber("");
      setGiftCardId(undefined);
    }
  };

  const handleRemoveSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleCashPayment = (receivedAmount: number | null) => {
    if (isSplitPayment && remainingAmount > 0) {
      const finalSplitPayments = [...splitPayments, { 
        payment_method: "cash" as PaymentMethod, 
        amount: remainingAmount 
      }];
      
      onSubmit(
        selectedCustomer?.id || null,
        usePoints,
        selectedCashier,
        undefined,
        finalSplitPayments,
        receivedAmount
      );
    } else {
      onSubmit(
        selectedCustomer?.id || null,
        usePoints,
        selectedCashier, 
        undefined,
        undefined,
        receivedAmount
      );
    }
  };

  const handleSubmitPayment = () => {
    if (!selectedCashier) {
      toast.error("Please select a staff member");
      return;
    }

    if (isSplitPayment) {
      if (remainingAmount > 0.001) {
        if (paymentMethod === 'credit') {
          const updatedSplitPayments = [...splitPayments, {
            payment_method: 'credit' as PaymentMethod,
            amount: remainingAmount
          }];
          
          onSubmit(
            selectedCustomer?.id || null,
            usePoints,
            selectedCashier,
            undefined,
            updatedSplitPayments
          );
        } else if (paymentMethod === 'cash') {
          toast.info("Please complete the cash amount below");
          return;
        } else {
          toast.error(`Please add a payment for the remaining $${remainingAmount.toFixed(2)}`);
          return;
        }
      } else if (remainingAmount <= 0.001 && splitPayments.length > 0) {
        onSubmit(
          selectedCustomer?.id || null,
          usePoints,
          selectedCashier,
          undefined,
          splitPayments
        );
      }
    } else {
      onSubmit(
        selectedCustomer?.id || null,
        usePoints,
        selectedCashier,
        !isSplitPayment ? giftCardId : undefined,
        isSplitPayment ? splitPayments : undefined
      );
    }
  };

  const showCashFormSubmitButton = paymentMethod === 'cash' && 
    (!isSplitPayment || (isSplitPayment && remainingAmount > 0));
  
  const showPaymentActionButton = paymentMethod !== 'cash' || 
    (isSplitPayment && remainingAmount <= 0.001);

  return (
    <ScrollArea className="max-h-[80vh]">
      <div className="space-y-6 p-6">
        {/* Storefront Customer Indicator */}
        {activeCustomer && !selectedCustomer && (
          <>
            <StorefrontCustomerIndicator customer={activeCustomer} />
            <div className="h-[1px] bg-border" />
          </>
        )}
        
        <CustomerSection 
          customers={customers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={onCustomerSelect}
          pointsValue={pointsValue}
          canRedeemPoints={!!canRedeemPoints}
          usePoints={usePoints}
          onPointsChange={(checked) => setUsePoints(checked)}
        />

        <div className="h-[1px] bg-border" />

        <StaffSelector
          selectedCashier={selectedCashier}
          onCashierSelect={setSelectedCashier}
          users={users || []}
          currentUserId={currentUserId}
        />

        <div className="h-[1px] bg-border" />

        {onDiscountSelect && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Apply Discount</Label>
              <DiscountSelector 
                onDiscountSelect={onDiscountSelect}
                selectedDiscount={selectedDiscount}
                disabled={false}
              />
            </div>
            <div className="h-[1px] bg-border" />
          </>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="splitPayment"
              checked={isSplitPayment}
              onChange={(e) => {
                setIsSplitPayment(e.target.checked);
                if (!e.target.checked) {
                  setSplitPayments([]);
                }
              }}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="splitPayment">Split Payment</Label>
          </div>

          {isSplitPayment ? (
            <SplitPaymentSection
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
              giftCardNumber={giftCardNumber}
              onGiftCardNumberChange={setGiftCardNumber}
              onGiftCardCheck={handleGiftCardCheck}
              giftCardError={giftCardError}
              remainingAmount={remainingAmount}
              splitPayments={splitPayments}
              onAddSplitPayment={handleAddSplitPayment}
              onRemoveSplitPayment={handleRemoveSplitPayment}
            />
          ) : (
            <>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={(value) => onPaymentMethodChange(value)}
              />

              {paymentMethod === 'gift_card' && (
                <GiftCardVerifier
                  giftCardNumber={giftCardNumber}
                  onGiftCardNumberChange={setGiftCardNumber}
                  onGiftCardCheck={handleGiftCardCheck}
                  giftCardError={giftCardError}
                />
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <PaymentTotals
            subtotal={subtotal}
            usePoints={usePoints}
            canRedeemPoints={canRedeemPoints}
            loyaltyDiscount={loyaltyDiscount}
            taxRate={taxRate}
            taxAmount={taxAmount}
            finalTotal={finalTotal}
            splitPayments={isSplitPayment ? splitPayments : []}
            remainingAmount={remainingAmount}
            discountAmount={discountAmount}
            discountName={selectedDiscount?.name}
            discountType={selectedDiscount?.type}
            discountValue={selectedDiscount?.value}
          />

          {paymentMethod === 'cash' && (
            <CashPaymentForm
              totalAmount={isSplitPayment ? remainingAmount : finalTotal}
              onSubmit={handleCashPayment}
              isProcessing={isProcessing}
              showSubmitButton={showCashFormSubmitButton}
            />
          )}

          {showPaymentActionButton && (
            <PaymentActions
              isProcessing={isProcessing}
              disabled={
                isProcessing || 
                !selectedCashier || 
                (paymentMethod === 'gift_card' && !isSplitPayment && !giftCardId) ||
                (isSplitPayment && remainingAmount > 0 && paymentMethod !== 'credit' && paymentMethod !== 'cash')
              }
              paymentMethod={paymentMethod}
              isSplitPayment={isSplitPayment}
              onClick={handleSubmitPayment}
              showPaymentButton={true}
            />
          )}
        </div>
      </div>
    </ScrollArea>
  );
};
