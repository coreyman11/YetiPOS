
import React from "react";
import { MinusCircle, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CartItemsListProps {
  cartItems: CartItem[];
  updateQuantity: (itemId: number, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
}

export const CartItemsList = ({
  cartItems,
  updateQuantity,
  removeFromCart,
}: CartItemsListProps) => {
  if (!cartItems.length) {
    return (
      <div className="py-6 text-center">
        <p className="text-muted-foreground">Your cart is empty</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[280px] pr-2">
      <div className="space-y-3">
        {cartItems.map((cartItem) => {
          const { item, quantity, id } = cartItem;
          const itemName = item.inventory?.name || item.name;
          const itemPrice = item.price;

          return (
            <div key={id} className="flex py-2 border-b last:border-b-0">
              <div className="h-16 w-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center mr-3 overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={itemName}
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">No image</div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h3 className="font-medium text-sm truncate pr-2">{itemName}</h3>
                  <button 
                    className="text-muted-foreground hover:text-red-500 transition-colors" 
                    onClick={() => removeFromCart(id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="mt-1 flex justify-between items-center">
                  <div className="flex items-center">
                    <button 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => updateQuantity(id, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                    <span className="mx-2 text-sm">{quantity}</span>
                    <button 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => updateQuantity(id, quantity + 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm font-medium">
                    ${(itemPrice * quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
