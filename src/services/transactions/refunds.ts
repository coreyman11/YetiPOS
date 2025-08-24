
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import { locationsApi } from '../locations-api';

type Refund = Database['public']['Tables']['refunds']['Insert'];

export const createRefund = async (refund: Refund) => {
  try {
    // First check if refund amount is valid
    if (isNaN(Number(refund.refund_amount)) || Number(refund.refund_amount) <= 0) {
      throw new Error('Invalid refund amount');
    }

    // Ensure location_id is set if not provided
    if (!refund.location_id) {
      const location = await locationsApi.getCurrentLocation();
      refund.location_id = location?.id;
    }

    // Insert the refund record
    const { data, error } = await supabase
      .from('refunds')
      .insert(refund)
      .select()
      .single();
    
    if (error) throw error;

    // Convert transaction_id and amount to numbers to ensure they're properly formatted
    const transactionId = Number(refund.transaction_id);
    const refundAmount = Number(refund.refund_amount);

    // Update the transaction's refunded_amount using RPC function
    // Make sure we pass parameters in the correct order as defined in the SQL function
    const { error: updateError } = await supabase.rpc('add_to_refunded_amount', {
      p_transaction_id: transactionId,
      p_amount: refundAmount
    });
    
    if (updateError) throw updateError;
    
    // Update the refund record with completed status
    const { error: refundUpdateError } = await supabase
      .from('refunds')
      .update({ status: 'completed' })
      .eq('id', data.id);
    
    if (refundUpdateError) {
      console.warn('Failed to update refund status:', refundUpdateError);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating refund:', error);
    toast.error('Failed to process refund');
    throw error;
  }
};

export const getRefundsByTransactionId = async (transactionId: number) => {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('refunded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching refunds for transaction ${transactionId}:`, error);
    throw error;
  }
};

export const getAllRefunds = async () => {
  try {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('location_id', location?.id)
      .order('refunded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all refunds:', error);
    throw error;
  }
};
