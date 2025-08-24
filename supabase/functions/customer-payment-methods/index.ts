import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CUSTOMER-PAYMENT-METHODS] Function started');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, customer_id, customer_email, card, payment_method_id } = await req.json();
    console.log('[CUSTOMER-PAYMENT-METHODS] Request data:', { action, customer_id, customer_email });

    // Validate email format if provided
    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      console.error('[CUSTOMER-PAYMENT-METHODS] Invalid email format:', customer_email);
      return new Response(JSON.stringify({ 
        error: `Invalid email format: ${customer_email}. Please provide a valid email address.` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      // Get customer's stripe_customer_id
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', customer_id)
        .single();

      if (!customer?.stripe_customer_id) {
        return new Response(JSON.stringify({ payment_methods: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.stripe_customer_id,
        type: 'card',
      });

      const formattedMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        last4: pm.card?.last4,
        brand: pm.card?.brand,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
        is_default: false, // You can implement default logic later
      }));

      return new Response(JSON.stringify({ payment_methods: formattedMethods }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      // Get or create Stripe customer
      let stripeCustomerId;
      const { data: customer } = await supabaseClient
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', customer_id)
        .single();

      if (customer?.stripe_customer_id) {
        stripeCustomerId = customer.stripe_customer_id;
      } else {
        const stripeCustomer = await stripe.customers.create({
          email: customer_email,
        });
        stripeCustomerId = stripeCustomer.id;

        await supabaseClient
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', customer_id);
      }

      // Use Stripe's test card tokens instead of raw card data
      let paymentMethodId;
      
      // Check if this is a test card number
      const testCardNumbers = {
        '4242424242424242': 'pm_card_visa',
        '4000056655665556': 'pm_card_visa_debit',
        '5555555555554444': 'pm_card_mastercard',
        '2223003122003222': 'pm_card_mastercard',
        '4000002760003184': 'pm_card_threeDSecure2Required',
      };

      const cleanNumber = card.number.replace(/\s/g, '');
      
      if (testCardNumbers[cleanNumber]) {
        // Use test payment method
        paymentMethodId = testCardNumbers[cleanNumber];
        
        // Attach test payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });
      } else {
        // For production or when raw card data is enabled
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: card.number,
            exp_month: card.exp_month,
            exp_year: card.exp_year,
            cvc: card.cvc,
          },
        });

        // Attach to customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: stripeCustomerId,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      await stripe.paymentMethods.detach(payment_method_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});