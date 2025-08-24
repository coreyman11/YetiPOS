import { useState } from 'react';
import { CartItem } from '@/hooks/useCart';
import { Customer, PaymentMethod, PendingTransaction } from '@/pages/services/hooks/payment/types';
import { handleCashPayment } from './payment/cashPaymentHandler';
import { createPendingCardTransaction, finalizeCardPayment } from './payment/cardPaymentHandler';
import { handleGiftCardPayment } from './payment/giftCardPaymentHandler';
import { handleLoyaltyPointsOnlyPayment } from './payment/loyaltyPaymentHandler';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { terminalApi } from '@/services/terminal-api';
import { toast } from "sonner";
import { validateInventoryAvailability } from './payment/inventoryUtils';

interface PaymentData {
  customerId: number | null;
  usePoints: boolean;
  cashierId?: string;
  giftCardId?: number;
  splitPayments?: any[];
  cashReceived?: number;
  activeShiftId?: number;
  taxRate: number;
  discountId?: number;
  discountAmount: number;
  useCardReader?: boolean;
}

interface UsePaymentProcessingOptions {
  cart: CartItem[];
  clearCart: () => void;
  onCompleteTransaction?: (transactionId: number) => void;
  activeShift?: any;
  defaultCashierId?: string;
}

export const usePaymentProcessing = ({
  cart,
  clearCart,
  onCompleteTransaction,
  activeShift,
  defaultCashierId
}: UsePaymentProcessingOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingCardTransaction, setPendingCardTransaction] = useState<PendingTransaction | null>(null);
  const [taxRate] = useState(6.75);
  const [selectedDiscount, setSelectedDiscount] = useState<Database['public']['Tables']['discounts']['Row'] | null>(null);

  // Reset function to clear all payment-related states
  const resetPaymentStates = () => {
    setLastTransactionId(null);
    setShowReceiptDialog(false);
    setIsCardModalOpen(false);
    setClientSecret(null);
    setPendingCardTransaction(null);
    setSelectedCustomer(null);
  };

  const calculateLoyaltyDiscount = async (customerId: number | null, usePoints: boolean, subtotal: number) => {
    if (!customerId || !usePoints) return 0;
    
    try {
      // Get active loyalty programs
      const { data: activePrograms, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error || !activePrograms || activePrograms.length === 0) {
        console.log('No active loyalty programs found');
        return 0;
      }
      
      const program = activePrograms[0]; // Use the first active program
      
      // Get customer's loyalty points
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();
      
      if (!customer || customer.loyalty_points <= 0) {
        return 0;
      }
      
      // Calculate maximum discount based on available points
      const pointValue = program.points_value_cents / 100; // Convert cents to dollars
      const maxDiscount = customer.loyalty_points * pointValue;
      
      // Don't discount more than the subtotal
      const loyaltyDiscount = Math.min(maxDiscount, subtotal);
      
      console.log(`Loyalty discount calculated: ${loyaltyDiscount} (${customer.loyalty_points} points available)`);
      return loyaltyDiscount;
    } catch (error) {
      console.error('Error calculating loyalty discount:', error);
      return 0;
    }
  };

  const getActiveLoyaltyProgram = async () => {
    try {
      const { data: activePrograms, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !activePrograms || activePrograms.length === 0) {
        return null;
      }
      
      return activePrograms[0];
    } catch (error) {
      console.error('Error getting active loyalty program:', error);
      return null;
    }
  };

  const processCashPayment = async (
    cart: CartItem[],
    paymentData: PaymentData,
    onSuccess: (transactionId: number) => void
  ) => {
    setIsProcessing(true);
    try {
      console.log('Payment processing - subtotal:', cart.reduce((acc, item) => acc + item.price * item.quantity, 0));
      console.log('Payment processing - discountAmount:', paymentData.discountAmount);
      
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const loyaltyDiscount = await calculateLoyaltyDiscount(paymentData.customerId, paymentData.usePoints, subtotal);
      const loyaltyProgram = await getActiveLoyaltyProgram();
      
      console.log('Payment processing - loyaltyDiscount:', loyaltyDiscount);
      
      const afterDiscounts = subtotal - paymentData.discountAmount - loyaltyDiscount;
      const taxAmount = (afterDiscounts * paymentData.taxRate) / 100;
      const finalTotal = afterDiscounts + taxAmount;
      
      console.log('Payment processing - finalTotal:', finalTotal);
      console.log('Payment processing - usePoints:', paymentData.usePoints);
      
      return await handleCashPayment(
        cart,
        paymentData.customerId,
        paymentData.usePoints,
        paymentData.cashierId,
        paymentData.giftCardId,
        paymentData.splitPayments,
        paymentData.cashReceived,
        finalTotal,
        onSuccess,
        paymentData.activeShiftId,
        paymentData.taxRate,
        paymentData.discountId,
        paymentData.discountAmount + loyaltyDiscount, // Include loyalty discount in total discount
        loyaltyProgram?.id || null
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processCardReaderPayment = async (
    cart: CartItem[],
    paymentData: PaymentData
  ) => {
    setIsProcessing(true);
    try {
      // Validate inventory availability before processing payment
      await validateInventoryAvailability(cart);
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const loyaltyDiscount = await calculateLoyaltyDiscount(paymentData.customerId, paymentData.usePoints, subtotal);
      const loyaltyProgram = await getActiveLoyaltyProgram();
      
      const totalDiscount = paymentData.discountAmount + loyaltyDiscount;
      const afterDiscounts = subtotal - totalDiscount;
      const taxAmount = (afterDiscounts * paymentData.taxRate) / 100;
      const finalTotal = afterDiscounts + taxAmount;
      
      console.log(`Processing card reader payment for $${finalTotal}`);
      
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(finalTotal * 100);
      
      // Try to use a saved default reader for the current location first
      let connectedReaderId: string | null = null;
      try {
        let query = supabase
          .from('card_reader_configurations')
          .select('*')
          .eq('is_default', true);
        if (activeShift?.location_id) {
          query = query.eq('location_id', activeShift.location_id);
        }
        const { data: configs } = await query.limit(1);
        if (configs && configs.length > 0) {
          connectedReaderId = configs[0].reader_id;
          console.log('Using saved default reader:', connectedReaderId);
          try {
            const reader = await terminalApi.getReader(connectedReaderId);
            if (reader.status !== 'online') {
              console.log('Saved reader not online, attempting to connect...');
              const connected = await terminalApi.connectById(connectedReaderId);
              connectedReaderId = connected.id;
            }
          } catch (e) {
            console.warn('Saved reader retrieval failed, will try discovery', e);
            connectedReaderId = null;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch saved reader configuration', e);
      }

      // Fallback: discover readers and pick an online one
      if (!connectedReaderId) {
        const readers = await terminalApi.listReaders();
        const online = readers.find(reader => reader.status === 'online');
        if (!online) {
          throw new Error("No connected card reader found. Please ensure your BBPOS reader is powered on and online.");
        }
        connectedReaderId = online.id;
        console.log(`Using discovered reader: ${connectedReaderId}`);
      }
      
      // Process the payment using the terminal API with the resolved reader
      const paymentResult = await terminalApi.processPayment(
        connectedReaderId,
        amountInCents,
        `POS Transaction - $${finalTotal.toFixed(2)}`
      );

      if (paymentResult && paymentResult.paymentIntent && paymentResult.paymentIntent.status === 'succeeded') {
        console.log("Card reader payment succeeded!");
        
        // Create the transaction in the database
        const transaction = await finalizeCardPayment(
          {
            amount: finalTotal,
            amountToCharge: finalTotal,
            customerId: paymentData.customerId,
            usePoints: paymentData.usePoints,
            cashierId: paymentData.cashierId,
            giftCardId: paymentData.giftCardId,
            splitPayments: paymentData.splitPayments,
            items: cart.map(item => ({
              service_id: item.type === 'service' ? item.id : null,
              inventory_id: item.type === 'inventory' ? item.id : null,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal,
            taxAmount,
            taxRate: paymentData.taxRate,
            shiftId: paymentData.activeShiftId,
            loyaltyProgramId: loyaltyProgram?.id || null
          },
          cart,
          (transactionId) => {
            setLastTransactionId(transactionId);
            if (onCompleteTransaction) {
              onCompleteTransaction(transactionId);
            }
            clearCart();
          },
          paymentResult.paymentIntent.id,
          paymentResult.paymentIntent.payment_method,
          paymentResult.paymentIntent.charges?.data[0]?.payment_method_details?.card?.last4,
          paymentResult.paymentIntent.charges?.data[0]?.payment_method_details?.card?.brand,
          paymentData.discountId?.toString()
        );

        toast.success("Card payment processed successfully!");
        return transaction;
      } else {
        throw new Error(paymentResult?.error?.message || "Card payment failed");
      }
    } catch (error) {
      console.error("Card reader payment error:", error);
      
      // Provide more specific error messages
      let errorMessage = "Card payment failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = "Card payment failed: Unknown error occurred";
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processCardPayment = async (
    cart: CartItem[],
    paymentData: PaymentData,
    isCardReader: boolean = false
  ) => {
    if (isCardReader) {
      return await processCardReaderPayment(cart, paymentData);
    }

    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const loyaltyDiscount = await calculateLoyaltyDiscount(paymentData.customerId, paymentData.usePoints, subtotal);
      const loyaltyProgram = await getActiveLoyaltyProgram();
      
      const totalDiscount = paymentData.discountAmount + loyaltyDiscount;
      
      return await createPendingCardTransaction(
        cart,
        paymentData.customerId,
        paymentData.usePoints,
        paymentData.cashierId,
        paymentData.giftCardId,
        paymentData.splitPayments,
        undefined,
        paymentData.activeShiftId,
        paymentData.taxRate,
        paymentData.discountId?.toString(),
        totalDiscount,
        isCardReader,
        loyaltyProgram?.id || null
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const processGiftCardPayment = async (
    cart: CartItem[],
    paymentData: PaymentData,
    onSuccess: (transactionId: number) => void
  ) => {
    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const loyaltyDiscount = await calculateLoyaltyDiscount(paymentData.customerId, paymentData.usePoints, subtotal);
      const loyaltyProgram = await getActiveLoyaltyProgram();
      
      const totalDiscount = paymentData.discountAmount + loyaltyDiscount;
      
      return await handleGiftCardPayment(
        cart,
        paymentData.customerId,
        paymentData.usePoints,
        paymentData.cashierId,
        paymentData.giftCardId,
        paymentData.splitPayments,
        undefined,
        onSuccess,
        paymentData.activeShiftId,
        paymentData.taxRate,
        paymentData.discountId?.toString(),
        totalDiscount,
        loyaltyProgram?.id || null
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (paymentData: Omit<PaymentData, 'taxRate' | 'discountAmount'> & { discountAmount?: number }) => {
    // Use the already calculated discount amount from the register UI
    // This prevents double-application of discounts
    const calculatedDiscountAmount = paymentData.discountAmount || 0;

    const fullPaymentData: PaymentData = {
      ...paymentData,
      taxRate,
      discountAmount: calculatedDiscountAmount,
      activeShiftId: activeShift?.id,
      cashierId: defaultCashierId
    };

    // Check if this is a loyalty points only transaction (zero dollar after redemption)
    if (paymentData.usePoints && paymentData.customerId) {
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const loyaltyDiscount = await calculateLoyaltyDiscount(paymentData.customerId, paymentData.usePoints, subtotal);
      const loyaltyProgram = await getActiveLoyaltyProgram();
      
      const totalDiscount = calculatedDiscountAmount + loyaltyDiscount;
      const afterDiscounts = subtotal - totalDiscount;
      const taxAmount = (afterDiscounts * taxRate) / 100;
      const finalTotal = afterDiscounts + taxAmount;
      
      console.log(`Calculated final total: ${finalTotal}, loyalty discount: ${loyaltyDiscount}`);
      
      // If final total is $0 or negative, handle as loyalty points only payment
      if (finalTotal <= 0) {
        console.log("Processing as loyalty points only payment (zero dollar transaction)");
        return handleLoyaltyPointsOnlyPayment(
          cart,
          paymentData.customerId,
          loyaltyProgram?.id || null,
          defaultCashierId,
          activeShift?.id,
          taxRate,
          selectedDiscount?.id?.toString(),
          calculatedDiscountAmount,
          (transactionId) => {
            setLastTransactionId(transactionId);
            if (onCompleteTransaction) {
              onCompleteTransaction(transactionId);
            }
            clearCart();
          }
        );
      }
    }

    if (paymentMethod === 'cash') {
      return processCashPayment(cart, fullPaymentData, (transactionId) => {
        setLastTransactionId(transactionId);
        if (onCompleteTransaction) {
          onCompleteTransaction(transactionId);
        }
        clearCart();
      });
    } else if (paymentMethod === 'card_reader') {
      // For card reader, process payment directly and show receipt on success
      try {
        await processCardReaderPayment(cart, fullPaymentData);
        // Payment successful, close payment sheet and show receipt
        setIsPaymentSheetOpen(false);
        setShowReceiptDialog(true);
      } catch (error) {
        // Payment failed, keep payment sheet open for retry
        console.error("Card reader payment failed:", error);
      }
    } else if (paymentMethod === 'credit') {
      const result = await processCardPayment(cart, fullPaymentData, false);
      if (result) {
        setClientSecret(result.clientSecret);
        setPendingCardTransaction(result.pendingTransaction);
        setIsCardModalOpen(true);
      }
      return result;
    } else if (paymentMethod === 'gift_card') {
      return processGiftCardPayment(cart, fullPaymentData, (transactionId) => {
        setLastTransactionId(transactionId);
        if (onCompleteTransaction) {
          onCompleteTransaction(transactionId);
        }
        clearCart();
      });
    }
  };

  const handleCardPaymentSuccess = () => {
    setIsCardModalOpen(false);
    setShowReceiptDialog(true);
    if (onCompleteTransaction && lastTransactionId) {
      onCompleteTransaction(lastTransactionId);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    // Only reset states that need to be cleared between payment attempts
    setIsCardModalOpen(false);
    setClientSecret(null);
    setPendingCardTransaction(null);
    setSelectedCustomer(null);
    // Don't reset lastTransactionId or showReceiptDialog here - they should persist for receipt display
    setPaymentMethod(method);
    setIsPaymentSheetOpen(true);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    // Calculate discount amount based on type
    let discountAmount = 0;
    if (selectedDiscount) {
      if (selectedDiscount.type === 'percentage') {
        discountAmount = (subtotal * selectedDiscount.value) / 100;
      } else {
        discountAmount = selectedDiscount.value;
      }
      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const finalTotal = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      finalTotal
    };
  };

  return {
    isProcessing,
    isPaymentSheetOpen,
    setIsPaymentSheetOpen,
    isCardModalOpen,
    setIsCardModalOpen,
    showReceiptDialog,
    setShowReceiptDialog,
    selectedCustomer,
    setSelectedCustomer,
    lastTransactionId,
    paymentMethod,
    setPaymentMethod,
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
  };
};
