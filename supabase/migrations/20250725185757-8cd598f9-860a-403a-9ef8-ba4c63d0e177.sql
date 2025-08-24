-- Fix customer email format for ID 5
UPDATE public.customers 
SET email = 'none@gmail.com' 
WHERE id = 5 AND email = 'none@gmail';

-- Reset suspended test membership to active for testing
UPDATE public.customer_memberships 
SET 
  billing_status = 'active',
  next_billing_date = '2025-07-25T00:00:00Z',
  failed_payment_attempts = 0,
  grace_period_end = NULL
WHERE id = 'fb7ee6dd-4e13-4e2a-b420-9d87edc5c361';