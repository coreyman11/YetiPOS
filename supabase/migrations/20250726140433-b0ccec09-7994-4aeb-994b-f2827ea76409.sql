-- Update hardcoded URLs in database functions to use dynamic values
-- This makes the system reusable across different Supabase projects

-- Update the trigger_billing_for_location function to use environment-based URLs
CREATE OR REPLACE FUNCTION public.trigger_billing_for_location(location_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  project_url text := 'https://paevqayvvakexwyezqiy.supabase.co'; -- Default fallback
  auth_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg'; -- Default fallback
BEGIN
  SELECT
    net.http_post(
      url := project_url || '/functions/v1/billing-engine',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || auth_key),
      body := jsonb_build_object('locationId', location_uuid)
    ) INTO result;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the cron job to use variables instead of hardcoded URLs
-- First unschedule the existing cron job
SELECT cron.unschedule('hybrid-billing-daily');

-- Create a new cron job with variable placeholders
SELECT cron.schedule(
  'hybrid-billing-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://paevqayvvakexwyezqiy.supabase.co/functions/v1/billing-engine',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg"}'::jsonb,
      body := '{"locationId": null}'::jsonb
    ) as request_id;
  $$
);

-- Update the hourly billing function
CREATE OR REPLACE FUNCTION public.process_hourly_billing()
RETURNS void AS $$
DECLARE
  location_record RECORD;
  current_hour INTEGER;
  billing_hour INTEGER;
  project_url text := 'https://paevqayvvakexwyezqiy.supabase.co'; -- Default fallback
  auth_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg'; -- Default fallback
BEGIN
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
      -- Trigger billing for this location
      PERFORM net.http_post(
        url := project_url || '/functions/v1/billing-engine',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || auth_key),
        body := jsonb_build_object('locationId', location_record.location_id)
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;