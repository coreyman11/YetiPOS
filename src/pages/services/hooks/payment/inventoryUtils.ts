
import { supabase } from "@/lib/supabase";
import { CartItem } from '@/pages/services/hooks/payment/types';

export const getCartItems = (cart: CartItem[]) => {
  return cart.map(item => ({
    price: item.price,
    quantity: item.quantity,
    inventory_id: item.type === 'inventory' ? item.id : null,
    service_id: item.type === 'service' ? item.id : null,
    gift_card_id: null // We'll handle gift cards separately
  }));
};

export const validateInventoryAvailability = async (cart: CartItem[]) => {
  for (const item of cart) {
    if (item.type === 'inventory') {
      const { data: inventoryItem, error } = await supabase
        .from('inventory')
        .select('quantity, name')
        .eq('id', item.id)
        .single();
      
      if (error) {
        console.error(`Error checking inventory for item ${item.id}:`, error);
        throw new Error(`Unable to verify inventory for item ${item.id}`);
      }
      
      if (!inventoryItem) {
        throw new Error(`Inventory item ${item.id} not found`);
      }
      
      if (inventoryItem.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`);
      }
    }
  }
};

export const decrementInventory = async (inventoryId: number, quantity: number) => {
  try {
    const { error } = await supabase.rpc('adjust_inventory_quantity', {
      p_inventory_id: inventoryId,
      p_adjustment: -quantity // Negative for decrement
    });
    
    if (error) {
      console.error("Error updating inventory:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to decrement inventory:", error);
    throw error;
  }
};
