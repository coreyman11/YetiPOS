
import { useState } from 'react';
import { Database } from "@/types/supabase";

type Service = Database['public']['Tables']['services']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'inventory';
  service_id?: number | null;
  inventory_id?: number | null;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Service | InventoryItem, type: 'service' | 'inventory') => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id && cartItem.type === type
      );
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id && cartItem.type === type
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { 
        id: item.id, 
        name: item.name, 
        price: Number(item.price), 
        quantity: 1,
        type,
        service_id: type === 'service' ? item.id : null,
        inventory_id: type === 'inventory' ? item.id : null
      }];
    });
  };

  const removeFromCart = (id: number, type: 'service' | 'inventory') => {
    setCart((prevCart) => prevCart.filter(
      (cartItem) => !(cartItem.id === id && cartItem.type === type)
    ));
  };

  const updateQuantity = (id: number, type: 'service' | 'inventory', quantity: number) => {
    if (quantity < 0) return;
    setCart((prevCart) =>
      prevCart.map((cartItem) =>
        cartItem.id === id && cartItem.type === type 
          ? { ...cartItem, quantity } 
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    cart,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};
