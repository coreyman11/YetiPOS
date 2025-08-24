-- Fix the generate_secure_token function to use proper random generation
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Use gen_random_uuid() and encode it as hex for a secure token
  RETURN encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'hex') || 
         encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'hex');
END;
$function$;