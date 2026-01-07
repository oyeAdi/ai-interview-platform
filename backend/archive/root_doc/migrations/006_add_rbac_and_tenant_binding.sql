-- Migration: Add Role-Based Access Control for Admin Panel
-- This enables super-admin, admin, and user roles for access control

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user'));

-- Add tenant_id column to profiles for user-tenant binding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);

-- Add comments for documentation
COMMENT ON COLUMN profiles.role IS 'User role: super_admin (full access), admin (org-level access), user (standard access)';
COMMENT ON COLUMN profiles.tenant_id IS 'References the tenant this user belongs to. For B2B users, this is their organization. For B2C/C2C, this is their vision-specific tenant.';

-- Promote existing user to super_admin (replace with actual user ID)
-- UPDATE profiles SET role = 'super_admin' WHERE id = 'YOUR_USER_ID_HERE';
