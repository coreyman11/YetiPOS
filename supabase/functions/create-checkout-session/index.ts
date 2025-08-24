import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // You may want to restrict this to your domain in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to redact sensitive information in logs
const redactSensitiveInfo = (obj, sensitiveKeys = ['card', 'token', 'key', 'secret', 'password', 'auth', 'token', 'session']) => {
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
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Basic rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    // MODIFIED: Allow public access for store checkout while maintaining auth for admin functions
    // This is a public endpoint used by the store, so we don't require authentication
    // Get the Stripe secret key from environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('Missing STRIPE_SECRET_KEY environment variable');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing Stripe secret key'
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 500,
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", redactSensitiveInfo(e));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: e.message
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    const { lineItems, successUrl, cancelUrl, customerEmail, metadata, platformFeeCents, connectedAccountId: bodyConnectedAccountId } = body;
    
    const connectedAccountId = bodyConnectedAccountId || Deno.env.get('STRIPE_CONNECTED_ACCOUNT_ID') || null;
    
    // Redact and log the request details
    const safeMetadata = redactSensitiveInfo(metadata || {});
    // SECURITY: Minimal logging for production security
    console.log("Creating checkout session:", { 
      lineItemsCount: lineItems?.length || 0, 
      hasCustomerEmail: !!customerEmail,
      hasMetadata: !!metadata
    });

    // Fix: Process line items to remove empty descriptions
    const processedLineItems = lineItems.map(item => {
      // Create a deep copy to avoid modifying the original
      const processedItem = JSON.parse(JSON.stringify(item));
      
      // Handle empty description in product_data
      if (processedItem.price_data && 
          processedItem.price_data.product_data && 
          processedItem.price_data.product_data.description === "") {
        // Remove the description property entirely rather than sending empty string
        delete processedItem.price_data.product_data.description;
      }
      
      return processedItem;
    });

    // SECURITY: Minimal logging in production
    console.log("Line items processed");

    // Additional validation
    if (!processedLineItems || !Array.isArray(processedLineItems) || processedLineItems.length === 0) {
      console.error("Invalid line items provided");
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request - empty cart'
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    if (!successUrl || !cancelUrl) {
      console.error("Missing success or cancel URL");
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters'
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    // Validate line items - using the processed items
    for (const item of processedLineItems) {
      if (!item.price_data || typeof item.price_data !== 'object') {
        console.error("Line item missing price_data:", redactSensitiveInfo(item));
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'Each line item must have price_data object'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      if (!item.price_data.currency) {
        console.error("Line item missing currency:", item);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'Each price_data must specify a currency'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      if (!item.price_data.product_data || typeof item.price_data.product_data !== 'object') {
        console.error("Line item missing product_data:", item);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'Each price_data must have product_data object'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      if (!item.price_data.product_data.name) {
        console.error("Line item missing product name:", item);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'Each product_data must have a name'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      if (typeof item.price_data.unit_amount !== 'number' || isNaN(item.price_data.unit_amount) || item.price_data.unit_amount <= 0) {
        console.error("Invalid unit_amount:", item.price_data.unit_amount);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'unit_amount must be a positive number'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
      
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        console.error("Invalid quantity:", item.quantity);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid line item', 
            details: 'quantity must be a positive number'
          }),
          {
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json',
            },
            status: 400,
          }
        );
      }
    }

    console.log("Line items validated successfully");

    // Create checkout session options
    const sessionOptions: any = {
      payment_method_types: ['card'],
      line_items: processedLineItems, // Use processed items here
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata || {},
      billing_address_collection: 'auto',
    };

    // Add application fee and transfer_data for Connect
    if (connectedAccountId || typeof platformFeeCents === 'number') {
      sessionOptions.payment_intent_data = {};
      if (typeof platformFeeCents === 'number') {
        sessionOptions.payment_intent_data.application_fee_amount = platformFeeCents;
      }
      if (connectedAccountId) {
        sessionOptions.payment_intent_data.transfer_data = { destination: connectedAccountId };
      }
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionOptions.customer_email = customerEmail;
    }

    // Only add shipping address collection for "ship" delivery method
    if (metadata?.deliveryMethod === 'ship') {
      sessionOptions.shipping_address_collection = {
        allowed_countries: ['US'],
      };
    }

    // Create a checkout session
    try {
      console.log("Creating Stripe checkout session with options:", JSON.stringify(redactSensitiveInfo(sessionOptions), null, 2));
      const session = await stripe.checkout.sessions.create(sessionOptions);

      console.log("Checkout session created:", { id: session.id, url: session.url });

      return new Response(
        JSON.stringify({ 
          checkoutUrl: session.url,
          sessionId: session.id
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    } catch (stripeError) {
      console.error("Stripe API error:", redactSensitiveInfo(stripeError));
      
      return new Response(
        JSON.stringify({ 
          error: 'Payment processing error'
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", redactSensitiveInfo(error));
    
      return new Response(
        JSON.stringify({ 
          error: 'Server error'
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 500,
        }
      );
  }
});
