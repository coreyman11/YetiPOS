-- Strict RLS for customers table: customer self-access and staff location-based access

-- Ensure RLS is enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Add auth_user_id to link customer records to authenticated users (storefront accounts)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- Drop any existing permissive or conflicting policies
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers for their locations" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers for their locations" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers for their locations" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers for their locations" ON public.customers;
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
DROP POLICY IF EXISTS "Staff can view customers in their locations" ON public.customers;
DROP POLICY IF EXISTS "Staff can insert customers in their locations" ON public.customers;
DROP POLICY IF EXISTS "Staff can update customers in their locations" ON public.customers;
DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;

-- 1) Customers can view their own customer record
CREATE POLICY "Customers can view own record"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND auth.uid() = auth_user_id
);

-- 2) Customers can update their own customer record
CREATE POLICY "Customers can update own record"
ON public.customers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND auth.uid() = auth_user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = auth_user_id
);

-- 3) Staff (authenticated) can view customers for their specific locations or admins can view all
CREATE POLICY "Staff can view customers in their locations"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND customers.location_id IS NOT NULL
        AND customers.location_id = ANY(up.allowed_locations)
    )
  )
);

-- 4) Staff can insert customers for their specific locations (location_id must be in allowed list)
CREATE POLICY "Staff can insert customers in their locations"
ON public.customers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND NEW.location_id IS NOT NULL
        AND NEW.location_id = ANY(up.allowed_locations)
    )
  )
);

-- 5) Staff can update customers for their specific locations (or admins)
CREATE POLICY "Staff can update customers in their locations"
ON public.customers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND customers.location_id IS NOT NULL
        AND customers.location_id = ANY(up.allowed_locations)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND customers.location_id IS NOT NULL
        AND customers.location_id = ANY(up.allowed_locations)
    )
  )
);

-- 6) Only admins can delete customers
CREATE POLICY "Only admins can delete customers"
ON public.customers
FOR DELETE
USING (
  public.get_current_user_role() = 'admin'
);
