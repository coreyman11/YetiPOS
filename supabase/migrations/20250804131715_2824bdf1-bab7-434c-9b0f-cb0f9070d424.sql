-- Update the store_themes table structure to include proper columns for themes
-- First, let's check if the old table has the right structure

-- Add missing columns to store_themes if they don't exist
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#666666'; 
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#007bff';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'standard';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS footer_style TEXT DEFAULT 'standard';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS layout_style TEXT DEFAULT 'modern';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE store_themes ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Update existing themes with proper values
UPDATE store_themes SET 
  primary_color = '#000000',
  secondary_color = '#666666',
  accent_color = '#007bff',
  font_family = 'Inter',
  header_style = 'minimal',
  footer_style = 'minimal',
  layout_style = 'modern',
  config = jsonb_build_object(
    'primary_color', '#000000',
    'secondary_color', '#666666',
    'accent_color', '#007bff',
    'font_family', 'Inter',
    'header_style', 'minimal',
    'footer_style', 'minimal',
    'layout_style', 'modern'
  )
WHERE name = 'Minimal Modern';

UPDATE store_themes SET 
  primary_color = '#1a365d',
  secondary_color = '#4a5568',
  accent_color = '#3182ce',
  font_family = 'Open Sans',
  header_style = 'standard',
  footer_style = 'standard',
  layout_style = 'classic',
  config = jsonb_build_object(
    'primary_color', '#1a365d',
    'secondary_color', '#4a5568',
    'accent_color', '#3182ce',
    'font_family', 'Open Sans',
    'header_style', 'standard',
    'footer_style', 'standard',
    'layout_style', 'classic'
  )
WHERE name = 'Classic Business';

UPDATE store_themes SET 
  primary_color = '#2d1b69',
  secondary_color = '#805ad5',
  accent_color = '#ed8936',
  font_family = 'Poppins',
  header_style = 'creative',
  footer_style = 'modern',
  layout_style = 'magazine',
  config = jsonb_build_object(
    'primary_color', '#2d1b69',
    'secondary_color', '#805ad5',
    'accent_color', '#ed8936',
    'font_family', 'Poppins',
    'header_style', 'creative',
    'footer_style', 'modern',
    'layout_style', 'magazine'
  )
WHERE name = 'Creative Portfolio';

UPDATE store_themes SET 
  primary_color = '#1a202c',
  secondary_color = '#718096',
  accent_color = '#38b2ac',
  font_family = 'Inter',
  header_style = 'standard',
  footer_style = 'standard',
  layout_style = 'grid',
  config = jsonb_build_object(
    'primary_color', '#1a202c',
    'secondary_color', '#718096',
    'accent_color', '#38b2ac',
    'font_family', 'Inter',
    'header_style', 'standard',
    'footer_style', 'standard',
    'layout_style', 'grid'
  )
WHERE name = 'E-commerce Pro';

UPDATE store_themes SET 
  primary_color = '#2d3748',
  secondary_color = '#a0aec0',
  accent_color = '#f56565',
  font_family = 'Playfair Display',
  header_style = 'elegant',
  footer_style = 'elegant',
  layout_style = 'magazine',
  config = jsonb_build_object(
    'primary_color', '#2d3748',
    'secondary_color', '#a0aec0',
    'accent_color', '#f56565',
    'font_family', 'Playfair Display',
    'header_style', 'elegant',
    'footer_style', 'elegant',
    'layout_style', 'magazine'
  )
WHERE name = 'Fashion Forward';

UPDATE store_themes SET 
  primary_color = '#1a365d',
  secondary_color = '#4a5568',
  accent_color = '#00d9ff',
  font_family = 'Roboto',
  header_style = 'modern',
  footer_style = 'minimal',
  layout_style = 'modern',
  config = jsonb_build_object(
    'primary_color', '#1a365d',
    'secondary_color', '#4a5568',
    'accent_color', '#00d9ff',
    'font_family', 'Roboto',
    'header_style', 'modern',
    'footer_style', 'minimal',
    'layout_style', 'modern'
  )
WHERE name = 'Tech Startup';