
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { locationsApi } from "./locations-api";

type TaxConfiguration = Database['public']['Tables']['tax_configurations']['Row'];
type InsertTaxConfiguration = Database['public']['Tables']['tax_configurations']['Insert'];
type UpdateTaxConfiguration = Database['public']['Tables']['tax_configurations']['Update'];

export const taxApi = {
  getAll: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase
      .from('tax_configurations')
      .select('*')
      .eq('location_id', location?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (tax: InsertTaxConfiguration) => {
    // Ensure location_id is set if not provided
    if (!tax.location_id) {
      const location = await locationsApi.getCurrentLocation();
      tax.location_id = location?.id;
    }
    
    const { data, error } = await supabase
      .from('tax_configurations')
      .insert(tax)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: number, tax: UpdateTaxConfiguration) => {
    // Ensure location_id is set if not provided
    if (!tax.location_id) {
      const location = await locationsApi.getCurrentLocation();
      tax.location_id = location?.id;
    }
    
    const { data, error } = await supabase
      .from('tax_configurations')
      .update(tax)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: number) => {
    const { error } = await supabase
      .from('tax_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
