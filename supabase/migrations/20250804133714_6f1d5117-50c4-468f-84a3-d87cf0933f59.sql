-- Drop existing broad policies and create location-based ones for store_pages
DROP POLICY IF EXISTS "Anyone can view published store pages" ON public.store_pages;
DROP POLICY IF EXISTS "Authenticated users can manage store pages" ON public.store_pages;

-- Create location-based policies for store_pages
CREATE POLICY "Anyone can view published store pages" 
ON public.store_pages 
FOR SELECT 
USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert store pages for their locations" 
ON public.store_pages 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);

CREATE POLICY "Users can update store pages for their locations" 
ON public.store_pages 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);

CREATE POLICY "Users can delete store pages for their locations" 
ON public.store_pages 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);

-- Drop existing broad policies and create location-based ones for store_navigation
DROP POLICY IF EXISTS "Anyone can view store navigation" ON public.store_navigation;
DROP POLICY IF EXISTS "Authenticated users can manage navigation" ON public.store_navigation;

-- Create location-based policies for store_navigation
CREATE POLICY "Anyone can view store navigation" 
ON public.store_navigation 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert store navigation for their locations" 
ON public.store_navigation 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);

CREATE POLICY "Users can update store navigation for their locations" 
ON public.store_navigation 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);

CREATE POLICY "Users can delete store navigation for their locations" 
ON public.store_navigation 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  (location_id IN (
    SELECT unnest(user_profiles.allowed_locations) 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin')
);