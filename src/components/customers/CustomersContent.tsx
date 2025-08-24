
import { useState } from "react";
import { Plus, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerList } from "./CustomerList";
import { CustomerSearch } from "./CustomerSearch";
import { CustomerPagination } from "./CustomerPagination";
import { CustomerDetails } from "./CustomerDetails";
import { AddCustomerForm } from "./AddCustomerForm";
import { useCustomers } from "@/hooks/useCustomers";
import { useRealtime } from "@/contexts/realtime-context";
import { Database } from "@/types/supabase";
import { useQueryClient } from "@tanstack/react-query";

// Define types that match those in CustomerDetails component
type TransactionItem = {
  service_id: number | null;
  services: {
    id?: number;
    name: string;
    price?: number;
    created_at?: string;
  } | null;
  inventory_id: number | null;
  inventory: {
    id?: number;
    name: string;
    description?: string;
    quantity?: number;
  } | null;
  quantity: number;
  price: number;
};

// Define Transaction type that matches CustomerDetails
type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: TransactionItem[];
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface CustomersContentProps {
  inModal?: boolean;
}

export const CustomersContent = ({ inModal = false }: CustomersContentProps) => {
  const { networkStatus } = useRealtime();
  // Import queryClient directly
  const queryClient = useQueryClient();

  const {
    customers,
    isLoading,
    selectedCustomer,
    setSelectedCustomer,
    editingCustomer,
    setEditingCustomer,
    isAddingCustomer,
    setIsAddingCustomer,
    loyaltyTransactions,
    transactions,
    pointsValueCents,
    searchTerm,
    setSearchTerm,
    handleUpdateCustomer,
    pagination
  } = useCustomers();
  
  // Add a function to force a refresh of loyalty transactions when customer details are opened
  const handleSelectCustomer = (customer: Database['public']['Tables']['customers']['Row']) => {
    setSelectedCustomer(customer);
    // Use the directly imported queryClient instead of trying to access it from useCustomers
    queryClient.invalidateQueries({ queryKey: ['loyalty-transactions', customer.id] });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
        </div>
        <div className="flex items-center gap-2">
          {!networkStatus.online && (
            <div className="flex items-center text-yellow-600 mr-2">
              <WifiOff className="h-4 w-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
          <Button onClick={() => setIsAddingCustomer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <CustomerSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />

        <CustomerList
          customers={customers}
          pointsValueCents={pointsValueCents}
          inModal={inModal}
          onCustomerSelect={inModal ? handleSelectCustomer : undefined}
        />

        <CustomerPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={Math.min(pagination.endIndex, pagination.totalItems)}
          totalItems={pagination.totalItems}
          onPreviousPage={pagination.handlePreviousPage}
          onNextPage={pagination.handleNextPage}
        />
      </div>

      <CustomerDetails
        selectedCustomer={selectedCustomer}
        editingCustomer={editingCustomer}
        loyaltyTransactions={loyaltyTransactions}
        transactions={transactions as unknown as Transaction[]}
        onClose={() => {
          setSelectedCustomer(null);
          setEditingCustomer(null);
        }}
        onEdit={setEditingCustomer}
        onUpdate={setEditingCustomer}
        onSave={handleUpdateCustomer}
      />

      <AddCustomerForm 
        isOpen={isAddingCustomer}
        onClose={() => setIsAddingCustomer(false)}
      />
    </div>
  );
};
