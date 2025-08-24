
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { subDays } from 'https://esm.sh/date-fns@3.6.0';

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
    const { action, locationId, customerData, customerId } = requestData;

    switch (action) {
      case 'get_all':
        // Get customers with the latest loyalty points balance from loyalty_transactions
        const { data: customers, error: customersError } = await supabaseClient
          .from('customers')
          .select(`
            *,
            loyalty_transactions (
              points_balance,
              created_at
            )
          `)
          .eq('location_id', locationId)
          .order('created_at', { ascending: false });
        
        if (customersError) throw customersError;

        // Update each customer's loyalty_points with the most recent balance from loyalty_transactions
        const customersWithLatestPoints = customers?.map(customer => {
          // Sort loyalty transactions by created_at to get the most recent
          const sortedTransactions = customer.loyalty_transactions?.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          // Get the most recent points balance, fallback to customer table value
          const latestPointsBalance = sortedTransactions?.[0]?.points_balance ?? customer.loyalty_points;
          
          return {
            ...customer,
            loyalty_points: latestPointsBalance,
            // Remove the loyalty_transactions array from the response
            loyalty_transactions: undefined
          };
        }) || [];

        return new Response(JSON.stringify(customersWithLatestPoints), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_stats':
        const oneWeekAgo = subDays(new Date(), 7).toISOString();

        const { data: totalCustomers, error: totalError } = await supabaseClient
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('location_id', locationId);

        if (totalError) throw totalError;

        const { count: newCustomers, error: newError } = await supabaseClient
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('location_id', locationId)
          .gte('created_at', oneWeekAgo);

        if (newError) throw newError;

        return new Response(JSON.stringify({
          total: totalCustomers.length,
          newThisWeek: newCustomers || 0
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'get_transactions':
        const { data: transactions, error: transError } = await supabaseClient
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
          .eq('customer_id', customerId)
          .eq('location_id', locationId)
          .order('created_at', { ascending: false });
        
        if (transError) throw transError;
        return new Response(JSON.stringify(transactions || []), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'create':
        const { data: newCustomer, error: createError } = await supabaseClient
          .from('customers')
          .insert({
            ...customerData,
            location_id: locationId
          })
          .select()
          .single();
        
        if (createError) throw createError;
        return new Response(JSON.stringify(newCustomer), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'update':
        const { data: updatedCustomer, error: updateError } = await supabaseClient
          .from('customers')
          .update(customerData)
          .eq('id', customerId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedCustomer), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      case 'delete':
        const { error: deleteError } = await supabaseClient
          .from('customers')
          .delete()
          .eq('id', customerId);
        
        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error("Error in secure-customers-api:", error);
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
