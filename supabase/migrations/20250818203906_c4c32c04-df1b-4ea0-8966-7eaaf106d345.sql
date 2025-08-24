-- Create a location-aware points calculation function
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points_for_location(
  transaction_amount numeric,
  p_location_id uuid,
  p_program_id bigint DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  points_per_dollar INTEGER;
BEGIN
  -- Prefer program-specific configuration when provided and active
  IF p_program_id IS NOT NULL THEN
    SELECT lp.points_per_dollar
      INTO points_per_dollar
    FROM public.loyalty_programs lp
    WHERE lp.id = p_program_id
      AND COALESCE(lp.is_active, true) = true
    LIMIT 1;
  END IF;

  -- Fallback to loyalty_program_settings for the given location, then global
  IF points_per_dollar IS NULL THEN
    SELECT lps.points_per_dollar
      INTO points_per_dollar
    FROM public.loyalty_program_settings lps
    WHERE (lps.location_id = p_location_id OR lps.location_id IS NULL)
    ORDER BY (lps.location_id = p_location_id) DESC, lps.updated_at DESC
    LIMIT 1;
  END IF;

  -- Final fallback to 1 point per dollar
  IF points_per_dollar IS NULL THEN
    points_per_dollar := 1;
  END IF;

  RETURN FLOOR(transaction_amount * points_per_dollar)::INTEGER;
END;
$$;

-- Update trigger to use location-aware calculation
CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  earned_points INTEGER;
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Only process if there's a customer_id and the app hasn't handled loyalty points yet
  IF NEW.customer_id IS NOT NULL 
     AND NEW.use_loyalty_points = FALSE 
     AND (NEW.notes IS NULL OR NEW.notes NOT LIKE '%app_handled_loyalty%') THEN

    -- Calculate points using location-aware function
    earned_points := public.calculate_loyalty_points_for_location(NEW.total_amount, NEW.location_id, NEW.loyalty_program_id);

    -- Get current accurate balance from loyalty_transactions
    SELECT COALESCE(SUM(
      COALESCE(points_earned, 0) - COALESCE(points_redeemed, 0)
    ), 0)
    INTO current_balance
    FROM public.loyalty_transactions
    WHERE customer_id = NEW.customer_id;

    -- Calculate new balance
    new_balance := current_balance + earned_points;

    -- Update customer's points
    UPDATE customers
    SET loyalty_points = new_balance
    WHERE id = NEW.customer_id;

    -- Record the loyalty transaction with proper balance and location_id
    INSERT INTO loyalty_transactions
      (customer_id, transaction_id, points_earned, points_redeemed, points_balance, description, location_id, type, loyalty_program_id)
    VALUES
      (NEW.customer_id, NEW.id, earned_points, 0, new_balance, 
       'Points earned from transaction #' || NEW.id, NEW.location_id, 'earn', NEW.loyalty_program_id);
  END IF;
  
  RETURN NEW;
END;
$$;