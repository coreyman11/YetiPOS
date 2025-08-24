
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi, loyaltyProgramApi } from "@/services";
import { getCustomerLoyaltyBalance } from "@/services/loyalty-program-api";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";
import { usePagination } from "./usePagination";

type Customer = Database['public']['Tables']['customers']['Row'];
type LoyaltyTransaction = Database['public']['Tables']['loyalty_transactions']['Row'];

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

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  transaction_items: TransactionItem[];
};

export const useCustomers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
    staleTime: 0,
    refetchInterval: 60 * 1000,
  });

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const pagination = usePagination({
    totalItems: filteredCustomers.length,
    initialPageSize: 25
  });

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage
  } = pagination;

  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Ensure we're getting the most recent loyalty transactions data
  const { data: loyaltyTransactions = [] } = useQuery<LoyaltyTransaction[]>({
    queryKey: ['loyalty-transactions', selectedCustomer?.id],
    queryFn: () => loyaltyProgramApi.getTransactions(selectedCustomer!.id),
    enabled: !!selectedCustomer,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Always refetch when the component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['customer-transactions', selectedCustomer?.id],
    queryFn: () => customersApi.getCustomerTransactions(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  });

  const { data: activePrograms = [] } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: loyaltyProgramApi.getActivePrograms,
  });

  const defaultProgram = activePrograms[0];
  const pointsValueCents = defaultProgram?.points_value_cents ?? 0;

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;
    
    try {
      console.log('Saving customer updates:', editingCustomer);
      
      const updateData = {
        ...editingCustomer,
        name: `${editingCustomer.first_name || ''} ${editingCustomer.last_name || ''}`.trim()
      };
      
      await customersApi.update(editingCustomer.id, updateData);
      
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      if (selectedCustomer) {
        const updatedCustomerList = await customersApi.getAll();
        const updatedCustomer = updatedCustomerList.find(c => c.id === selectedCustomer.id);
        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
      
      setEditingCustomer(null);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  const prefetchNextPage = useCallback(() => {
    const nextPage = currentPage + 1;
    
    if (nextPage <= totalPages) {
      console.log(`Would prefetch page ${nextPage} if we had API pagination`);
    }
  }, [currentPage, totalPages]);

  return {
    customers: paginatedCustomers,
    filteredCustomers,
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
    pagination: {
      currentPage,
      pageSize,
      totalPages,
      startIndex,
      endIndex,
      totalItems: filteredCustomers.length,
      handlePageSizeChange,
      handlePreviousPage,
      handleNextPage,
      prefetchNextPage
    }
  };
};
