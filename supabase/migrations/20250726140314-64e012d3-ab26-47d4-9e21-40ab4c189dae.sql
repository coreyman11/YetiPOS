-- Update hardcoded URLs in database functions to use current_setting for dynamic values
-- This makes the system work with any Supabase project by using configured settings

-- First, create a function to get the current project URL and auth key
CREATE OR REPLACE FUNCTION public.get_current_project_config()
RETURNS jsonb AS $$
DECLARE
  project_url text;
  auth_key text;
BEGIN
  -- Get project URL from pg_settings or use a default fallback
  SELECT setting INTO project_url FROM pg_settings WHERE name = 'supabase.project_url';
  IF project_url IS NULL THEN
    project_url := 'https://paevqayvvakexwyezqiy.supabase.co'; -- fallback for existing deployment
  END IF;
  
  -- Get auth key from pg_settings or use a default fallback  
  SELECT setting INTO auth_key FROM pg_settings WHERE name = 'supabase.anon_key';
  IF auth_key IS NULL THEN
    auth_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg'; -- fallback for existing deployment
  END IF;
  
  RETURN jsonb_build_object('url', project_url, 'key', auth_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger_billing_for_location function to use dynamic config
CREATE OR REPLACE FUNCTION public.trigger_billing_for_location(location_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  config jsonb;
BEGIN
  -- Get dynamic project configuration
  config := public.get_current_project_config();
  
  SELECT
    net.http_post(
      url := (config->>'url') || '/functions/v1/billing-engine',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (config->>'key')),
      body := jsonb_build_object('locationId', location_uuid)
    ) INTO result;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the cron job to use dynamic configuration
-- First unschedule the existing cron job
SELECT cron.unschedule('hybrid-billing-daily');

-- Create a new cron job that uses the dynamic configuration function
SELECT cron.schedule(
  'hybrid-billing-daily',
  '0 2 * * *',
  $$
  DO $$
  DECLARE
    config jsonb;
  BEGIN
    config := public.get_current_project_config();
    
    PERFORM net.http_post(
      url := (config->>'url') || '/functions/v1/billing-engine',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (config->>'key')),
      body := '{"locationId": null}'::jsonb
    );
  END $$;
  $$
);

-- Update the hourly billing function to use dynamic configuration
CREATE OR REPLACE FUNCTION public.process_hourly_billing()
RETURNS void AS $$
DECLARE
  location_record RECORD;
  current_hour INTEGER;
  billing_hour INTEGER;
  config jsonb;
BEGIN
  -- Get dynamic project configuration
  config := public.get_current_project_config();
  
  -- Get current hour in UTC
  current_hour := EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC');
  
  -- Loop through all locations that have billing enabled and billing_time set
  FOR location_record IN 
    SELECT location_id, billing_time, timezone
    FROM public.billing_settings 
    WHERE billing_enabled = true 
    AND billing_time IS NOT NULL
  LOOP
    -- Extract hour from billing_time
    billing_hour := EXTRACT(HOUR FROM location_record.billing_time);
    
    -- Check if current time matches billing time for this location
    IF current_hour = billing_hour THEN
      -- Trigger billing for this location using dynamic config
      PERFORM net.http_post(
        url := (config->>'url') || '/functions/v1/billing-engine',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (config->>'key')),
        body := jsonb_build_object('locationId', location_record.location_id)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;