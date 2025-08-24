
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift } from "lucide-react";
import { Database } from "@/types/supabase";
import { calculatePointsValue, validateRedemption } from "@/utils/loyaltyCalculator";
import { supabase } from "@/lib/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CartItem {
  id: number;
  quantity: number;
  item: any;
}

interface CartSummaryProps {
  cartItems: CartItem[];
  total: number;
  deliveryMethod: string;
  customer?: Customer | null;
  onLoyaltyPointsChange?: (pointsToRedeem: number, discountAmount: number) => void;
}

export const CartSummary = ({ cartItems, total, deliveryMethod, customer, onLoyaltyPointsChange }: CartSummaryProps) => {
  const [loyaltyProgram, setLoyaltyProgram] = useState<any>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  
  useEffect(() => {
    if (customer) {
      // Fetch loyalty program settings
      const fetchLoyaltyProgram = async () => {
        const { data } = await supabase
          .from('loyalty_program_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (data) {
          setLoyaltyProgram(data);
        }
      };
      
      fetchLoyaltyProgram();
    }
  }, [customer]);
  
  useEffect(() => {
    if (useLoyaltyPoints && pointsToRedeem > 0 && loyaltyProgram) {
      const discount = calculatePointsValue(pointsToRedeem, loyaltyProgram);
      setLoyaltyDiscount(discount);
      onLoyaltyPointsChange?.(pointsToRedeem, discount);
    } else {
      setLoyaltyDiscount(0);
      onLoyaltyPointsChange?.(0, 0);
    }
  }, [useLoyaltyPoints, pointsToRedeem, loyaltyProgram, onLoyaltyPointsChange]);
  
  const canRedeemPoints = customer && loyaltyProgram && 
    customer.loyalty_points >= loyaltyProgram.minimum_points_redeem;
    
  const maxRedeemablePoints = loyaltyProgram && customer 
    ? Math.min(customer.loyalty_points, Math.floor((total * 100) / loyaltyProgram.points_value_cents))
    : 0;
    
  const handlePointsChange = (value: string) => {
    const points = parseInt(value) || 0;
    const maxPoints = Math.min(maxRedeemablePoints, customer?.loyalty_points || 0);
    setPointsToRedeem(Math.min(points, maxPoints));
  };
  
  const finalTotal = total - loyaltyDiscount;
  return (
    <div className="bg-gray-50 p-3 rounded-lg self-start">
      <div className="space-y-3">
        {cartItems.map((cartItem) => (
          <div key={cartItem.id} className="flex items-center">
            <div className="relative mr-2">
              <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {cartItem.item.image_url ? (
                  <img 
                    src={cartItem.item.image_url} 
                    alt={cartItem.item.inventory?.name || cartItem.item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-white">
                {cartItem.quantity}
              </span>
            </div>
            <div className="flex-1 text-xs">
              <p className="font-medium line-clamp-1">
                {cartItem.item.inventory?.name || cartItem.item.name}
              </p>
            </div>
            <div className="font-medium text-xs ml-2">
              ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
            </div>
          </div>
        ))}
        
        <Separator />
        
        {/* Customer Loyalty Info */}
        {customer && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700">
                <Gift className="h-4 w-4" />
                <span className="text-xs font-medium">Loyalty Account</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Current Points: {customer.loyalty_points} • You'll earn points on this purchase!
              </p>
            </div>
            
            {/* Loyalty Points Redemption - Show for any customer with points and loyalty program */}
            {customer && customer.loyalty_points > 0 && loyaltyProgram && (
              <div className="border border-blue-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="use-loyalty-points"
                    checked={useLoyaltyPoints}
                    onCheckedChange={(checked) => setUseLoyaltyPoints(checked === true)}
                  />
                  <Label htmlFor="use-loyalty-points" className="text-xs font-medium text-blue-700">
                    Use Loyalty Points
                  </Label>
                </div>
                
                {useLoyaltyPoints && (
                  <div className="space-y-2">
                    <Label className="text-xs text-blue-600">
                      Points to redeem (max: {maxRedeemablePoints})
                    </Label>
                    <Input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsChange(e.target.value)}
                      min={loyaltyProgram?.minimum_points_redeem || 0}
                      max={maxRedeemablePoints}
                      className="h-8 text-xs"
                      placeholder={`Min: ${loyaltyProgram?.minimum_points_redeem || 0}`}
                    />
                    {loyaltyDiscount > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        Discount: -${loyaltyDiscount.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          {loyaltyDiscount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span>Loyalty Points Discount</span>
              <span>-${loyaltyDiscount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{deliveryMethod === "pickup" ? "Free" : "Calculated at next step"}</span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between font-medium">
            <span>Total</span>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">USD</div>
              <div>${finalTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
