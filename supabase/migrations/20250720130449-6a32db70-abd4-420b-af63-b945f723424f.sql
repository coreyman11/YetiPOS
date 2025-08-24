-- Phase 1: Enable RLS and create policies for unprotected tables

-- Enable RLS on employee_reports
ALTER TABLE public.employee_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_reports
CREATE POLICY "Users can view employee reports for their locations"
ON public.employee_reports
FOR SELECT
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can insert employee reports for their locations"
ON public.employee_reports
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update employee reports for their locations"
ON public.employee_reports
FOR UPDATE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can delete employee reports for their locations"
ON public.employee_reports
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Enable RLS on inventory_categories
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_categories
CREATE POLICY "Users can view inventory categories for their locations"
ON public.inventory_categories
FOR SELECT
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can insert inventory categories for their locations"
ON public.inventory_categories
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update inventory categories for their locations"
ON public.inventory_categories
FOR UPDATE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can delete inventory categories for their locations"
ON public.inventory_categories
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Enable RLS on loyalty_programs
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;

-- Create policies for loyalty_programs
CREATE POLICY "Users can view loyalty programs for their locations"
ON public.loyalty_programs
FOR SELECT
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can insert loyalty programs for their locations"
ON public.loyalty_programs
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update loyalty programs for their locations"
ON public.loyalty_programs
FOR UPDATE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can delete loyalty programs for their locations"
ON public.loyalty_programs
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Enable RLS on payment_splits
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_splits (based on transaction access)
CREATE POLICY "Users can view payment splits for transactions they can access"
ON public.payment_splits
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.id = payment_splits.transaction_id
  AND (
    t.assigned_user_id = auth.uid() OR
    t.location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
));

CREATE POLICY "Users can insert payment splits for transactions they can access"
ON public.payment_splits
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.id = payment_splits.transaction_id
  AND (
    t.assigned_user_id = auth.uid() OR
    t.location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
));

CREATE POLICY "Users can update payment splits for transactions they can access"
ON public.payment_splits
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.id = payment_splits.transaction_id
  AND (
    t.assigned_user_id = auth.uid() OR
    t.location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
));

CREATE POLICY "Users can delete payment splits for transactions they can access"
ON public.payment_splits
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.id = payment_splits.transaction_id
  AND (
    t.assigned_user_id = auth.uid() OR
    t.location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  )
));

-- Enable RLS on printer_configurations
ALTER TABLE public.printer_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for printer_configurations
CREATE POLICY "Users can view printer configurations for their locations"
ON public.printer_configurations
FOR SELECT
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can insert printer configurations for their locations"
ON public.printer_configurations
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update printer configurations for their locations"
ON public.printer_configurations
FOR UPDATE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can delete printer configurations for their locations"
ON public.printer_configurations
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Enable RLS on shifts
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for shifts
CREATE POLICY "Users can view shifts for their locations or assigned to them"
ON public.shifts
FOR SELECT
USING (
  assigned_user_id = auth.uid() OR
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert shifts for their locations"
ON public.shifts
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update shifts for their locations or assigned to them"
ON public.shifts
FOR UPDATE
USING (
  assigned_user_id = auth.uid() OR
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role
    FROM user_profiles
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can delete shifts for their locations"
ON public.shifts
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Enable RLS on tax_configurations
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for tax_configurations
CREATE POLICY "Users can view tax configurations for their locations"
ON public.tax_configurations
FOR SELECT
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can insert tax configurations for their locations"
ON public.tax_configurations
FOR INSERT
WITH CHECK (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can update tax configurations for their locations"
ON public.tax_configurations
FOR UPDATE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

CREATE POLICY "Users can delete tax configurations for their locations"
ON public.tax_configurations
FOR DELETE
USING (location_id IN (
  SELECT unnest(user_profiles.allowed_locations)
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) OR (
  SELECT user_profiles.role
  FROM user_profiles
  WHERE user_profiles.id = auth.uid()
) = 'admin');

-- Fix search_path vulnerabilities in existing functions
CREATE OR REPLACE FUNCTION public.update_discounts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_shift_total_sales()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Handle INSERT and UPDATE of completed transactions
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed' AND NEW.shift_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.shift_id IS NOT NULL) THEN
    
    UPDATE public.shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM public.transactions 
       WHERE shift_id = NEW.shift_id 
       AND status = 'completed'), 
      0
    )
    WHERE id = NEW.shift_id;
    
  -- Handle UPDATE where transaction status changes from completed to something else
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' AND OLD.shift_id IS NOT NULL) THEN
    
    UPDATE public.shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM public.transactions 
       WHERE shift_id = OLD.shift_id 
       AND status = 'completed'), 
      0
    )
    WHERE id = OLD.shift_id;
    
  -- Handle DELETE of completed transactions
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'completed' AND OLD.shift_id IS NOT NULL) THEN
    
    UPDATE public.shifts 
    SET total_sales = COALESCE(
      (SELECT SUM(total_amount) 
       FROM public.transactions 
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
$function$;

CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(user_id uuid)
 RETURNS TABLE(permission_id uuid, permission_name text, granted boolean, source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    -- Get permissions from user's role
    SELECT 
      rp.permission_id,
      pd.name as permission_name,
      rp.granted,
      'role' as source
    FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permission_definitions pd ON rp.permission_id = pd.id
    WHERE up.id = user_id
  ),
  individual_perms AS (
    -- Get individual permission overrides
    SELECT 
      up.permission_id,
      pd.name as permission_name,
      up.granted,
      'individual' as source
    FROM public.user_permissions up
    JOIN public.permission_definitions pd ON up.permission_id = pd.id
    WHERE up.user_id = user_id
  )
  -- Combine role permissions with individual overrides (individual takes precedence)
  SELECT 
    COALESCE(ip.permission_id, rp.permission_id) as permission_id,
    COALESCE(ip.permission_name, rp.permission_name) as permission_name,
    COALESCE(ip.granted, rp.granted) as granted,
    COALESCE(ip.source, rp.source) as source
  FROM role_perms rp
  FULL OUTER JOIN individual_perms ip ON rp.permission_id = ip.permission_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_gift_card_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- If this is a gift card payment and it's completed, process the redemption
    IF NEW.payment_method = 'gift_card' AND NEW.status = 'completed' THEN
        -- The gift card ID should be stored in a separate table or field
        -- This is just a placeholder for the logic
        PERFORM public.process_gift_card_transaction(
            NEW.gift_card_id,
            NEW.id,
            'redeem',
            NEW.total_amount
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_transaction_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  earned_points INTEGER;
  customer_record RECORD;
BEGIN
  -- Only process if there's a customer_id
  IF NEW.customer_id IS NOT NULL THEN
    -- Calculate points
    earned_points := public.calculate_loyalty_points(NEW.total_amount);
    
    -- Update customer's points
    UPDATE public.customers
    SET loyalty_points = loyalty_points + earned_points
    WHERE id = NEW.customer_id
    RETURNING * INTO customer_record;
    
    -- Record the loyalty transaction with location_id
    INSERT INTO public.loyalty_transactions
      (customer_id, transaction_id, points_earned, points_redeemed, points_balance, description, location_id, type)
    VALUES
      (NEW.customer_id, NEW.id, earned_points, 0, customer_record.loyalty_points, 
       'Points earned from transaction #' || NEW.id, NEW.location_id, 'earn');
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_gift_card_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_number TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a 16-digit number (4 groups of 4 digits)
        v_number := 
            lpad(floor(random() * 10000)::text, 4, '0') || '-' ||
            lpad(floor(random() * 10000)::text, 4, '0') || '-' ||
            lpad(floor(random() * 10000)::text, 4, '0') || '-' ||
            lpad(floor(random() * 10000)::text, 4, '0');
            
        -- Check if this number already exists
        SELECT EXISTS (
            SELECT 1 
            FROM public.gift_cards 
            WHERE card_number = v_number
        ) INTO v_exists;
        
        -- Exit loop if we found a unique number
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_number;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_inventory_items(items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  return (
    items is null 
    or (
      jsonb_typeof(items) = 'array'
      and items <> '[]'::jsonb
      and items <@ '[{"inventory_id": 0, "quantity": 0}]'::jsonb
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_inventory_quantity(p_inventory_id bigint, p_adjustment integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  update public.inventory
  set quantity = quantity + p_adjustment
  where id = p_inventory_id;
  
  if not found then
    raise exception 'Inventory item not found';
  end if;
  
  if exists (
    select 1
    from public.inventory
    where id = p_inventory_id
    and quantity < 0
  ) then
    raise exception 'Insufficient inventory';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_loyalty_points(transaction_amount numeric)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  points_per_dollar INTEGER;
BEGIN
  SELECT lps.points_per_dollar INTO points_per_dollar
  FROM public.loyalty_program_settings lps
  LIMIT 1;
  
  RETURN FLOOR(transaction_amount * points_per_dollar)::INTEGER;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_gift_card_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Update the gift card's current balance with the balance_after from the transaction
    UPDATE public.gift_cards
    SET current_balance = NEW.balance_after,
        last_used_at = CASE 
            WHEN NEW.type = 'redeem' THEN NOW()
            ELSE last_used_at
        END
    WHERE id = NEW.gift_card_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_gift_card_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Update the gift card's current balance with the most recent transaction balance
  UPDATE public.gift_cards
  SET current_balance = NEW.balance_after
  WHERE id = NEW.gift_card_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_to_refunded_amount(p_transaction_id bigint, p_amount numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_current_refunded_amount numeric;
  v_total_amount numeric;
  v_new_refunded_amount numeric;
BEGIN
  -- Get current transaction details
  SELECT total_amount, COALESCE(refunded_amount, 0)
  INTO v_total_amount, v_current_refunded_amount
  FROM public.transactions
  WHERE id = p_transaction_id;
  
  -- Calculate new refunded amount
  v_new_refunded_amount := v_current_refunded_amount + p_amount;
  
  -- Validate that refund doesn't exceed original amount
  IF v_new_refunded_amount > v_total_amount THEN
    RAISE EXCEPTION 'Refund amount exceeds original transaction amount';
  END IF;
  
  -- Update the transaction with the new refunded amount
  UPDATE public.transactions
  SET refunded_amount = v_new_refunded_amount
  WHERE id = p_transaction_id;
  
  -- Return the new refunded amount
  RETURN v_new_refunded_amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_gift_card_transaction(p_gift_card_id bigint, p_transaction_id bigint, p_type text, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Lock the gift card row for update
    SELECT current_balance INTO v_current_balance
    FROM public.gift_cards
    WHERE id = p_gift_card_id
    FOR UPDATE;

    IF p_type = 'redeem' AND v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient gift card balance';
    END IF;

    -- Calculate new balance
    IF p_type = 'purchase' OR p_type = 'activate' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSE
        v_new_balance := v_current_balance - p_amount;
    END IF;

    -- Update gift card balance
    UPDATE public.gift_cards
    SET 
        current_balance = v_new_balance,
        last_used_at = CASE 
            WHEN p_type = 'redeem' THEN NOW()
            ELSE last_used_at
        END
    WHERE id = p_gift_card_id;

    -- Record the transaction with explicit balance_after
    INSERT INTO public.gift_card_transactions (
        gift_card_id,
        transaction_id,
        type,
        amount,
        balance_after,
        created_at
    ) VALUES (
        p_gift_card_id,
        p_transaction_id,
        p_type,
        p_amount,
        v_new_balance,
        NOW()
    );
END;
$function$;