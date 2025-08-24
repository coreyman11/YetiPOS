-- Ensure RLS is enabled and proper policies exist for public.shifts so staff can manage shifts in their locations
DO $$ BEGIN
  ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- VIEW policy: users can view shifts for their allowed locations or if admin
DO $$ BEGIN
  CREATE POLICY "Users can view shifts for their locations"
  ON public.shifts
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
    OR (
      location_id IS NOT NULL AND location_id IN (
        SELECT unnest(up.allowed_locations)
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INSERT policy: users can insert shifts only for their allowed locations or if admin
DO $$ BEGIN
  CREATE POLICY "Users can insert shifts for their locations"
  ON public.shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR (
      location_id IS NOT NULL AND location_id IN (
        SELECT unnest(up.allowed_locations)
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UPDATE policy: users can update shifts only for their allowed locations or if admin
DO $$ BEGIN
  CREATE POLICY "Users can update shifts for their locations"
  ON public.shifts
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() = 'admin'
    OR (
      location_id IS NOT NULL AND location_id IN (
        SELECT unnest(up.allowed_locations)
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR (
      location_id IS NOT NULL AND location_id IN (
        SELECT unnest(up.allowed_locations)
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
      )
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;