-- Create a test membership for customer ID 18 with proper billing settings
INSERT INTO customer_memberships (
  customer_id,
  membership_plan_id,
  location_id,
  billing_type,
  billing_status,
  next_billing_date,
  stripe_customer_id,
  current_period_start,
  failed_payment_attempts
) VALUES (
  18,
  '550e8400-e29b-41d4-a716-446655440000', -- Use existing plan ID
  'bc33b7c2-250f-48ac-8edd-2cd13d98347c',
  'hybrid_fixed',
  'active',
  '2025-07-24T00:00:00Z', -- Set to yesterday to trigger billing
  'cus_Sk3bOCst87GnXS', -- Use existing Stripe customer
  NOW(),
  0
) ON CONFLICT DO NOTHING;