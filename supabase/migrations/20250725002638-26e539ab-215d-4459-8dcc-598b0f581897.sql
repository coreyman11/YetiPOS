-- Create a test customer if not exists
INSERT INTO public.customers (id, name, email, phone, location_id)
VALUES (9999, 'Test Customer for Billing', 'test-billing@example.com', '555-0123', 'bc33b7c2-250f-48ac-8edd-2cd13d98347c')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Create a test membership plan if not exists
INSERT INTO public.membership_plans (id, name, description, price_cents, billing_type, billing_interval, location_id, usage_based, usage_rate_cents)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test Hybrid Plan', 'Test plan for billing engine', 2999, 'hybrid_usage', 'monthly', 'bc33b7c2-250f-48ac-8edd-2cd13d98347c', true, 10)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents;

-- Create or update test customer membership with next_billing_date as today
INSERT INTO public.customer_memberships (
  id, 
  customer_id, 
  membership_plan_id, 
  billing_type, 
  billing_status, 
  next_billing_date, 
  current_period_start,
  location_id
)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  9999,
  '550e8400-e29b-41d4-a716-446655440000',
  'hybrid_usage',
  'active',
  CURRENT_DATE,
  NOW() - INTERVAL '30 days',
  'bc33b7c2-250f-48ac-8edd-2cd13d98347c'
)
ON CONFLICT (id) DO UPDATE SET 
  next_billing_date = CURRENT_DATE,
  billing_status = 'active';

-- Insert some usage tracking data for the test membership
INSERT INTO public.usage_tracking (
  customer_membership_id,
  location_id,
  tracking_date,
  transaction_count,
  revenue_cents,
  unique_customers
)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440000', 'bc33b7c2-250f-48ac-8edd-2cd13d98347c', CURRENT_DATE - INTERVAL '1 day', 5, 12500, 3),
  ('660e8400-e29b-41d4-a716-446655440000', 'bc33b7c2-250f-48ac-8edd-2cd13d98347c', CURRENT_DATE - INTERVAL '2 days', 8, 20000, 5),
  ('660e8400-e29b-41d4-a716-446655440000', 'bc33b7c2-250f-48ac-8edd-2cd13d98347c', CURRENT_DATE - INTERVAL '3 days', 3, 7500, 2)
ON CONFLICT (customer_membership_id, location_id, tracking_date) DO UPDATE SET
  transaction_count = EXCLUDED.transaction_count,
  revenue_cents = EXCLUDED.revenue_cents,
  unique_customers = EXCLUDED.unique_customers;