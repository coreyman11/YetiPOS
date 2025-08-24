-- Update the RLS policy to be more permissive for admin users
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Check if user has admin role in user_profiles table
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    -- Check if user has Admin role via role_id
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      JOIN public.roles r ON up.role_id = r.id 
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    ) OR
    -- Allow if location_id is in user's allowed locations (for non-admin users)
    (location_id IS NOT NULL AND location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  )
);