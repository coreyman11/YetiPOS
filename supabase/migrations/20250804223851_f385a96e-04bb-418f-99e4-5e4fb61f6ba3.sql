-- Create logo_settings table to store logo URLs for each location
CREATE TABLE IF NOT EXISTS public.logo_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID NOT NULL UNIQUE,
    logo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.logo_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for logo settings
CREATE POLICY "Users can view logo settings for their locations" 
ON public.logo_settings 
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

CREATE POLICY "Users can insert logo settings for their locations" 
ON public.logo_settings 
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

CREATE POLICY "Users can update logo settings for their locations" 
ON public.logo_settings 
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

CREATE POLICY "Users can delete logo settings for their locations" 
ON public.logo_settings 
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_logo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_logo_settings_updated_at
    BEFORE UPDATE ON public.logo_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_logo_settings_updated_at();

-- Create storage policies for the receipt_logos bucket (if needed)
INSERT INTO storage.policies (id, bucket_id, name, definition, check, command)
VALUES 
  ('logo_upload_policy', 'receipt_logos', 'Allow authenticated users to upload logos', 
   'auth.uid() IS NOT NULL', 'auth.uid() IS NOT NULL', 'INSERT'),
  ('logo_read_policy', 'receipt_logos', 'Allow public read access to logos',
   'true', 'true', 'SELECT'),
  ('logo_update_policy', 'receipt_logos', 'Allow authenticated users to update logos',
   'auth.uid() IS NOT NULL', 'auth.uid() IS NOT NULL', 'UPDATE'),
  ('logo_delete_policy', 'receipt_logos', 'Allow authenticated users to delete logos',
   'auth.uid() IS NOT NULL', 'auth.uid() IS NOT NULL', 'DELETE')
ON CONFLICT (id) DO NOTHING;