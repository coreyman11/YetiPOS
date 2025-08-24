-- Add missing permission definitions
INSERT INTO public.permission_definitions (name, category, description) VALUES
  ('manage_stores', 'Store Management', 'Manage store configurations and portal access'),
  ('manage_billing', 'Financial', 'Manage billing settings and processes'),
  ('manage_gift_cards', 'Sales', 'Manage gift card system and transactions')
ON CONFLICT (name) DO NOTHING;

-- Grant these permissions to Admin role by default
DO $$
DECLARE
  admin_role_id UUID;
  perm_record RECORD;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  
  IF admin_role_id IS NOT NULL THEN
    -- Grant the new permissions to admin role
    FOR perm_record IN 
      SELECT id FROM public.permission_definitions 
      WHERE name IN ('manage_stores', 'manage_billing', 'manage_gift_cards')
    LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, granted)
      VALUES (admin_role_id, perm_record.id, true)
      ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;
    END LOOP;
  END IF;
END $$;