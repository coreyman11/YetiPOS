-- Fix the membership_plans RLS policies to properly handle admin access
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;
DROP POLICY IF EXISTS "Users can view membership plans for their locations" ON public.membership_plans;

-- Create a simplified INSERT policy that properly handles admin users
CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Check if user has admin role (string format)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' OR
    -- Check if user has Admin role (via role_id UUID)
    (SELECT r.name FROM public.user_profiles up 
     JOIN public.roles r ON up.role_id = r.id 
     WHERE up.id = auth.uid()) = 'Admin' OR
    -- Allow if location_id is in user's allowed locations (for non-admin users)
    (location_id IS NOT NULL AND location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    ))
  )
);

-- Create a simplified SELECT policy  
CREATE POLICY "Users can view membership plans for their locations" 
ON public.membership_plans 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Check if user has admin role (string format)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin' OR
    -- Check if user has Admin role (via role_id UUID)
    (SELECT r.name FROM public.user_profiles up 
     JOIN public.roles r ON up.role_id = r.id 
     WHERE up.id = auth.uid()) = 'Admin' OR
    -- Allow access to global plans (location_id is NULL)
    location_id IS NULL OR
    -- Allow if location_id is in user's allowed locations
    location_id IN (
      SELECT unnest(allowed_locations) 
      FROM public.user_profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Make sure at least one user has proper admin role
UPDATE public.user_profiles 
SET role = 'admin', role_id = '9c99b496-fd1e-40c5-bbfd-1e9d268325f3'
WHERE email = 'coreystevensnj@gmail.com';

-- Also set allowed_locations for the admin user to allow location-based access
UPDATE public.user_profiles 
SET allowed_locations = ARRAY((SELECT id::text FROM public.locations LIMIT 5))
WHERE email = 'coreystevensnj@gmail.com';