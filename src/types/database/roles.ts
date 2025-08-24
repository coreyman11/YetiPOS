export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
}

export interface EffectivePermission {
  permission_id: string;
  permission_name: string;
  granted: boolean;
  source: 'role' | 'individual';
}

export interface CreateRoleData {
  name: string;
  description?: string;
  is_system?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}