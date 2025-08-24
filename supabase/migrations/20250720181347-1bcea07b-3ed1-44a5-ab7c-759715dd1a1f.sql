
-- Fix membership_plans RLS policies to handle admin users and authentication issues
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can insert membership plans for their locations" 
  ON public.membership_plans 
  FOR INSERT 
  WITH CHECK (
    -- Allow if user is authenticated and is admin (can create plans with null location_id)
    (auth.uid() IS NOT NULL AND (
      (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' OR
      (SELECT r.name FROM public.user_profiles up 
       JOIN public.roles r ON up.role_id = r.id 
       WHERE up.id = auth.uid()) = 'Admin'
    )) OR
    -- Allow if location_id matches user's allowed locations
    (auth.uid() IS NOT NULL AND location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  );

-- Fix role_permissions RLS policies to allow proper role management
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;

CREATE POLICY "Admins can manage role permissions" 
  ON public.role_permissions 
  FOR ALL 
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check for text-based admin role
      (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' OR
      -- Check for UUID-based Admin role
      (SELECT r.name FROM public.user_profiles up 
       JOIN public.roles r ON up.role_id = r.id 
       WHERE up.id = auth.uid()) = 'Admin'
    )
  );

-- Also fix the SELECT policy for role_permissions to be more permissive
DROP POLICY IF EXISTS "Everyone can view role permissions" ON public.role_permissions;

CREATE POLICY "Authenticated users can view role permissions" 
  ON public.role_permissions 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Add a policy for user_permissions table to ensure admins can manage all permissions
DROP POLICY IF EXISTS "Admins can manage all user permissions" ON public.user_permissions;

CREATE POLICY "Admins can manage all user permissions" 
  ON public.user_permissions 
  FOR ALL 
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check for text-based admin role
      (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' OR
      -- Check for UUID-based Admin role  
      (SELECT r.name FROM public.user_profiles up 
       JOIN public.roles r ON up.role_id = r.id 
       WHERE up.id = auth.uid()) = 'Admin'
    )
  );
