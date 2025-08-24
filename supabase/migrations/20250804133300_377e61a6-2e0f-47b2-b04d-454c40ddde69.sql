-- Add missing location_id column to store_pages table
ALTER TABLE public.store_pages 
ADD COLUMN location_id uuid REFERENCES public.locations(id);

-- Add location_id column to store_navigation table as well for consistency
ALTER TABLE public.store_navigation 
ADD COLUMN location_id uuid REFERENCES public.locations(id);