
import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/types/supabase";
import { inventoryApi } from "@/services";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/contexts/realtime";
import { supabase } from "@/lib/supabase";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export const useInventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [isViewingItem, setIsViewingItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hasRealtimeUpdates, setHasRealtimeUpdates] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { networkStatus } = useRealtime();

  useEffect(() => {
    if (!networkStatus.online) return;

    const channelName = `inventory-changes-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('🔄 Real-time inventory update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          
          toast({
            title: "Inventory Updated",
            description: `Inventory data has been ${payload.eventType.toLowerCase()}d`,
          });
          
          setHasRealtimeUpdates(true);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to inventory realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error connecting to inventory realtime updates');
          toast({
            title: "Connection Issue",
            description: "Unable to receive real-time updates. Data may not be current.",
            variant: "destructive",
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, toast, networkStatus.online]);

  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => await inventoryApi.getAll(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: hasRealtimeUpdates ? false : 60 * 1000,
    networkMode: networkStatus.online ? 'online' : 'always',
  });

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id' | 'created_at'>) => {
    if (!networkStatus.online) {
      toast({
        title: "Offline Mode",
        description: "You can't add inventory items while offline",
        variant: "destructive",
      });
      return;
    }

    try {
      const added = await inventoryApi.create(newItem);
      
      queryClient.setQueryData(['inventory'], (oldData: InventoryItem[] = []) => {
        return [...oldData, added];
      });
      
      setIsAddingItem(false);
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = async (item: InventoryItem) => {
    if (!networkStatus.online) {
      toast({
        title: "Offline Mode",
        description: "You can't edit inventory items while offline",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = await inventoryApi.update(item.id, item);
      
      queryClient.setQueryData(['inventory'], (oldData: InventoryItem[] = []) => {
        return oldData.map(existingItem => 
          existingItem.id === updated.id ? updated : existingItem
        );
      });
      
      setIsEditingItem(false);
      setSelectedItem(null);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditingItem(true);
  };

  const handleViewClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewingItem(true);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.barcode?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => {
      const nextPage = Math.min(totalPages, prev + 1);
      if (nextPage < totalPages) {
        prefetchNextPage();
      }
      return nextPage;
    });
  };

  const prefetchNextPage = useCallback(() => {
    if (!networkStatus.online) return;
    
    const nextPage = currentPage + 1;
    const totalPages = Math.ceil(filteredItems.length / pageSize);
    
    if (nextPage <= totalPages) {
      console.log(`Would prefetch page ${nextPage} if we had API pagination`);
    }
  }, [currentPage, pageSize, networkStatus.online, filteredItems.length]);

  return {
    items: paginatedItems,
    filteredItems,
    isLoading,
    isError,
    searchTerm,
    setSearchTerm,
    isAddingItem,
    setIsAddingItem,
    isEditingItem,
    setIsEditingItem,
    isViewingItem,
    setIsViewingItem,
    selectedItem,
    setSelectedItem,
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    networkStatus,
    hasRealtimeUpdates,
    handleAddItem,
    handleEditItem,
    handleEditClick,
    handleViewClick,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage
  };
};
