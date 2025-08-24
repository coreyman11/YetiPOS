
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { locationsApi } from './locations-api';

type Discount = Database['public']['Tables']['discounts']['Row'];
type DiscountInsert = Database['public']['Tables']['discounts']['Insert'];
type DiscountUpdate = Database['public']['Tables']['discounts']['Update'];

export const discountsApi = {
  async getAll() {
    try {
      const location = await locationsApi.getCurrentLocation();
      
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('location_id', location?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching discounts:', error);
      throw error;
    }
  },

  async getActive() {
    try {
      const location = await locationsApi.getCurrentLocation();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('location_id', location?.id)
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.gt.${now},end_date.is.null`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active discounts:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching discount with ID ${id}:`, error);
      throw error;
    }
  },

  async create(discount: DiscountInsert) {
    try {
      if (!discount.location_id) {
        const location = await locationsApi.getCurrentLocation();
        discount.location_id = location?.id;
      }
      
      const { data, error } = await supabase
        .from('discounts')
        .insert(discount)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  },

  async update(id: string, updates: DiscountUpdate) {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating discount with ID ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting discount with ID ${id}:`, error);
      throw error;
    }
  },

  async toggleActive(id: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error toggling active state for discount with ID ${id}:`, error);
      throw error;
    }
  }
};
