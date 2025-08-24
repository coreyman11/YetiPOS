-- Fix customer table RLS policies to prevent public access
-- The current policies allow public viewing which is a security risk

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;

-- Ensure RLS is enabled on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Add secure policies for customers table
-- Allow staff to view customers only in their assigned locations
CREATE POLICY "Staff can view customers in their locations"
ON public.customers
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    (get_current_user_role() = 'admin'::text) OR 
    (
      EXISTS (
        SELECT 1 
        FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND (
          customers.location_id IS NOT NULL AND 
          customers.location_id = ANY(up.allowed_locations)
        )
      )
    )
  )
);

-- Allow staff to insert customers in their locations
CREATE POLICY "Staff can insert customers in their locations"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (
    (get_current_user_role() = 'admin'::text) OR 
    (
      EXISTS (
        SELECT 1 
        FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND (
          customers.location_id IS NOT NULL AND 
          customers.location_id = ANY(up.allowed_locations)
        )
      )
    )
  )
);

-- Allow staff to update customers in their locations
CREATE POLICY "Staff can update customers in their locations"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (
    (get_current_user_role() = 'admin'::text) OR 
    (
      EXISTS (
        SELECT 1 
        FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND (
          customers.location_id IS NOT NULL AND 
          customers.location_id = ANY(up.allowed_locations)
        )
      )
    )
  )
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (
    (get_current_user_role() = 'admin'::text) OR 
    (
      EXISTS (
        SELECT 1 
        FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND (
          customers.location_id IS NOT NULL AND 
          customers.location_id = ANY(up.allowed_locations)
        )
      )
    )
  )
);

-- Allow customers to view and update their own records
CREATE POLICY "Customers can view own record"
ON public.customers
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (auth.uid() = auth_user_id)
);

CREATE POLICY "Customers can update own record"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (auth.uid() = auth_user_id)
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (auth.uid() = auth_user_id)
);

-- Only admins can delete customers
CREATE POLICY "Only admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin'::text);