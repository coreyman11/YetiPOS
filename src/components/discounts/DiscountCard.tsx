
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Database } from "@/types/supabase";
import { format } from "date-fns";
import { EditDiscountDialog } from "./EditDiscountDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { discountsApi } from "@/services";
import { toast } from "sonner";

type Discount = Database['public']['Tables']['discounts']['Row'];

interface DiscountCardProps {
  discount: Discount;
  onAction: () => void;
}

export const DiscountCard = ({ discount, onAction }: DiscountCardProps) => {
  const isActive = discount.is_active;
  const now = new Date();
  const startDate = new Date(discount.start_date);
  const endDate = discount.end_date ? new Date(discount.end_date) : null;
  
  const isCurrentlyValid = startDate <= now && (!endDate || endDate >= now);
  const isFutureDiscount = startDate > now;
  const isPastDiscount = endDate && endDate < now;

  let status: 'active' | 'inactive' | 'future' | 'expired' = 'inactive';
  if (isActive && isCurrentlyValid) {
    status = 'active';
  } else if (isActive && isFutureDiscount) {
    status = 'future';
  } else if (isPastDiscount || !isActive) {
    status = 'expired';
  }

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    future: "bg-blue-100 text-blue-800",
    expired: "bg-red-100 text-red-800"
  };

  const formatValue = () => {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    } else {
      return formatCurrency(discount.value);
    }
  };

  const handleDelete = async () => {
    try {
      await discountsApi.delete(discount.id);
      toast.success("Discount deleted successfully");
      onAction();
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Failed to delete discount");
    }
  };

  const handleToggleActive = async () => {
    try {
      await discountsApi.toggleActive(discount.id, !discount.is_active);
      toast.success(`Discount ${discount.is_active ? "deactivated" : "activated"} successfully`);
      onAction();
    } catch (error) {
      console.error("Error toggling discount status:", error);
      toast.error("Failed to update discount status");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{discount.name}</CardTitle>
          <div className="mt-1">
            <Badge className={statusColors[status]}>
              {status === 'active' ? 'Active' : 
               status === 'future' ? 'Upcoming' : 
               status === 'expired' ? 'Expired' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-1">
          <EditDiscountDialog 
            discount={discount} 
            onDiscountUpdated={onAction} 
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Discount</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this discount? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Discount Value:</p>
            <p className="font-medium">{formatValue()}</p>
          </div>
          <div>
            <p className="text-gray-500">Type:</p>
            <p className="font-medium capitalize">{discount.type}</p>
          </div>
          <div>
            <p className="text-gray-500">Start Date:</p>
            <p className="font-medium">{format(new Date(discount.start_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-gray-500">End Date:</p>
            <p className="font-medium">
              {discount.end_date 
                ? format(new Date(discount.end_date), 'MMM d, yyyy')
                : 'No end date'}
            </p>
          </div>
        </div>
        {discount.description && (
          <div className="mt-2">
            <p className="text-gray-500 text-sm">Description:</p>
            <p className="text-sm">{discount.description}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto"
          onClick={handleToggleActive}
        >
          {discount.is_active ? "Deactivate" : "Activate"}
        </Button>
      </CardFooter>
    </Card>
  );
};
