-- Fix the membership_plans RLS policy to properly handle admin permissions
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

-- Create a simpler, more robust INSERT policy for membership_plans
CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Direct admin role check
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin' OR
    -- Admin role via role_id
    (SELECT r.name FROM user_profiles up JOIN roles r ON up.role_id = r.id WHERE up.id = auth.uid()) = 'Admin' OR
    -- Permission-based check
    EXISTS (
      SELECT 1 FROM get_user_effective_permissions(auth.uid()) 
      WHERE permission_name = 'manage_memberships' AND granted = true
    ) OR
    -- Location-based access for non-admin users
    (location_id IS NOT NULL AND location_id IN (
      SELECT unnest(allowed_locations) FROM user_profiles WHERE id = auth.uid()
    ))
  )
);