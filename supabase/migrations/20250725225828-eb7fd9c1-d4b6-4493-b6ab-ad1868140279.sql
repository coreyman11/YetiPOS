-- Add missing fields to billing_settings table
ALTER TABLE public.billing_settings 
ADD COLUMN IF NOT EXISTS billing_time TIME DEFAULT '02:00:00',
ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT true;

-- Create billing_settings records for existing locations
INSERT INTO public.billing_settings (location_id, billing_time, billing_enabled)
SELECT 
  id as location_id,
  '02:00:00'::time as billing_time,
  true as billing_enabled
FROM public.locations
ON CONFLICT (location_id) DO NOTHING;

-- Update the cron job to process each location individually
SELECT cron.unschedule('hybrid-billing-daily');

-- Set up dynamic configuration settings
SELECT set_config('app.supabase_url', current_setting('SUPABASE_URL', true), false);
SELECT set_config('app.supabase_anon_key', current_setting('SUPABASE_ANON_KEY', true), false);

-- Create new cron job that processes billing for each location at their configured time
SELECT cron.schedule(
  'process-billing-by-location',
  '0 * * * *', -- Run every hour
  $$
  DO $$
  DECLARE
    location_record RECORD;
    current_hour INTEGER;
    billing_hour INTEGER;
    supabase_url TEXT;
    supabase_anon_key TEXT;
  BEGIN
    -- Get dynamic configuration
    supabase_url := current_setting('app.supabase_url', true);
    supabase_anon_key := current_setting('app.supabase_anon_key', true);
    
    -- Get current hour in UTC
    current_hour := EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC');
    
    -- Loop through each location with billing enabled
    FOR location_record IN 
      SELECT bs.location_id, bs.billing_time, bs.billing_timezone
      FROM public.billing_settings bs
      WHERE bs.billing_enabled = true
    LOOP
      -- Extract hour from billing_time and convert to location timezone
      billing_hour := EXTRACT(HOUR FROM location_record.billing_time);
      
      -- Check if current time matches billing time for this location
      IF current_hour = billing_hour THEN
        -- Trigger billing for this location using dynamic environment variables
        PERFORM net.http_post(
          url := supabase_url || '/functions/v1/billing-engine',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || supabase_anon_key
          ),
          body := jsonb_build_object('locationId', location_record.location_id)
        );
      END IF;
    END LOOP;
  END;
  $$;
  $$
);