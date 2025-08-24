
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Store {
  id: string;
  name: string;
}

interface StoreSelectorProps {
  userId: string;
  userProfile: any;
  onComplete: () => void;
}

export const StoreSelector = ({ userId, userProfile, onComplete }: StoreSelectorProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        // First check if the user has allowed locations
        if (userProfile.allowed_locations && userProfile.allowed_locations.length > 0) {
          // Fetch only the locations the user has access to
          const { data, error } = await supabase
            .from('locations')
            .select('*')
            .in('id', userProfile.allowed_locations);
          
          if (error) throw error;
          setStores(data || []);
        } else if (userProfile.role === 'admin') {
          // Admins can see all locations
          const { data, error } = await supabase
            .from('locations')
            .select('*');
          
          if (error) throw error;
          setStores(data || []);
        } else {
          // User has no specific permissions
          setStores([]);
          toast.error("You don't have access to any locations. Please contact an administrator.");
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [userProfile]);

  const handleStoreSelect = async () => {
    if (!selectedStore) {
      toast.error("Please select a store");
      return;
    }

    try {
      const selectedStoreData = stores.find(s => s.id === selectedStore);
      if (!selectedStoreData) throw new Error("Store not found");
      
      // Store both user profile and selected store in localStorage
      localStorage.setItem('selectedUser', JSON.stringify(userProfile));
      localStorage.setItem('selectedStore', JSON.stringify(selectedStoreData));
      
      // Navigate to the main page or call the onComplete callback
      onComplete();
    } catch (error) {
      console.error("Store selection error:", error);
      toast.error("Failed to select store");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">No locations available for you.</p>
        <p className="text-xs text-muted-foreground mt-2">Please contact an administrator to get access.</p>
      </div>
    );
  }

  return (
    <div>
      <CardContent className="space-y-4">
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger>
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
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          disabled={!selectedStore} 
          onClick={handleStoreSelect}
        >
          Continue
        </Button>
      </CardFooter>
    </div>
  );
};
