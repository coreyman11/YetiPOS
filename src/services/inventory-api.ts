
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { locationsApi } from './locations-api'

type InventoryItem = Database['public']['Tables']['inventory']['Row']
type InventoryCategory = Database['public']['Tables']['inventory']['Row']

// Cache for barcode scanning to avoid multiple DB hits
let barcodeCache = new Map<string, any>()

export const inventoryApi = {
  getAll: async (locationId?: string | null) => {
    // If locationId is provided use it, otherwise get the current location
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'get_all',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  getAllCategories: async (locationId?: string | null) => {
    // If locationId is provided use it, otherwise get the current location
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'get_categories',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  createCategory: async (name: string, color?: string) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'create_category',
        locationId: location?.id,
        categoryData: { name, color }
      }
    });
    
    if (error) throw error;
    return data;
  },

  updateCategory: async (categoryId: number, name: string, color?: string) => {
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'update_category',
        categoryId,
        categoryData: { name, color }
      }
    });
    
    if (error) throw error;
    return data;
  },

  deleteCategory: async (categoryId: number) => {
    const location = await locationsApi.getCurrentLocation();
    
    // Get category name first
    const { data: category } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'get_categories',
        locationId: location?.id
      }
    });
    
    const categoryToDelete = category?.find((cat: any) => cat.id === categoryId);
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'delete_category',
        categoryId,
        locationId: location?.id,
        categoryData: { name: categoryToDelete?.name }
      }
    });
    
    if (error) throw error;
    return data.success;
  },

  create: async (item: Omit<InventoryItem, 'id' | 'created_at'>) => {
    const location = await locationsApi.getCurrentLocation();
    const location_id = item.location_id || location?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'create_item',
        locationId: location_id,
        itemData: item
      }
    });
    
    if (error) throw error;
    return data;
  },

  update: async (id: number, item: Partial<InventoryItem>) => {
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'update_item',
        itemId: id,
        itemData: item
      }
    });
    
    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'delete_item',
        itemId: id
      }
    });
    
    if (error) throw error;
    return data.success;
  },

  findByBarcode: async (barcode: string) => {
    // Check cache first
    if (barcodeCache.has(barcode)) {
      return { data: barcodeCache.get(barcode), error: null }
    }
    
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-inventory-api', {
      body: { 
        action: 'find_by_barcode',
        locationId: location?.id,
        barcode
      }
    });
    
    if (error) {
      return { data: null, error }
    }
    
    // Save to cache
    if (data) {
      barcodeCache.set(barcode, data)
    }
    
    return { data, error: null }
  },

  findById: async (id: number) => {
    // Use direct query for single item lookup as it's less sensitive
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  clearBarcodeCache: () => {
    barcodeCache.clear()
  }
}
