-- Update existing stripe_subscription memberships to hybrid_fixed billing
UPDATE customer_memberships 
SET billing_type = 'hybrid_fixed', 
    next_billing_date = CURRENT_DATE + INTERVAL '1 month'
WHERE billing_type = 'stripe_subscription' 
  AND billing_status = 'active';