import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  customerId: number;
  type: 'account_completion' | 'password_reset';
  storeUrl?: string;
  storeName?: string;
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, type, storeUrl, storeName }: EmailRequest = await req.json();

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_secure_token');

    if (tokenError || !tokenData) {
      console.error('Token generation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Token generation failed' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = tokenData;

    // Update customer with token
    const updateData = type === 'account_completion' 
      ? { 
          account_completion_token: token,
          account_completion_sent_at: new Date().toISOString()
        }
      : { 
          password_reset_token: token,
          password_reset_sent_at: new Date().toISOString()
        };

    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId);

    if (updateError) {
      console.error('Customer update failed:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update customer' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email based on type
    let emailSubject: string;
    let emailHtml: string;
    const baseUrl = storeUrl || 'https://paevqayvvakexwyezqiy.supabase.co';
    const completionUrl = `${baseUrl}/account-setup/${token}`;

    if (type === 'account_completion') {
      emailSubject = `Complete Your ${storeName || 'Store'} Account Setup`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to ${storeName || 'Our Store'}!</h1>
          <p>Hi ${customer.first_name || customer.name},</p>
          <p>Your account has been created at our store. To access your account online and view your purchase history, loyalty points, and exclusive offers, please complete your account setup.</p>
          <div style="margin: 30px 0;">
            <a href="${completionUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Complete Account Setup
            </a>
          </div>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you have any questions, please contact our store directly.</p>
          <p>Thank you!</p>
        </div>
      `;
    } else {
      emailSubject = `Reset Your ${storeName || 'Store'} Password`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hi ${customer.first_name || customer.name},</p>
          <p>We received a request to reset your password for your ${storeName || 'store'} account.</p>
          <div style="margin: 30px 0;">
            <a href="${completionUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Store <onboarding@resend.dev>",
      to: [customer.email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in send-customer-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(serve_handler);