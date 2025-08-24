-- Add is_visible column to feature_definitions table
ALTER TABLE public.feature_definitions 
ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

-- Update the is_feature_enabled function to respect visibility
CREATE OR REPLACE FUNCTION public.is_feature_enabled(feature_name text, location_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT ft.is_enabled AND fd.is_visible
      FROM public.feature_toggles ft
      JOIN public.feature_definitions fd ON ft.feature_id = fd.id
      WHERE fd.name = feature_name 
      AND ft.location_id = is_feature_enabled.location_id
    ),
    -- Default to true only if feature is visible, false if hidden
    (
      SELECT fd.is_visible
      FROM public.feature_definitions fd
      WHERE fd.name = feature_name
    )
  );
$$;