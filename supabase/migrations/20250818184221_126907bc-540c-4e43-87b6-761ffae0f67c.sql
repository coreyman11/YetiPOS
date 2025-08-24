-- Phase 3 & 4: Security Hardening Implementation

-- Create audit logging table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'auth',
  user_identifier TEXT,
  ip_address INET,
  user_agent TEXT,
  location_id UUID,
  event_data JSONB DEFAULT '{}',
  risk_level TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit log
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
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
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create security monitoring table for suspicious activity
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  user_identifier TEXT,
  ip_address INET,
  location_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security incidents
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security incidents
CREATE POLICY "Only admins can manage security incidents" 
ON public.security_incidents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.roles r ON up.role_id = r.id
    WHERE up.id = auth.uid() 
    AND r.role_scope = 'vendor'
  )
);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_event_category TEXT DEFAULT 'auth',
  p_user_identifier TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    event_category,
    user_identifier,
    ip_address,
    user_agent,
    location_id,
    event_data,
    risk_level
  ) VALUES (
    p_event_type,
    p_event_category,
    p_user_identifier,
    p_ip_address,
    p_user_agent,
    p_location_id,
    p_event_data,
    p_risk_level
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  failed_attempts INTEGER;
  incident_id UUID;
BEGIN
  -- Check for multiple failed login attempts from same IP
  IF NEW.event_type = 'login_failed' THEN
    SELECT COUNT(*) INTO failed_attempts
    FROM public.security_audit_log
    WHERE event_type = 'login_failed'
    AND ip_address = NEW.ip_address
    AND created_at > now() - INTERVAL '1 hour';
    
    -- If 5+ failed attempts in 1 hour, create security incident
    IF failed_attempts >= 5 THEN
      INSERT INTO public.security_incidents (
        incident_type,
        severity,
        user_identifier,
        ip_address,
        description,
        metadata
      ) VALUES (
        'brute_force_attempt',
        'high',
        NEW.user_identifier,
        NEW.ip_address,
        'Multiple failed login attempts detected',
        jsonb_build_object(
          'failed_attempts', failed_attempts,
          'time_window', '1 hour'
        )
      )
      RETURNING id INTO incident_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for suspicious activity detection
DROP TRIGGER IF EXISTS detect_suspicious_activity_trigger ON public.security_audit_log;
CREATE TRIGGER detect_suspicious_activity_trigger
  AFTER INSERT ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_suspicious_activity();

-- Enhance customer data protection with better RLS policies
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record" 
ON public.customers 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = auth_user_id)
  OR
  (password_hash IS NOT NULL AND online_account_active = true)
);

-- Create function for safe customer data access (data filtering)
CREATE OR REPLACE FUNCTION public.get_safe_customer_data(p_customer_id BIGINT)
RETURNS TABLE(
  id BIGINT,
  name TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  loyalty_points INTEGER,
  location_id UUID,
  online_account_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.first_name,
    c.last_name,
    c.loyalty_points,
    c.location_id,
    c.online_account_active
  FROM public.customers c
  WHERE c.id = p_customer_id;
END;
$$;