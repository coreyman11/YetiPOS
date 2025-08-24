import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionRequest {
  token: string;
  password?: string;
  action: 'validate' | 'complete';
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password, action }: CompletionRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find customer by token
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .or(`account_completion_token.eq.${token},password_reset_token.eq.${token}`)
      .single();

    if (customerError || !customer) {
      console.error('Invalid token:', customerError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check token expiry (24 hours for account completion, 1 hour for password reset)
    const isPasswordReset = customer.password_reset_token === token;
    const tokenSentAt = isPasswordReset 
      ? customer.password_reset_sent_at 
      : customer.account_completion_sent_at;
    
    if (!tokenSentAt) {
      return new Response(
        JSON.stringify({ error: 'Invalid token state' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentTime = new Date(tokenSentAt);
    const expiryHours = isPasswordReset ? 1 : 24;
    const expiryTime = new Date(sentTime.getTime() + (expiryHours * 60 * 60 * 1000));
    
    if (new Date() > expiryTime) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'validate') {
      // Just validate the token and return customer info
      return new Response(
        JSON.stringify({ 
          valid: true, 
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            isPasswordReset
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'complete') {
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash password (simple bcrypt alternative for Deno)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + customer.email); // Use email as salt
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Update customer with password and clear tokens
      const updateData: any = {
        password_hash,
        online_account_active: true,
        account_completion_token: null,
        account_completion_sent_at: null,
        password_reset_token: null,
        password_reset_sent_at: null
      };

      const { error: updateError } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customer.id);

      if (updateError) {
        console.error('Password update failed:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to complete account setup' }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in account-completion function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(serve_handler);