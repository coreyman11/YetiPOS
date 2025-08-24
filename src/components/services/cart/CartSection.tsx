
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/hooks/useCart";

interface CartSectionProps {
  cart: CartItem[];
  updateQuantity: (item: CartItem, quantity: number) => void;
  removeFromCart: (item: CartItem) => void;
  onProceedToPayment?: () => void;
}

export const CartSection = ({
  cart,
  updateQuantity,
  removeFromCart,
  onProceedToPayment,
}: CartSectionProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-b">

      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 p-4">
            <p className="text-center">Your order is empty. Add items from the menu.</p>
          </div>
        ) : (
          <div className="divide-y">
            {cart.map((item) => (
              <div 
                key={`${item.type}-${item.id}`}
                className="flex items-center py-2 px-3 hover:bg-gray-50"
              >
                <div className="font-medium text-sm w-6 text-right mr-2">
                  ×{item.quantity}
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-xs text-gray-500">${item.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item, Math.max(0, item.quantity - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => removeFromCart(item)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
