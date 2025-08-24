import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const useLogoSettings = () => {
  const { userProfile } = useAuth();
  
  // Get the current location - assuming first allowed location for now
  const currentLocationId = userProfile?.allowed_locations?.[0];

  return useQuery({
    queryKey: ['logo-settings', currentLocationId],
    queryFn: async () => {
      if (!currentLocationId) return null;
      
      const { data, error } = await supabase
        .from('logo_settings')
        .select('*')
        .eq('location_id', currentLocationId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!currentLocationId,
  });
};