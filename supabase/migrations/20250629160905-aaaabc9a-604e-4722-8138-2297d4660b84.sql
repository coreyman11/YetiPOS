
-- Add label tracking fields to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS needs_label boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS label_printed_at timestamp with time zone;

-- Update existing inventory items to need labels if they don't have barcodes
UPDATE public.inventory 
SET needs_label = true 
WHERE barcode IS NULL OR barcode = '';

-- Update existing inventory items with barcodes to not need labels initially
UPDATE public.inventory 
SET needs_label = false 
WHERE barcode IS NOT NULL AND barcode != '';
