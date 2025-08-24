
export interface UsersTables {
  user_profiles: {
    Row: {
      id: string
      full_name: string | null
      role: string | null
      role_id: string | null
      created_at: string
      updated_at: string
      employee_code: string | null
      email: string
      allowed_locations: string[] | null
    }
    Insert: {
      id: string
      full_name?: string | null
      role?: string | null
      role_id?: string | null
      created_at?: string
      updated_at?: string
      employee_code?: string | null
      email: string
      allowed_locations?: string[] | null
    }
    Update: {
      id?: string
      full_name?: string | null
      role?: string | null
      role_id?: string | null
      created_at?: string
      updated_at?: string
      employee_code?: string | null
      email?: string
      allowed_locations?: string[] | null
    }
  }
  permission_definitions: {
    Row: {
      id: string
      name: string
      category: string
      description: string | null
      created_at: string
    }
    Insert: {
      id?: string
      name: string
      category: string
      description?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      name?: string
      category?: string
      description?: string | null
      created_at?: string
    }
  }
  user_permissions: {
    Row: {
      id: string
      user_id: string
      permission_id: string
      granted: boolean
      granted_by: string | null
      granted_at: string
    }
    Insert: {
      id?: string
      user_id: string
      permission_id: string
      granted?: boolean
      granted_by?: string | null
      granted_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      permission_id?: string
      granted?: boolean
      granted_by?: string | null
      granted_at?: string
    }
  }
}
