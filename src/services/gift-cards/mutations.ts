
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { CreateGiftCardParams, SplitPayment } from './types';
import { giftCardQueries } from './queries';
import { locationsApi } from '../locations-api';

export const giftCardMutations = {
  create: async ({ initialBalance, notes, manualCardNumber }: CreateGiftCardParams) => {
    const location = await locationsApi.getCurrentLocation();
    let cardNumber: string;
    
    if (manualCardNumber) {
      const existingCard = await giftCardQueries.checkExistingCard(manualCardNumber);
      if (existingCard) {
        throw new Error('Gift card number already exists');
      }
      cardNumber = manualCardNumber;
    } else {
      cardNumber = await giftCardQueries.generateCardNumber();
    }
    
    const { data: giftCard, error: createError } = await supabase
      .from('gift_cards')
      .insert({
        card_number: cardNumber,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        notes,
        location_id: location?.id,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) throw createError;
    return giftCard;
  },

  createSplitPayment: async (transactionId: number, payments: SplitPayment[]) => {
    // Check if payment splits already exist for this transaction
    const { data: existingPayments, error: checkError } = await supabase
      .from('payment_splits')
      .select('*')
      .eq('transaction_id', transactionId);
    
    if (checkError) {
      console.error('Error checking existing payments:', checkError);
      throw checkError;
    }
    
    // If payments already exist, don't create them again
    if (existingPayments && existingPayments.length > 0) {
      console.log('Payment splits already exist for this transaction, skipping creation');
      return existingPayments;
    }

    console.log(`Creating split payments for transaction ${transactionId}:`, payments);

    // Get location_id from transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('location_id')
      .eq('id', transactionId)
      .single();
      
    if (transactionError) {
      console.error('Error getting transaction:', transactionError);
      throw transactionError;
    }
    
    const locationId = transaction.location_id;

    for (const payment of payments) {
      if (payment.payment_method === 'gift_card' && payment.gift_card_number) {
        try {
          console.log(`Processing gift card payment with card number: ${payment.gift_card_number}`);
          
          // First check if the gift card exists and get its ID
          const giftCard = await giftCardQueries.checkExistingCard(payment.gift_card_number);
          
          if (!giftCard) {
            console.error(`Gift card not found: ${payment.gift_card_number}`);
            toast.error("Gift card not found");
            throw new Error('Gift card not found');
          }

          if (!giftCard.is_active) {
            toast.error("Gift card is not active");
            throw new Error('Gift card is not active');
          }

          // Calculate true current balance from latest transaction
          let currentBalance = giftCard.current_balance;
          console.log(`Gift card ${giftCard.id} (${payment.gift_card_number}) current balance: ${currentBalance}, payment amount: ${payment.amount}`);

          if (currentBalance < payment.amount) {
            toast.error("Insufficient gift card balance");
            throw new Error(`Insufficient gift card balance. Available: ${currentBalance.toFixed(2)}, Required: ${payment.amount.toFixed(2)}`);
          }

          // Calculate the new balance
          const newBalance = Math.max(0, currentBalance - payment.amount);

          // Create the gift card transaction record
          const { data: transactionData, error: transactionError } = await supabase
            .from('gift_card_transactions')
            .insert({
              gift_card_id: giftCard.id,
              transaction_id: transactionId,
              location_id: locationId,
              type: 'redeem',
              amount: payment.amount,
              balance_after: newBalance
            })
            .select()
            .single();

          if (transactionError) {
            console.error('Gift card transaction error:', transactionError);
            toast.error("Error recording gift card transaction");
            throw transactionError;
          }

          console.log(`Created gift card transaction: ${JSON.stringify(transactionData)}`);
          
          // Also update the card's current_balance field directly for consistency
          const { error: updateError } = await supabase
            .from('gift_cards')
            .update({ current_balance: newBalance, last_used_at: new Date().toISOString() })
            .eq('id', giftCard.id);
            
          if (updateError) {
            console.error("Error updating gift card balance:", updateError);
          } else {
            console.log(`Updated gift card ${giftCard.id} balance to ${newBalance}`);
          }

          // Create the payment split record with the identified gift card ID
          const { error: splitError } = await supabase
            .from('payment_splits')
            .insert({
              transaction_id: transactionId,
              payment_method: payment.payment_method,
              amount: payment.amount,
              location_id: locationId,
              gift_card_id: giftCard.id
            });

          if (splitError) {
            console.error('Payment split error:', splitError);
            toast.error("Error recording payment split");
            throw splitError;
          }

        } catch (error) {
          console.error('Gift card payment error:', error);
          toast.error(error instanceof Error ? error.message : "Error processing gift card payment");
          throw error;
        }
      } else {
        // For non-gift card payments, just create the payment split
        const { error: splitError } = await supabase
          .from('payment_splits')
          .insert({
            transaction_id: transactionId,
            payment_method: payment.payment_method,
            amount: payment.amount,
            location_id: locationId
          });

        if (splitError) {
          console.error('Payment split error:', splitError);
          toast.error("Error recording payment split");
          throw splitError;
        }
      }
    }
    
    console.log(`Successfully created all split payments for transaction ${transactionId}`);
  }
};
