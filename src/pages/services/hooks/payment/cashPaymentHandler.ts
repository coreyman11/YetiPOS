
import { supabase } from '@/lib/supabase';
import { locationsApi } from '@/services/locations-api';
import { loyaltyProgramApi } from '@/services/loyalty-program-api';
import { toast } from 'sonner';
import { CartItem } from "@/hooks/useCart";
import { SplitPayment } from "@/pages/services/hooks/payment/types";
import { decrementInventory, validateInventoryAvailability } from "./inventoryUtils";

export const handleCashPayment = async (
  cart: CartItem[],
  customerId: number | null,
  usePoints: boolean,
  cashierId: string | undefined,
  giftCardId: number | undefined,
  splitPayments: SplitPayment[] | undefined,
  cashReceived: number | null | undefined,
  finalTotal: number,
  handleTransactionCompleted: (transactionId: number) => void,
  activeShiftId: number | undefined,
  taxRate: number,
  discountId: number | undefined,
  discountAmount: number,
  loyaltyProgramId?: number | null,
  storefrontCustomerId?: number | null
) => {
  // Use storefront customer if available and no other customer selected
  const effectiveCustomerId = customerId || storefrontCustomerId;
  if (!activeShiftId) {
    console.error("No active shift found");
    toast.error("No active shift found. Please start a shift before processing payments.");
    throw new Error("No active shift found");
  }

  // Validate split payments
  if (splitPayments && splitPayments.length > 0) {
    let totalSplitAmount = 0;
    for (const payment of splitPayments) {
      totalSplitAmount += payment.amount || 0;
    }

    if (Math.abs(totalSplitAmount - finalTotal) > 0.01) {
      toast.error("The total amount of split payments does not match the final total.");
      throw new Error("Split payment amounts do not match the final total.");
    }
  }

  // Validate inventory availability before processing payment
  await validateInventoryAvailability(cart);

  // Get the current location
  const location = await locationsApi.getCurrentLocation();
  const locationId = location?.id;

  // Create transaction data
  const transactionData = {
    payment_method: 'cash',
    customer_id: effectiveCustomerId,
    status: 'completed',
    total_amount: finalTotal,
    subtotal: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    tax_amount: (finalTotal - cart.reduce((acc, item) => acc + item.price * item.quantity, 0 - discountAmount)),
    tax_rate: taxRate,
    use_loyalty_points: usePoints,
    assigned_user_id: cashierId || null,
    gift_card_id: giftCardId || null,
    is_split_payment: splitPayments && splitPayments.length > 0,
    shift_id: activeShiftId,
    discount_id: discountId ? discountId.toString() : null,
    discount_total: discountAmount,
    location_id: locationId,
    loyalty_program_id: loyaltyProgramId || null,
    notes: 'app_handled_loyalty' // Marker to prevent trigger conflicts
  };

  console.log('Creating transaction with location_id:', locationId);

  // Insert transaction into the database
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();

  if (transactionError) {
    console.error("Error creating transaction:", transactionError);
    toast.error("Failed to create transaction: " + transactionError.message);
    throw transactionError;
  }

  const transactionId = transaction.id;

  // Create transaction items
  const transactionItems = cart.map(item => ({
    transaction_id: transactionId,
    service_id: item.type === 'service' ? item.id : null,
    inventory_id: item.type === 'inventory' ? item.id : null,
    quantity: item.quantity,
    price: item.price,
    location_id: locationId
  }));

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(transactionItems);

  if (itemsError) {
    console.error("Error creating transaction items:", itemsError);
    toast.error("Failed to create transaction items: " + itemsError.message);

    // Optionally, attempt to delete the created transaction if items creation fails
    await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    throw itemsError;
  }

  // Decrement inventory quantities for inventory items
  for (const item of cart) {
    if (item.type === 'inventory') {
      try {
        await decrementInventory(item.id, item.quantity);
      } catch (error) {
        console.error(`Failed to decrement inventory for item ${item.id}:`, error);
        // Continue processing - inventory adjustment failure shouldn't block transaction
      }
    }
  }

  // If a discount was applied, also record it in the transaction_discounts table for backward compatibility
  if (discountId && discountAmount > 0) {
    const { error: discountError } = await supabase
      .from('transaction_discounts')
      .insert({
        transaction_id: transactionId,
        discount_id: discountId.toString(), // Convert to string since discount_id is uuid
        discount_amount: discountAmount,
        location_id: locationId
      });
    
    if (discountError) {
      console.error("Error recording discount:", discountError);
      // Non-critical error, don't throw
    }
  }

  // Handle split payments
  if (splitPayments && splitPayments.length > 0) {
    for (const payment of splitPayments) {
      const { error: splitPaymentError } = await supabase
        .from('payment_splits')
        .insert({
          transaction_id: transactionId,
          payment_method: payment.payment_method,
          amount: payment.amount,
          gift_card_id: payment.gift_card_id,
          location_id: locationId
        });

      if (splitPaymentError) {
        console.error("Error creating split payment:", splitPaymentError);
        toast.error("Failed to create split payment: " + splitPaymentError.message);
        throw splitPaymentError;
      }

      // Process gift card transactions for gift card payments
      if (payment.payment_method === 'gift_card' && payment.gift_card_id) {
        try {
          console.log(`Processing gift card transaction for card ID: ${payment.gift_card_id}, amount: ${payment.amount}`);
          
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
          
          console.log(`Gift card current balance from latest transaction: ${currentBalance}`);
          const newBalance = Math.max(0, currentBalance - payment.amount);
          console.log(`Calculated new balance: ${newBalance}`);
          
          // Create gift card transaction record
          const { error: gcTransactionError } = await supabase
            .from('gift_card_transactions')
            .insert({
              gift_card_id: payment.gift_card_id,
              transaction_id: transactionId,
              type: 'redeem',
              amount: payment.amount,
              balance_after: newBalance,
              location_id: locationId
            });
            
          if (gcTransactionError) {
            console.error("Error recording gift card transaction:", gcTransactionError);
            // Continue processing - non-critical error
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
  }

  // Calculate points earned - only if not using existing points
  if (!usePoints && effectiveCustomerId) {
    const pointsPerDollar = 1; // Assuming 1 point per dollar, adjust as needed
    const pointsEarned = Math.floor(finalTotal * pointsPerDollar);
    
    // Add loyalty points (earn)
    await handleLoyaltyPointsEarned(effectiveCustomerId, pointsEarned, transactionId, locationId, loyaltyProgramId);
  }
  
  // If using loyalty points, handle the redemption
  if (usePoints && effectiveCustomerId && loyaltyProgramId) {
    try {
      // Pass the final total so we only redeem enough points to cover the purchase
      await loyaltyProgramApi.redeemPoints(effectiveCustomerId, finalTotal, transactionId, loyaltyProgramId);
    } catch (error) {
      console.error('Error handling loyalty points redemption:', error);
      // Non-critical error, continue with transaction
    }
  }
  
  // Manually update the loyalty transactions to ensure location_id is set
  if (effectiveCustomerId && locationId) {
    try {
      // Small delay to ensure the trigger has completed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Updating loyalty transaction for transaction #${transactionId} with location_id: ${locationId}`);
      
      // Update the recently created loyalty transaction with the correct location_id
      const { error: updateError } = await supabase
        .from('loyalty_transactions')
        .update({ location_id: locationId })
        .eq('transaction_id', transactionId)
        .is('location_id', null);
      
      if (updateError) {
        console.error("Error updating loyalty transaction location:", updateError);
      } else {
        console.log("Successfully updated loyalty transaction with location_id");
      }
    } catch (e) {
      console.error("Error handling location update for loyalty transaction:", e);
    }
  }

  // Trigger transaction completion callback
  handleTransactionCompleted(transactionId);

  return transaction;
};

// Helper function to add loyalty points (earn)
const handleLoyaltyPointsEarned = async (
  customerId: number, 
  pointsEarned: number, 
  transactionId: number, 
  locationId?: string,
  loyaltyProgramId?: number | null
) => {
  if (!customerId || pointsEarned <= 0) return;
  
  try {
    console.log(`Handling loyalty points earned: ${pointsEarned} points for customer ${customerId}`);
    
    // Use the centralized API to create the transaction with proper balance calculation
    await loyaltyProgramApi.createTransaction({
      customer_id: customerId,
      transaction_id: transactionId,
      points_earned: pointsEarned,
      points_redeemed: null,
      type: 'earn',
      description: `Points earned from transaction #${transactionId}`,
      location_id: locationId,
      loyalty_program_id: loyaltyProgramId
    });
    
    console.log(`Successfully added ${pointsEarned} loyalty points for customer #${customerId}`);
  } catch (error) {
    console.error('Error handling loyalty points:', error);
    throw error;
  }
};
