import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StripeCheckout } from "./StripeCheckout";
import { z } from "zod";
import { ContactForm } from "./checkout/ContactForm";
import { DeliveryMethodSelector } from "./checkout/DeliveryMethodSelector";
import { ShippingAddressForm } from "./checkout/ShippingAddressForm";
import { CartSummary } from "./checkout/CartSummary";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CheckoutFormProps { 
  cartItems: CartItem[]; 
  total: number; 
  storeName: string;
  onSuccess: () => void;
  customer?: Customer | null;
}

const customerInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  deliveryMethod: z.enum(["ship", "pickup"])
}).and(
  z.union([
    z.object({
      deliveryMethod: z.literal("ship"),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      zip: z.string().min(1, "ZIP code is required"),
    }),
    z.object({
      deliveryMethod: z.literal("pickup"),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
  ])
);

export const CheckoutForm = ({ 
  cartItems, 
  total, 
  storeName,
  onSuccess,
  customer 
}: CheckoutFormProps) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    deliveryMethod: "ship",
    marketingConsent: false
  });

  // Pre-fill form if customer is logged in
  useEffect(() => {
    if (customer) {
      setCustomerInfo(prev => ({
        ...prev,
        name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
        email: customer.email || '',
        address: customer.address_line1 || '',
        city: customer.city || '',
        state: customer.state || '',
        zip: customer.zip || ''
      }));
    }
  }, [customer]);
  
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loyaltyPointsData, setLoyaltyPointsData] = useState<{
    pointsToRedeem: number;
    discountAmount: number;
  }>({ pointsToRedeem: 0, discountAmount: 0 });

  const handleLoyaltyPointsChange = (pointsToRedeem: number, discountAmount: number) => {
    setLoyaltyPointsData({ pointsToRedeem, discountAmount });
  };
  
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }
    
    // Validate form
    try {
      customerInfoSchema.parse(customerInfo);
      setErrors({});
      setShowStripeCheckout(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            formattedErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(formattedErrors);
        toast.error("Please fill in all required fields correctly");
      }
    }
  };

  const handleCustomerInfoChange = (updates: Partial<typeof customerInfo>) => {
    setCustomerInfo(prev => ({ ...prev, ...updates }));
  };
  
  if (showStripeCheckout) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <button 
              className="flex items-center text-xs text-primary hover:underline transition-colors mb-2" 
              onClick={() => setShowStripeCheckout(false)}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Return to information
            </button>
            
            <StripeCheckout
              cartItems={cartItems}
              total={total}
              storeName={storeName}
              customerInfo={customerInfo}
              onSuccess={onSuccess}
              customer={customer}
              loyaltyPointsData={loyaltyPointsData}
            />
          </div>
          
          <CartSummary
            cartItems={cartItems}
            total={total}
            deliveryMethod={customerInfo.deliveryMethod}
            customer={customer}
            onLoyaltyPointsChange={handleLoyaltyPointsChange}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="text-lg font-semibold mb-3">Checkout</div>
          
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <ContactForm
              email={customerInfo.email}
              onEmailChange={(email) => handleCustomerInfoChange({ email })}
              marketingConsent={customerInfo.marketingConsent}
              onMarketingConsentChange={(checked) => handleCustomerInfoChange({ marketingConsent: checked })}
              emailError={errors.email}
            />
            
            <DeliveryMethodSelector
              value={customerInfo.deliveryMethod}
              onChange={(value) => handleCustomerInfoChange({ deliveryMethod: value })}
              error={errors.deliveryMethod}
            />
            
            <ShippingAddressForm
              customerInfo={customerInfo}
              onChange={handleCustomerInfoChange}
              errors={errors}
              deliveryMethod={customerInfo.deliveryMethod}
            />
            
            <Button
              type="submit"
              className="w-full h-9"
            >
              Continue to payment
            </Button>
          </form>
        </div>
        
        <CartSummary
          cartItems={cartItems}
          total={total}
          deliveryMethod={customerInfo.deliveryMethod}
          customer={customer}
          onLoyaltyPointsChange={handleLoyaltyPointsChange}
        />
      </div>
    </div>
  );
};
