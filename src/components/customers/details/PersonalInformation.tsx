import { Input } from "@/components/ui/input";
import { Gift } from "lucide-react";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface PersonalInformationProps {
  selectedCustomer: Customer;
  editingCustomer: Customer | null;
  onUpdate: (customer: Customer) => void;
}

export const PersonalInformation = ({
  selectedCustomer,
  editingCustomer,
  onUpdate,
}: PersonalInformationProps) => {
  // Get the loyalty points directly from the customer record
  const loyaltyPoints = selectedCustomer.loyalty_points || 0;

  const handleNameChange = (field: 'first_name' | 'last_name', value: string) => {
    if (!editingCustomer) return;
    
    const updatedCustomer = {
      ...editingCustomer,
      [field]: value,
      // Also update the combined name field to keep everything consistent
      name: field === 'first_name'
        ? `${value} ${editingCustomer.last_name || ''}`.trim()
        : `${editingCustomer.first_name || ''} ${value}`.trim()
    };
    
    onUpdate(updatedCustomer);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Personal Information</h3>
      
      <div className="p-3 border rounded-md bg-accent/50 mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4" />
          <span className="font-medium">
            Loyalty Points Balance: {loyaltyPoints} points
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">First Name</label>
          {editingCustomer ? (
            <Input
              value={editingCustomer.first_name || ''}
              onChange={(e) => handleNameChange('first_name', e.target.value)}
            />
          ) : (
            <div className="font-medium">{selectedCustomer.first_name}</div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Last Name</label>
          {editingCustomer ? (
            <Input
              value={editingCustomer.last_name || ''}
              onChange={(e) => handleNameChange('last_name', e.target.value)}
            />
          ) : (
            <div className="font-medium">{selectedCustomer.last_name}</div>
          )}
        </div>
      </div>
    </div>
  );
};
