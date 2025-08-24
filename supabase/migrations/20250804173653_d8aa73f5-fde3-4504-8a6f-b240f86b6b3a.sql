-- Add design fields to online_stores table
ALTER TABLE public.online_stores 
ADD COLUMN primary_color TEXT DEFAULT '#000000',
ADD COLUMN secondary_color TEXT DEFAULT '#666666',
ADD COLUMN accent_color TEXT DEFAULT '#007bff',
ADD COLUMN font_family TEXT DEFAULT 'Inter',
ADD COLUMN header_style TEXT DEFAULT 'standard',
ADD COLUMN footer_style TEXT DEFAULT 'standard',
ADD COLUMN layout_style TEXT DEFAULT 'modern';