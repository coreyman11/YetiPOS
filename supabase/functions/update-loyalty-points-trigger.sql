
-- We're going to keep this trigger function for backward compatibility
-- but our app will now primarily use direct API calls for better control
-- over loyalty points redemption and earning

CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  earned_points INTEGER;
  customer_record RECORD;
BEGIN
  -- Only process if there's a customer_id and not using loyalty points
  -- This prevents double-counting when the app is handling points directly
  IF NEW.customer_id IS NOT NULL AND NEW.use_loyalty_points = FALSE THEN
    -- Calculate points
    earned_points := calculate_loyalty_points(NEW.total_amount);
    
    -- Update customer's points
    UPDATE customers
    SET loyalty_points = loyalty_points + earned_points
    WHERE id = NEW.customer_id
    RETURNING * INTO customer_record;
    
    -- Record the loyalty transaction with location_id
    INSERT INTO loyalty_transactions
      (customer_id, transaction_id, points_earned, points_redeemed, points_balance, description, location_id, type)
    VALUES
      (NEW.customer_id, NEW.id, earned_points, 0, customer_record.loyalty_points, 
       'Points earned from transaction #' || NEW.id, NEW.location_id, 'earn');
  END IF;
  
  RETURN NEW;
END;
$function$
