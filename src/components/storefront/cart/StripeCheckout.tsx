
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, RefreshCw, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { SuccessState } from "./checkout/SuccessState";
import { LoadingState } from "./checkout/LoadingState";
import { ErrorState } from "./checkout/ErrorState";
import { StripeButton } from "./checkout/StripeButton";
import { PaymentMethods } from "./checkout/PaymentMethods";
import { OrderSummary } from "./checkout/OrderSummary";
import { useNavigate } from "react-router-dom";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface StripeCheckoutProps {
  cartItems: CartItem[];
  total: number;
  storeName: string;
  customerInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    deliveryMethod: string;
    marketingConsent: boolean;
  };
  onSuccess: () => void;
  customer?: Customer | null;
  loyaltyPointsData?: {
    pointsToRedeem: number;
    discountAmount: number;
  };
}

export const StripeCheckout = ({
  cartItems,
  total,
  storeName,
  customerInfo,
  onSuccess,
  customer,
  loyaltyPointsData,
}: StripeCheckoutProps) => {
  const navigate = useNavigate();
  const {
    isLoading,
    isSuccess,
    checkoutUrl,
    initError,
    configurationMissing,
    isRedirecting,
    initializeCheckout,
    handleRedirectToCheckout
  } = useStripeCheckout(cartItems, total, storeName, customerInfo, onSuccess, loyaltyPointsData);
  
  if (isSuccess) {
    return <SuccessState />;
  }
  
  return (
    <div className="max-w-md mx-auto my-6 space-y-6">
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <h3 className="font-medium text-lg mb-4">Payment</h3>
        
        <div className="mb-4">
          <div className="flex items-center text-sm font-medium text-green-700 mb-2">
            <Lock className="h-4 w-4 mr-2" />
            Secure checkout via Stripe
          </div>
        </div>
        
        {isLoading ? (
          <LoadingState />
        ) : configurationMissing ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Stripe configuration missing</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>Stripe needs to be configured before online checkout can work.</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Go to Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : initError ? (
          <ErrorState error={initError} onRetry={initializeCheckout} />
        ) : checkoutUrl ? (
          <>
            <StripeButton 
              onClick={handleRedirectToCheckout} 
              isRedirecting={isRedirecting} 
            />
            
            <Separator className="my-4" />
            
            <PaymentMethods />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm text-red-500">There was a problem initializing checkout</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => initializeCheckout()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </div>
        )}
      </div>
      
      <OrderSummary 
        cartItems={cartItems} 
        total={total} 
        deliveryMethod={customerInfo.deliveryMethod}
        customer={customer}
        loyaltyDiscount={loyaltyPointsData?.discountAmount || 0}
      />
    </div>
  );
};
