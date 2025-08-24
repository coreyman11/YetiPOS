
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestData = await req.json();
    const { action, shiftId } = requestData;

    switch (action) {
      case 'get_shift_sales':
        // Get all transactions for the shift
        const { data: transactions, error: transError } = await supabaseClient
          .from('transactions')
          .select(`
            id,
            total_amount,
            payment_method,
            is_split_payment,
            status
          `)
          .eq('shift_id', shiftId)
          .eq('status', 'completed');
        
        if (transError) throw transError;
        
        // Initialize sales object
        const sales: { [key: string]: number } = {
          cash: 0,
          credit: 0,
          gift_card: 0,
          other: 0
        };
        
        // Calculate sales by payment method
        if (transactions) {
          transactions.forEach(transaction => {
            if (!transaction.is_split_payment) {
              const method = transaction.payment_method;
              if (method in sales) {
                sales[method] += Number(transaction.total_amount);
              } else {
                sales.other += Number(transaction.total_amount);
              }
            }
          });
        }
        
        // Get split payments
        const splitTransactions = transactions?.filter(t => t.is_split_payment) || [];
        if (splitTransactions.length > 0) {
          const { data: splits, error: splitsError } = await supabaseClient
            .from('payment_splits')
            .select('amount, payment_method')
            .in('transaction_id', splitTransactions.map(t => t.id));
            
          if (!splitsError && splits) {
            splits.forEach(split => {
              const method = split.payment_method;
              if (method in sales) {
                sales[method] += Number(split.amount);
              } else {
                sales.other += Number(split.amount);
              }
            });
          }
        }
        
        return new Response(JSON.stringify(sales), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error("Error in secure-transactions-api:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        stack: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
