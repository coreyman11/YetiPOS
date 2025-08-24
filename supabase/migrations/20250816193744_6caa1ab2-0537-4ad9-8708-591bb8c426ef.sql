-- Update is_feature_enabled function to properly check visibility
CREATE OR REPLACE FUNCTION public.is_feature_enabled(feature_name text, location_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (
      SELECT ft.is_enabled AND fd.is_visible
      FROM public.feature_toggles ft
      JOIN public.feature_definitions fd ON ft.feature_id = fd.id
      WHERE fd.name = feature_name 
      AND ft.location_id = is_feature_enabled.location_id
    ),
    -- Default: feature enabled if visible, disabled if hidden  
    (
      SELECT fd.is_visible
      FROM public.feature_definitions fd
      WHERE fd.name = feature_name
    ),
    true -- If feature doesn't exist, default to enabled
  );
$function$