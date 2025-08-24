-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Create a new policy that allows users to see their own profile AND allows admins/managers to see any profile
CREATE POLICY "Users can view profiles with role access" ON public.user_profiles
FOR SELECT USING (
  -- Users can see their own profile
  auth.uid() = id 
  OR 
  -- Admins can see any profile
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role = 'admin'
  )
  OR
  -- Users with Admin or Manager roles can see any profile
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    JOIN public.roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() 
    AND r.name IN ('Admin', 'Manager')
  )
);