-- Fix the track_transaction_usage function to handle null customer_id
CREATE OR REPLACE FUNCTION public.track_transaction_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  membership_record RECORD;
  tracking_record RECORD;
  metadata_obj JSONB;
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
      -- Build metadata object conditionally based on customer_id
      metadata_obj := jsonb_build_object(
        'last_transaction_id', NEW.id,
        'payment_method', NEW.payment_method
      );
      
      -- Only add customer_id to metadata if it's not null
      IF NEW.customer_id IS NOT NULL THEN
        metadata_obj := metadata_obj || jsonb_build_object(NEW.customer_id::text, true);
      END IF;

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
        metadata_obj
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
        metadata = CASE 
          WHEN NEW.customer_id IS NOT NULL 
          THEN public.usage_tracking.metadata || jsonb_build_object(
            'last_transaction_id', NEW.id,
            'payment_method', NEW.payment_method,
            NEW.customer_id::text, true
          )
          ELSE public.usage_tracking.metadata || jsonb_build_object(
            'last_transaction_id', NEW.id,
            'payment_method', NEW.payment_method
          )
        END,
        updated_at = now();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$