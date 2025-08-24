
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { CartItem as CartItemComponent } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database } from "@/types/supabase";

type Service = Database['public']['Tables']['services']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'inventory';
}

interface CartSectionProps {
  cart: CartItem[];
  updateQuantity: (id: number, type: 'service' | 'inventory', quantity: number) => void;
  removeFromCart: (id: number, type: 'service' | 'inventory') => void;
  onProceedToPayment: () => void;
}

export const CartSection = ({
  cart,
  updateQuantity,
  removeFromCart,
  onProceedToPayment,
}: CartSectionProps) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="h-full bg-gray-50 dark:bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center">
          <span>Current Cart</span>
          <span className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-24rem)] px-6">
          <div className="space-y-4">
            {cart.map((item) => (
              <CartItemComponent
                key={`${item.type}-${item.id}`}
                {...item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-lg font-medium">Cart is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add items from the menu to get started
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {cart.length > 0 && (
        <CardFooter className="flex-col space-y-4 border-t mt-auto p-0 bg-white dark:bg-gray-800">
          <div className="flex justify-between w-full text-xl font-bold px-6 pt-4">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full text-lg h-16 rounded-none" 
            size="lg"
            onClick={onProceedToPayment}
          >
            <DollarSign className="mr-2 h-6 w-6" />
            Pay ${total.toFixed(2)}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
