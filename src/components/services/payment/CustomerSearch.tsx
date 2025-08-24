
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Database } from "@/types/supabase";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSearchProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer) => void;
}

export const CustomerSearch = ({
  customers,
  searchQuery,
  onSearchChange,
  selectedCustomer,
  onCustomerSelect,
}: CustomerSearchProps) => {
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    const name = customer.name?.toLowerCase() || '';
    const phone = customer.phone?.toLowerCase() || '';
    const email = customer.email?.toLowerCase() || '';
    const firstName = customer.first_name?.toLowerCase() || '';
    const lastName = customer.last_name?.toLowerCase() || '';
    
    return name.includes(searchLower) || 
           phone.includes(searchLower) || 
           email.includes(searchLower) ||
           firstName.includes(searchLower) ||
           lastName.includes(searchLower);
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-md border-gray-300 py-6"
        />
      </div>
      
      {filteredCustomers.length > 0 && (
        <div className="border rounded-md shadow-sm divide-y bg-white max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-3 cursor-pointer hover:bg-gray-50 border-l-4 border-l-red-500"
              onClick={() => onCustomerSelect(customer)}
            >
              <div className="font-medium">
                {customer.name}
              </div>
              <div className="text-sm text-gray-500">
                {customer.phone} • {customer.email}
              </div>
              <div className="text-sm text-gray-500">
                Points: {customer.loyalty_points}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedCustomer && (
        <div className="space-y-4 mt-2">
          {/* Selected customer details are now handled by CustomerDetails component */}
        </div>
      )}
    </div>
  );
};
