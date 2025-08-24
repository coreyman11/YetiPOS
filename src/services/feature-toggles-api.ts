import { supabase } from '@/lib/supabase';

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_core: boolean;
  is_visible?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureToggle {
  id: string;
  location_id: string;
  feature_id: string;
  is_enabled: boolean;
  enabled_by: string | null;
  enabled_at: string | null;
  disabled_by: string | null;
  disabled_at: string | null;
  created_at: string;
  updated_at: string;
  feature_definition?: FeatureDefinition;
}

export interface VendorAdminAuditLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  location_id: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: string;
}

export const featureTogglesApi = {
  // Feature Definitions Management
  async getAllFeatureDefinitions(): Promise<FeatureDefinition[]> {
    const { data, error } = await supabase
      .from('feature_definitions')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createFeatureDefinition(
    definition: Omit<FeatureDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FeatureDefinition> {
    const { data, error } = await supabase
      .from('feature_definitions')
      .insert(definition)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFeatureDefinition(
    id: string,
    updates: Partial<Omit<FeatureDefinition, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<FeatureDefinition> {
    const { data, error } = await supabase
      .from('feature_definitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFeatureDefinition(id: string): Promise<void> {
    const { error } = await supabase
      .from('feature_definitions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Feature Toggles Management
  async getFeatureTogglesForLocation(locationId: string): Promise<FeatureToggle[]> {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select(`
        *,
        feature_definition:feature_definitions (*)
      `)
      .eq('location_id', locationId)
      .order('feature_definitions(category)', { ascending: true })
      .order('feature_definitions(name)', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllFeatureToggles(): Promise<FeatureToggle[]> {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select(`
        *,
        feature_definition:feature_definitions (*)
      `)
      .order('location_id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateFeatureToggle(
    id: string,
    isEnabled: boolean
  ): Promise<FeatureToggle> {
    const currentUser = await supabase.auth.getUser();
    const now = new Date().toISOString();

    const updates = {
      is_enabled: isEnabled,
      ...(isEnabled 
        ? { 
            enabled_by: currentUser.data.user?.id, 
            enabled_at: now,
            disabled_by: null,
            disabled_at: null
          }
        : { 
            disabled_by: currentUser.data.user?.id, 
            disabled_at: now,
            enabled_by: null,
            enabled_at: null
          }
      )
    };

    const { data, error } = await supabase
      .from('feature_toggles')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        feature_definition:feature_definitions (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async bulkUpdateFeatureToggles(
    locationId: string,
    updates: Array<{ featureId: string; isEnabled: boolean }>
  ): Promise<void> {
    const currentUser = await supabase.auth.getUser();
    const now = new Date().toISOString();

    for (const update of updates) {
      const toggleUpdates = {
        is_enabled: update.isEnabled,
        ...(update.isEnabled 
          ? { 
              enabled_by: currentUser.data.user?.id, 
              enabled_at: now,
              disabled_by: null,
              disabled_at: null
            }
          : { 
              disabled_by: currentUser.data.user?.id, 
              disabled_at: now,
              enabled_by: null,
              enabled_at: null
            }
        )
      };

      const { error } = await supabase
        .from('feature_toggles')
        .update(toggleUpdates)
        .eq('location_id', locationId)
        .eq('feature_id', update.featureId);

      if (error) throw error;
    }
  },

  // Feature Status Checking
  async isFeatureEnabled(featureName: string, locationId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_feature_enabled', {
      feature_name: featureName,
      location_id: locationId
    });

    if (error) throw error;
    return data || true; // Default to enabled if no toggle exists
  },

  async getEnabledFeaturesForLocation(locationId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('feature_toggles')
      .select(`
        feature_definitions (name, is_visible)
      `)
      .eq('location_id', locationId)
      .eq('is_enabled', true);

    if (error) throw error;
    return (
      data
        ?.map(item => item.feature_definitions as any)
        .filter(fd => fd && fd.is_visible !== false) // Only include visible features
        .map(fd => fd.name) || []
    );
  },

  // Vendor Admin Audit Logs
  async getAuditLogs(
    locationId?: string,
    targetType?: string,
    limit: number = 100
  ): Promise<VendorAdminAuditLog[]> {
    let query = supabase
      .from('vendor_admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Vendor Admin Utilities
  async isVendorAdmin(userId?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_vendor_admin', {
      user_id: userId || undefined
    });

    if (error) throw error;
    return data || false;
  },

  // Initialize feature toggles for new location
  async initializeFeatureTogglesForLocation(locationId: string): Promise<void> {
    // Get all feature definitions
    const { data: features, error: featuresError } = await supabase
      .from('feature_definitions')
      .select('id');

    if (featuresError) throw featuresError;

    // Create toggles for all features (enabled by default)
    const toggles = features?.map(feature => ({
      location_id: locationId,
      feature_id: feature.id,
      is_enabled: true
    })) || [];

    if (toggles.length > 0) {
      const { error } = await supabase
        .from('feature_toggles')
        .insert(toggles);

      if (error) throw error;
    }
  }
};