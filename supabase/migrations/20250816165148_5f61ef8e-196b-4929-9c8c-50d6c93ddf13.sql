-- Create Vendor Admin role
INSERT INTO roles (name, description, is_system, role_scope) 
VALUES ('Vendor Admin', 'Full administrative access for vendor operations', true, 'vendor')
ON CONFLICT (name) DO NOTHING;