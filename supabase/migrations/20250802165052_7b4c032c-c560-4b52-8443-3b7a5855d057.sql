-- Fix loyalty points balance calculation by recalculating all balances
-- First, create a function to recalculate loyalty points balances

CREATE OR REPLACE FUNCTION recalculate_loyalty_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_record RECORD;
  transaction_record RECORD;
  running_balance INTEGER;
BEGIN
  -- Loop through all customers who have loyalty transactions
  FOR customer_record IN 
    SELECT DISTINCT customer_id 
    FROM loyalty_transactions 
    WHERE customer_id IS NOT NULL
  LOOP
    running_balance := 0;
    
    -- Loop through all transactions for this customer in chronological order
    FOR transaction_record IN
      SELECT id, points_earned, points_redeemed
      FROM loyalty_transactions
      WHERE customer_id = customer_record.customer_id
      ORDER BY created_at ASC
    LOOP
      -- Update running balance
      IF transaction_record.points_earned IS NOT NULL THEN
        running_balance := running_balance + transaction_record.points_earned;
      END IF;
      
      IF transaction_record.points_redeemed IS NOT NULL THEN
        running_balance := running_balance - transaction_record.points_redeemed;
      END IF;
      
      -- Ensure balance never goes negative
      running_balance := GREATEST(0, running_balance);
      
      -- Update the transaction with correct balance
      UPDATE loyalty_transactions
      SET points_balance = running_balance
      WHERE id = transaction_record.id;
    END LOOP;
    
    -- Update customer's loyalty_points to match the final balance
    UPDATE customers
    SET loyalty_points = running_balance
    WHERE id = customer_record.customer_id;
    
  END LOOP;
END;
$$;

-- Execute the balance recalculation
SELECT recalculate_loyalty_balances();

-- Update the loyalty points trigger to use better balance calculation
CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  earned_points INTEGER;
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Only process if there's a customer_id and not using loyalty points for redemption
  IF NEW.customer_id IS NOT NULL AND NEW.use_loyalty_points = FALSE THEN
    -- Calculate points earned
    earned_points := calculate_loyalty_points(NEW.total_amount);
    
    -- Get current accurate balance from loyalty_transactions
    SELECT COALESCE(SUM(
      COALESCE(points_earned, 0) - COALESCE(points_redeemed, 0)
    ), 0)
    INTO current_balance
    FROM loyalty_transactions
    WHERE customer_id = NEW.customer_id;
    
    -- Calculate new balance
    new_balance := current_balance + earned_points;
    
    -- Update customer's points
    UPDATE customers
    SET loyalty_points = new_balance
    WHERE id = NEW.customer_id;
    
    -- Record the loyalty transaction with accurate balance
    INSERT INTO loyalty_transactions
      (customer_id, transaction_id, points_earned, points_redeemed, points_balance, description, location_id, type)
    VALUES
      (NEW.customer_id, NEW.id, earned_points, 0, new_balance, 
       'Points earned from transaction #' || NEW.id, NEW.location_id, 'earn');
  END IF;
  
  RETURN NEW;
END;
$function$;