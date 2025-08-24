-- Create store themes table
CREATE TABLE public.store_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store pages table for custom pages
CREATE TABLE public.store_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
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
  parent_id UUID REFERENCES public.store_navigation(id),
  sort_order INTEGER DEFAULT 0,
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store widgets table
CREATE TABLE public.store_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL,
  type TEXT NOT NULL, -- 'hero', 'testimonial', 'gallery', 'contact_form', etc.
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  position TEXT DEFAULT 'main', -- 'header', 'main', 'footer', 'sidebar'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store SEO settings table
CREATE TABLE public.store_seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image_url TEXT,
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  structured_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product collections table
CREATE TABLE public.product_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Create product variants table
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id BIGINT NOT NULL,
  store_id BIGINT NOT NULL,
  name TEXT NOT NULL, -- e.g., "Small Red", "Large Blue"
  sku TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  cost NUMERIC,
  quantity INTEGER DEFAULT 0,
  weight NUMERIC,
  options JSONB DEFAULT '{}', -- {"size": "Small", "color": "Red"}
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection products junction table
CREATE TABLE public.collection_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.product_collections(id) ON DELETE CASCADE,
  inventory_id BIGINT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add theme and design columns to online_stores table
ALTER TABLE public.online_stores 
ADD COLUMN theme_id UUID REFERENCES public.store_themes(id),
ADD COLUMN custom_css TEXT,
ADD COLUMN custom_js TEXT,
ADD COLUMN font_family TEXT DEFAULT 'Inter',
ADD COLUMN primary_color TEXT DEFAULT '#000000',
ADD COLUMN secondary_color TEXT DEFAULT '#666666',
ADD COLUMN accent_color TEXT DEFAULT '#007bff',
ADD COLUMN header_style TEXT DEFAULT 'standard',
ADD COLUMN footer_style TEXT DEFAULT 'standard',
ADD COLUMN layout_style TEXT DEFAULT 'modern',
ADD COLUMN show_search BOOLEAN DEFAULT true,
ADD COLUMN show_cart BOOLEAN DEFAULT true,
ADD COLUMN show_wishlist BOOLEAN DEFAULT false,
ADD COLUMN products_per_page INTEGER DEFAULT 12,
ADD COLUMN enable_reviews BOOLEAN DEFAULT true,
ADD COLUMN enable_inventory_tracking BOOLEAN DEFAULT true,
ADD COLUMN allow_backorders BOOLEAN DEFAULT false,
ADD COLUMN checkout_style TEXT DEFAULT 'single_page',
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN timezone TEXT DEFAULT 'UTC',
ADD COLUMN maintenance_mode BOOLEAN DEFAULT false,
ADD COLUMN maintenance_message TEXT;

-- Enable RLS on new tables
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for themes (public read, admin write)
CREATE POLICY "Anyone can view store themes" ON public.store_themes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage themes" ON public.store_themes FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for store pages
CREATE POLICY "Anyone can view published store pages" ON public.store_pages FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage store pages" ON public.store_pages FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for navigation
CREATE POLICY "Anyone can view store navigation" ON public.store_navigation FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage navigation" ON public.store_navigation FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for widgets
CREATE POLICY "Anyone can view active store widgets" ON public.store_widgets FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage widgets" ON public.store_widgets FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for SEO settings
CREATE POLICY "Anyone can view store SEO settings" ON public.store_seo_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage SEO settings" ON public.store_seo_settings FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for collections
CREATE POLICY "Anyone can view product collections" ON public.product_collections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage collections" ON public.product_collections FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for variants
CREATE POLICY "Anyone can view active product variants" ON public.product_variants FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage variants" ON public.product_variants FOR ALL USING (auth.uid() IS NOT NULL);

-- Create RLS policies for collection products
CREATE POLICY "Anyone can view collection products" ON public.collection_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage collection products" ON public.collection_products FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert default themes
INSERT INTO public.store_themes (name, description, config, category) VALUES
('Modern Minimal', 'Clean and minimal design with focus on products', '{"layout": "minimal", "colors": {"primary": "#000000", "secondary": "#666666"}, "fonts": {"primary": "Inter"}}', 'minimal'),
('Bold Commerce', 'Bold design for fashion and lifestyle brands', '{"layout": "bold", "colors": {"primary": "#2563eb", "secondary": "#1e40af"}, "fonts": {"primary": "Poppins"}}', 'fashion'),
('Classic Business', 'Professional design for business stores', '{"layout": "classic", "colors": {"primary": "#059669", "secondary": "#047857"}, "fonts": {"primary": "Source Sans Pro"}}', 'business'),
('Creative Studio', 'Artistic design for creative professionals', '{"layout": "creative", "colors": {"primary": "#7c3aed", "secondary": "#6d28d9"}, "fonts": {"primary": "Playfair Display"}}', 'creative');

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_themes_updated_at BEFORE UPDATE ON public.store_themes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_pages_updated_at BEFORE UPDATE ON public.store_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_widgets_updated_at BEFORE UPDATE ON public.store_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_seo_settings_updated_at BEFORE UPDATE ON public.store_seo_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_collections_updated_at BEFORE UPDATE ON public.product_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();