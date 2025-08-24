-- Phase 1: Hybrid Billing System Database Schema
-- Enable pg_cron extension for automated billing
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add billing-related columns to existing membership_plans table
ALTER TABLE public.membership_plans 
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'stripe_subscription' CHECK (billing_type IN ('stripe_subscription', 'hybrid_usage', 'hybrid_fixed')),
ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_based boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_rate_cents integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_day_of_month integer DEFAULT 1 CHECK (billing_day_of_month >= 1 AND billing_day_of_month <= 28);

-- Add billing-related columns to existing customer_memberships table
ALTER TABLE public.customer_memberships 
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'stripe_subscription' CHECK (billing_type IN ('stripe_subscription', 'hybrid_usage', 'hybrid_fixed')),
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_billed_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS next_billing_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'active' CHECK (billing_status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
ADD COLUMN IF NOT EXISTS failed_payment_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_end timestamp with time zone;

-- Create billing_cycles table to track billing periods
CREATE TABLE IF NOT EXISTS public.billing_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_membership_id uuid NOT NULL REFERENCES public.customer_memberships(id) ON DELETE CASCADE,
  cycle_start timestamp with time zone NOT NULL,
  cycle_end timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'cancelled')),
  amount_cents integer NOT NULL DEFAULT 0,
  usage_data jsonb DEFAULT '{}',
  processed_at timestamp with time zone,
  location_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create usage_tracking table for monitoring POS usage
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_membership_id uuid NOT NULL REFERENCES public.customer_memberships(id) ON DELETE CASCADE,
  location_id uuid,
  tracking_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_count integer DEFAULT 0,
  revenue_cents integer DEFAULT 0,
  active_minutes integer DEFAULT 0,
  unique_customers integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_membership_id, location_id, tracking_date)
);

-- Create billing_invoices table for tracking charges
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_membership_id uuid NOT NULL REFERENCES public.customer_memberships(id) ON DELETE CASCADE,
  billing_cycle_id uuid REFERENCES public.billing_cycles(id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  tax_cents integer DEFAULT 0,
  total_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  due_date timestamp with time zone NOT NULL,
  paid_at timestamp with time zone,
  failed_at timestamp with time zone,
  failure_reason text,
  retry_count integer DEFAULT 0,
  line_items jsonb DEFAULT '[]',
  location_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create membership_trials table for trial period management
CREATE TABLE IF NOT EXISTS public.membership_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_membership_id uuid NOT NULL REFERENCES public.customer_memberships(id) ON DELETE CASCADE,
  trial_start timestamp with time zone NOT NULL DEFAULT now(),
  trial_end timestamp with time zone NOT NULL,
  converted boolean DEFAULT false,
  converted_at timestamp with time zone,
  location_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_membership_id)
);

-- Create billing_settings table for system configuration
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid,
  max_retry_attempts integer DEFAULT 5,
  retry_delay_hours integer DEFAULT 24,
  grace_period_days integer DEFAULT 5,
  auto_suspend_after_grace boolean DEFAULT true,
  usage_calculation_method text DEFAULT 'transaction_count' CHECK (usage_calculation_method IN ('transaction_count', 'revenue_based', 'time_based', 'hybrid')),
  billing_timezone text DEFAULT 'UTC',
  send_payment_reminders boolean DEFAULT true,
  reminder_days_before integer DEFAULT 3,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(location_id)
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_cycles
CREATE POLICY "Users can view billing cycles for their locations" ON public.billing_cycles
FOR SELECT USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert billing cycles for their locations" ON public.billing_cycles
FOR INSERT WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update billing cycles for their locations" ON public.billing_cycles
FOR UPDATE USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create RLS policies for usage_tracking
CREATE POLICY "Users can view usage tracking for their locations" ON public.usage_tracking
FOR SELECT USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert usage tracking for their locations" ON public.usage_tracking
FOR INSERT WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update usage tracking for their locations" ON public.usage_tracking
FOR UPDATE USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create RLS policies for billing_invoices
CREATE POLICY "Users can view billing invoices for their locations" ON public.billing_invoices
FOR SELECT USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert billing invoices for their locations" ON public.billing_invoices
FOR INSERT WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update billing invoices for their locations" ON public.billing_invoices
FOR UPDATE USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create RLS policies for membership_trials
CREATE POLICY "Users can view membership trials for their locations" ON public.membership_trials
FOR SELECT USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert membership trials for their locations" ON public.membership_trials
FOR INSERT WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update membership trials for their locations" ON public.membership_trials
FOR UPDATE USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create RLS policies for billing_settings
CREATE POLICY "Users can view billing settings for their locations" ON public.billing_settings
FOR SELECT USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can insert billing settings for their locations" ON public.billing_settings
FOR INSERT WITH CHECK (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

CREATE POLICY "Users can update billing settings for their locations" ON public.billing_settings
FOR UPDATE USING (
  location_id IN (
    SELECT unnest(user_profiles.allowed_locations)
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) OR (
    SELECT user_profiles.role FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  ) = 'admin'
);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to new tables
CREATE TRIGGER update_billing_cycles_updated_at
    BEFORE UPDATE ON public.billing_cycles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at
    BEFORE UPDATE ON public.billing_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_trials_updated_at
    BEFORE UPDATE ON public.membership_trials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_settings_updated_at
    BEFORE UPDATE ON public.billing_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text AS $$
DECLARE
    v_number text;
    v_exists boolean;
BEGIN
    LOOP
        -- Generate invoice number format: INV-YYYY-XXXXXX
        v_number := 'INV-' || EXTRACT(YEAR FROM now()) || '-' || 
                   lpad(floor(random() * 1000000)::text, 6, '0');
        
        -- Check if this number already exists
        SELECT EXISTS (
            SELECT 1 
            FROM public.billing_invoices 
            WHERE invoice_number = v_number
        ) INTO v_exists;
        
        -- Exit loop if we found a unique number
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_cycles_customer_membership ON public.billing_cycles(customer_membership_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON public.billing_cycles(status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_cycle_dates ON public.billing_cycles(cycle_start, cycle_end);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_membership_date ON public.usage_tracking(customer_membership_id, tracking_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_location_date ON public.usage_tracking(location_id, tracking_date);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_membership ON public.billing_invoices(customer_membership_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON public.billing_invoices(status);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_due_date ON public.billing_invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_membership_trials_end_date ON public.membership_trials(trial_end);
CREATE INDEX IF NOT EXISTS idx_membership_trials_converted ON public.membership_trials(converted);

-- Add comments for documentation
COMMENT ON TABLE public.billing_cycles IS 'Tracks billing periods for hybrid billing memberships';
COMMENT ON TABLE public.usage_tracking IS 'Daily usage metrics for usage-based billing calculations';
COMMENT ON TABLE public.billing_invoices IS 'Individual invoices and payment attempts for hybrid billing';
COMMENT ON TABLE public.membership_trials IS 'Trial period tracking for memberships';
COMMENT ON TABLE public.billing_settings IS 'Configurable billing system settings per location';