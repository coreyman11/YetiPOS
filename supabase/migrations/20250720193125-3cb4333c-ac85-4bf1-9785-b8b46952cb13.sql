-- Fix the get_user_effective_permissions function with proper column aliasing
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(p_user_id uuid)
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
    WHERE up.id = p_user_id
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
    WHERE user_perms.user_id = p_user_id
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

-- Test creating a membership plan to ensure permissions work
INSERT INTO public.membership_plans (name, description, price_cents, billing_interval, billing_interval_count, location_id)
VALUES ('Test Plan', 'A test membership plan', 2999, 'monthly', 1, null);