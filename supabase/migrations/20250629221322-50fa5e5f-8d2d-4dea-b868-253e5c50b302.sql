
-- Add missing banner columns to the online_stores table
ALTER TABLE public.online_stores 
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS banner_title text,
ADD COLUMN IF NOT EXISTS banner_subtitle text;

-- Update the updated_at column to use the trigger for these new columns
-- (This ensures the updated_at timestamp is properly maintained)
