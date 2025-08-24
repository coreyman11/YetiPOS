-- Update the test customer membership to have the correct billing type for billing engine
UPDATE customer_memberships 
SET billing_type = 'hybrid_fixed'
WHERE customer_id = 10 
AND location_id = 'bc33b7c2-250f-48ac-8edd-2cd13d98347c';