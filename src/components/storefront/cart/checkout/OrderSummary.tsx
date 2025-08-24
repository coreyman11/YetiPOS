
import { Separator } from "@/components/ui/separator";
import { Gift } from "lucide-react";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  total: number;
  deliveryMethod: string;
  customer?: Customer | null;
  loyaltyDiscount?: number;
}

export const OrderSummary = ({ cartItems, total, deliveryMethod, customer, loyaltyDiscount = 0 }: OrderSummaryProps) => {
  const finalTotal = total - loyaltyDiscount;
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-3">
      <h3 className="font-medium text-sm">Order Summary</h3>
      <Separator />
      
      <div className="space-y-3">
        {cartItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.item.inventory?.name || item.item.name} × {item.quantity}</span>
            <span>${(item.item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <Separator />
      
      {/* Customer Loyalty Info */}
      {customer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Gift className="h-4 w-4" />
            <span className="text-xs font-medium">Loyalty Rewards</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {customer.first_name || customer.name}: {customer.loyalty_points} points available • Earn more with this purchase!
          </p>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${total.toFixed(2)}</span>
      </div>
      
      {loyaltyDiscount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Loyalty Points Discount</span>
          <span>-${loyaltyDiscount.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        <span>{deliveryMethod === "pickup" ? "Free" : "Calculated at checkout"}</span>
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>${finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
