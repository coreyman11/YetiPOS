import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Get Stripe secret key from environment variable
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to redact sensitive information in logs
const redactSensitiveInfo = (obj, sensitiveKeys = ['card', 'token', 'key', 'secret', 'password', 'auth', 'session', 'email', 'address', 'phone', 'name']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = { ...obj };
  for (const key in redacted) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      redacted[key] = typeof redacted[key] === 'string' 
        ? `${redacted[key].substring(0, 4)}...${redacted[key].slice(-4)}`
        : '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveInfo(redacted[key], sensitiveKeys);
    }
  }
  return redacted;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiter using memory (will reset on function restart)
const ipRequests = new Map<string, {count: number, timestamp: number}>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  
  if (!record) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // Reset counter if window has passed
  if (now - record.timestamp > RATE_WINDOW) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // Increment and check
  if (record.count >= RATE_LIMIT) {
    return false; // Rate limited
  }
  
  record.count++;
  return true;
}

serve(async (req) => {
  // Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting to protect against brute force attacks
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { 
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing stripe signature or webhook secret');
    return new Response('Missing stripe signature or webhook secret', { 
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const body = await req.text();
    
    // Use async signature verification with proper error handling
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Processing Stripe event: ${event.type}`);

    // Handle specific events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      await handleCheckoutSessionCompleted(session);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    // Redact any sensitive information from the error before logging
    console.error(`Webhook Error:`, redactSensitiveInfo(err));
    return new Response(`Webhook Error: ${err.message}`, { 
      status: 400,
      headers: corsHeaders
    });
  }
});

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout session:', session.id);
    
    // Get payment intent details for additional data
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    console.log('Retrieved payment intent:', paymentIntent.id);
    
    // Extract metadata from the session
    const {
      customerName,
      customerEmail,
      customerAddress,
      deliveryMethod,
      subtotal,
      taxAmount,
      taxRate,
      source,
      storeId,
      locationId,
      cartItems,
      customerId,
      loyaltyPointsUsed,
      loyaltyDiscount,
    } = session.metadata || {};
    
    // Log complete metadata for debugging
    console.log('Complete session metadata:', redactSensitiveInfo(session.metadata || {}));
    
    // Explicitly log the source to help with debugging
    console.log(`Transaction source from metadata: "${source || 'not set'}"`);
    
    // Log metadata safely (redact any potentially sensitive fields)
    const safeMetadata = redactSensitiveInfo({
      customerName,
      customerEmail,
      deliveryMethod,
      source,
      storeId,
      locationId,
      cartItemsSummary: cartItems ? JSON.parse(cartItems).length : 0
    });
    
    console.log('Session metadata:', safeMetadata);
    
    // Parse cart items from the metadata
    let items = [];
    try {
      items = cartItems ? JSON.parse(cartItems) : [];
      console.log(`Successfully parsed ${items.length} cart items`);
    } catch (e) {
      console.error('Error parsing cart items:', e);
      console.log('Raw cart items data:', cartItems);
      items = [];
    }
    
    console.log(`Processing ${items.length} cart items`);
    
    if (items.length === 0) {
      console.error('No items found in cart data');
      return;
    }

    // Ensure source is correctly set - prioritize value from metadata or default to 'online_store'
    const transactionSource = source || 'online_store';
    console.log(`Transaction source set to: ${transactionSource}`);
    
    // Determine customer ID - first try from metadata, then lookup by email
    let finalCustomerId = null;
    if (customerId) {
      finalCustomerId = parseInt(customerId);
      console.log(`Using customer ID from metadata: ${finalCustomerId}`);
    } else if (customerEmail && locationId) {
      // Fallback: lookup customer by email and location
      console.log(`Looking up customer by email: ${customerEmail.substring(0, 4)}...`);
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .eq('location_id', locationId)
        .single();
      
      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
        console.log(`Found existing customer by email: ${finalCustomerId}`);
      }
    }
    
    // Create transaction
    const usedLoyaltyPoints = loyaltyPointsUsed ? parseInt(loyaltyPointsUsed) > 0 : false;
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        payment_method: 'credit',
        customer_id: finalCustomerId, // Use the determined customer ID
        status: 'completed',
        total_amount: parseFloat(session.amount_total) / 100, // convert from cents
        subtotal: parseFloat(subtotal || session.amount_subtotal / 100),
        tax_amount: parseFloat(taxAmount || (session.amount_total - session.amount_subtotal) / 100),
        tax_rate: parseFloat(taxRate || 0),
        use_loyalty_points: usedLoyaltyPoints,
        assigned_user_id: null,
        gift_card_id: null,
        is_split_payment: false,
        source: transactionSource, // Use the verified source value
        store_id: storeId ? parseInt(storeId) : null,
        location_id: locationId || null
      })
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error creating transaction:', redactSensitiveInfo(transactionError));
      throw transactionError;
    }
    
    console.log('Transaction created successfully:', transaction.id);
    
    // Create transaction items
    const transactionItems = items.map(item => ({
      transaction_id: transaction.id,
      service_id: item.service_id || null,
      inventory_id: item.inventory_id || null,
      quantity: item.quantity,
      price: item.price,
      location_id: locationId || null // Ensure location_id is passed here
    }));
    
    console.log('Preparing to insert transaction items:', transactionItems.length);
    
    const { data: insertedItems, error: itemsError } = await supabase
      .from('transaction_items')
      .insert(transactionItems)
      .select();
    
    if (itemsError) {
      console.error('Error creating transaction items:', redactSensitiveInfo(itemsError));
      throw itemsError;
    }
    
    console.log(`Added ${insertedItems?.length || 0} transaction items`);
    
    // Record Stripe payment - but redact sensitive card information in logs
    const safePaymentInfo = redactSensitiveInfo({
      payment_intent_id: session.payment_intent,
      payment_method_id: paymentIntent.payment_method,
      card_brand: paymentIntent.payment_method_details?.card?.brand || null,
      card_last4: paymentIntent.payment_method_details?.card?.last4 || null
    });
    
    console.log('Recording payment with details:', safePaymentInfo);
    
    const { error: paymentError } = await supabase
      .from('stripe_payments')
      .insert({
        transaction_id: transaction.id,
        payment_intent_id: session.payment_intent,
        payment_method_id: paymentIntent.payment_method,
        payment_status: paymentIntent.status,
        amount: parseFloat(session.amount_total) / 100,
        currency: session.currency,
        card_brand: paymentIntent.payment_method_details?.card?.brand || null,
        card_last4: paymentIntent.payment_method_details?.card?.last4 || null
      });
    
    if (paymentError) {
      console.error('Error recording payment:', redactSensitiveInfo(paymentError));
      throw paymentError;
    }
    
    console.log('Payment record created');
    
    // Update inventory quantities
    for (const item of items) {
      if (item.inventory_id) {
        console.log(`Adjusting inventory for item ${item.inventory_id}, quantity: -${item.quantity}`);
        const { data: inventoryResult, error: inventoryError } = await supabase.rpc('adjust_inventory_quantity', {
          p_inventory_id: item.inventory_id,
          p_adjustment: -item.quantity
        });
        
        if (inventoryError) {
          console.error('Error adjusting inventory:', redactSensitiveInfo(inventoryError));
          // Continue processing other items even if this one fails
        } else {
          console.log('Inventory adjusted successfully');
        }
      }
    }
    
    // Handle loyalty points and location updates for customer transactions
    if (transaction.customer_id && locationId) {
      try {
        // Handle loyalty points redemption if used
        if (usedLoyaltyPoints && loyaltyPointsUsed && loyaltyDiscount) {
          const pointsRedeemed = parseInt(loyaltyPointsUsed);
          const discountAmount = parseFloat(loyaltyDiscount);
          
          console.log(`Processing loyalty points redemption: ${pointsRedeemed} points for $${discountAmount} discount`);
          
          // Get current customer balance
          const { data: currentBalance } = await supabase
            .from('loyalty_transactions')
            .select('points_balance')
            .eq('customer_id', transaction.customer_id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const previousBalance = currentBalance?.[0]?.points_balance || 0;
          const newBalance = previousBalance - pointsRedeemed;
          
          // Create redemption transaction record
          const { error: redeemError } = await supabase
            .from('loyalty_transactions')
            .insert({
              customer_id: transaction.customer_id,
              transaction_id: transaction.id,
              points_earned: 0,
              points_redeemed: pointsRedeemed,
              points_balance: newBalance,
              type: 'redeem',
              description: `Points redeemed from storefront purchase #${transaction.id}`,
              location_id: locationId
            });
          
          if (redeemError) {
            console.error('Error recording loyalty redemption:', redactSensitiveInfo(redeemError));
          } else {
            // Update customer's loyalty points balance
            await supabase
              .from('customers')
              .update({ loyalty_points: newBalance })
              .eq('id', transaction.customer_id);
            
            console.log(`Successfully redeemed ${pointsRedeemed} points for customer ${transaction.customer_id}`);
          }
        }
        
        // Small delay to ensure the trigger has completed for earning points
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`Processing loyalty points for customer ${transaction.customer_id} from transaction #${transaction.id}`);
        
        // Update any loyalty transactions to ensure they have location_id
        const { error: updateError } = await supabase
          .from('loyalty_transactions')
          .update({ location_id: locationId })
          .eq('transaction_id', transaction.id)
          .is('location_id', null);
        
        if (updateError) {
          console.error('Error updating loyalty transaction location:', redactSensitiveInfo(updateError));
        } else {
          console.log("Successfully updated loyalty transaction with location_id");
        }

        // Verify loyalty points were processed correctly
        const { data: loyaltyTransactions } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('transaction_id', transaction.id);
        
        if (loyaltyTransactions && loyaltyTransactions.length > 0) {
          console.log(`Found ${loyaltyTransactions.length} loyalty transaction(s) for transaction ${transaction.id}`);
        } else {
          console.log(`No loyalty transactions found for transaction ${transaction.id} - this may be expected if loyalty is not configured`);
        }
      } catch (e) {
        console.error("Error handling loyalty processing:", redactSensitiveInfo(e));
      }
    } else if (transaction.customer_id) {
      console.log(`Customer transaction ${transaction.id} processed but no location_id available for loyalty processing`);
    } else {
      console.log(`Anonymous transaction ${transaction.id} processed - no loyalty points awarded`);
    }
    
    console.log('Checkout session processing completed successfully');

  } catch (error) {
    console.error('Error handling checkout session:', redactSensitiveInfo(error));
  }
}
