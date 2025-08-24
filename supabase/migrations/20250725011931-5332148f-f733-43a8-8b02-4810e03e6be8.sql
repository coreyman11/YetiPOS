-- Add stripe_customer_id column to customers table for tokenized payment methods
ALTER TABLE public.customers 
ADD COLUMN stripe_customer_id TEXT;

-- Add index for better performance when looking up by stripe_customer_id
CREATE INDEX idx_customers_stripe_customer_id ON public.customers(stripe_customer_id);