
-- Create membership plans table for different subscription tiers
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, etc.
  billing_interval_count INTEGER NOT NULL DEFAULT 1,
  stripe_price_id TEXT,
  location_id UUID REFERENCES public.locations(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER, -- null = unlimited
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer memberships table to link customers to plans
CREATE TABLE public.customer_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  location_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, membership_plan_id)
);

-- Create membership benefits table for defining what each plan includes
CREATE TABLE public.membership_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL, -- discount_percentage, discount_fixed, exclusive_access, priority_support, etc.
  benefit_value NUMERIC, -- percentage or fixed amount
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all membership tables
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_plans
CREATE POLICY "Users can view membership plans for their locations" ON public.membership_plans
  FOR SELECT USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can insert membership plans for their locations" ON public.membership_plans
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can update membership plans for their locations" ON public.membership_plans
  FOR UPDATE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can delete membership plans for their locations" ON public.membership_plans
  FOR DELETE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

-- RLS Policies for customer_memberships
CREATE POLICY "Users can view customer memberships for their locations" ON public.customer_memberships
  FOR SELECT USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can insert customer memberships for their locations" ON public.customer_memberships
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can update customer memberships for their locations" ON public.customer_memberships
  FOR UPDATE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can delete customer memberships for their locations" ON public.customer_memberships
  FOR DELETE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

-- RLS Policies for membership_benefits
CREATE POLICY "Users can view membership benefits for their locations" ON public.membership_benefits
  FOR SELECT USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can insert membership benefits for their locations" ON public.membership_benefits
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can update membership benefits for their locations" ON public.membership_benefits
  FOR UPDATE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY "Users can delete membership benefits for their locations" ON public.membership_benefits
  FOR DELETE USING (
    location_id IN (
      SELECT unnest(user_profiles.allowed_locations)
      FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    ) OR (
      SELECT user_profiles.role FROM user_profiles WHERE user_profiles.id = auth.uid()
    ) = 'admin'
  );

-- Add indexes for better performance
CREATE INDEX idx_membership_plans_location_id ON public.membership_plans(location_id);
CREATE INDEX idx_customer_memberships_customer_id ON public.customer_memberships(customer_id);
CREATE INDEX idx_customer_memberships_location_id ON public.customer_memberships(location_id);
CREATE INDEX idx_customer_memberships_stripe_subscription_id ON public.customer_memberships(stripe_subscription_id);
CREATE INDEX idx_membership_benefits_plan_id ON public.membership_benefits(membership_plan_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_membership_plans_updated_at
    BEFORE UPDATE ON public.membership_plans
    FOR EACH ROW EXECUTE FUNCTION update_membership_updated_at();

CREATE TRIGGER update_customer_memberships_updated_at
    BEFORE UPDATE ON public.customer_memberships
    FOR EACH ROW EXECUTE FUNCTION update_membership_updated_at();
