import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { StaffSelector } from "./payment-sheet/StaffSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomerSelect } from "./CustomerSelect";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { Database } from "@/types/supabase";
import { PaymentMethod, SplitPayment } from "@/pages/services/hooks/payment/types";
import { GiftCardVerifier } from "./payment-sheet/GiftCardVerifier";
import { giftCardsApi } from "@/services";
import { CardReaderPayment } from "./payment-sheet/CardReaderPayment";
import { DiscountSelector } from "./DiscountSelector";

type Customer = Database['public']['Tables']['customers']['Row'];
type Discount = Database['public']['Tables']['discounts']['Row'];

interface PaymentSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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
  selectedDiscount?: Discount | null;
  discountAmount?: number;
  onDiscountSelect?: (discount: Discount | null) => void;
}

interface PaymentSheetContentProps {
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
  children: React.ReactNode;
  selectedDiscount?: Discount | null;
  discountAmount?: number;
}

const PaymentSheetContent = ({
  total,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing,
  onSubmit,
  selectedCustomer,
  onCustomerSelect,
  children,
  selectedDiscount,
  discountAmount = 0
}: PaymentSheetContentProps) => {
  const [usePoints, setUsePoints] = useState(false);
  const [cashReceived, setCashReceived] = useState<number | null>(null);
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [giftCardId, setGiftCardId] = useState<number | undefined>();
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [giftCardBalance, setGiftCardBalance] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState(total);

  const { data: activePrograms } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCustomer
  });

  const defaultProgram = activePrograms?.[0];
  
  const canRedeemPoints = selectedCustomer && 
    defaultProgram && 
    selectedCustomer.loyalty_points >= defaultProgram.minimum_points_redeem;
    
  const pointsValue = selectedCustomer && defaultProgram ? 
    (selectedCustomer.loyalty_points * defaultProgram.points_value_cents) / 100 : 0;

  useEffect(() => {
    const totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    let finalTotal = total;
    
    if (usePoints && canRedeemPoints) {
      finalTotal -= pointsValue;
    }
    
    if (discountAmount > 0) {
      finalTotal -= discountAmount;
    }
    
    setRemainingAmount(Math.max(0, finalTotal - totalPaid));
  }, [splitPayments, total, usePoints, pointsValue, canRedeemPoints, discountAmount]);

  const handleSubmit = () => {
    if (paymentMethod === "gift_card" && !isSplitPayment && !giftCardId) {
      toast.error("Please verify a valid gift card first.");
      return;
    }

    if (isSplitPayment && splitPayments.length > 0) {
      console.log("Submitting split payment with usePoints:", usePoints);
      onSubmit(selectedCustomer?.id || null, usePoints, undefined, undefined, splitPayments, cashReceived);
      return;
    }

    console.log("Submitting regular payment with usePoints:", usePoints);
    onSubmit(selectedCustomer?.id || null, usePoints, undefined, giftCardId, undefined, cashReceived);
  };

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

      setGiftCardBalance(giftCard.current_balance);

      if (isSplitPayment) {
        const amountToUse = Math.min(giftCard.current_balance, remainingAmount);
        
        if (amountToUse <= 0) {
          setGiftCardError("Cannot add payment - order already paid in full or gift card has zero balance");
          return;
        }
        
        setSplitPayments([...splitPayments, {
          payment_method: "gift_card",
          amount: amountToUse,
          gift_card_id: giftCard.id,
          gift_card_number: giftCardNumber
        }]);
        
        setGiftCardNumber("");
        toast.success(`Added $${amountToUse.toFixed(2)} from gift card`);
      } else {
        if (giftCard.current_balance < total) {
          setGiftCardError(`Insufficient balance. Available: $${giftCard.current_balance.toFixed(2)}. Consider using split payment.`);
          setGiftCardId(undefined);
          return;
        }

        setGiftCardId(giftCard.id);
        toast.success("Gift card verified successfully!");
      }
    } catch (error) {
      console.error('Gift card verification error:', error);
      setGiftCardError("Error verifying gift card");
      setGiftCardId(undefined);
    }
  };

  const taxRate = 6.75;
  const subtotal = total;
  
  const taxAmount = total - (total / (1 + taxRate/100));
  
  const maxLoyaltyDiscount = total - (discountAmount || 0);
  const rawLoyaltyDiscount = usePoints && canRedeemPoints ? pointsValue : 0;
  const loyaltyDiscount = Math.min(maxLoyaltyDiscount, rawLoyaltyDiscount);
  
  const finalTotal = Math.max(0, total - loyaltyDiscount - (discountAmount || 0));

  const handleAddCashSplit = () => {
    if (remainingAmount <= 0) return;
    
    setSplitPayments([...splitPayments, {
      payment_method: "cash",
      amount: remainingAmount
    }]);
  };

  const handleAddCreditSplit = () => {
    if (remainingAmount <= 0) return;
    
    setSplitPayments([...splitPayments, {
      payment_method: "credit",
      amount: remainingAmount
    }]);
  };

  const handleRemoveSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <DialogHeader className="space-y-2.5 px-4 pt-4">
        <DialogTitle>Complete Payment</DialogTitle>
        <DialogDescription>
          Choose a payment method to complete the transaction.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-auto p-4">
        {children}

        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="split-payment"
              checked={isSplitPayment}
              onCheckedChange={(checked) => {
                setIsSplitPayment(checked as boolean);
                if (!(checked as boolean)) {
                  setSplitPayments([]);
                }
              }}
            />
            <Label htmlFor="split-payment">
              Split Payment (Use multiple payment methods)
            </Label>
          </div>
        </div>

        {isSplitPayment && (
          <div className="space-y-4 pt-4 border-t mt-4">
            <div className="text-sm font-medium">Split Payments</div>
            
            <div className="space-y-2">
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    {payment.payment_method === 'gift_card' 
                      ? `Gift Card (${payment.gift_card_number?.substring(0, 8)}...)` 
                      : payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${payment.amount.toFixed(2)}</span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRemoveSplitPayment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {remainingAmount > 0 && (
              <div className="text-sm font-medium">
                Remaining Amount: ${remainingAmount.toFixed(2)}
              </div>
            )}

            <div className="space-y-2 mt-4">
              <Label>Add Payment Method</Label>
              {paymentMethod === "gift_card" && (
                <GiftCardVerifier
                  giftCardNumber={giftCardNumber}
                  onGiftCardNumberChange={setGiftCardNumber}
                  onGiftCardCheck={handleGiftCardCheck}
                  giftCardError={giftCardError}
                />
              )}

              {paymentMethod === "cash" && (
                <Button 
                  className="w-full" 
                  onClick={handleAddCashSplit}
                  disabled={remainingAmount <= 0}
                >
                  Add Cash Payment (${remainingAmount.toFixed(2)})
                </Button>
              )}

              {paymentMethod === "credit" && (
                <Button 
                  className="w-full" 
                  onClick={handleAddCreditSplit}
                  disabled={remainingAmount <= 0}
                >
                  Add Credit Card Payment (${remainingAmount.toFixed(2)})
                </Button>
              )}
            </div>
          </div>
        )}

        {!isSplitPayment && (
          <>
            {paymentMethod === "credit" && (
              <CardReaderPayment
                amount={finalTotal}
                onSuccess={() => {
                  handleSubmit();
                }}
                onError={(error) => {
                  toast.error(error.message);
                }}
                onFallback={() => {
                  onPaymentMethodChange("manual_credit");
                }}
              />
            )}

            {paymentMethod === "manual_credit" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    type="text"
                    id="card-number"
                    placeholder="Enter card number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    type="text"
                    id="expiry-date"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    type="text"
                    id="cvv"
                    placeholder="CVV"
                  />
                </div>
              </div>
            )}

            {paymentMethod === "gift_card" && (
              <div className="space-y-4 pt-4">
                <GiftCardVerifier
                  giftCardNumber={giftCardNumber}
                  onGiftCardNumberChange={setGiftCardNumber}
                  onGiftCardCheck={handleGiftCardCheck}
                  giftCardError={giftCardError}
                />
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="cash-received">Cash Received (optional)</Label>
                  <Input
                    type="number"
                    id="cash-received"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setCashReceived(isNaN(value) ? null : value);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-points"
                checked={usePoints}
                onCheckedChange={(checked) => {
                  console.log("Loyalty points checkbox changed to:", checked);
                  setUsePoints(checked as boolean);
                }}
                disabled={!canRedeemPoints}
              />
              <Label htmlFor="use-points" className={!canRedeemPoints ? "text-muted-foreground" : ""}>
                Use {selectedCustomer.loyalty_points} points {canRedeemPoints ? `($${pointsValue.toFixed(2)})` : ''}
              </Label>
            </div>
            {!canRedeemPoints && selectedCustomer.loyalty_points > 0 && (
              <div className="text-sm text-muted-foreground">
                Not enough points to redeem. Minimum required: {defaultProgram?.minimum_points_redeem || 100} points
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>${(subtotal - taxAmount).toFixed(2)}</span>
          </div>
          {usePoints && canRedeemPoints && (
            <div className="flex justify-between mb-1 text-sm">
              <span>Points Discount:</span>
              <span className="text-red-500">-${loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between mb-1 text-sm">
              <span>Discount {selectedDiscount?.name ? `(${selectedDiscount.name})` : ''}:</span>
              <span className="text-red-500">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span>Tax ({taxRate}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          {splitPayments.length > 0 && (
            <>
              <div className="border-t my-2"></div>
              {splitPayments.map((payment, index) => (
                <div key={index} className="flex justify-between mb-1 text-sm">
                  <span>{payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)} Payment:</span>
                  <span>-${payment.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t my-2"></div>
              <div className="flex justify-between mb-1">
                <span>Remaining:</span>
                <span>${remainingAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-semibold text-lg">
            <span>Final Total:</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="p-4 border-t">
        <Button
          disabled={
            isProcessing || 
            (paymentMethod === "gift_card" && !isSplitPayment && !giftCardId) ||
            (isSplitPayment && remainingAmount > 0)
          }
          className="w-full bg-primary"
          onClick={handleSubmit}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Pay"
          )}
          {paymentMethod === "cash" && cashReceived !== null && !isSplitPayment
            ? ` $${(cashReceived - finalTotal).toFixed(2)} Change`
            : ` $${(isSplitPayment ? remainingAmount : finalTotal).toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
};

export const PaymentSheet = ({ 
  isOpen, 
  onOpenChange, 
  total, 
  paymentMethod, 
  onPaymentMethodChange, 
  isProcessing, 
  onSubmit, 
  selectedCustomer, 
  onCustomerSelect,
  selectedDiscount,
  discountAmount,
  onDiscountSelect
}: PaymentSheetProps) => {
  const [selectedCashier, setSelectedCashier] = useState<string>("");
  
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  useEffect(() => {
    if (currentUser && !selectedCashier) {
      setSelectedCashier(currentUser.id);
    }
  }, [currentUser]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md md:max-w-xl p-0 flex flex-col h-full max-h-[80vh]">
        <PaymentSheetContent 
          total={total}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          isProcessing={isProcessing}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={onCustomerSelect}
          selectedDiscount={selectedDiscount}
          discountAmount={discountAmount}
          onSubmit={(customerId, usePoints, _, giftCardId, splitPayments, cashReceived) => {
            onSubmit(
              customerId, 
              usePoints, 
              selectedCashier, 
              giftCardId, 
              splitPayments, 
              cashReceived
            );
          }}
        >
          <div className="space-y-4">
            <CustomerSelect
              selectedCustomer={selectedCustomer}
              onCustomerSelect={onCustomerSelect}
            />
            <PaymentMethodSelect
              paymentMethod={paymentMethod}
              onPaymentMethodChange={onPaymentMethodChange}
            />
          </div>
          
          {onDiscountSelect && (
            <div className="space-y-2 pt-4">
              <Label className="text-sm font-medium">Apply Discount</Label>
              <DiscountSelector 
                onDiscountSelect={onDiscountSelect}
                selectedDiscount={selectedDiscount}
                disabled={false}
              />
            </div>
          )}
          
          <div className="space-y-4 pt-4">
            <StaffSelector
              selectedCashier={selectedCashier}
              onCashierSelect={setSelectedCashier}
              users={staffUsers}
              currentUserId={currentUser?.id}
            />
          </div>
          
        </PaymentSheetContent>
      </DialogContent>
    </Dialog>
  );
};
