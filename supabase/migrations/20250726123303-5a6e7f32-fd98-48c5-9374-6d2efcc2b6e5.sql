-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles with role access" ON public.user_profiles;

-- Create a security definer function to get current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create another security definer function to check if user has role via roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role_name()
RETURNS TEXT AS $$
  SELECT r.name 
  FROM public.user_profiles up 
  JOIN public.roles r ON r.id = up.role_id
  WHERE up.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create new policy using the security definer functions to avoid recursion
CREATE POLICY "Users can view profiles with role access" ON public.user_profiles
FOR SELECT USING (
  -- Users can see their own profile
  auth.uid() = id 
  OR 
  -- Admins can see any profile (using security definer function)
  public.get_current_user_role() = 'admin'
  OR
  -- Users with Admin or Manager roles can see any profile (using security definer function)
  public.get_current_user_role_name() IN ('Admin', 'Manager')
);