-- Add notes column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN notes TEXT;