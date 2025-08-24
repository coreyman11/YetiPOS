import { supabase } from '@/lib/supabase';

export const permissionsApi = {
  async getAllPermissions() {
    const { data, error } = await supabase
      .from('permission_definitions')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getUserPermissions(userId: string) {
    const { data, error } = await supabase
      .from('user_permissions')
      .select(`
        id,
        user_id,
        permission_id,
        granted,
        permission_definitions (
          id,
          name,
          category,
          description
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async updateUserPermission(userId: string, permissionId: string, granted: boolean) {
    const { data: existing } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .eq('permission_id', permissionId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_permissions')
        .update({ 
          granted,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
          granted_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          permission_id: permissionId,
          granted,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
    }
  },

  async updateMultiplePermissions(userId: string, permissions: { permissionId: string; granted: boolean }[]) {
    for (const { permissionId, granted } of permissions) {
      await this.updateUserPermission(userId, permissionId, granted);
    }
  },

  async assignRolePermissions(userId: string, roleId: string) {
    // Get permissions assigned to this role from the database
    const { data: rolePermissions, error } = await supabase
      .from('role_permissions')
      .select('permission_id, granted')
      .eq('role_id', roleId);

    if (error) throw error;

    // Get all available permissions
    const allPermissions = await this.getAllPermissions();

    // Create a map of role permissions for quick lookup
    const rolePermissionMap = new Map(
      rolePermissions?.map(rp => [rp.permission_id, rp.granted]) || []
    );

    // Create permission updates array - grant permissions that are granted in the role
    const permissionUpdates = allPermissions.map(permission => ({
      permissionId: permission.id,
      granted: rolePermissionMap.get(permission.id) || false
    }));

    await this.updateMultiplePermissions(userId, permissionUpdates);
  }
};