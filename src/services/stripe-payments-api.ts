
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { redactSensitiveInfo } from '@/utils/secure-logging';

type StripePayment = Database['public']['Tables']['stripe_payments']['Insert']

export const stripePaymentsApi = {
  create: async (payment: StripePayment) => {
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase
      .from('stripe_payments')
      .insert(payment)
      .select()
      .single()

    if (error) throw error
    return data
  },

  getByTransactionId: async (transactionId: number) => {
    const session = await supabase.auth.getSession()
    if (!session.data.session) {
      throw new Error('Authentication required')
    }

    const { data, error } = await supabase
      .from('stripe_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error) throw error
    return data
  },

  createPaymentIntent: async (amount: number, metadata?: any) => {
    try {
      // Redact sensitive information before logging
      const safeMetadata = redactSensitiveInfo(metadata || {});
      console.log(`Creating payment intent with amount:`, amount, 'metadata:', safeMetadata);
      
      // Use the Supabase Edge Function directly instead of a custom endpoint
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount, metadata }
      });
      
      if (error) {
        console.error('Error from create-payment-intent function:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
}
