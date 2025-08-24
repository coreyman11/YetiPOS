-- Tighten RLS for customers table and remove permissive policies
alter table public.customers enable row level security;

-- Drop overly permissive existing policies if they exist
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;

-- Allow SELECT for admins, or rows with location_id NULL (legacy), or rows in user's allowed locations
CREATE POLICY "Users can view customers for their locations"
ON public.customers
FOR SELECT
USING (
  public.get_current_user_role() = 'admin'
  OR location_id IS NULL
  OR location_id IN (
    SELECT unnest(up.allowed_locations)
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
  )
);

-- Allow INSERT for admins or rows whose location is in allowed locations (or NULL for legacy)
CREATE POLICY "Users can insert customers for their locations"
ON public.customers
FOR INSERT
WITH CHECK (
  public.get_current_user_role() = 'admin'
  OR location_id IS NULL
  OR location_id IN (
    SELECT unnest(up.allowed_locations)
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
  )
);

-- Allow UPDATE for admins or rows within allowed locations (or NULL)
CREATE POLICY "Users can update customers for their locations"
ON public.customers
FOR UPDATE
USING (
  public.get_current_user_role() = 'admin'
  OR location_id IS NULL
  OR location_id IN (
    SELECT unnest(up.allowed_locations)
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
  )
)
WITH CHECK (
  public.get_current_user_role() = 'admin'
  OR location_id IS NULL
  OR location_id IN (
    SELECT unnest(up.allowed_locations)
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
  )
);

-- Optional: Allow DELETE with same restrictions
CREATE POLICY "Users can delete customers for their locations"
ON public.customers
FOR DELETE
USING (
  public.get_current_user_role() = 'admin'
  OR location_id IS NULL
  OR location_id IN (
    SELECT unnest(up.allowed_locations)
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
  )
);
