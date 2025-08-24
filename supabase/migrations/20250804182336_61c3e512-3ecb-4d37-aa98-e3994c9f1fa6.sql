-- Fix the generate_secure_token function to have proper search_path
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;