
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/supabase";
import { TableCell, TableRow } from "@/components/ui/table";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerRowProps {
  customer: Customer;
  pointsValueCents: number;
  inModal?: boolean;
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerRow = ({ 
  customer, 
  pointsValueCents, 
  inModal = false, 
  onCustomerSelect 
}: CustomerRowProps) => {
  const navigate = useNavigate();
  
  const handleCustomerClick = () => {
    if (inModal && onCustomerSelect) {
      onCustomerSelect(customer);
    } else {
      navigate(`/customers/${customer.id}`);
    }
  };
  
  // Calculate loyalty points from loyalty_transactions instead of customer record
  // This will be handled by the parent component that should fetch the latest balance
  const loyaltyPoints = customer.loyalty_points || 0;

  // Calculate current points value using the correct formula
  const pointsValue = (loyaltyPoints * pointsValueCents) / 100;

  return (
    <TableRow 
      onClick={handleCustomerClick}
      className="cursor-pointer hover:bg-accent"
    >
      <TableCell className="font-medium">
        {customer.first_name} {customer.last_name}
      </TableCell>
      <TableCell>
        {customer.email}
      </TableCell>
      <TableCell>
        {customer.phone}
      </TableCell>
      <TableCell>
        {loyaltyPoints} points
      </TableCell>
      <TableCell>
        ${pointsValue.toFixed(2)}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            handleCustomerClick();
          }}
        >
          <User className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};
