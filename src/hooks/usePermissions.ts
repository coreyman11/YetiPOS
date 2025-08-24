
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useFeatureToggle } from './useFeatureToggle';

export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted: boolean;
  permission: Permission;
}

export const usePermissions = () => {
  const { userProfile, activeUser, isAdmin } = useAuth();
  
  // Use activeUser if context is switched, otherwise use userProfile
  const effectiveUser = activeUser || userProfile;

  const { data: userPermissions = [], isLoading } = useQuery({
    queryKey: ['user-permissions', effectiveUser?.id],
    queryFn: async () => {
      if (!effectiveUser?.id) return [];
      
      // If the effective user is admin, they have all permissions
      const effectiveUserIsAdmin = effectiveUser?.role === 'admin' || 
                                   effectiveUser?.role_name === 'Admin' || 
                                   effectiveUser?.role_name === 'admin';
      
      if (effectiveUserIsAdmin) {
        const { data: allPerms, error } = await supabase
          .from('permission_definitions')
          .select('*');
        
        if (error) throw error;
        
        return allPerms.map(perm => ({
          id: `admin-${perm.id}`,
          user_id: effectiveUser.id,
          permission_id: perm.id,
          granted: true,
          permission: perm
        })) as UserPermission[];
      }
      
      // Get user's effective permissions from the database function
      const { data: effectivePerms, error } = await supabase.rpc('get_user_effective_permissions', {
        p_user_id: effectiveUser.id
      });

      if (error) throw error;
      
      // Also get permission definitions to merge with effective permissions
      const { data: permissionDefs, error: permDefsError } = await supabase
        .from('permission_definitions')
        .select('*');

      if (permDefsError) throw permDefsError;
      
      return effectivePerms
        .filter((perm: any) => perm.granted)
        .map((perm: any) => {
          const permissionDef = permissionDefs.find(def => def.id === perm.permission_id);
          return {
            id: `effective-${perm.permission_id}`,
            user_id: effectiveUser.id,
            permission_id: perm.permission_id,
            granted: perm.granted,
            permission: permissionDef || {
              id: perm.permission_id,
              name: perm.permission_name,
              category: 'unknown',
              description: null
            }
          };
        }) as UserPermission[];
    },
    enabled: !!effectiveUser?.id,
  });

  const hasPermission = (
    permissionName: string, 
    checkFeatureToggle: boolean = true
  ): boolean => {
    // Check if effective user is admin
    const effectiveUserIsAdmin = effectiveUser?.role === 'admin' || 
                                 effectiveUser?.role_name === 'Admin' || 
                                 effectiveUser?.role_name === 'admin';
    if (effectiveUserIsAdmin) return true;
    
    const hasPermissionGranted = userPermissions.some(
      up => up.permission.name === permissionName && up.granted
    );
    
    return hasPermissionGranted;
  };

  const hasAnyPermission = (
    permissionNames: string[], 
    checkFeatureToggle: boolean = true
  ): boolean => {
    // Check if effective user is admin
    const effectiveUserIsAdmin = effectiveUser?.role === 'admin' || 
                                 effectiveUser?.role_name === 'Admin' || 
                                 effectiveUser?.role_name === 'admin';
    if (effectiveUserIsAdmin) return true;
    
    return permissionNames.some(name => hasPermission(name, checkFeatureToggle));
  };

  const getPermissionsByCategory = (category: string): UserPermission[] => {
    return userPermissions.filter(up => up.permission.category === category);
  };

  // New function to check both permission and feature toggle
  const hasPermissionWithFeature = (permissionName: string, locationId?: string): boolean => {
    const hasPermissionGranted = hasPermission(permissionName, false);
    if (!hasPermissionGranted) return false;
    
    // If no location provided, just check permission
    if (!locationId) return true;
    
    // Map permission to feature name
    const featureName = getFeatureNameFromPermission(permissionName);
    if (!featureName) return hasPermissionGranted;
    
    // This would need to be handled at component level with useFeatureToggle hook
    // since we can't use hooks inside this custom hook
    return hasPermissionGranted;
  };

  const getFeatureNameFromPermission = (permissionName: string): string | null => {
    const permissionToFeatureMap: Record<string, string> = {
      'view_dashboard': 'dashboard',
      'manage_inventory': 'inventory',
      'view_inventory': 'inventory',
      'manage_customers': 'customers',
      'view_customers': 'customers',
      'process_transactions': 'transactions',
      'view_transactions': 'transactions',
      'view_reports': 'reports',
      'manage_gift_cards': 'gift_cards',
      'view_gift_cards': 'gift_cards',
      'manage_loyalty': 'loyalty_programs',
      'view_loyalty': 'loyalty_programs',
      'manage_memberships': 'memberships',
      'view_memberships': 'memberships',
      'manage_discounts': 'discounts',
      'view_discounts': 'discounts',
      'use_label_generator': 'label_generator',
      'manage_users': 'user_management',
      'view_billing': 'billing',
      'manage_billing': 'billing',
      'manage_stores': 'portal',
      'manage_portal': 'portal',
      'view_storefront': 'storefront',
      'manage_services': 'services',
      'view_services': 'services',
      'manage_shifts': 'shift_management',
      'view_shifts': 'shift_management',
      'manage_tax': 'tax_configuration',
      'manage_payments': 'payments'
    };
    
    return permissionToFeatureMap[permissionName] || null;
  };

  return {
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasPermissionWithFeature,
    getPermissionsByCategory,
    getFeatureNameFromPermission,
    isLoading,
  };
};

export const useAllPermissions = () => {
  return useQuery({
    queryKey: ['all-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_definitions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Permission[];
    },
  });
};

export const useUserPermissions = (userId?: string) => {
  return useQuery({
    queryKey: ['user-permissions-admin', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select(`
          id,
          user_id,
          permission_id,
          granted,
          permission_definitions!inner (
            id,
            name,
            category,
            description
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        permission_id: item.permission_id,
        granted: item.granted,
        permission: {
          id: item.permission_definitions.id,
          name: item.permission_definitions.name,
          category: item.permission_definitions.category,
          description: item.permission_definitions.description,
        }
      })) as UserPermission[];
    },
    enabled: !!userId,
  });
};
