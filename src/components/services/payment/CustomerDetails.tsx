
import { Gift } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/types/supabase";
import { Separator } from "@/components/ui/separator";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerDetailsProps {
  customer: Customer;
  pointsValue: number;
  canRedeemPoints: boolean;
  usePoints: boolean;
  onPointsChange: (checked: boolean) => void;
}

export const CustomerDetails = ({
  customer,
  pointsValue,
  canRedeemPoints,
  usePoints,
  onPointsChange,
}: CustomerDetailsProps) => {
  // Use loyalty points from the actual balance calculation, not the customer record
  const loyaltyPoints = customer.loyalty_points || 0;

  // Display points value in dollars - ensure minimum value of 0
  const formattedPointsValue = Math.max(0, pointsValue).toFixed(2);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <div className="text-lg font-medium">{customer.name}</div>
        <div className="text-gray-500">
          {customer.phone} • {customer.email}
        </div>
        <div className="text-gray-500 flex items-center gap-1 mt-1">
          <Gift className="h-4 w-4" /> 
          <span>Points: {loyaltyPoints}</span>
        </div>
      </div>
      
      {canRedeemPoints && (
        <div className="pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="redeem-points"
              checked={usePoints}
              onCheckedChange={(checked) => onPointsChange(checked as boolean)}
            />
            <label
              htmlFor="redeem-points"
              className="text-sm font-medium cursor-pointer"
            >
              Use {loyaltyPoints} points (Save ${formattedPointsValue})
            </label>
          </div>
        </div>
      )}
      
      {!canRedeemPoints && loyaltyPoints > 0 && (
        <div className="text-sm text-muted-foreground">
          Not enough points to redeem. Minimum required: 100 points
        </div>
      )}
    </div>
  );
};
