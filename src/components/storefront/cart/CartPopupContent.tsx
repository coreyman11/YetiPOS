
import React, { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, ShoppingBag, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartItemsList } from "./CartItemsList";
import { CheckoutForm } from "./CheckoutForm";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CartPopupContentProps {
  cartItems: CartItem[];
  updateQuantity: (itemId: number, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  total: number;
  store: any;
  onClose: () => void;
  customer?: Customer | null;
}

export function CartPopupContent({
  cartItems,
  updateQuantity,
  removeFromCart,
  total,
  store,
  onClose,
  customer
}: CartPopupContentProps) {
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("cart");
  const isMobile = useIsMobile();

  const handleCheckoutSuccess = () => {
    setCheckoutComplete(true);
    // Clear cart could be implemented here
  };

  return (
    <DialogContent className="p-0 overflow-hidden max-w-3xl mx-auto w-[95vw] max-h-[90vh] flex flex-col">
      <div className="bg-white border-b p-4 flex-shrink-0">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Cart
            </DialogTitle>
            <DialogClose className="rounded-full h-8 w-8 flex items-center justify-center hover:bg-black/5">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{store?.name}</p>
      </div>
      
      {checkoutComplete ? (
        <div className="text-center py-8 px-4 max-w-md mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Order Complete</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you for your purchase!
          </p>
          <Button className="mt-4" onClick={onClose}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <Tabs 
          defaultValue="cart" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full flex flex-col flex-grow overflow-hidden"
        >
          <div className="px-4 pt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger 
                value="cart" 
                className="text-sm font-medium rounded-md data-[state=active]:shadow-sm"
              >
                Cart ({cartItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="checkout" 
                disabled={cartItems.length === 0}
                className="text-sm font-medium rounded-md data-[state=active]:shadow-sm"
              >
                Checkout
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cart" className="m-0 p-4 flex-grow overflow-auto">
            <ScrollArea className="h-full pr-2">
              <CartItemsList 
                cartItems={cartItems} 
                updateQuantity={updateQuantity} 
                removeFromCart={removeFromCart} 
              />
              
              {cartItems.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <Separator />
                  
                  {/* Customer Loyalty Info */}
                  {customer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Gift className="h-4 w-4" />
                        <span className="text-sm font-medium">Loyalty Points Available</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        You have {customer.loyalty_points} points • You'll earn points on this purchase!
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between font-medium text-base">
                    <span>Total</span>
                    <span className="text-primary font-bold">${total.toFixed(2)}</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={() => setActiveTab("checkout")}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button 
                    variant="outline" 
                    className="mt-3" 
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="checkout" className="m-0 flex-grow overflow-auto">
            <ScrollArea className="h-full">
              <div className="p-4">
                <CheckoutForm 
                  cartItems={cartItems} 
                  total={total} 
                  storeName={store.slug}
                  onSuccess={handleCheckoutSuccess}
                  customer={customer}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </DialogContent>
  );
}
