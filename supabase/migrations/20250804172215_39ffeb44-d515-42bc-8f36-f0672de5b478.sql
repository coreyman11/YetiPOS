-- Create API endpoints for storefront customer authentication

-- First, let's add a function to verify customer credentials
CREATE OR REPLACE FUNCTION public.verify_storefront_customer(
  p_email TEXT,
  p_phone TEXT,
  p_location_id UUID
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  loyalty_points INTEGER,
  location_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.first_name,
    c.last_name,
    c.loyalty_points,
    c.location_id
  FROM public.customers c
  WHERE c.email = p_email 
    AND c.phone = p_phone
    AND (c.location_id = p_location_id OR c.location_id IS NULL)
  LIMIT 1;
END;
$$;

-- Function to create a new storefront customer
CREATE OR REPLACE FUNCTION public.create_storefront_customer(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  loyalty_points INTEGER,
  location_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_customer_id BIGINT;
BEGIN
  -- Check if customer already exists with this email
  IF EXISTS (SELECT 1 FROM public.customers WHERE email = p_email) THEN
    RAISE EXCEPTION 'Customer with this email already exists';
  END IF;

  -- Insert new customer
  INSERT INTO public.customers (
    name,
    email,
    phone,
    first_name,
    last_name,
    location_id,
    loyalty_points
  ) VALUES (
    p_name,
    p_email,
    p_phone,
    p_first_name,
    p_last_name,
    p_location_id,
    0
  )
  RETURNING customers.id INTO new_customer_id;

  -- Return the created customer
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.first_name,
    c.last_name,
    c.loyalty_points,
    c.location_id
  FROM public.customers c
  WHERE c.id = new_customer_id;
END;
$$;