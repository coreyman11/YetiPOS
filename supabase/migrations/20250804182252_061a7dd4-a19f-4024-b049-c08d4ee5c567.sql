-- Add password and account completion fields to customers table
ALTER TABLE public.customers 
ADD COLUMN password_hash TEXT,
ADD COLUMN account_completion_token TEXT,
ADD COLUMN account_completion_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN online_account_active BOOLEAN DEFAULT FALSE,
ADD COLUMN password_reset_token TEXT,
ADD COLUMN password_reset_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for token lookups
CREATE INDEX idx_customers_completion_token ON public.customers(account_completion_token);
CREATE INDEX idx_customers_reset_token ON public.customers(password_reset_token);

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;