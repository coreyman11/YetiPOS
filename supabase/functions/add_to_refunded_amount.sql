
CREATE OR REPLACE FUNCTION public.add_to_refunded_amount(p_transaction_id bigint, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_refunded_amount numeric;
  v_total_amount numeric;
  v_new_refunded_amount numeric;
BEGIN
  -- Get current transaction details
  SELECT total_amount, COALESCE(refunded_amount, 0)
  INTO v_total_amount, v_current_refunded_amount
  FROM transactions
  WHERE id = p_transaction_id;
  
  -- Calculate new refunded amount
  v_new_refunded_amount := v_current_refunded_amount + p_amount;
  
  -- Validate that refund doesn't exceed original amount
  IF v_new_refunded_amount > v_total_amount THEN
    RAISE EXCEPTION 'Refund amount exceeds original transaction amount';
  END IF;
  
  -- Update the transaction with the new refunded amount
  UPDATE transactions
  SET refunded_amount = v_new_refunded_amount
  WHERE id = p_transaction_id;
  
  -- Return the new refunded amount
  RETURN v_new_refunded_amount;
END;
$$;
