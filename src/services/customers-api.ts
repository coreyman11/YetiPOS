
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { locationsApi } from './locations-api';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerCreate = {
  name: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
  credit_card_number?: string;
  credit_card_expire_date?: string;
  token?: string;
  span?: string;
  bin?: string;
};

export const customersApi = {
  getAll: async () => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'get_all',
        locationId: location?.id
      }
    });
    
    if (error) throw error;
    return data;
  },

  getCustomerStats: async (locationId?: string) => {
    const location = locationId ? { id: locationId } : await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'get_stats',
        locationId: location?.id
      }
    });
    
    if (error) throw error;
    return data;
  },

  getCustomerTransactions: async (customerId: number) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'get_transactions',
        locationId: location?.id,
        customerId
      }
    });
    
    if (error) throw error;
    return data;
  },

  create: async (customer: CustomerCreate, sendInvitation: boolean = true) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'create',
        locationId: location?.id,
        customerData: customer,
        sendInvitation
      }
    });
    
    if (error) throw error;
    return data;
  },

  sendAccountInvitation: async (customerId: number, storeUrl?: string, storeName?: string) => {
    const { data, error } = await supabase.functions.invoke('send-customer-email', {
      body: { 
        customerId,
        type: 'account_completion',
        storeUrl,
        storeName
      }
    });
    
    if (error) throw error;
    return data;
  },

  sendPasswordReset: async (customerId: number, storeUrl?: string, storeName?: string) => {
    const { data, error } = await supabase.functions.invoke('send-customer-email', {
      body: { 
        customerId,
        type: 'password_reset',
        storeUrl,
        storeName
      }
    });
    
    if (error) throw error;
    return data;
  },

  update: async (id: number, customer: Partial<Customer>) => {
    console.log('Updating customer:', id, customer); // Add logging to debug
    
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'update',
        customerId: id,
        customerData: customer
      }
    });
    
    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
    
    console.log('Customer updated successfully:', data);
    return data;
  },

  delete: async (id: number) => {
    const { data, error } = await supabase.functions.invoke('secure-customers-api', {
      body: { 
        action: 'delete',
        customerId: id
      }
    });
    
    if (error) throw error;
    return data.success;
  },
};
