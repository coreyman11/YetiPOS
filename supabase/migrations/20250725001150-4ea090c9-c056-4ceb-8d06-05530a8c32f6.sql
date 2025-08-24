-- Phase 2: Usage Tracking Integration & Automation Setup

-- Function to track POS usage from transactions
CREATE OR REPLACE FUNCTION public.track_transaction_usage()
RETURNS TRIGGER AS $$
DECLARE
  membership_record RECORD;
  tracking_record RECORD;
BEGIN
  -- Only process completed transactions
  IF NEW.status = 'completed' THEN
    -- Find active hybrid memberships for this location
    FOR membership_record IN 
      SELECT cm.*, mp.billing_type 
      FROM public.customer_memberships cm
      JOIN public.membership_plans mp ON cm.membership_plan_id = mp.id
      WHERE cm.location_id = NEW.location_id 
      AND cm.billing_type IN ('hybrid_usage', 'hybrid_fixed')
      AND cm.billing_status IN ('active', 'trial')
    LOOP
      -- Upsert usage tracking for today
      INSERT INTO public.usage_tracking (
        customer_membership_id,
        location_id,
        tracking_date,
        transaction_count,
        revenue_cents,
        unique_customers,
        metadata
      ) VALUES (
        membership_record.id,
        NEW.location_id,
        CURRENT_DATE,
        1,
        COALESCE(NEW.total_amount * 100, 0)::integer, -- Convert to cents
        CASE WHEN NEW.customer_id IS NOT NULL THEN 1 ELSE 0 END,
        jsonb_build_object(
          'last_transaction_id', NEW.id,
          'payment_method', NEW.payment_method
        )
      )
      ON CONFLICT (customer_membership_id, location_id, tracking_date)
      DO UPDATE SET
        transaction_count = public.usage_tracking.transaction_count + 1,
        revenue_cents = public.usage_tracking.revenue_cents + COALESCE(NEW.total_amount * 100, 0)::integer,
        unique_customers = CASE 
          WHEN NEW.customer_id IS NOT NULL AND 
               NOT (public.usage_tracking.metadata ? NEW.customer_id::text)
          THEN public.usage_tracking.unique_customers + 1
          ELSE public.usage_tracking.unique_customers
        END,
        metadata = public.usage_tracking.metadata || jsonb_build_object(
          'last_transaction_id', NEW.id,
          'payment_method', NEW.payment_method,
          NEW.customer_id::text, true
        ),
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for transaction usage tracking
DROP TRIGGER IF EXISTS track_transaction_usage_trigger ON public.transactions;
CREATE TRIGGER track_transaction_usage_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.track_transaction_usage();

-- Function to initialize trial memberships
CREATE OR REPLACE FUNCTION public.initialize_membership_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- If membership plan has trial days and membership is new
  IF NEW.billing_type IN ('hybrid_usage', 'hybrid_fixed') AND 
     TG_OP = 'INSERT' AND 
     EXISTS (
       SELECT 1 FROM public.membership_plans 
       WHERE id = NEW.membership_plan_id 
       AND trial_days > 0
     ) THEN
    
    -- Get trial days from plan
    DECLARE
      trial_days INTEGER;
      trial_end_date TIMESTAMP WITH TIME ZONE;
    BEGIN
      SELECT mp.trial_days INTO trial_days
      FROM public.membership_plans mp
      WHERE mp.id = NEW.membership_plan_id;
      
      trial_end_date := now() + (trial_days || ' days')::interval;
      
      -- Update membership with trial info
      NEW.billing_status := 'trial';
      NEW.trial_end_date := trial_end_date;
      NEW.next_billing_date := trial_end_date;
      
      -- Create trial record
      INSERT INTO public.membership_trials (
        customer_membership_id,
        trial_start,
        trial_end,
        location_id
      ) VALUES (
        NEW.id,
        now(),
        trial_end_date,
        NEW.location_id
      );
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for trial initialization
DROP TRIGGER IF EXISTS initialize_membership_trial_trigger ON public.customer_memberships;
CREATE TRIGGER initialize_membership_trial_trigger
  BEFORE INSERT ON public.customer_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_membership_trial();

-- Setup daily billing cron job (runs at 2 AM UTC every day)
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

-- Function to manually trigger billing for specific location
CREATE OR REPLACE FUNCTION public.trigger_billing_for_location(location_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT
    net.http_post(
      url := 'https://paevqayvvakexwyezqiy.supabase.co/functions/v1/billing-engine',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXZxYXl2dmFrZXh3eWV6cWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4Mjg1NzMsImV4cCI6MjA1NTQwNDU3M30.QpMeoWwN4mLFFrcua07ci62N3n3jg1W4x50ofjtHARg"}'::jsonb,
      body := jsonb_build_object('locationId', location_uuid)
    ) INTO result;
    
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create indexes for better performance on new usage patterns
CREATE INDEX IF NOT EXISTS idx_customer_memberships_billing_status ON public.customer_memberships(billing_status);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_billing_type ON public.customer_memberships(billing_type);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_next_billing ON public.customer_memberships(next_billing_date) 
WHERE billing_type IN ('hybrid_usage', 'hybrid_fixed');

-- Add helpful comments
COMMENT ON FUNCTION public.track_transaction_usage IS 'Automatically tracks POS usage for hybrid billing memberships';
COMMENT ON FUNCTION public.initialize_membership_trial IS 'Sets up trial periods for new hybrid billing memberships';
COMMENT ON FUNCTION public.trigger_billing_for_location IS 'Manually trigger billing run for a specific location';