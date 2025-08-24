-- Fix the missing loyalty transaction for transaction #612
-- Customer 6 used loyalty points but the redemption wasn't recorded

-- Insert the missing loyalty transaction record
INSERT INTO public.loyalty_transactions (
  customer_id, 
  transaction_id, 
  points_earned, 
  points_redeemed, 
  points_balance, 
  type, 
  description, 
  location_id, 
  loyalty_program_id,
  created_at
) VALUES (
  6, 
  612, 
  NULL, 
  99, 
  179, 
  'redeem', 
  'Points redeemed for transaction #612', 
  'bc33b7c2-250f-48ac-8edd-2cd13d98347c', 
  1,
  '2025-08-08 19:32:57.654389+00'
);

-- Update customer's loyalty points to reflect the correct balance after redemption
UPDATE public.customers 
SET loyalty_points = 179 
WHERE id = 6;