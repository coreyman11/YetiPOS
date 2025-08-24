
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

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
const RATE_LIMIT = 20; // requests
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Basic rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: corsHeaders,
        }
      )
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    // Get Supabase connection details from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') 
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing required Supabase environment variables")
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: corsHeaders,
        }
      )
    }

    // Create a Supabase client using the authorization header
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError) {
      console.error('Authorization failed:', redactSensitiveInfo(authError));
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    if (!user) {
      console.error('No user found in session');
      return new Response(
        JSON.stringify({ error: 'No authenticated user found' }),
        {
          status: 401,
          headers: corsHeaders,
        }
      )
    }

    console.log(`Authenticated request from user: ${user.id}`);

    // Get the publishable key from environment variable
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY')
    const secretKeyConfigured = !!Deno.env.get('STRIPE_SECRET_KEY')
    const connectedAccountConfigured = !!Deno.env.get('STRIPE_CONNECTED_ACCOUNT_ID')
    
    if (!publishableKey) {
      console.log("No Stripe publishable key configured")
    }
    
    // SECURITY: Only return the minimum information needed
    return new Response(
      JSON.stringify({ 
        key: publishableKey,
        secretKeyConfigured,
        connectedAccountConfigured,
      }),
      {
        headers: corsHeaders,
      }
    )
  } catch (error) {
    console.error("Error retrieving Stripe keys:", redactSensitiveInfo(error))
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }
})
