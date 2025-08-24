-- First, let's see the current membership plans structure and add support for multiple locations

-- Create a junction table to support many-to-many relationship between plans and locations
CREATE TABLE IF NOT EXISTS public.membership_plan_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(membership_plan_id, location_id)
);

-- Enable RLS on the new table
ALTER TABLE public.membership_plan_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the junction table
CREATE POLICY "Users can view plan locations for their locations" 
ON public.membership_plan_locations 
FOR SELECT 
USING ((location_id IN ( SELECT unnest(user_profiles.allowed_locations) AS unnest
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid()))) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text));

CREATE POLICY "Users can insert plan locations for their locations" 
ON public.membership_plan_locations 
FOR INSERT 
WITH CHECK ((location_id IN ( SELECT unnest(user_profiles.allowed_locations) AS unnest
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid()))) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text));

CREATE POLICY "Users can update plan locations for their locations" 
ON public.membership_plan_locations 
FOR UPDATE 
USING ((location_id IN ( SELECT unnest(user_profiles.allowed_locations) AS unnest
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid()))) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text));

CREATE POLICY "Users can delete plan locations for their locations" 
ON public.membership_plan_locations 
FOR DELETE 
USING ((location_id IN ( SELECT unnest(user_profiles.allowed_locations) AS unnest
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid()))) OR (( SELECT user_profiles.role
   FROM user_profiles
  WHERE (user_profiles.id = auth.uid())) = 'admin'::text));

-- Migrate existing data: For existing plans that have a location_id, create entries in the junction table
INSERT INTO public.membership_plan_locations (membership_plan_id, location_id)
SELECT id, location_id 
FROM public.membership_plans 
WHERE location_id IS NOT NULL
ON CONFLICT (membership_plan_id, location_id) DO NOTHING;

-- Update membership plans table to support global plans (make location_id nullable for backwards compatibility)
-- The location_id column will remain for backwards compatibility but new logic will use the junction table