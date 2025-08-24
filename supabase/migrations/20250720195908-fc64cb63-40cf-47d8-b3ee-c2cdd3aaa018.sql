-- Fix user profile role data consistency
UPDATE public.user_profiles 
SET role_id = '9c99b496-fd1e-40c5-bbfd-1e9d268325f3'
WHERE id = 'f5b8c2a1-3456-7890-1234-567890123456'; -- Nick's profile

UPDATE public.user_profiles 
SET role_id = '9c99b496-fd1e-40c5-bbfd-1e9d268325f3', role = 'admin'
WHERE id = '123e4567-e89b-12d3-a456-426614174001'; -- Brandon's profile

-- Clean up test membership plan created by migration
DELETE FROM public.membership_plans 
WHERE name LIKE '%test%' OR name LIKE '%Test%';

-- Update membership_plans RLS policy to be more robust with role handling
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  -- Check if user is authenticated
  auth.uid() IS NOT NULL AND (
    -- Check if user is admin (handle both string and UUID formats)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    OR 
    -- Check if user has Admin role via role_id
    (SELECT r.name FROM public.user_profiles up 
     JOIN public.roles r ON up.role_id = r.id 
     WHERE up.id = auth.uid()) = 'Admin'
    OR
    -- Check if user has specific permission through the permission system
    EXISTS (
      SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
      WHERE permission_name = 'manage_memberships' AND granted = true
    )
    OR
    -- Allow if location_id is in user's allowed locations (for non-null location_id)
    (location_id IS NOT NULL AND location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  )
);

-- Also update the SELECT policy to be consistent
DROP POLICY IF EXISTS "Users can view membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can view membership plans for their locations" 
ON public.membership_plans 
FOR SELECT 
USING (
  -- Check if user is authenticated
  auth.uid() IS NOT NULL AND (
    -- Check if user is admin (handle both string and UUID formats)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    OR 
    -- Check if user has Admin role via role_id
    (SELECT r.name FROM public.user_profiles up 
     JOIN public.roles r ON up.role_id = r.id 
     WHERE up.id = auth.uid()) = 'Admin'
    OR
    -- Check if user has specific permission through the permission system
    EXISTS (
      SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) 
      WHERE permission_name = 'manage_memberships' AND granted = true
    )
    OR
    -- Allow if location_id is in user's allowed locations or is null (global plans)
    (location_id IS NULL OR location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  )
);