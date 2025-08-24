import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { secureLogger, getGenericErrorMessage, sanitizeMetadata } from "@/utils/secure-logging";
import { checkRateLimit, RateLimitError } from "@/utils/rate-limiting";

// Helper function to get the correct Supabase URL based on environment
const getSupabaseUrl = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('VITE_SUPABASE_URL environment variable is not configured');
  }
  return url;
};

// SECURITY: Removed direct access to environment variables
// All Stripe keys are now fetched securely from edge functions

export const stripeApi = {
  createPaymentIntent: async (amount: number, metadata?: any) => {
    try {
      secureLogger.apiCall("Creating payment intent", { amount });
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount, metadata: sanitizeMetadata(metadata || {}) },
      });

      if (error) {
        secureLogger.error("Error creating payment intent");
        throw new Error(getGenericErrorMessage(error));
      }
      return data;
    } catch (err) {
      secureLogger.error("Error in createPaymentIntent");
      throw new Error(getGenericErrorMessage(err));
    }
  },

  createCheckoutSession: async ({
    lineItems,
    successUrl,
    cancelUrl,
    customerEmail,
    metadata
  }: {
    lineItems: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description?: string;
          images?: string[];
        };
        unit_amount: number;
      };
      quantity: number;
    }>;
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) => {
    try {
      // SECURITY: Apply rate limiting
      checkRateLimit('stripe-checkout');
      
      secureLogger.apiCall("Creating checkout session", { 
        lineItemsCount: lineItems?.length || 0,
        hasCustomerEmail: !!customerEmail
      });
      
      // Validate line items
      if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
        throw new Error("Your cart is empty");
      }
      
      // Validate URLs - ensure they are absolute URLs
      if (!successUrl || !cancelUrl) {
        throw new Error("Missing success or cancel URL");
      }
      
      if (!successUrl.startsWith('http') || !cancelUrl.startsWith('http')) {
        // Fix URLs if they're relative
        const baseUrl = window.location.origin;
        if (!successUrl.startsWith('http')) {
          successUrl = baseUrl + (successUrl.startsWith('/') ? '' : '/') + successUrl;
        }
        if (!cancelUrl.startsWith('http')) {
          cancelUrl = baseUrl + (cancelUrl.startsWith('/') ? '' : '/') + cancelUrl;
        }
        secureLogger.debug("Fixed relative URLs");
      }
      
      // Validate and process line items
      const validatedLineItems = lineItems.map(item => {
        if (!item.price_data) {
          throw new Error("Invalid line item: missing price data");
        }
        
        // Ensure unit_amount is a valid number
        if (typeof item.price_data.unit_amount !== 'number' || isNaN(item.price_data.unit_amount) || item.price_data.unit_amount <= 0) {
          if (typeof item.price_data.unit_amount === 'string') {
            item.price_data.unit_amount = Math.round(parseFloat(item.price_data.unit_amount) * 100);
          } else if (typeof item.price_data.unit_amount === 'number' && !Number.isInteger(item.price_data.unit_amount)) {
            // If it's a decimal number (e.g. 9.99), convert to cents
            item.price_data.unit_amount = Math.round(item.price_data.unit_amount * 100);
          }
          
          if (item.price_data.unit_amount <= 0) {
            throw new Error("Price must be greater than 0");
          }
        }
        
        // Ensure currency is specified
        if (!item.price_data.currency) {
          item.price_data.currency = 'usd';
        }
        
        // Ensure product_data is complete
        if (!item.price_data.product_data) {
          throw new Error("Invalid line item: missing product data");
        }
        
        if (!item.price_data.product_data.name) {
          throw new Error("Invalid line item: missing product name");
        }
        
        // Ensure quantity is a valid number
        if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
          item.quantity = Math.max(1, parseInt(String(item.quantity)) || 1);
        }
        
        return item;
      });
      
      // SECURITY: Use sanitizeMetadata to remove sensitive information
      const safemetadata = sanitizeMetadata(metadata || {});
      
      // Use secure fetch with minimal exposed information
      const supabaseUrl = getSupabaseUrl();
      const functionUrl = `${supabaseUrl}/functions/v1/create-checkout-session`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      };
      
      // Try to get auth session, but continue if not available (public storefront)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        secureLogger.debug("No authenticated session, proceeding as public request");
      }
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lineItems: validatedLineItems,
          successUrl,
          cancelUrl,
          customerEmail,
          metadata: safemetadata,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        secureLogger.error("Checkout session creation failed", { status: response.status });
        
        let errorMessage = "Failed to create checkout session";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = getGenericErrorMessage({ message: errorText });
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data || !data.checkoutUrl) {
        throw new Error("Invalid response from checkout session creation");
      }
      
      secureLogger.apiCall("Checkout session created successfully");
      return data;
    } catch (err) {
      secureLogger.error("Error in createCheckoutSession");
      
      if (err instanceof RateLimitError) {
        const waitTime = Math.ceil(err.resetTime / 1000);
        toast.error(`Too many requests. Please wait ${waitTime} seconds.`);
        throw err;
      }
      
      const message = getGenericErrorMessage(err);
      toast.error(message);
      
      throw new Error(message);
    }
  },

  getPublishableKey: async () => {
    try {
      // SECURITY: Apply rate limiting
      checkRateLimit('stripe-publishable-key');
      
      // SECURITY: Always fetch from secure edge function, never from environment
      secureLogger.apiCall("Fetching Stripe publishable key from secure endpoint");
      
      // Get the current session to include the auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Authentication required to access Stripe configuration");
      }
      
      const supabaseUrl = getSupabaseUrl();
      
      // Create a fetch request to the Edge Function with authentication
      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-stripe-publishable-key`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        secureLogger.error("Failed to fetch publishable key");
        
        // Handle session expiration specifically
        if (response.status === 401) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.details && (
              errorData.details.includes('session_not_found') || 
              errorData.details.includes('Invalid Refresh Token') ||
              errorData.details.includes('Session not found')
            )) {
              // Clear any stale session data
              await supabase.auth.signOut();
              // Redirect to login
              window.location.href = '/login';
              throw new Error("Session expired. Please log in again.");
            }
          } catch (parseError) {
            // If we can't parse the error, just treat it as a general auth error
          }
        }
        
        throw new Error("Failed to fetch Stripe configuration");
      }
      
      const data = await response.json();
      
      if (!data?.key) {
        throw new Error("Stripe is not configured. Please set up your Stripe keys in Settings.");
      }
      
      return data.key;
    } catch (err) {
      secureLogger.error("Error in getPublishableKey");
      throw new Error(getGenericErrorMessage(err));
    }
  },
  
  getStripePromise: async () => {
    try {
      const key = await stripeApi.getPublishableKey();
      secureLogger.apiCall("Initializing Stripe");
      return loadStripe(key);
    } catch (err) {
      secureLogger.error("Error getting Stripe promise");
      // Don't show toast if it's a session expired error (user will be redirected)
      if (!err.message.includes("Session expired")) {
        toast.error("Stripe configuration is missing. Please set up Stripe in Settings.");
      }
      throw new Error(getGenericErrorMessage(err));
    }
  },
};