
import { supabase } from '@/lib/supabase';

export interface Location {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const locationsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  create: async (name: string) => {
    const { data, error } = await supabase
      .from('locations')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('locations')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  assignUserToLocation: async (userId: string, locationId: string) => {
    // First get the current allowed_locations
    const { data: user, error: fetchError } = await supabase
      .from('user_profiles')
      .select('allowed_locations')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!user) throw new Error('User not found');
    
    // Add the new location to the array if it's not already there
    const currentLocations = user.allowed_locations || [];
    if (!currentLocations.includes(locationId)) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          allowed_locations: [...currentLocations, locationId]
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
    }
    
    return true;
  },

  removeUserFromLocation: async (userId: string, locationId: string) => {
    // First get the current allowed_locations
    const { data: user, error: fetchError } = await supabase
      .from('user_profiles')
      .select('allowed_locations')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    if (!user) throw new Error('User not found');
    
    // Filter out the location
    const currentLocations = user.allowed_locations || [];
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        allowed_locations: currentLocations.filter(id => id !== locationId)
      })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    return true;
  },

  getCurrentLocation: async (): Promise<Location | null> => {
    try {
      // First try to get from localStorage
      const storedStore = localStorage.getItem('selectedStore');
      if (storedStore) {
        return JSON.parse(storedStore);
      }

      // If no stored location, get the first available location for the user
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('allowed_locations')
        .eq('id', user.user.id)
        .maybeSingle();

      if (profile?.allowed_locations && profile.allowed_locations.length > 0) {
        const { data: location } = await supabase
          .from('locations')
          .select('*')
          .eq('id', profile.allowed_locations[0])
          .maybeSingle();

        if (location) {
          // Store it for future use
          localStorage.setItem('selectedStore', JSON.stringify(location));
          return location;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  },
  
  // Add a convenience method to get location ID
  getCurrentLocationId: async (): Promise<string | null> => {
    try {
      const location = await locationsApi.getCurrentLocation();
      return location?.id || null;
    } catch (error) {
      console.error("Error getting current location ID:", error);
      return null;
    }
  },

  // Updated function to get users for a location using the secure edge function
  getUsersForLocation: async (locationId: string) => {
    try {
      if (!locationId) {
        console.warn("No location ID provided to getUsersForLocation");
        return [];
      }

      console.log(`Fetching users for location: ${locationId}`);
      
      // Use the manage-users edge function for security instead of direct database query
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          action: 'list_location_users',
          locationId: locationId
        }
      });
      
      if (error) {
        console.error("Error fetching location users via edge function:", error);
        // Fallback to direct query if edge function fails but with improved array syntax
        const { data: locationUsers = [], error: locError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, employee_code, role')
          .contains('allowed_locations', [locationId])
          .not('employee_code', 'is', null);
        
        if (locError) {
          console.error("Error in fallback query:", locError);
          return [];
        }
        
        console.log(`Fallback: Found ${locationUsers.length} users with employee codes for location ${locationId}`);
        return locationUsers.sort((a, b) => 
          (a.full_name || a.email).localeCompare(b.full_name || b.email)
        );
      }

      const users = data || [];
      console.log(`Edge function: Found ${users.length} users with employee codes for location ${locationId}`);
      
      // Sort by full name
      return users.sort((a, b) => 
        (a.full_name || a.email).localeCompare(b.full_name || b.email)
      );
    } catch (error) {
      console.error("Error in getUsersForLocation:", error);
      return [];
    }
  }
};
