-- Tighten RLS for gift cards to prevent public read access
-- Ensure RLS is enabled
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive public SELECT policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gift_cards;
DROP POLICY IF EXISTS "read_gift_cards" ON public.gift_cards;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.gift_card_transactions;
DROP POLICY IF EXISTS "read_gift_card_transactions" ON public.gift_card_transactions;

-- Create restricted SELECT policies based on allowed locations or admin role
CREATE POLICY "Users can view gift cards for their locations"
ON public.gift_cards
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND gift_cards.location_id IS NOT NULL
        AND gift_cards.location_id = ANY (up.allowed_locations)
    ))
    OR ((SELECT user_profiles.role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) = 'admin')
  )
);

CREATE POLICY "Users can view gift card transactions for their locations"
ON public.gift_card_transactions
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    (EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND gift_card_transactions.location_id IS NOT NULL
        AND gift_card_transactions.location_id = ANY (up.allowed_locations)
    ))
    OR ((SELECT user_profiles.role FROM public.user_profiles WHERE user_profiles.id = auth.uid()) = 'admin')
  )
);