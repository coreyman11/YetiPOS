-- Add membership management permission
INSERT INTO public.permission_definitions (name, description, category)
VALUES ('manage_memberships', 'Create and manage membership plans', 'configuration');

-- Update membership_plans RLS policy for INSERT to be more robust
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  -- Check if user is authenticated
  auth.uid() IS NOT NULL AND (
    -- Check if user is admin (either direct role or resolved role name)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    OR 
    (SELECT r.name FROM public.user_profiles up JOIN public.roles r ON up.role_id = r.id WHERE up.id = auth.uid()) = 'Admin'
    OR
    -- Check if user has specific permission through the permission system
    EXISTS (
      SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
      WHERE permission_name = 'manage_memberships' AND granted = true
    )
    OR
    -- Allow if location_id is in user's allowed locations
    (location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  )
);