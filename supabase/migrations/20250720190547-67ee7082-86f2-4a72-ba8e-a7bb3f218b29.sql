
-- Fix the get_user_effective_permissions function to resolve ambiguous column references
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(user_id uuid)
RETURNS TABLE (
  permission_id uuid,
  permission_name text,
  granted boolean,
  source text
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
      user_perms.permission_id,
      pd.name as permission_name,
      user_perms.granted,
      'individual' as source
    FROM public.user_permissions user_perms
    JOIN public.permission_definitions pd ON user_perms.permission_id = pd.id
    WHERE user_perms.user_id = user_id
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

-- Assign the manage_memberships permission to the Admin role
INSERT INTO public.role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  pd.id as permission_id,
  true as granted
FROM public.roles r
CROSS JOIN public.permission_definitions pd
WHERE r.name = 'Admin' 
  AND pd.name = 'manage_memberships'
  AND NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp 
    WHERE rp.role_id = r.id AND rp.permission_id = pd.id
  );

-- Simplify the membership_plans RLS policy for INSERT to make it more reliable
DROP POLICY IF EXISTS "Users can insert membership plans for their locations" ON public.membership_plans;

CREATE POLICY "Users can insert membership plans for their locations" 
ON public.membership_plans 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Check if user is admin (either direct role or resolved role name)
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    OR 
    (SELECT r.name FROM public.user_profiles up JOIN public.roles r ON up.role_id = r.id WHERE up.id = auth.uid()) = 'Admin'
    OR
    -- Check if user has manage_memberships permission
    EXISTS (
      SELECT 1 FROM public.get_user_effective_permissions(auth.uid()) perms
      WHERE perms.permission_name = 'manage_memberships' AND perms.granted = true
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
