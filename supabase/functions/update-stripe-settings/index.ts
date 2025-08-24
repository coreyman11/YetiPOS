
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to redact sensitive information in logs
const redactSensitiveInfo = (obj, sensitiveKeys = ['key', 'secret', 'password', 'token']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const redacted = { ...obj };
  for (const key in redacted) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      redacted[key] = typeof redacted[key] === 'string' 
        ? '[REDACTED]'
        : '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveInfo(redacted[key], sensitiveKeys);
    }
  }
  return redacted;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Parse the request body
    const { publishableKey, secretKey, connectedAccountId } = await req.json();
    
    console.log("Updating Stripe settings");
    
    // Validate inputs - but don't log the actual keys
    if (publishableKey && !publishableKey.startsWith('pk_')) {
      console.error("Invalid publishable key format");
      return new Response(
        JSON.stringify({ 
          error: 'Invalid publishable key format. Should start with pk_test_ or pk_live_'
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
    
    if (secretKey && !secretKey.startsWith('sk_')) {
      console.error("Invalid secret key format");
      return new Response(
        JSON.stringify({ 
          error: 'Invalid secret key format. Should start with sk_test_ or sk_live_'
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

    if (connectedAccountId && !connectedAccountId.startsWith('acct_')) {
      console.error("Invalid connected account ID format");
      return new Response(
        JSON.stringify({ 
          error: 'Invalid connected account ID format. Should start with acct_'
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
    
    // Security check: ensure the environments match for both keys if both are provided
    if (publishableKey && secretKey) {
      const isPubLive = publishableKey.startsWith('pk_live_');
      const isSecretLive = secretKey.startsWith('sk_live_');
      
      if (isPubLive !== isSecretLive) {
        console.error("Environment mismatch between publishable and secret keys");
        return new Response(
          JSON.stringify({ 
            error: 'Environment mismatch: Both keys must be from the same environment (test or live)'
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
      
      // Set environment flag based on keys
      const environment = isPubLive ? 'production' : 'development';
      console.log(`Setting environment to ${environment} based on provided keys`);
    }
    
    // Get Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Missing environment variables'
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
    
    // Determine which fields are configured via environment (Supabase Secrets)
    const configured = {
      publishableKeyConfigured: !!Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
      secretKeyConfigured: !!Deno.env.get('STRIPE_SECRET_KEY'),
      connectedAccountConfigured: !!Deno.env.get('STRIPE_CONNECTED_ACCOUNT_ID'),
    };

    // Build list of fields the caller attempted to update
    const attemptedUpdates: string[] = [];
    if (publishableKey) attemptedUpdates.push('STRIPE_PUBLISHABLE_KEY');
    if (secretKey) attemptedUpdates.push('STRIPE_SECRET_KEY');
    if (connectedAccountId) attemptedUpdates.push('STRIPE_CONNECTED_ACCOUNT_ID');

    if (attemptedUpdates.length === 0) {
      console.log("No Stripe settings provided to update");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No changes submitted',
          configured
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    // Updating secrets from this function is not supported – must be done via Supabase Secrets UI/API
    console.warn('Attempt to update Stripe secrets via edge function. Not supported. Attempted:', attemptedUpdates);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Stripe settings must be configured via Supabase Secrets',
        error_code: 'secrets_not_configurable',
        details: {
          attemptedUpdates,
          how_to_configure: 'Go to Supabase Dashboard → Project Settings → Functions → Secrets and set STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_CONNECTED_ACCOUNT_ID',
        },
        configured
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
        status: 501,
      }
    );
    
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Stripe settings updated successfully'
      }),
      {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error',
        message: error.message,
        stack: error.stack
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
