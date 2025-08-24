
import { useState, useEffect } from "react";
import { stripeApi } from "@/services";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { locationsApi } from "@/services";
import { secureLogger, sanitizeMetadata } from "@/utils/secure-logging";
import { useStorefrontAuth } from "@/contexts/storefront-auth-context";

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  deliveryMethod: string;
  marketingConsent: boolean;
}

export const useStripeCheckout = (
  cartItems: CartItem[],
  total: number,
  storeName: string,
  customerInfo: CustomerInfo,
  onSuccess: () => void,
  loyaltyPointsData?: { pointsToRedeem: number; discountAmount: number }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [configurationMissing, setConfigurationMissing] = useState(false);
  
  // Get authenticated customer from storefront auth context
  const { customer: authenticatedCustomer } = useStorefrontAuth();

  const initializeCheckout = async () => {
    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }
    
    try {
      setIsLoading(true);
      setInitError(null);
      setConfigurationMissing(false);
      
      try {
        await stripeApi.getPublishableKey();
      } catch (error) {
        if (error.message && error.message.includes("not configured")) {
          setConfigurationMissing(true);
          setInitError("Stripe is not configured. Please set up your Stripe keys in Settings.");
          throw error;
        }
      }
      
      const { data: activeTaxes = [] } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      const activeTax = activeTaxes[0];
      const taxRate = activeTax ? activeTax.rate : 0;
      const subtotal = total;
      const loyaltyDiscount = loyaltyPointsData?.discountAmount || 0;
      const discountedSubtotal = subtotal - loyaltyDiscount;
      const taxAmount = (discountedSubtotal * taxRate) / 100;
      const finalTotal = discountedSubtotal + taxAmount;
      
      secureLogger.apiCall("Creating checkout with tax", { 
        hasTax: taxRate > 0
      });
      
      // Calculate discount percentage to apply proportionally to each item
      const discountPercentage = loyaltyDiscount > 0 ? loyaltyDiscount / subtotal : 0;
      
      const lineItems = cartItems.map(item => {
        const productData = {
          name: item.item.inventory?.name || item.item.name || 'Product',
          images: item.item.image_url ? [item.item.image_url] : [],
        };
        
        // Only add description if it's not empty (to avoid Stripe API error)
        const description = item.item.inventory?.description || item.item.description;
        if (description && description.trim() !== '') {
          productData['description'] = description;
        }
        
        // Apply loyalty discount proportionally to each item
        const originalPrice = item.item.price || 0;
        const discountedPrice = originalPrice * (1 - discountPercentage);
        
        return {
          price_data: {
            currency: 'usd',
            product_data: productData,
            unit_amount: Math.round(discountedPrice * 100),
          },
          quantity: item.quantity,
        };
      });
      
      let locationId = null;
      try {
        const location = await locationsApi.getCurrentLocation();
        locationId = location?.id;
      } catch (error) {
        secureLogger.debug("Could not get location ID");
      }
      
      const { data: stores } = await supabase
        .from('online_stores')
        .select('id')
        .eq('slug', storeName)
        .limit(1);
      
      const storeId = stores && stores.length > 0 ? stores[0].id : null;
      
      const origin = window.location.origin;
      const path = window.location.pathname;
      const successUrl = `${origin}${path}?checkout_success=true`;
      const cancelUrl = `${origin}${path}`;
      
      const cartItemsData = cartItems.map(item => ({
        inventory_id: item.item.inventory_id || item.item.id || null,
        quantity: item.quantity,
        price: item.item.price || 0
      }));
      
      // Ensure source is explicitly set to 'online_store'
      const metadata: Record<string, string> = {
        customerName: customerInfo?.name || '',
        customerEmail: customerInfo?.email || '',
        deliveryMethod: customerInfo?.deliveryMethod || 'pickup',
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        taxRate: taxRate.toString(),
        source: 'online_store', // Explicitly set source to 'online_store'
        storeId: storeId?.toString() || '',
        locationId: locationId?.toString() || '',
        cartItems: JSON.stringify(cartItemsData),
        loyaltyPointsUsed: loyaltyPointsData?.pointsToRedeem?.toString() || '0',
        loyaltyDiscount: loyaltyDiscount.toString()
      };

      // Add authenticated customer ID if available
      if (authenticatedCustomer?.id) {
        metadata.customerId = authenticatedCustomer.id.toString();
        secureLogger.debug("Adding authenticated customer to checkout metadata", {
          customerId: authenticatedCustomer.id
        });
      }
      
      // Conditionally add address information for shipping
      if (customerInfo && customerInfo.deliveryMethod === "ship") {
        // Create the address string directly here
        metadata.shippingAddress = `${customerInfo.address || ''}, ${customerInfo.city || ''}, ${customerInfo.state || ''} ${customerInfo.zip || ''}`;
      }
      
      secureLogger.apiCall("Creating checkout session", { 
        itemCount: lineItems.length,
        deliveryMethod: customerInfo?.deliveryMethod
      });
      
      try {
        const { checkoutUrl, sessionId } = await stripeApi.createCheckoutSession({
          lineItems,
          successUrl,
          cancelUrl,
          customerEmail: customerInfo?.email || undefined,
          metadata: sanitizeMetadata(metadata)
        });
        
        if (checkoutUrl) {
          secureLogger.apiCall("Checkout URL generated successfully");
          setCheckoutUrl(checkoutUrl);
        } else {
          throw new Error("Failed to create checkout session");
        }
      } catch (error) {
        secureLogger.error("Error in Stripe checkout session creation");
        
        if (error.message && (
          error.message.includes("not configured") || 
          error.message.includes("missing") || 
          error.message.includes("invalid key") ||
          error.message.includes("Authentication required")
        )) {
          setConfigurationMissing(true);
          setInitError("Stripe is not properly configured. Please set up your Stripe keys in Settings.");
        } else {
          setInitError(error.message || "Failed to initialize checkout. Please try again.");
        }
        
        throw error;
      }
    } catch (error) {
      secureLogger.error("Error creating checkout session");
      
      if (!initError) {
        if (error.message && (
          error.message.includes("not configured") || 
          error.message.includes("missing") || 
          error.message.includes("invalid key") ||
          error.message.includes("Authentication required")
        )) {
          setConfigurationMissing(true);
          setInitError("Stripe is not properly configured. Please set up your Stripe keys in Settings.");
        } else {
          setInitError(error.message || "Failed to initialize checkout. Please try again.");
        }
      }
      
      if (!configurationMissing) {
        toast.error(error.message || "Failed to initialize checkout");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectToCheckout = () => {
    if (checkoutUrl) {
      setIsRedirecting(true);
      window.location.href = checkoutUrl;
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = queryParams.get('checkout_success');
    
    if (checkoutSuccess === 'true') {
      setIsSuccess(true);
      window.history.replaceState(null, '', window.location.pathname);
      
      toast.success("Payment successful!");
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  }, [onSuccess]);

  useEffect(() => {
    initializeCheckout();
  }, []);

  return {
    isLoading,
    isSuccess,
    checkoutUrl,
    initError,
    configurationMissing,
    isRedirecting,
    initializeCheckout,
    handleRedirectToCheckout
  };
};
