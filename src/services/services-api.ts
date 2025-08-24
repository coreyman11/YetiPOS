
// No changes needed to this file since the backend entity is still "services"
// The file is kept as is, it just needs to be referenced correctly in the components
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { locationsApi } from './locations-api'

type Service = Database['public']['Tables']['services']['Row']

export const servicesApi = {
  getAll: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('location_id', location?.id)
      .order('name')
    
    if (error) throw error
    return data
  },

  create: async (
    service: Omit<Service, 'id' | 'created_at'> & { 
      inventory_items?: { inventory_id: number; quantity: number }[] 
    }
  ) => {
    // Ensure location_id is set if not provided
    if (!service.location_id) {
      const location = await locationsApi.getCurrentLocation();
      service.location_id = location?.id;
    }
    
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (
    service: Service & { 
      inventory_items?: { inventory_id: number; quantity: number }[] 
    }
  ) => {
    // Ensure location_id is set if not provided
    if (!service.location_id) {
      const location = await locationsApi.getCurrentLocation();
      service.location_id = location?.id;
    }
    
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', service.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
}
