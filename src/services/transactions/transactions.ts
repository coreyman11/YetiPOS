
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { giftCardsApi } from '@/services';
import { SplitPayment } from '../gift-cards/types';
import { toast } from 'sonner';
import { locationsApi } from '../locations-api';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export const getAll = async () => {
  try {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

export const getPage = async (page: number, pageSize: number) => {
  try {
    const location = await locationsApi.getCurrentLocation();
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching transactions page ${page}:`, error);
    throw error;
  }
};

export const create = async (
  transaction: Omit<Transaction, 'id' | 'created_at'>,
  items: Array<{
    service_id: number | null;
    inventory_id: number | null;
    quantity: number;
    price: number;
    location_id?: string;
  }>,
) => {
  try {
    if (!transaction.location_id) {
      const location = await locationsApi.getCurrentLocation();
      transaction.location_id = location?.id;
    }

    if (transaction.is_split_payment) {
      console.log("Creating a split payment transaction");
      
      if (transaction.gift_card_id) {
        console.log(`Checking if gift card ${transaction.gift_card_id} has already been charged`);
        
        const { data: existingGiftCardTransactions } = await supabase
          .from('gift_card_transactions')
          .select('*')
          .eq('gift_card_id', transaction.gift_card_id)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (existingGiftCardTransactions && existingGiftCardTransactions.length > 0) {
          const recentTransactions = existingGiftCardTransactions.filter(tx => {
            const txTime = new Date(tx.created_at).getTime();
            const oneMinuteAgo = Date.now() - 60000;
            return txTime > oneMinuteAgo;
          });
          
          if (recentTransactions.length > 0) {
            console.log("Recently processed gift card transaction found, skipping to prevent duplication");
            toast.info("This transaction was already processed");
            throw new Error("This gift card has already been processed in the last minute. Please wait and try again if needed.");
          }
        }
      }
    }

    const { data: activePrograms } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('is_active', true)
      .eq('location_id', transaction.location_id)
      .order('created_at', { ascending: false })
      .limit(1);

    const program = activePrograms?.[0];
    if (!program) throw new Error('No active loyalty program found');

    let finalAmount = transaction.total_amount;
    let pointsRedeemed = 0;
    let originalPoints = 0;
    let newPointsBalance = 0;

    console.log("Transaction use_loyalty_points flag:", transaction.use_loyalty_points);
    
    if (transaction.use_loyalty_points && transaction.customer_id) {
      console.log("Loyalty points redemption requested for customer:", transaction.customer_id);
      
      const { data: customer } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', transaction.customer_id)
        .single();

      if (customer) {
        originalPoints = customer.loyalty_points;
        console.log(`Customer has ${originalPoints} loyalty points`);
        
        // Calculate maximum points value in dollars
        const maxPointsValue = (originalPoints * program.points_value_cents) / 100;
        console.log(`Maximum points value: $${maxPointsValue.toFixed(2)}`);
        
        if (maxPointsValue >= transaction.total_amount) {
          // Customer has enough points to cover the entire transaction
          const pointsNeeded = Math.ceil((transaction.total_amount * 100) / program.points_value_cents);
          pointsRedeemed = pointsNeeded;
          newPointsBalance = originalPoints - pointsRedeemed;
          finalAmount = 0;
          console.log(`Used ${pointsRedeemed} points to cover the entire transaction. New balance: ${newPointsBalance}`);
        } else {
          // Customer doesn't have enough points to cover the entire transaction
          pointsRedeemed = originalPoints;
          newPointsBalance = 0;
          finalAmount = transaction.total_amount - maxPointsValue;
          console.log(`Used all ${pointsRedeemed} points for partial payment. Remaining amount: $${finalAmount.toFixed(2)}`);
        }
        
        // Update customer's loyalty points balance
        const { error: updateError } = await supabase
          .from('customers')
          .update({ loyalty_points: newPointsBalance })
          .eq('id', transaction.customer_id);
          
        if (updateError) {
          console.error('Error updating customer loyalty points:', updateError);
          throw updateError;
        }
        
        console.log(`Updated customer ${transaction.customer_id} loyalty points from ${originalPoints} to ${newPointsBalance}`);
      }
    }

    if (transaction.payment_method === 'gift_card' && transaction.gift_card_id && !transaction.is_split_payment) {
      const { data: giftCard } = await supabase
        .from('gift_cards')
        .select(`
          id, 
          card_number,
          current_balance,
          is_active,
          gift_card_transactions (
            id,
            balance_after, 
            created_at
          )
        `)
        .eq('id', transaction.gift_card_id)
        .single();

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      if (!giftCard.is_active) {
        throw new Error('Gift card is not active');
      }

      let currentBalance = giftCard.current_balance;
      if (giftCard.gift_card_transactions && giftCard.gift_card_transactions.length > 0) {
        const sortedTransactions = [...giftCard.gift_card_transactions]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        currentBalance = sortedTransactions[0].balance_after;
      }

      console.log(`Gift card ${giftCard.card_number} checked balance: ${currentBalance}, needed: ${finalAmount}`);

      if (currentBalance < finalAmount) {
        throw new Error(`Insufficient gift card balance. Available: $${currentBalance.toFixed(2)}, Required: $${finalAmount.toFixed(2)}`);
      }
    }

    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        total_amount: finalAmount
      })
      .select()
      .single();
    
    if (transactionError) throw transactionError;

    const transactionItems = items.map(item => ({
      transaction_id: transactionData.id,
      ...item,
      location_id: item.location_id || transaction.location_id
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems);
    
    if (itemsError) throw itemsError;

    if (transaction.customer_id && transaction.use_loyalty_points && pointsRedeemed > 0) {
      // Create loyalty transaction record for the points redemption
      console.log(`Creating loyalty redemption record for ${pointsRedeemed} points`);
      
      const { error: loyaltyError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: transaction.customer_id,
          transaction_id: transactionData.id,
          points_earned: null,
          points_redeemed: pointsRedeemed,
          points_balance: newPointsBalance,
          type: 'redeem',
          location_id: transaction.location_id,
          description: `Redeemed ${pointsRedeemed} points for $${(pointsRedeemed * program.points_value_cents / 100).toFixed(2)} discount`
        });

      if (loyaltyError) {
        console.error('Error creating loyalty transaction record:', loyaltyError);
        throw loyaltyError;
      }
      
      console.log(`Created loyalty transaction record for ${pointsRedeemed} redeemed points`);
    }

    console.log("Updating inventory quantities for items:", items);
    for (const item of items) {
      if (item.inventory_id) {
        try {
          console.log(`Adjusting inventory for item ${item.inventory_id}, quantity: -${item.quantity}`);
          const { error: inventoryError } = await supabase.rpc('adjust_inventory_quantity', {
            p_inventory_id: item.inventory_id,
            p_adjustment: -item.quantity
          });
          
          if (inventoryError) {
            console.error('Error adjusting inventory:', inventoryError);
          }
        } catch (inventoryAdjustError) {
          console.error('Exception in inventory adjustment:', inventoryAdjustError);
        }
      }
    }

    return transactionData;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const createSplitPayments = async (
  transactionId: number,
  splitPayments: SplitPayment[]
) => {
  try {
    const { data: existingPayments, error: checkError } = await supabase
      .from('payment_splits') // FIXED: Changed from split_payments to payment_splits
      .select('*')
      .eq('transaction_id', transactionId);
    
    if (checkError) throw checkError;
    
    if (existingPayments && existingPayments.length > 0) {
      console.log('Split payments already exist for this transaction, skipping creation');
      return existingPayments;
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('location_id')
      .eq('id', transactionId)
      .single();
    
    if (transactionError) throw transactionError;
    
    const paymentsWithLocation = splitPayments.map(payment => ({
      ...payment,
      location_id: transaction.location_id
    }));

    return await giftCardsApi.createSplitPayment(transactionId, paymentsWithLocation);
  } catch (error) {
    console.error('Error creating split payments:', error);
    throw error;
  }
};

export const getById = async (id: number) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching transaction ${id}:`, error);
    throw error;
  }
};

export const getRecent = async (limit = 5) => {
  try {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        customers (*),
        transaction_items (
          *,
          services (*),
          inventory (*)
        )
      `)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    throw error;
  }
};

export const getCount = async () => {
  try {
    const location = await locationsApi.getCurrentLocation();
    
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', location?.id);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting transactions:', error);
    throw error;
  }
};
