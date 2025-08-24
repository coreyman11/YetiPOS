
-- Add loyalty_program_id column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN loyalty_program_id bigint REFERENCES public.loyalty_programs(id);

-- Create index for performance
CREATE INDEX idx_transactions_loyalty_program_id ON public.transactions(loyalty_program_id);

-- Backfill existing transactions that used loyalty points with loyalty_program_id = 1
UPDATE public.transactions 
SET loyalty_program_id = 1 
WHERE use_loyalty_points = true 
AND customer_id IS NOT NULL 
AND loyalty_program_id IS NULL;

-- Add is_active column to loyalty_programs table if it doesn't exist
ALTER TABLE public.loyalty_programs 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Ensure the existing program is active
UPDATE public.loyalty_programs 
SET is_active = true 
WHERE id = 1;
