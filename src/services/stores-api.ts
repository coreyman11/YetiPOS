import { supabase } from '@/lib/supabase'
import { Database } from '@/integrations/supabase/types'
import { locationsApi } from './locations-api'

type Store = Database['public']['Tables']['online_stores']['Row']
type StoreInventory = Database['public']['Tables']['store_inventory']['Row']

export const storesApi = {
  getAll: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('online_stores')
      .select('*')
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  getById: async (id: number) => {
    const { data, error } = await supabase
      .from('online_stores')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('online_stores')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (store: Partial<Store> & Pick<Store, 'name' | 'slug'>) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('online_stores')
      .insert({
        ...store,
        location_id: location?.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: number, store: Partial<Store>) => {
    console.log("Updating store in API:", id, store)
    
    // Clean up the data before sending to the API
    // Convert empty strings to null for nullable fields
    const cleanData: Partial<Store> = { ...store }
    
    // List of fields that should be null instead of empty string
    const nullableFields = ['description', 'logo_url', 'banner_url', 'banner_title', 'banner_subtitle', 'banner_cta_text']
    
    nullableFields.forEach(field => {
      if (field in cleanData && cleanData[field as keyof Partial<Store>] === '') {
        // Type assertion to tell TypeScript this is a valid field and can be null
        (cleanData as any)[field] = null;
      }
    })
    
    const { data, error } = await supabase
      .from('online_stores')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error("Supabase update error:", error)
      throw error
    }
    return data
  },

  getStoreInventory: async (storeId: number, locationId?: string) => {
    // If locationId is provided, use it directly (for public storefront)
    // Otherwise, get current location (for authenticated users)
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase
      .from('store_inventory')
      .select(`
        *,
        inventory(*)
      `)
      .eq('store_id', storeId)
      .eq('is_visible', true) // Only get visible items for the storefront
      .eq('location_id', location_id)
    
    if (error) throw error
    return data
  },
  
  getFullStoreInventory: async (storeId: number) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('store_inventory')
      .select(`
        *,
        inventory(*)
      `)
      .eq('store_id', storeId)
      .eq('location_id', location?.id)
    
    if (error) throw error
    return data
  },

  updateStoreInventory: async (items: Partial<StoreInventory>[]) => {
    const location = await locationsApi.getCurrentLocation();
    
    // Add location_id to each item
    const itemsWithLocation = items.map(item => ({
      ...item,
      location_id: location?.id
    }));
    
    const { data, error } = await supabase
      .from('store_inventory')
      .upsert(itemsWithLocation, { 
        onConflict: 'store_id,inventory_id',
        ignoreDuplicates: false 
      })
      .select()
    
    if (error) throw error
    return data
  },
  
  syncInventoryWithPOS: async (storeId: number) => {
    try {
      console.log("Starting inventory sync for store ID:", storeId);
      const location = await locationsApi.getCurrentLocation();
      
      // Get all inventory from POS
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('location_id', location?.id)
      
      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError);
        throw inventoryError;
      }
      
      // Get current store inventory
      const { data: storeInventory, error: storeError } = await supabase
        .from('store_inventory')
        .select('*')
        .eq('store_id', storeId)
        .eq('location_id', location?.id)
      
      if (storeError) {
        console.error("Error fetching store inventory:", storeError);
        throw storeError;
      }
      
      console.log(`Found ${inventoryItems.length} inventory items and ${storeInventory.length} store inventory items`);
      
      // Find items that are in inventory but not in store inventory
      const missingItems = inventoryItems.filter(item => 
        !storeInventory.some(si => si.inventory_id === item.id)
      );
      
      // Also update existing items to ensure prices match
      const itemsToUpdate = inventoryItems.filter(item =>
        storeInventory.some(si => 
          si.inventory_id === item.id && 
          (si.price !== item.price || !si.is_visible)
        )
      );
      
      console.log(`Found ${missingItems.length} missing items and ${itemsToUpdate.length} items to update`);
      
      // Prepare upsert data for missing items
      const upsertDataForMissing = missingItems.map(item => ({
        store_id: storeId,
        inventory_id: item.id,
        is_visible: true,
        price: item.price || 0,
        image_url: null,
        location_id: location?.id
      }));
      
      // Prepare upsert data for existing items that need updating
      const upsertDataForExisting = itemsToUpdate.map(item => {
        const storeItem = storeInventory.find(si => si.inventory_id === item.id);
        return {
          store_id: storeId,
          inventory_id: item.id,
          is_visible: true,
          price: item.price || 0,
          image_url: storeItem?.image_url || null,
          location_id: location?.id
        };
      });
      
      const upsertData = [...upsertDataForMissing, ...upsertDataForExisting];
      
      if (upsertData.length === 0) {
        console.log("No changes needed, store inventory is already synced");
        return { data: [], added: 0, updated: 0 };
      }
      
      // Add missing items and update existing items in store inventory
      const { data, error } = await supabase
        .from('store_inventory')
        .upsert(upsertData, {
          onConflict: 'store_id,inventory_id',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error("Error upserting inventory:", error);
        throw error;
      }
      
      console.log(`Successfully synced inventory: added ${missingItems.length}, updated ${itemsToUpdate.length} items`);
      
      return { 
        data, 
        added: missingItems.length,
        updated: itemsToUpdate.length
      };
    } catch (error) {
      console.error('Error syncing inventory:', error);
      throw error;
    }
  }
};
