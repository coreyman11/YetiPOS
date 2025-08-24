
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    // Initialize Stripe with latest version
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log("Processing terminal API request");

    // Parse request body
    const { action, data } = await req.json();
    console.log("Action requested:", action);

    switch (action) {
      case "createConnectionToken": {
        console.log("Creating connection token");
        const connectionToken = await stripe.terminal.connectionTokens.create();
        return new Response(
          JSON.stringify({ token: connectionToken.secret }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "listReaders": {
        console.log("Listing readers");
        const readers = await stripe.terminal.readers.list();
        console.log("Found readers:", readers.data.length);
        return new Response(
          JSON.stringify({ readers: readers.data }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "connectReader": {
        const { readerId } = data;
        if (!readerId) {
          throw new Error("Reader ID is required");
        }

        console.log("Connecting to reader:", readerId);
        
        // First, try to get the reader to see if it exists
        try {
          const reader = await stripe.terminal.readers.retrieve(readerId);
          console.log("Reader retrieved successfully:", reader.id);
          return new Response(
            JSON.stringify({ reader }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error connecting to reader:", error);
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "registerReader": {
        const { registrationCode, label } = data;
        if (!registrationCode) {
          throw new Error("Registration code is required");
        }

        console.log("Registering reader with code:", registrationCode);
        
        try {
          const reader = await stripe.terminal.readers.create({
            registration_code: registrationCode,
            label: label || "Card Reader",
          });

          console.log("Reader registered successfully:", reader.id);
          return new Response(
            JSON.stringify({ reader }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error registering reader:", error);
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "processPayment": {
        const { readerId, amount, currency = "usd", description } = data;
        if (!readerId || !amount) {
          throw new Error("Reader ID and amount are required");
        }

        // Ensure amount is in dollars - if it's already in cents, convert back
        const amountInDollars = amount > 1000 ? amount / 100 : amount;
        const amountInCents = Math.round(amountInDollars * 100);
        
        console.log(`Processing payment: $${amountInDollars.toFixed(2)} (${amountInCents} cents) on reader ${readerId}`);

        try {
          // Create a PaymentIntent with automatic capture
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents, // Amount in cents
            currency,
            description,
            payment_method_types: ["card_present"],
            capture_method: "automatic", // Auto-capture for completed payments
          });

          console.log("PaymentIntent created:", paymentIntent.id);

          // Process the payment on the reader and wait for completion
          const reader = await stripe.terminal.readers.processPaymentIntent(
            readerId,
            {
              payment_intent: paymentIntent.id,
            }
          );

          console.log("Payment initiated on reader, now waiting for completion...");

          // Wait for the payment to complete by polling the PaymentIntent
          let finalPaymentIntent = paymentIntent;
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds timeout

          while (attempts < maxAttempts && finalPaymentIntent.status === "requires_payment_method") {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            finalPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
            attempts++;
            console.log(`Polling attempt ${attempts}: PaymentIntent status is ${finalPaymentIntent.status}`);
          }

          console.log("Final payment status:", finalPaymentIntent.status);

          return new Response(
            JSON.stringify({ paymentIntent: finalPaymentIntent, reader }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error processing payment:", error);
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "disconnectReader": {
        const { readerId } = data;
        if (!readerId) {
          throw new Error("Reader ID is required");
        }

        console.log("Disconnecting reader:", readerId);
        
        try {
          await stripe.terminal.readers.cancel_action(readerId);
          console.log("Reader disconnected successfully");
          return new Response(
            JSON.stringify({ success: true }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error disconnecting reader:", error);
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      case "getReader": {
        const { readerId } = data;
        if (!readerId) {
          throw new Error("Reader ID is required");
        }

        console.log("Getting reader:", readerId);
        
        try {
          const reader = await stripe.terminal.readers.retrieve(readerId);
          console.log("Reader retrieved:", reader.id);
          return new Response(
            JSON.stringify({ reader }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          console.error("Error getting reader:", error);
          return new Response(
            JSON.stringify({ error: { message: error.message, code: error.code } }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      default:
        console.log("Invalid action requested:", action);
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Error in stripe-terminal-api:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
