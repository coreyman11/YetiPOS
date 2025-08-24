-- Fix the search path for the logo settings trigger function
CREATE OR REPLACE FUNCTION public.update_logo_settings_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;