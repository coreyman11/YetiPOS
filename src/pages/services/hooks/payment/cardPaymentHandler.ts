
import { supabase } from "@/lib/supabase";
import { CartItem } from "@/hooks/useCart";
import { SplitPayment } from "@/pages/services/hooks/payment/types";
import { stripePaymentsApi } from "@/services";
import { decrementInventory, validateInventoryAvailability } from "./inventoryUtils";
import { PendingTransaction } from "../payment/types";
import { toast } from "sonner";
import { loyaltyProgramApi } from "@/services";
import { locationsApi } from "@/services";

export const createPendingCardTransaction = async (
  cart: CartItem[],
  customerId: number | null,
  usePoints: boolean,
  cashierId?: string,
  giftCardId?: number,
  splitPayments?: SplitPayment[],
  totalAmount?: number,
  shiftId?: number | null,
  taxRate: number = 0,
  discountId?: string,
  discountAmount: number = 0,
  isCardReader: boolean = false,
  loyaltyProgramId?: number | null,
  storefrontCustomerId?: number | null
) => {
  try {
    // Use storefront customer if available and no other customer selected
    const effectiveCustomerId = customerId || storefrontCustomerId;
    // Calculate totals
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const finalTotal = afterDiscount + taxAmount;
    
    // Get total paid from split payments
    let totalPaid = 0;
    let amountToCharge = finalTotal;
    
    if (splitPayments && splitPayments.length > 0) {
      totalPaid = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
      amountToCharge = Math.max(0, finalTotal - totalPaid);
      
      // If fully paid by other methods, no need for card payment
      if (amountToCharge <= 0) {
        const pendingTransaction: PendingTransaction = {
          amount: finalTotal,
          amountToCharge: 0,
          customerId: effectiveCustomerId,
          usePoints,
          cashierId,
          giftCardId,
          splitPayments,
          items: cart.map(item => ({
            service_id: item.type === 'service' ? item.id : null,
            inventory_id: item.type === 'inventory' ? item.id : null,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal,
          taxAmount,
          taxRate,
          shiftId,
          loyaltyProgramId
        };
        
        return {
          pendingTransaction,
          clientSecret: "free_transaction"
        };
      }
    }

    const pendingTransaction: PendingTransaction = {
      amount: finalTotal,
      amountToCharge,
      customerId: effectiveCustomerId,
      usePoints,
      cashierId,
      giftCardId,
      splitPayments,
      items: cart.map(item => ({
        service_id: item.type === 'service' ? item.id : null,
        inventory_id: item.type === 'inventory' ? item.id : null,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      taxAmount,
      taxRate,
      shiftId,
      loyaltyProgramId
    };

    // For card reader payments, skip payment intent creation entirely
    // Let Stripe Terminal handle the complete payment process
    if (isCardReader) {
      console.log("Card reader payment - skipping payment intent creation, letting Terminal API handle everything");
      return {
        pendingTransaction,
        clientSecret: "card_reader_payment"
      };
    }

    // Only create payment intent for regular credit card payments
    if (amountToCharge > 0.01) {
      console.log(`Creating payment intent for regular credit card payment - amount: ${amountToCharge}, including tax amount: ${taxAmount}`);
      const paymentIntent = await stripePaymentsApi.createPaymentIntent(
        amountToCharge,
        { 
          subtotal: afterDiscount.toFixed(2), 
          taxAmount: taxAmount.toFixed(2),
          taxRate: taxRate.toFixed(2)
        }
      );

      return {
        pendingTransaction,
        clientSecret: paymentIntent.clientSecret
      };
    } else {
      return {
        pendingTransaction,
        clientSecret: "free_transaction"
      };
    }
  } catch (error) {
    console.error("Failed to create pending card transaction:", error);
    toast.error("Failed to process payment: " + (error.message || "Unknown error"));
    throw error;
  }
};

export const finalizeCardPayment = async (
  pendingTransaction: PendingTransaction,
  cart: CartItem[],
  onSuccess?: (transactionId: number) => void,
  paymentIntentId?: string,
  paymentMethodId?: string,
  last4?: string,
  brand?: string,
  discountId?: string
) => {
  try {
    // Validate inventory availability before finalizing payment
    await validateInventoryAvailability(cart);
    // Get the current location
    const { data: locationData } = await supabase
      .from('locations')
      .select('id')
      .limit(1)
      .single();
      
    const locationId = locationData?.id;
    
    // Extract discount info from the cart if available
    const discountAmount = pendingTransaction.subtotal - 
      (pendingTransaction.amountToCharge || pendingTransaction.amount) + 
      pendingTransaction.taxAmount;

    // Calculate total with discounts
    const totalAmount = pendingTransaction.amount;

    // Create a transaction record
    let transactionData: any = {
      payment_method: pendingTransaction.splitPayments && pendingTransaction.splitPayments.length > 0 ? 'split' : 'credit',
      customer_id: pendingTransaction.customerId,
      status: "completed",
      total_amount: totalAmount,
      subtotal: pendingTransaction.subtotal,
      tax_amount: pendingTransaction.taxAmount,
      tax_rate: pendingTransaction.taxRate,
      use_loyalty_points: pendingTransaction.usePoints,
      is_split_payment: pendingTransaction.splitPayments && pendingTransaction.splitPayments.length > 0,
      assigned_user_id: pendingTransaction.cashierId,
      gift_card_id: pendingTransaction.giftCardId,
      shift_id: pendingTransaction.shiftId,
      location_id: locationId,
      discount_total: discountAmount || 0,
      loyalty_program_id: pendingTransaction.loyaltyProgramId || null
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);
      toast.error("Failed to complete transaction: " + error.message);
      throw error;
    }

    // Create transaction items
    await Promise.all(
      cart.map(async (item) => {
        // Create transaction item
        const { error: itemError } = await supabase
          .from('transaction_items')
          .insert([{
            transaction_id: transaction.id,
            [item.type === 'service' ? 'service_id' : 'inventory_id']: item.id,
            quantity: item.quantity,
            price: item.price,
            location_id: locationId
          }]);

        if (itemError) {
          console.error("Error creating transaction item:", itemError);
          throw itemError;
        }

        // Decrement inventory if needed
        if (item.type === 'inventory') {
          await decrementInventory(item.id, item.quantity);
        }
      })
    );

    // If we have a discount, record it
    if (discountId && discountAmount > 0) {
      const { error: discountError } = await supabase
        .from('transaction_discounts')
        .insert([{
          transaction_id: transaction.id,
          discount_id: discountId,
          discount_amount: discountAmount,
          location_id: locationId
        }]);

      if (discountError) {
        console.error("Error recording discount:", discountError);
      }
    }

    // Handle split payments if any
    if (pendingTransaction.splitPayments && pendingTransaction.splitPayments.length > 0) {
      const paymentPromises = pendingTransaction.splitPayments.map(payment => {
        return supabase
          .from('payment_splits')
          .insert([{
            transaction_id: transaction.id,
            payment_method: payment.payment_method,
            amount: payment.amount,
            gift_card_id: payment.gift_card_id,
            location_id: locationId
          }]);
      });

      // Add the card payment to split payments if needed
      if (pendingTransaction.amountToCharge && pendingTransaction.amountToCharge > 0) {
        paymentPromises.push(
          supabase
            .from('payment_splits')
            .insert([{
              transaction_id: transaction.id,
              payment_method: 'credit',
              amount: pendingTransaction.amountToCharge,
              location_id: locationId
            }])
        );
      }

      await Promise.all(paymentPromises);
    }

    // Record the Stripe payment if we have payment details
    if (paymentIntentId) {
      const { error: stripeError } = await supabase
        .from('stripe_payments')
        .insert([{
          transaction_id: transaction.id,
          amount: pendingTransaction.amountToCharge || pendingTransaction.amount,
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId,
          payment_status: 'succeeded',
          card_last4: last4,
          card_brand: brand
        }]);

      if (stripeError) {
        console.error("Error recording Stripe payment:", stripeError);
      }
    }

    // Handle loyalty points
    if (pendingTransaction.customerId) {
      try {
        if (pendingTransaction.usePoints) {
          // Redeem loyalty points
          await loyaltyProgramApi.redeemPoints(
            pendingTransaction.customerId, 
            totalAmount, 
            transaction.id,
            pendingTransaction.loyaltyProgramId
          );
        } else {
          // Award loyalty points for this transaction
          const pointsEarned = await loyaltyProgramApi.calculatePointsValue(totalAmount);
          if (pointsEarned > 0) {
            await loyaltyProgramApi.createTransaction({
              customer_id: pendingTransaction.customerId,
              transaction_id: transaction.id,
              points_earned: pointsEarned,
              points_redeemed: null,
              points_balance: 0, // Will be calculated by the API
              type: 'earn',
              description: `Points earned from transaction #${transaction.id}`,
              location_id: locationId,
              loyalty_program_id: pendingTransaction.loyaltyProgramId
            });
          }
        }
      } catch (loyaltyError) {
        console.error("Error processing loyalty points:", loyaltyError);
        // Don't throw here, just log the error so the transaction still completes
      }
    }

    // Create a receipt for the transaction
    try {
      console.log("Creating receipt for transaction:", transaction.id);
      const { data: receiptSettings } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      
      const defaultTemplate = `
        <div class="receipt">
          <h3>Transaction Receipt</h3>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Date: {{date}}</p>
          <p>Total: ${{totalAmount}}</p>
        </div>
      `;

      const receiptData = {
        transaction_id: transaction.id,
        template: receiptSettings?.template_id || defaultTemplate,
        location_id: locationId,
        status: 'pending'
      };

      const { error: receiptError } = await supabase
        .from('receipts')
        .insert([receiptData]);

      if (receiptError) {
        console.error("Error creating receipt:", receiptError);
        // Don't throw here, just log the error so the transaction still completes
      } else {
        console.log("Receipt created successfully for transaction:", transaction.id);
      }
    } catch (receiptError) {
      console.error("Exception creating receipt:", receiptError);
      // Don't throw here, just log the error so the transaction still completes
    }

    if (onSuccess) {
      onSuccess(transaction.id);
    }

    return transaction;
  } catch (error) {
    console.error("Failed to finalize card payment:", error);
    toast.error("Payment failed: " + (error.message || "Unknown error"));
    throw error;
  }
};
