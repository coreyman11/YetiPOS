
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useOffline } from '@/contexts/offline-context';
import { locationsApi } from './locations-api';

type LoyaltyProgram = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  points_per_dollar: number;
  minimum_points_redeem: number;
  points_value_cents: number;
  created_at: string;
};

type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

const DEFAULT_SETTINGS = {
  points_per_dollar: 1,
  minimum_points_redeem: 100,
  points_value_cents: 1,
};

export const loyaltyProgramApi = {
  getActivePrograms: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('is_active', true)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getAllPrograms: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  toggleProgramStatus: async (programId: number, isActive: boolean) => {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .update({ is_active: isActive })
      .eq('id', programId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  createProgram: async (program: Partial<LoyaltyProgram>) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('loyalty_programs')
      .insert({
        name: program.name,
        description: program.description,
        points_per_dollar: program.points_per_dollar ?? DEFAULT_SETTINGS.points_per_dollar,
        minimum_points_redeem: program.minimum_points_redeem ?? DEFAULT_SETTINGS.minimum_points_redeem,
        points_value_cents: program.points_value_cents ?? DEFAULT_SETTINGS.points_value_cents,
        location_id: location?.id
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  calculatePointsValue: async (points: number, programId?: number): Promise<number> => {
    try {
      const { data: settings } = await supabase
        .from('loyalty_program_settings')
        .select('points_value_cents')
        .limit(1)
        .single();

      if (!settings) {
        console.warn('No loyalty program settings found, using default value');
        return points * 0.01; // Default: 1 cent per point
      }

      return (points * settings.points_value_cents) / 100;
    } catch (error) {
      console.error('Error calculating points value:', error);
      return points * 0.01; // Fallback to default
    }
  },

  getTransactions: async (customerId: number) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching loyalty transactions:', error);
      throw error;
    }
    
    console.log(`Retrieved ${data?.length || 0} loyalty transactions for customer #${customerId}`);
    return data || [];
  },
  
  createTransaction: async (transactionData: Partial<LoyaltyTransaction>) => {
    try {
      const location = await locationsApi.getCurrentLocation();
      
      // Get current accurate balance by calculating from existing transactions
      const currentBalance = await getCustomerLoyaltyBalance(transactionData.customer_id!);
      
      // Calculate new balance
      let newBalance = currentBalance;
      if (transactionData.points_earned) {
        newBalance += transactionData.points_earned;
      }
      if (transactionData.points_redeemed) {
        newBalance -= transactionData.points_redeemed;
      }

      // Ensure balance doesn't go negative
      newBalance = Math.max(0, newBalance);

      console.log(`Creating loyalty transaction: Customer ${transactionData.customer_id}, Current: ${currentBalance}, New: ${newBalance}`);

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .insert({
          ...transactionData,
          points_balance: newBalance,
          location_id: location?.id || transactionData.location_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating loyalty transaction:', error);
        throw error;
      }

      // Always update customer's loyalty_points to stay in sync
      if (transactionData.customer_id) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ loyalty_points: newBalance })
          .eq('id', transactionData.customer_id);
          
        if (updateError) {
          console.error('Error updating customer loyalty points:', updateError);
        }
      }

      console.log(`Successfully created loyalty transaction with balance: ${newBalance}`);
      return data;
    } catch (error) {
      console.error('Failed to create loyalty transaction:', error);
      throw error;
    }
  },

  redeemPoints: async (customerId: number, totalAmount: number, transactionId: number, loyaltyProgramId?: number): Promise<void> => {
    const location = await locationsApi.getCurrentLocation();
    
    try {
      // Get current balance from customer table (more reliable than calculated balance)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('loyalty_points')
        .eq('id', customerId)
        .single();
      
      if (customerError || !customer) {
        throw new Error('Customer not found');
      }
      
      const currentBalance = customer.loyalty_points;

      // Get the specific program or the default active one
      let program;
      if (loyaltyProgramId) {
        const { data: specificProgram, error: programError } = await supabase
          .from('loyalty_programs')
          .select('*')
          .eq('id', loyaltyProgramId)
          .eq('is_active', true)
          .single();
        
        if (programError || !specificProgram) {
          throw new Error('Specified loyalty program not found or inactive');
        }
        program = specificProgram;
      } else {
        const { data: programs, error: programError } = await supabase
          .from('loyalty_programs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (programError) {
          console.error('Error fetching loyalty program:', programError);
          throw programError;
        }
        
        const defaultProgram = programs && programs.length > 0 ? programs[0] : null;
        if (!defaultProgram) {
          throw new Error('No active loyalty program found');
        }
        program = defaultProgram;
      }

      const pointValuePerPoint = program.points_value_cents / 100;
      
      const pointsNeededForPurchase = Math.ceil(totalAmount / pointValuePerPoint);
      
      const pointsToRedeem = Math.min(currentBalance, pointsNeededForPurchase);
      
      const redeemedValue = Math.min(totalAmount, pointsToRedeem * pointValuePerPoint);
      
      console.log(`Redeeming ${pointsToRedeem} points worth $${redeemedValue.toFixed(2)} for a $${totalAmount.toFixed(2)} purchase`);
      
      if (pointsToRedeem <= 0) {
        console.log('No points to redeem');
        return;
      }
      
      const newPointsBalance = currentBalance - pointsToRedeem;
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ loyalty_points: newPointsBalance })
        .eq('id', customerId);
      
      if (updateError) {
        console.error('Error updating customer loyalty points:', updateError);
        throw updateError;
      }
      
      const { error: transactionError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          transaction_id: transactionId,
          points_earned: null,
          points_redeemed: pointsToRedeem,
          points_balance: newPointsBalance,
          type: 'redeem',
          description: `Points redeemed for transaction #${transactionId}`,
          location_id: location?.id,
          loyalty_program_id: program.id
        });
      
      if (transactionError) {
        console.error('Error recording loyalty point redemption:', transactionError);
        throw transactionError;
      }
      
      console.log(`Redeemed ${pointsToRedeem} points for customer #${customerId}`);
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  },

  updateTransactionLocation: async (transactionId: number) => {
    const location = await locationsApi.getCurrentLocation();
    if (!location?.id) return;
    
    const { error } = await supabase
      .from('loyalty_transactions')
      .update({ location_id: location.id })
      .eq('transaction_id', transactionId)
      .is('location_id', null);
    
    if (error) {
      console.error('Error updating loyalty transaction location:', error);
      throw error;
    }
    
    return true;
  }
};

// Get accurate loyalty points balance from transactions
export const getCustomerLoyaltyBalance = async (customerId: number): Promise<number> => {
  try {
    const { data: transactions } = await supabase
      .from('loyalty_transactions')
      .select('points_earned, points_redeemed')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (!transactions || transactions.length === 0) {
      return 0;
    }

    // Calculate actual balance by summing all earned and subtracting all redeemed
    let balance = 0;
    for (const transaction of transactions) {
      if (transaction.points_earned) {
        balance += transaction.points_earned;
      }
      if (transaction.points_redeemed) {
        balance -= transaction.points_redeemed;
      }
    }

    return Math.max(0, balance); // Ensure balance never goes negative
  } catch (error) {
    console.error('Error calculating customer loyalty balance:', error);
    return 0;
  }
};

export const useLoyaltyTransactions = (customerId: number) => {
  const { getCachedLoyaltyTransactions, cacheLoyaltyTransactions } = useOffline();
  
  const fetchTransactionsWithCache = async () => {
    if (!customerId) return [];
    
    try {
      const cachedData = await getCachedLoyaltyTransactions(customerId);
      if (cachedData) {
        console.log(`Using cached loyalty transactions for customer #${customerId}`);
        return cachedData;
      }
      
      console.log(`Fetching loyalty transactions for customer #${customerId} from API`);
      const data = await loyaltyProgramApi.getTransactions(customerId);
      
      await cacheLoyaltyTransactions(customerId, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching loyalty transactions:', error);
      throw error;
    }
  };
  
  return { fetchTransactionsWithCache };
};
