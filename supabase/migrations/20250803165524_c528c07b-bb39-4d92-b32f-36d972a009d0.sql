-- Add loyalty_program_id column to loyalty_transactions table
ALTER TABLE public.loyalty_transactions 
ADD COLUMN loyalty_program_id bigint REFERENCES public.loyalty_programs(id);