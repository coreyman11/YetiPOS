
import { supabase } from '@/lib/supabase'
import { locationsApi } from './locations-api'

export const membershipsApi = {
  getCustomerMemberships: async (customerId: number) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_customer_memberships',
        customerId
      }
    });
    
    if (error) throw error;
    return data;
  },

  getAll: async (locationId?: string | null) => {
    // If locationId is provided use it, otherwise get the current location
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_all_plans',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  getAllBenefits: async (locationId?: string | null) => {
    // If locationId is provided use it, otherwise get the current location
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_all_benefits',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  createPlan: async (plan: any) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'create_plan',
        locationId: location?.id,
        planData: plan
      }
    });
    
    if (error) throw error;
    return data;
  },

  updatePlan: async (planId: string, plan: any) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'update_plan',
        planId,
        planData: plan
      }
    });
    
    if (error) throw error;
    return data;
  },

  deletePlan: async (planId: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'delete_plan',
        planId
      }
    });
    
    if (error) throw error;
    return data.success;
  },

  addCustomerMembership: async (customerId: number, planId: string) => {
    const location = await locationsApi.getCurrentLocation();
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'add_customer_membership',
        customerId,
        planId,
        locationId: location?.id
      }
    });
    
    if (error) throw error;
    return data;
  },

  cancelCustomerMembership: async (membershipId: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'cancel_customer_membership',
        membershipId
      }
    });
    
    if (error) throw error;
    return data;
  },

  updateCustomerMembership: async (membershipId: string, updates: any) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'update_customer_membership',
        membershipId,
        updates
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Billing-related methods
  getBillingSettings: async (locationId?: string | null) => {
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_billing_settings',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  updateBillingSettings: async (locationId: string, settings: any) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'update_billing_settings',
        locationId,
        settings
      }
    });
    
    if (error) throw error;
    return data;
  },

  getUsageTracking: async (membershipId: string, startDate?: string, endDate?: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_usage_tracking',
        membershipId,
        startDate,
        endDate
      }
    });
    
    if (error) throw error;
    return data;
  },

  getBillingInvoices: async (membershipId: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_billing_invoices',
        membershipId
      }
    });
    
    if (error) throw error;
    return data;
  },

  triggerBillingRun: async (locationId?: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'trigger_billing_run',
        locationId
      }
    });
    
    if (error) throw error;
    return data;
  },

  getBillingDashboardStats: async (locationId?: string | null) => {
    const location_id = locationId || (await locationsApi.getCurrentLocation())?.id;
    
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_billing_dashboard_stats',
        locationId: location_id
      }
    });
    
    if (error) throw error;
    return data;
  },

  // New functions for managing plan-location relationships
  addPlanLocations: async (planId: string, locationIds: string[]) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'add_plan_locations',
        planId,
        locationIds
      }
    });
    
    if (error) throw error;
    return data;
  },

  getPlanLocations: async (planId: string) => {
    const { data, error } = await supabase.functions.invoke('secure-memberships-api', {
      body: { 
        action: 'get_plan_locations',
        planId
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Get all locations for the multi-select
  getAllLocations: async () => {
    return await locationsApi.getAll();
  }
}
