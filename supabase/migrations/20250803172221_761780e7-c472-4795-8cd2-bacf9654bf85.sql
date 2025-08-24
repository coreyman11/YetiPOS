-- Disable the automatic loyalty points trigger since we now handle this manually in the application
-- This prevents double-counting and ensures proper balance calculation

-- First, drop the existing trigger if it exists
DROP TRIGGER IF EXISTS transaction_loyalty_points_trigger ON transactions;

-- Update the trigger function to properly handle loyalty programs and prevent conflicts
CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  earned_points INTEGER;
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Only process if there's a customer_id and the app hasn't handled loyalty points yet
  -- We check for a special marker in the notes to avoid conflicts with app handling
  IF NEW.customer_id IS NOT NULL 
     AND NEW.use_loyalty_points = FALSE 
     AND (NEW.notes IS NULL OR NEW.notes NOT LIKE '%app_handled_loyalty%') THEN
    
    -- Calculate points using the function
    earned_points := calculate_loyalty_points(NEW.total_amount);
    
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
$function$;