-- Secure transactions table with proper RLS scoped by user location and role
-- 1) Enable RLS and remove common overly-permissive policies if present
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;

-- Drop likely permissive SELECT policies if they exist (safe no-ops if absent)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transactions;
DROP POLICY IF EXISTS "Allow read access for all" ON public.transactions;
DROP POLICY IF EXISTS "Public read access" ON public.transactions;

-- 2) Staff/Admin: SELECT transactions only for their allowed locations
CREATE POLICY "Staff can view transactions in their locations"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND transactions.location_id IS NOT NULL
        AND transactions.location_id = ANY (up.allowed_locations)
    )
  )
);

-- 3) Staff/Admin: INSERT transactions only for their allowed locations
CREATE POLICY "Staff can insert transactions in their locations"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND transactions.location_id IS NOT NULL
        AND transactions.location_id = ANY (up.allowed_locations)
    )
  )
);

-- 4) Staff/Admin: UPDATE transactions only for their allowed locations
CREATE POLICY "Staff can update transactions in their locations"
ON public.transactions
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND transactions.location_id IS NOT NULL
        AND transactions.location_id = ANY (up.allowed_locations)
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND transactions.location_id IS NOT NULL
        AND transactions.location_id = ANY (up.allowed_locations)
    )
  )
);

-- 5) Admins or recent creators: DELETE transactions (for rollback on failure)
CREATE POLICY "Admins or creators can delete recent transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'admin'
  OR (
    auth.uid() IS NOT NULL
    AND transactions.assigned_user_id = auth.uid()
    AND transactions.created_at > (now() - interval '10 minutes')
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND transactions.location_id IS NOT NULL
        AND transactions.location_id = ANY (up.allowed_locations)
    )
  )
);
