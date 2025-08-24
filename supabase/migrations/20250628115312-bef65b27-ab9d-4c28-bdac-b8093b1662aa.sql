
-- Step 1: Backfill existing shifts with correct total_sales values
UPDATE shifts 
SET total_sales = COALESCE(
  (SELECT SUM(total_amount) 
   FROM transactions 
   WHERE shift_id = shifts.id 
   AND status = 'completed'), 
  0
)
WHERE total_sales IS NULL OR total_sales = 0;

-- Step 2: Create a function to update shift total sales
CREATE OR REPLACE FUNCTION update_shift_total_sales()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE of completed transactions
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.shift_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.shift_id IS NOT NULL) THEN
    
    UPDATE shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM transactions 
       WHERE shift_id = NEW.shift_id 
       AND status = 'completed'), 
      0
    )
    WHERE id = NEW.shift_id;
    
  -- Handle UPDATE where transaction status changes from completed to something else
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' AND OLD.shift_id IS NOT NULL) THEN
    
    UPDATE shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM transactions 
       WHERE shift_id = OLD.shift_id 
       AND status = 'completed'), 
      0
    )
    WHERE id = OLD.shift_id;
    
  -- Handle DELETE of completed transactions
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'completed' AND OLD.shift_id IS NOT NULL) THEN
    
    UPDATE shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM transactions 
       WHERE shift_id = OLD.shift_id 
       AND status = 'completed'), 
      0
    )
    WHERE id = OLD.shift_id;
    
  END IF;
  
  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS trigger_update_shift_total_sales ON transactions;
CREATE TRIGGER trigger_update_shift_total_sales
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_total_sales();
