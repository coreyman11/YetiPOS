-- Fix insecure public read on customers table by tightening SELECT policy
-- 1) Drop the overly permissive policy
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;

-- 2) Recreate a strict "Customers can view own record" policy
-- Only allow the authenticated customer to view their own record
CREATE POLICY "Customers can view own record"
ON public.customers
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND auth.uid() = auth_user_id
);

-- NOTE: Existing staff/admin policies remain unchanged:
-- - "Staff can view customers in their locations" (SELECT)
-- - "Staff can insert/update customers in their locations" (INSERT/UPDATE)
-- - "Only admins can delete customers" (DELETE)
-- This change removes the previous OR condition that allowed public read when
-- password_hash IS NOT NULL AND online_account_active = true.