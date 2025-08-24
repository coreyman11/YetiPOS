
-- Create permission definitions table
CREATE TABLE public.permission_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user permissions table
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permission_definitions(id) ON DELETE CASCADE NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Add RLS policies
ALTER TABLE public.permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Permission definitions policies (admins only)
CREATE POLICY "Admins can manage permission definitions" 
  ON public.permission_definitions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow everyone to view permission definitions
CREATE POLICY "Everyone can view permission definitions" 
  ON public.permission_definitions 
  FOR SELECT 
  USING (true);

-- User permissions policies
CREATE POLICY "Admins can manage all user permissions" 
  ON public.user_permissions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions" 
  ON public.user_permissions 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Insert default permission definitions
INSERT INTO public.permission_definitions (name, category, description) VALUES
-- Dashboard permissions
('view_dashboard', 'dashboard', 'View dashboard and analytics'),
('view_reports', 'dashboard', 'View sales reports and metrics'),

-- Sales permissions
('process_transactions', 'sales', 'Process sales transactions'),
('handle_refunds', 'sales', 'Process refunds and returns'),
('manage_register', 'sales', 'Open/close register and manage cash'),

-- Customer permissions
('view_customers', 'customers', 'View customer information'),
('create_customers', 'customers', 'Create new customers'),
('edit_customers', 'customers', 'Edit customer information'),
('delete_customers', 'customers', 'Delete customers'),

-- Inventory permissions
('view_inventory', 'inventory', 'View inventory items'),
('create_inventory', 'inventory', 'Add new inventory items'),
('edit_inventory', 'inventory', 'Edit inventory items'),
('delete_inventory', 'inventory', 'Delete inventory items'),
('manage_categories', 'inventory', 'Manage inventory categories'),

-- Configuration permissions
('manage_taxes', 'configuration', 'Configure tax settings'),
('manage_discounts', 'configuration', 'Configure discount rules'),
('manage_loyalty', 'configuration', 'Configure loyalty programs'),
('manage_locations', 'configuration', 'Manage store locations'),
('manage_shifts', 'configuration', 'Manage employee shifts'),

-- User management permissions
('view_users', 'user_management', 'View user accounts'),
('create_users', 'user_management', 'Create new user accounts'),
('edit_users', 'user_management', 'Edit user information'),
('delete_users', 'user_management', 'Delete user accounts'),
('manage_permissions', 'user_management', 'Assign user permissions'),

-- System settings permissions
('manage_settings', 'settings', 'Configure system settings'),
('manage_hardware', 'settings', 'Configure printers and hardware'),
('manage_receipts', 'settings', 'Configure receipt templates');

-- Grant all permissions to existing admin users
INSERT INTO public.user_permissions (user_id, permission_id, granted)
SELECT 
  up.id,
  pd.id,
  true
FROM public.user_profiles up
CROSS JOIN public.permission_definitions pd
WHERE up.role = 'admin';

-- Grant basic permissions to existing managers
INSERT INTO public.user_permissions (user_id, permission_id, granted)
SELECT 
  up.id,
  pd.id,
  true
FROM public.user_profiles up
CROSS JOIN public.permission_definitions pd
WHERE up.role = 'manager'
AND pd.name IN (
  'view_dashboard', 'view_reports', 'process_transactions', 'handle_refunds',
  'manage_register', 'view_customers', 'create_customers', 'edit_customers',
  'view_inventory', 'create_inventory', 'edit_inventory', 'manage_categories',
  'view_users'
);

-- Grant basic permissions to existing employees
INSERT INTO public.user_permissions (user_id, permission_id, granted)
SELECT 
  up.id,
  pd.id,
  true
FROM public.user_profiles up
CROSS JOIN public.permission_definitions pd
WHERE up.role = 'employee'
AND pd.name IN (
  'process_transactions', 'view_customers', 'create_customers', 'view_inventory'
);
