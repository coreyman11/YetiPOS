import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Logging helper
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-ENGINE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep("Billing engine started");

    // Initialize Supabase with service role
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

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const requestData = await req.json();
    const { locationId } = requestData;

    logStep("Processing billing for location", { locationId });

    // Get billing settings for the location
    const { data: billingSettings } = await supabaseClient
      .from('billing_settings')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();

    const settings = billingSettings || {
      max_retry_attempts: 5,
      retry_delay_hours: 24,
      grace_period_days: 5,
      auto_suspend_after_grace: true,
      usage_calculation_method: 'transaction_count'
    };

    logStep("Retrieved billing settings", settings);

    // Get memberships that need billing
    const today = new Date();
    const { data: membershipsToBill } = await supabaseClient
      .from('customer_memberships')
      .select(`
        *,
        membership_plans (*),
        customers (*)
      `)
      .eq('location_id', locationId)
      .in('billing_type', ['hybrid_usage', 'hybrid_fixed']) // Handle both hybrid billing types
      .in('billing_status', ['active', 'trial', 'past_due'])
      .or(`next_billing_date.lte.${today.toISOString()},next_billing_date.is.null`);

    logStep("Found memberships to process", { count: membershipsToBill?.length || 0 });

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      trials_converted: 0,
      suspended: 0,
      errors: []
    };

    for (const membership of membershipsToBill || []) {
      try {
        logStep("Processing membership", { 
          membershipId: membership.id, 
          customerId: membership.customer_id,
          status: membership.billing_status 
        });

        // Check if membership is in trial
        if (membership.billing_status === 'trial') {
          const trialEndDate = new Date(membership.trial_end_date);
          if (today > trialEndDate) {
            // Convert trial to active billing
            await convertTrialToActive(supabaseClient, membership, stripe);
            results.trials_converted++;
            logStep("Trial converted to active", { membershipId: membership.id });
          }
          continue;
        }

        // Calculate usage and generate invoice
        const usageAmount = await calculateUsageAmount(supabaseClient, membership, settings);
        logStep("Calculated usage amount", { membershipId: membership.id, amount: usageAmount });

        if (usageAmount > 0) {
          const invoiceResult = await processPayment(supabaseClient, stripe, membership, usageAmount);
          
          if (invoiceResult.success) {
            results.successful++;
            // Update next billing date
            const nextBillingDate = new Date(today);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            
            await supabaseClient
              .from('customer_memberships')
              .update({
                last_billed_date: today.toISOString(),
                next_billing_date: nextBillingDate.toISOString(),
                failed_payment_attempts: 0,
                billing_status: 'active'
              })
              .eq('id', membership.id);

            // Create transaction record for successful recurring payment
            await supabaseClient
              .from('transactions')
              .insert({
                customer_id: membership.customer_id,
                location_id: membership.location_id,
                total_amount: usageAmount / 100, // Convert from cents to dollars
                payment_method: 'card', // Stripe payment
                status: 'completed',
                source: 'recurring',
                user_data: {
                  membership_id: membership.id,
                  invoice_id: invoiceResult.invoice?.id,
                  billing_cycle_id: invoiceResult.billingCycle?.id,
                  stripe_payment_intent_id: invoiceResult.paymentIntent?.id
                }
              });
              
            logStep("Payment successful, created transaction record and updated membership", { membershipId: membership.id });
          } else {
            results.failed++;
            const failedAttempts = (membership.failed_payment_attempts || 0) + 1;
            const gracePeriodEnd = new Date(today);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + settings.grace_period_days);

            let newStatus = 'past_due';
            if (failedAttempts >= settings.max_retry_attempts) {
              if (settings.auto_suspend_after_grace) {
                newStatus = 'suspended';
                results.suspended++;
              }
            }

            await supabaseClient
              .from('customer_memberships')
              .update({
                failed_payment_attempts: failedAttempts,
                billing_status: newStatus,
                grace_period_end: gracePeriodEnd.toISOString()
              })
              .eq('id', membership.id);

            logStep("Payment failed, updated membership", { 
              membershipId: membership.id, 
              attempts: failedAttempts,
              newStatus 
            });
          }
        }

        results.processed++;

      } catch (error) {
        logStep("Error processing membership", { 
          membershipId: membership.id, 
          error: error.message 
        });
        results.errors.push({
          membershipId: membership.id,
          error: error.message
        });
      }
    }

    logStep("Billing run completed", results);

    return new Response(JSON.stringify({
      success: true,
      results,
      processed_at: today.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logStep("ERROR in billing engine", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Helper function to convert trial to active billing
async function convertTrialToActive(supabaseClient: any, membership: any, stripe: any) {
  try {
    // Update membership status
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await supabaseClient
      .from('customer_memberships')
      .update({
        billing_status: 'active',
        trial_end_date: null,
        next_billing_date: nextBillingDate.toISOString()
      })
      .eq('id', membership.id);

    // Update trial record
    await supabaseClient
      .from('membership_trials')
      .update({
        converted: true,
        converted_at: new Date().toISOString()
      })
      .eq('customer_membership_id', membership.id);

    logStep("Trial converted successfully", { membershipId: membership.id });
  } catch (error) {
    logStep("Error converting trial", { membershipId: membership.id, error: error.message });
    throw error;
  }
}

// Helper function to calculate usage-based billing amount
async function calculateUsageAmount(supabaseClient: any, membership: any, settings: any) {
  try {
    const membershipPlan = membership.membership_plans;
    
    // For hybrid_fixed billing, just use the base price
    if (membership.billing_type === 'hybrid_fixed') {
      return membershipPlan.price_cents;
    }
    
    // For hybrid_usage billing, calculate usage-based charges
    const startDate = new Date(membership.last_billed_date || membership.current_period_start);
    const endDate = new Date();

    // Get usage data for the billing period
    const { data: usageData } = await supabaseClient
      .from('usage_tracking')
      .select('*')
      .eq('customer_membership_id', membership.id)
      .gte('tracking_date', startDate.toISOString().split('T')[0])
      .lt('tracking_date', endDate.toISOString().split('T')[0]);

    let totalAmount = membershipPlan.price_cents; // Base subscription fee

    // Calculate usage-based charges
    if (membershipPlan.usage_based && membershipPlan.usage_rate_cents > 0) {
      if (usageData && usageData.length > 0) {
        const totalTransactions = usageData.reduce((sum, day) => sum + (day.transaction_count || 0), 0);
        const usageCharge = totalTransactions * membershipPlan.usage_rate_cents;
        totalAmount += usageCharge;

        logStep("Usage calculation", {
          basePrice: membershipPlan.price_cents,
          transactions: totalTransactions,
          usageRate: membershipPlan.usage_rate_cents,
          usageCharge,
          totalAmount
        });
      }
    }

    return totalAmount;
  } catch (error) {
    logStep("Error calculating usage", { membershipId: membership.id, error: error.message });
    // Return base price on error
    return membership.membership_plans.price_cents;
  }
}

// Helper function to process payment via Stripe
async function processPayment(supabaseClient: any, stripe: any, membership: any, amount: number) {
  try {
    // Find or create Stripe customer
    let stripeCustomerId = membership.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: membership.customers.email,
        name: membership.customers.name,
        metadata: {
          customer_id: membership.customer_id,
          membership_id: membership.id
        }
      });
      stripeCustomerId = customer.id;

      // Update membership with Stripe customer ID
      await supabaseClient
        .from('customer_memberships')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', membership.id);
    }

    // Create invoice number
    const { data: invoiceNumberResult } = await supabaseClient
      .rpc('generate_invoice_number');
    const invoiceNumber = invoiceNumberResult || `INV-${Date.now()}`;

    // Create billing cycle record
    const { data: billingCycle } = await supabaseClient
      .from('billing_cycles')
      .insert({
        customer_membership_id: membership.id,
        cycle_start: membership.last_billed_date || membership.current_period_start,
        cycle_end: new Date().toISOString(),
        amount_cents: amount,
        status: 'pending',
        location_id: membership.location_id
      })
      .select()
      .single();

    // Get customer's payment methods - try multiple methods
    logStep("Retrieving customer payment methods", { customerId: stripeCustomerId });
    
    // First try to get attached payment methods
    let paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
      limit: 10
    });
    
    logStep("Found attached payment methods", { count: paymentMethods.data.length });
    
    // If no attached payment methods, try to get customer's default payment method from setup intents
    if (paymentMethods.data.length === 0) {
      logStep("No attached payment methods, checking setup intents");
      
      const setupIntents = await stripe.setupIntents.list({
        customer: stripeCustomerId,
        limit: 10
      });
      
      logStep("Found setup intents", { count: setupIntents.data.length });
      
      // Look for successful setup intents with payment methods
      for (const setupIntent of setupIntents.data) {
        if (setupIntent.status === 'succeeded' && setupIntent.payment_method) {
          // Attach the payment method to the customer if not already attached
          try {
            await stripe.paymentMethods.attach(setupIntent.payment_method as string, {
              customer: stripeCustomerId
            });
            logStep("Attached payment method from setup intent", { 
              paymentMethodId: setupIntent.payment_method 
            });
            
            // Refresh payment methods list
            paymentMethods = await stripe.paymentMethods.list({
              customer: stripeCustomerId,
              type: 'card',
              limit: 10
            });
            break;
          } catch (attachError) {
            logStep("Error attaching payment method", { 
              error: attachError.message,
              paymentMethodId: setupIntent.payment_method 
            });
          }
        }
      }
    }
    
    logStep("Final payment methods count", { count: paymentMethods.data.length });
    
    if (paymentMethods.data.length === 0) {
      throw new Error(`No payment methods found for customer ${stripeCustomerId}. Customer may need to add a payment method.`);
    }
    
    const paymentMethodId = paymentMethods.data[0].id;
    logStep("Using payment method", { paymentMethodId });

    // Create payment intent with attached payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      metadata: {
        membership_id: membership.id,
        customer_id: membership.customer_id,
        billing_cycle_id: billingCycle.id,
        invoice_number: invoiceNumber
      }
    });
    
    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    });

    // Create invoice record
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay

    const { data: invoice } = await supabaseClient
      .from('billing_invoices')
      .insert({
        customer_membership_id: membership.id,
        billing_cycle_id: billingCycle.id,
        invoice_number: invoiceNumber,
        amount_cents: amount,
        total_cents: amount,
        stripe_payment_intent_id: paymentIntent.id,
        due_date: dueDate.toISOString(),
        status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        paid_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null,
        location_id: membership.location_id,
        line_items: JSON.stringify([{
          description: `${membership.membership_plans.name} - Monthly Subscription`,
          amount: amount,
          quantity: 1
        }])
      })
      .select()
      .single();

    // Update billing cycle status
    await supabaseClient
      .from('billing_cycles')
      .update({
        status: paymentIntent.status === 'succeeded' ? 'processed' : 'pending',
        processed_at: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null
      })
      .eq('id', billingCycle.id);

    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntent,
      invoice,
      billingCycle
    };

  } catch (error) {
    logStep("Error processing payment", { membershipId: membership.id, error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}