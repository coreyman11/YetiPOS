-- Phase 1: Database Foundation for Vendor Admin & Feature Toggle System

-- Add role_scope enum to distinguish customer vs vendor roles
CREATE TYPE public.role_scope AS ENUM ('customer', 'vendor');

-- Add role_scope column to existing roles table
ALTER TABLE public.roles ADD COLUMN role_scope public.role_scope NOT NULL DEFAULT 'customer';

-- Create feature definitions table
CREATE TABLE public.feature_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_core BOOLEAN NOT NULL DEFAULT false, -- Core features cannot be disabled
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature toggles table for per-location feature management
CREATE TABLE public.feature_toggles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL,
  feature_id UUID NOT NULL REFERENCES public.feature_definitions(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_by UUID REFERENCES auth.users(id),
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(location_id, feature_id)
);

-- Create vendor admin audit log table
CREATE TABLE public.vendor_admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'feature_toggle', 'role_assignment', etc.
  target_id TEXT NOT NULL,
  location_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_definitions (vendor admin only for modifications)
CREATE POLICY "Anyone can view feature definitions"
ON public.feature_definitions
FOR SELECT
USING (true);

CREATE POLICY "Only vendor admins can modify feature definitions"
ON public.feature_definitions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() 
    AND r.role_scope = 'vendor'
  )
);

-- RLS Policies for feature_toggles (vendor admin only)
CREATE POLICY "Vendor admins can view all feature toggles"
ON public.feature_toggles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() 
    AND r.role_scope = 'vendor'
  )
);

CREATE POLICY "Vendor admins can manage feature toggles"
ON public.feature_toggles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() 
    AND r.role_scope = 'vendor'
  )
);

-- RLS Policies for vendor_admin_audit_log (vendor admin only)
CREATE POLICY "Vendor admins can view audit logs"
ON public.vendor_admin_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() 
    AND r.role_scope = 'vendor'
  )
);

CREATE POLICY "System can insert audit logs"
ON public.vendor_admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Insert core feature definitions
INSERT INTO public.feature_definitions (name, description, category, is_core) VALUES
('dashboard', 'Main dashboard and analytics', 'core', true),
('inventory', 'Inventory management system', 'core', true),
('customers', 'Customer management', 'core', true),
('transactions', 'Transaction processing', 'core', true),
('reports', 'Basic reporting', 'core', true),
('gift_cards', 'Gift card management', 'commerce', false),
('loyalty_programs', 'Loyalty and rewards programs', 'commerce', false),
('memberships', 'Membership management', 'commerce', false),
('discounts', 'Discount and promotion management', 'commerce', false),
('label_generator', 'Barcode and label generation', 'tools', false),
('user_management', 'User and role management', 'admin', false),
('billing', 'Billing and invoicing', 'admin', false),
('portal', 'Store portal management', 'admin', false),
('storefront', 'Online storefront', 'ecommerce', false),
('services', 'Service booking and management', 'business', false),
('shift_management', 'Employee shift tracking', 'business', false),
('tax_configuration', 'Tax settings and configuration', 'finance', false),
('payments', 'Payment processing configuration', 'finance', false);

-- Function to check if user has vendor admin role
CREATE OR REPLACE FUNCTION public.is_vendor_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = user_id 
    AND r.role_scope = 'vendor'
  );
$$;

-- Function to check if feature is enabled for location
CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  feature_name TEXT,
  location_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT ft.is_enabled
      FROM public.feature_toggles ft
      JOIN public.feature_definitions fd ON ft.feature_id = fd.id
      WHERE fd.name = feature_name 
      AND ft.location_id = is_feature_enabled.location_id
    ),
    -- Default to true if no toggle exists (features enabled by default)
    true
  );
$$;

-- Function to get user's effective permissions with feature toggle check
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions_with_features(
  p_user_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE(
  permission_id UUID,
  permission_name TEXT,
  granted BOOLEAN,
  source TEXT,
  feature_enabled BOOLEAN
)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    perms.permission_id,
    perms.permission_name,
    perms.granted,
    perms.source,
    CASE 
      WHEN p_location_id IS NULL THEN true
      ELSE public.is_feature_enabled(
        CASE perms.permission_name
          WHEN 'view_dashboard' THEN 'dashboard'
          WHEN 'manage_inventory' THEN 'inventory'
          WHEN 'view_inventory' THEN 'inventory'
          WHEN 'manage_customers' THEN 'customers'
          WHEN 'view_customers' THEN 'customers'
          WHEN 'process_transactions' THEN 'transactions'
          WHEN 'view_transactions' THEN 'transactions'
          WHEN 'view_reports' THEN 'reports'
          WHEN 'manage_gift_cards' THEN 'gift_cards'
          WHEN 'view_gift_cards' THEN 'gift_cards'
          WHEN 'manage_loyalty' THEN 'loyalty_programs'
          WHEN 'view_loyalty' THEN 'loyalty_programs'
          WHEN 'manage_memberships' THEN 'memberships'
          WHEN 'view_memberships' THEN 'memberships'
          WHEN 'manage_discounts' THEN 'discounts'
          WHEN 'view_discounts' THEN 'discounts'
          WHEN 'use_label_generator' THEN 'label_generator'
          WHEN 'manage_users' THEN 'user_management'
          WHEN 'view_billing' THEN 'billing'
          WHEN 'manage_billing' THEN 'billing'
          WHEN 'manage_portal' THEN 'portal'
          WHEN 'view_storefront' THEN 'storefront'
          WHEN 'manage_services' THEN 'services'
          WHEN 'view_services' THEN 'services'
          WHEN 'manage_shifts' THEN 'shift_management'
          WHEN 'view_shifts' THEN 'shift_management'
          WHEN 'manage_tax' THEN 'tax_configuration'
          WHEN 'manage_payments' THEN 'payments'
          ELSE 'dashboard' -- Default to core feature
        END,
        p_location_id
      )
    END as feature_enabled
  FROM public.get_user_effective_permissions(p_user_id) perms;
END;
$$;

-- Create trigger to log feature toggle changes
CREATE OR REPLACE FUNCTION public.log_feature_toggle_change()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.vendor_admin_audit_log (
    admin_user_id,
    action,
    target_type,
    target_id,
    location_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'feature_toggle_created'
      WHEN TG_OP = 'UPDATE' THEN 'feature_toggle_updated'
      WHEN TG_OP = 'DELETE' THEN 'feature_toggle_deleted'
    END,
    'feature_toggle',
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    COALESCE(NEW.location_id, OLD.location_id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER feature_toggle_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.feature_toggles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_feature_toggle_change();

-- Update triggers for updated_at columns
CREATE TRIGGER update_feature_definitions_updated_at
  BEFORE UPDATE ON public.feature_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_toggles_updated_at
  BEFORE UPDATE ON public.feature_toggles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create vendor admin role
INSERT INTO public.roles (name, description, is_system, role_scope) VALUES
('Vendor Admin', 'Full vendor administration access', true, 'vendor');

-- Insert default feature toggles for all existing locations
INSERT INTO public.feature_toggles (location_id, feature_id, is_enabled)
SELECT 
  l.id as location_id,
  fd.id as feature_id,
  true as is_enabled
FROM public.locations l
CROSS JOIN public.feature_definitions fd
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_toggles ft 
  WHERE ft.location_id = l.id AND ft.feature_id = fd.id
);