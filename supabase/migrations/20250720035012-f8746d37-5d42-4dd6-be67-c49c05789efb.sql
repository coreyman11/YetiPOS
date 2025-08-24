-- Create roles table for custom role management
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions table to link roles with permissions
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permission_definitions(id) ON DELETE CASCADE NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Add role_id column to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN role_id UUID REFERENCES public.roles(id);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for roles
CREATE POLICY "Admins can manage roles" 
  ON public.roles 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view roles" 
  ON public.roles 
  FOR SELECT 
  USING (true);

-- RLS policies for role_permissions
CREATE POLICY "Admins can manage role permissions" 
  ON public.role_permissions 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view role permissions" 
  ON public.role_permissions 
  FOR SELECT 
  USING (true);

-- Insert default system roles
INSERT INTO public.roles (name, description, is_system) VALUES
('Admin', 'Full system access with all permissions', true),
('Manager', 'Store management with most permissions', true),
('Employee', 'Basic employee permissions for daily operations', true),
('Cashier', 'Point of sale and customer service permissions', true);

-- Create role permissions based on the existing user role permissions
INSERT INTO public.role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  pd.id as permission_id,
  true as granted
FROM public.roles r
CROSS JOIN public.permission_definitions pd
WHERE r.name = 'Admin';

INSERT INTO public.role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  pd.id as permission_id,
  true as granted
FROM public.roles r
CROSS JOIN public.permission_definitions pd
WHERE r.name = 'Manager'
AND pd.name IN (
  'view_dashboard', 'view_reports', 'process_transactions', 'handle_refunds',
  'manage_register', 'view_customers', 'create_customers', 'edit_customers',
  'view_inventory', 'create_inventory', 'edit_inventory', 'manage_categories',
  'view_users', 'manage_discounts', 'manage_loyalty', 'manage_shifts'
);

INSERT INTO public.role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  pd.id as permission_id,
  true as granted
FROM public.roles r
CROSS JOIN public.permission_definitions pd
WHERE r.name = 'Employee'
AND pd.name IN (
  'process_transactions', 'view_customers', 'create_customers', 'view_inventory'
);

INSERT INTO public.role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  pd.id as permission_id,
  true as granted
FROM public.roles r
CROSS JOIN public.permission_definitions pd
WHERE r.name = 'Cashier'
AND pd.name IN (
  'process_transactions', 'view_customers', 'create_customers', 'view_inventory', 'handle_refunds'
);

-- Update existing user profiles to use the new role system
UPDATE public.user_profiles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'Admin')
WHERE role = 'admin';

UPDATE public.user_profiles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'Manager')
WHERE role = 'manager';

UPDATE public.user_profiles 
SET role_id = (SELECT id FROM public.roles WHERE name = 'Employee')
WHERE role = 'employee';

-- Create function to get effective user permissions (role + individual overrides)
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(user_id UUID)
RETURNS TABLE (
  permission_id UUID,
  permission_name TEXT,
  granted BOOLEAN,
  source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    -- Get permissions from user's role
    SELECT 
      rp.permission_id,
      pd.name as permission_name,
      rp.granted,
      'role' as source
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permission_definitions pd ON rp.permission_id = pd.id
    WHERE up.id = user_id
  ),
  individual_perms AS (
    -- Get individual permission overrides
    SELECT 
      up.permission_id,
      pd.name as permission_name,
      up.granted,
      'individual' as source
    FROM public.user_permissions up
    JOIN public.permission_definitions pd ON up.permission_id = pd.id
    WHERE up.user_id = user_id
  )
  -- Combine role permissions with individual overrides (individual takes precedence)
  SELECT 
    COALESCE(ip.permission_id, rp.permission_id) as permission_id,
    COALESCE(ip.permission_name, rp.permission_name) as permission_name,
    COALESCE(ip.granted, rp.granted) as granted,
    COALESCE(ip.source, rp.source) as source
  FROM role_perms rp
  FULL OUTER JOIN individual_perms ip ON rp.permission_id = ip.permission_id;
END;
$$;