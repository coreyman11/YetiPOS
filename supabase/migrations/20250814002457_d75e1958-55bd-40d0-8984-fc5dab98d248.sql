-- Enable RLS policies for transactions table to prevent unauthorized access
-- Users can only view transactions for their allowed locations

-- Policy for SELECT (viewing transactions)
CREATE POLICY "Users can view transactions for their locations" 
ON public.transactions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations) 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) 
    OR (
      SELECT user_profiles.role 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
);

-- Policy for INSERT (creating transactions)
CREATE POLICY "Users can insert transactions for their locations" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations) 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) 
    OR (
      SELECT user_profiles.role 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
);

-- Policy for UPDATE (modifying transactions)
CREATE POLICY "Users can update transactions for their locations" 
ON public.transactions 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations) 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) 
    OR (
      SELECT user_profiles.role 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations) 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) 
    OR (
      SELECT user_profiles.role 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
);

-- Policy for DELETE (deleting transactions) - restricted to admins only
CREATE POLICY "Only admins can delete transactions" 
ON public.transactions 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Apply similar policies to transaction_items table
CREATE POLICY "Users can view transaction items for their locations" 
ON public.transaction_items 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_items.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Users can insert transaction items for their locations" 
ON public.transaction_items 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_items.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Users can update transaction items for their locations" 
ON public.transaction_items 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_items.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_items.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Only admins can delete transaction items" 
ON public.transaction_items 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Apply similar policies to refunds table for complete transaction security
CREATE POLICY "Users can view refunds for their locations" 
ON public.refunds 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = refunds.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Users can insert refunds for their locations" 
ON public.refunds 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = refunds.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Users can update refunds for their locations" 
ON public.refunds 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = refunds.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = refunds.transaction_id 
    AND (
      t.location_id IN (
        SELECT unnest(user_profiles.allowed_locations) 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) 
      OR (
        SELECT user_profiles.role 
        FROM user_profiles 
        WHERE user_profiles.id = auth.uid()
      ) = 'admin'
    )
  )
);

CREATE POLICY "Only admins can delete refunds" 
ON public.refunds 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);