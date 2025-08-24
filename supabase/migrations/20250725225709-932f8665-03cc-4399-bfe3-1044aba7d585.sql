-- Add missing fields to billing_settings table
ALTER TABLE public.billing_settings 
ADD COLUMN billing_time TIME DEFAULT '02:00:00',
ADD COLUMN billing_enabled BOOLEAN DEFAULT true;

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
  BEGIN
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
        -- Trigger billing for this location
        PERFORM net.http_post(
          url := 'https://paevqayvvakexwyezqiy.supabase.co/functions/v1/billing-engine',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg"}'::jsonb,
          body := jsonb_build_object('locationId', location_record.location_id)
        );
      END IF;
    END LOOP;
  END;
  $$;
  $$
);