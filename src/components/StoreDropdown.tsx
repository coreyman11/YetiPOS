
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";

interface Store {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export const StoreDropdown = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching stores:", error);
          toast.error("Failed to load locations");
          setIsLoading(false);
          return;
        }

        setStores(data || []);

        // Get the selected store from localStorage
        const storedStore = localStorage.getItem('selectedStore');
        if (storedStore) {
          const parsedStore = JSON.parse(storedStore);
          // Verify the store is in the list of allowed stores
          if (data?.some(store => store.id === parsedStore.id)) {
            setSelectedStore(parsedStore.id);
          } else if (data && data.length > 0) {
            // If stored store is not allowed, select the first available one
            setSelectedStore(data[0].id);
            localStorage.setItem('selectedStore', JSON.stringify(data[0]));
          }
        } else if (data && data.length > 0) {
          // If no store is selected but we have stores, select the first one
          setSelectedStore(data[0].id);
          localStorage.setItem('selectedStore', JSON.stringify(data[0]));
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load locations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleStoreChange = async (storeId: string) => {
    try {
      const storeData = stores.find(s => s.id === storeId);
      if (!storeData) {
        toast.error("Store not found");
        return;
      }
      
      setSelectedStore(storeId);
      localStorage.setItem('selectedStore', JSON.stringify(storeData));
      
      // Refresh the page to update all the data based on the new store
      window.location.reload();
    } catch (error) {
      console.error("Error changing store:", error);
      toast.error("Failed to change store");
    }
  };

  if (isLoading) {
    return <div className="w-full p-2 text-sm text-muted-foreground">Loading locations...</div>;
  }

  if (stores.length === 0) {
    return <div className="w-full p-2 text-sm text-muted-foreground">No locations available</div>;
  }

  return (
    <div className="w-full">
      <p className="text-xs text-muted-foreground mb-1.5">Current Location</p>
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedStore} onValueChange={handleStoreChange}>
          <SelectTrigger className="w-full h-8 text-sm">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
