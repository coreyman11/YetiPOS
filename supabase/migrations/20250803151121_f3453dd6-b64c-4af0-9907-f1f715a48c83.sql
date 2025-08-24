-- Fix loyalty points calculation function accessibility issue
-- Drop and recreate the function with proper schema qualification and permissions

-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS public.calculate_loyalty_points(numeric);

-- Recreate the function with explicit schema qualification and proper permissions
CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(transaction_amount numeric)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  points_per_dollar INTEGER;
BEGIN
  -- Get points per dollar from loyalty program settings
  SELECT lps.points_per_dollar INTO points_per_dollar
  FROM public.loyalty_program_settings lps
  LIMIT 1;
  
  -- If no settings found, default to 1 point per dollar
  IF points_per_dollar IS NULL THEN
    points_per_dollar := 1;
  END IF;
  
  -- Calculate and return points (floor to ensure integer result)
  RETURN FLOOR(transaction_amount * points_per_dollar)::INTEGER;
END;
$function$;

-- Update the handle_transaction_loyalty_points function to use fully qualified names
CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  earned_points INTEGER;
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Only process if there's a customer_id and not using loyalty points for redemption
  IF NEW.customer_id IS NOT NULL AND NEW.use_loyalty_points = FALSE THEN
    -- Calculate points earned using the public schema function
    earned_points := public.calculate_loyalty_points(NEW.total_amount);
    
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
    UPDATE public.customers
    SET loyalty_points = new_balance
    WHERE id = NEW.customer_id;
    
    -- Record the loyalty transaction with accurate balance
    INSERT INTO public.loyalty_transactions
      (customer_id, transaction_id, points_earned, points_redeemed, points_balance, description, location_id, type)
    VALUES
      (NEW.customer_id, NEW.id, earned_points, 0, new_balance, 
       'Points earned from transaction #' || NEW.id, NEW.location_id, 'earn');
  END IF;
  
  RETURN NEW;
END;
$function$;