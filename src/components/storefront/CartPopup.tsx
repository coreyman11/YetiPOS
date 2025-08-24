
import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { CartPopupContent } from "./cart/CartPopupContent";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (itemId: number, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  total: number;
  store: any;
  customer?: Customer | null;
}

export function CartPopup(props: CartPopupProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose();
    }
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      <CartPopupContent {...props} />
    </Dialog>
  );
}
