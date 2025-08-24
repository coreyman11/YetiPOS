
import { supabase } from '@/lib/supabase';
import { Role, RolePermission, CreateRoleData, UpdateRoleData, EffectivePermission } from '@/types/database/roles';

export const rolesApi = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get role by ID
  getById: async (id: string): Promise<Role | null> => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new role
  create: async (roleData: CreateRoleData): Promise<Role> => {
    const { data, error } = await supabase
      .from('roles')
      .insert([roleData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update role
  update: async (id: string, updates: UpdateRoleData): Promise<Role> => {
    const { data, error } = await supabase
      .from('roles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete role
  delete: async (id: string): Promise<void> => {
    // Check if role is a system role
    const role = await rolesApi.getById(id);
    if (role?.is_system) {
      throw new Error('Cannot delete system roles');
    }

    // Check if any users are assigned to this role
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role_id', id)
      .limit(1);

    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      throw new Error('Cannot delete role that has users assigned to it');
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get role permissions
  getPermissions: async (roleId: string): Promise<RolePermission[]> => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permission_definitions (
          id,
          name,
          category,
          description
        )
      `)
      .eq('role_id', roleId);
    
    if (error) throw error;
    return data || [];
  },

  // Set role permissions
  setPermissions: async (roleId: string, permissionIds: string[]): Promise<void> => {
    // First, delete existing permissions for this role
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);
    
    if (deleteError) throw deleteError;

    // Then, insert new permissions
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        granted: true
      }));

      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(rolePermissions);
      
      if (insertError) throw insertError;
    }
  },

  // Get effective permissions for a user (combines role + individual overrides)
  getUserEffectivePermissions: async (userId: string): Promise<EffectivePermission[]> => {
    const { data, error } = await supabase.rpc('get_user_effective_permissions', {
      p_user_id: userId
    });
    
    if (error) throw error;
    return data || [];
  },

  // Assign role to user
  assignToUser: async (userId: string, roleId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role_id: roleId })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Get users assigned to a role
  getUsersByRole: async (roleId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('role_id', roleId);
    
    if (error) throw error;
    return data || [];
  }
};
