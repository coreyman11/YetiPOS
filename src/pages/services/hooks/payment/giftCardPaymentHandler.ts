
import { supabase } from "@/lib/supabase";
import { CartItem } from "@/hooks/useCart";
import { SplitPayment } from "@/pages/services/hooks/payment/types";
import { decrementInventory, validateInventoryAvailability } from "./inventoryUtils";
import { toast } from "sonner";
import { loyaltyProgramApi } from "@/services";

export const handleGiftCardPayment = async (
  cart: CartItem[],
  customerId: number | null,
  usePoints: boolean,
  cashierId?: string,
  giftCardId?: number,
  splitPayments?: SplitPayment[],
  totalAmount?: number,
  onSuccess?: (transactionId: number) => void,
  shiftId?: number | null,
  taxRate: number = 0,
  discountId?: string,
  discountAmount: number = 0,
  loyaltyProgramId?: number | null
) => {
  try {
    // Validate inventory availability before processing payment
    await validateInventoryAvailability(cart);

    // Get the current location
    const { data: locationData } = await supabase
      .from('locations')
      .select('id')
      .limit(1)
      .single();
      
    const locationId = locationData?.id;
    
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const finalTotal = afterDiscount + taxAmount;

    // Create a transaction record
    let transactionData: any = {
      payment_method: splitPayments && splitPayments.length > 0 ? 'split' : 'gift_card',
      customer_id: customerId,
      status: "completed",
      total_amount: finalTotal,
      subtotal,
      tax_amount: taxAmount,
      tax_rate: taxRate,
      use_loyalty_points: usePoints,
      is_split_payment: splitPayments && splitPayments.length > 0,
      assigned_user_id: cashierId,
      gift_card_id: giftCardId,
      shift_id: shiftId,
      location_id: locationId,
      discount_total: discountAmount || 0,
      loyalty_program_id: loyaltyProgramId || null,
      notes: 'app_handled_loyalty' // Marker to prevent trigger conflicts
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

    // Handle inventory for all items in cart
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
    if (splitPayments && splitPayments.length > 0) {
      for (const payment of splitPayments) {
        const { error: splitError } = await supabase
          .from('payment_splits')
          .insert([{
            transaction_id: transaction.id,
            payment_method: payment.payment_method,
            amount: payment.amount,
            gift_card_id: payment.gift_card_id,
            location_id: locationId
          }]);
        
        if (splitError) {
          console.error('Payment split error:', splitError);
          throw splitError;
        }
        
        // Process gift card transactions for gift card payments
        if (payment.payment_method === 'gift_card' && payment.gift_card_id) {
          try {
            // Get current balance from latest transaction record, not just the card record
            const { data: giftCardData } = await supabase
              .from('gift_cards')
              .select(`
                id,
                current_balance,
                gift_card_transactions (
                  id, 
                  balance_after,
                  created_at
                )
              `)
              .eq('id', payment.gift_card_id)
              .single();
              
            if (!giftCardData) {
              console.error(`Gift card not found: ${payment.gift_card_id}`);
              continue;
            }
            
            // Get the true current balance from the most recent transaction
            let currentBalance = giftCardData.current_balance;
            if (giftCardData.gift_card_transactions && giftCardData.gift_card_transactions.length > 0) {
              const sortedTransactions = [...giftCardData.gift_card_transactions]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              currentBalance = sortedTransactions[0].balance_after;
            }
            
            const newBalance = Math.max(0, currentBalance - payment.amount);
            
            // Create gift card transaction record
            const { error: gcTransactionError } = await supabase
              .from('gift_card_transactions')
              .insert({
                gift_card_id: payment.gift_card_id,
                transaction_id: transaction.id,
                type: 'redeem',
                amount: payment.amount,
                balance_after: newBalance,
                location_id: locationId
              });
              
            if (gcTransactionError) {
              console.error("Error recording gift card transaction:", gcTransactionError);
            } else {
              console.log(`Gift card transaction recorded successfully, new balance: ${newBalance}`);
              
              // Also update the card's current_balance field directly for consistency
              const { error: updateError } = await supabase
                .from('gift_cards')
                .update({ current_balance: newBalance, last_used_at: new Date().toISOString() })
                .eq('id', payment.gift_card_id);
                
              if (updateError) {
                console.error("Error updating gift card balance:", updateError);
              }
            }
          } catch (gcError) {
            console.error("Error processing gift card transaction:", gcError);
            // Continue processing - non-critical error
          }
        }
      }
    } else if (transaction.payment_method === 'gift_card' && giftCardId) {
      // Handle single gift card payment (not split)
      try {
        // Get current balance from latest transaction record
        const { data: giftCardData } = await supabase
          .from('gift_cards')
          .select(`
            id,
            current_balance,
            gift_card_transactions (
              id, 
              balance_after,
              created_at
            )
          `)
          .eq('id', giftCardId)
          .single();
          
        if (!giftCardData) {
          console.error(`Gift card not found: ${giftCardId}`);
          throw new Error('Gift card not found');
        }
        
        // Get the true current balance from the most recent transaction
        let currentBalance = giftCardData.current_balance;
        if (giftCardData.gift_card_transactions && giftCardData.gift_card_transactions.length > 0) {
          const sortedTransactions = [...giftCardData.gift_card_transactions]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          currentBalance = sortedTransactions[0].balance_after;
        }
        
        const newBalance = Math.max(0, currentBalance - finalTotal);
        
        // Create gift card transaction record
        const { error: gcTransactionError } = await supabase
          .from('gift_card_transactions')
          .insert({
            gift_card_id: giftCardId,
            transaction_id: transaction.id,
            type: 'redeem',
            amount: finalTotal,
            balance_after: newBalance,
            location_id: locationId
          });
          
        if (gcTransactionError) {
          console.error("Error recording gift card transaction:", gcTransactionError);
        } else {
          // Also update the card's current_balance field directly for consistency
          const { error: updateError } = await supabase
            .from('gift_cards')
            .update({ current_balance: newBalance, last_used_at: new Date().toISOString() })
            .eq('id', giftCardId);
            
          if (updateError) {
            console.error("Error updating gift card balance:", updateError);
          }
        }
      } catch (gcError) {
        console.error("Error processing gift card transaction:", gcError);
        // Continue processing - non-critical error
      }
    }

    // Handle loyalty points
    if (customerId) {
      try {
        if (usePoints) {
          // Redeem loyalty points
          await loyaltyProgramApi.redeemPoints(
            customerId, 
            finalTotal, 
            transaction.id,
            loyaltyProgramId
          );
        } else {
          // Award loyalty points for this transaction
          const pointsEarned = await loyaltyProgramApi.calculatePointsValue(finalTotal);
          if (pointsEarned > 0) {
            await loyaltyProgramApi.createTransaction({
              customer_id: customerId,
              transaction_id: transaction.id,
              points_earned: pointsEarned,
              points_redeemed: null,
              points_balance: 0, // Will be calculated by the API
              type: 'earn',
              description: `Points earned from transaction #${transaction.id}`,
              location_id: locationId,
              loyalty_program_id: loyaltyProgramId
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
    console.error("Failed to process gift card payment:", error);
    toast.error("Payment failed: " + (error.message || "Unknown error"));
    throw error;
  }
};
