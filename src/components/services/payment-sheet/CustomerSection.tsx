
import React from "react";
import { CustomerSearch } from "../payment/CustomerSearch";
import { CustomerDetails } from "../payment/CustomerDetails";
import { Database } from "@/types/supabase";
import { Separator } from "@/components/ui/separator";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSectionProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  pointsValue: number;
  canRedeemPoints: boolean;
  usePoints: boolean;
  onPointsChange: (checked: boolean) => void;
}

export const CustomerSection = ({
  customers,
  searchQuery,
  onSearchChange,
  selectedCustomer,
  onCustomerSelect,
  pointsValue,
  canRedeemPoints,
  usePoints,
  onPointsChange,
}: CustomerSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Customer Details</div>
      <CustomerSearch
        customers={customers}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={onCustomerSelect}
      />
      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          pointsValue={pointsValue}
          canRedeemPoints={canRedeemPoints}
          usePoints={usePoints}
          onPointsChange={onPointsChange}
        />
      )}
    </div>
  );
};
