-- Create store themes table
CREATE TABLE public.store_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  preview_image_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#000000',
  secondary_color TEXT NOT NULL DEFAULT '#666666', 
  accent_color TEXT NOT NULL DEFAULT '#007bff',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  header_style TEXT NOT NULL DEFAULT 'standard',
  footer_style TEXT NOT NULL DEFAULT 'standard',
  layout_style TEXT NOT NULL DEFAULT 'modern',
  custom_css TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store pages table
CREATE TABLE public.store_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Create store navigation table
CREATE TABLE public.store_navigation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'internal' CHECK (type IN ('internal', 'external', 'page')),
  page_id UUID,
  parent_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default themes
INSERT INTO public.store_themes (name, description, category, primary_color, secondary_color, accent_color, font_family, header_style, footer_style, layout_style) VALUES
('Minimal Modern', 'Clean and minimalist design perfect for modern brands', 'modern', '#000000', '#666666', '#007bff', 'Inter', 'minimal', 'minimal', 'modern'),
('Classic Business', 'Professional and trustworthy design for established businesses', 'business', '#1a365d', '#4a5568', '#3182ce', 'Open Sans', 'standard', 'standard', 'classic'),
('Creative Portfolio', 'Bold and artistic design for creative professionals', 'creative', '#2d1b69', '#805ad5', '#ed8936', 'Poppins', 'creative', 'modern', 'magazine'),
('E-commerce Pro', 'Optimized for online selling with conversion-focused elements', 'ecommerce', '#1a202c', '#718096', '#38b2ac', 'Inter', 'standard', 'standard', 'grid'),
('Fashion Forward', 'Stylish and trendy design perfect for fashion brands', 'fashion', '#2d3748', '#a0aec0', '#f56565', 'Playfair Display', 'elegant', 'elegant', 'magazine'),
('Tech Startup', 'Modern and innovative design for technology companies', 'tech', '#1a365d', '#4a5568', '#00d9ff', 'Roboto', 'modern', 'minimal', 'modern');

-- Enable RLS
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_navigation ENABLE ROW LEVEL SECURITY;

-- Create policies for store_themes (read-only for authenticated users)
CREATE POLICY "Anyone can view store themes" 
ON public.store_themes 
FOR SELECT 
USING (is_active = true);

-- Create policies for store_pages
CREATE POLICY "Users can view store pages for their locations" 
ON public.store_pages 
FOR SELECT 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert store pages for their locations" 
ON public.store_pages 
FOR INSERT 
WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update store pages for their locations" 
ON public.store_pages 
FOR UPDATE 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can delete store pages for their locations" 
ON public.store_pages 
FOR DELETE 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create policies for store_navigation (same pattern)
CREATE POLICY "Users can view store navigation for their locations" 
ON public.store_navigation 
FOR SELECT 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert store navigation for their locations" 
ON public.store_navigation 
FOR INSERT 
WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update store navigation for their locations" 
ON public.store_navigation 
FOR UPDATE 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can delete store navigation for their locations" 
ON public.store_navigation 
FOR DELETE 
USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Add update triggers
CREATE TRIGGER update_store_themes_updated_at
BEFORE UPDATE ON public.store_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_pages_updated_at
BEFORE UPDATE ON public.store_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_navigation_updated_at
BEFORE UPDATE ON public.store_navigation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();