-- ============================================================================
-- Migration: 009_rbac_permissions.sql
-- Description: Implement comprehensive RBAC with 5 roles
-- Roles: super_admin, tenant_admin, account_admin, HITL_expert, candidate
-- ============================================================================

-- Add RBAC fields to users/profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS tenant_id TEXT,
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS managed_accounts TEXT[] DEFAULT '{}';

-- Drop potentially misconfigured tables from previous attempts
DROP TABLE IF EXISTS user_tenant_roles CASCADE;
DROP TABLE IF EXISTS user_account_assignments CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS role_templates CASCADE;
DROP TABLE IF EXISTS role_categories CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Create tenants table with TEXT id (allows 'global')
CREATE TABLE tenants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    domain TEXT,
    subscription_tier TEXT DEFAULT 'enterprise',
    parent_tenant_id TEXT REFERENCES tenants(id),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create role_categories table
CREATE TABLE IF NOT EXISTS role_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create role_templates table
CREATE TABLE IF NOT EXISTS role_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES role_categories(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create accounts table (Client/Unit within a Tenant)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    website TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create positions table (Hiring role within an Account)
CREATE TABLE positions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
    role_template_id UUID REFERENCES role_templates(id),
    title TEXT NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_tenant_roles junction table
CREATE TABLE user_tenant_roles (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('tenant_admin', 'account_admin', 'HITL_expert', 'candidate')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

-- Create user_account_assignments for account_admin role
CREATE TABLE user_account_assignments (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'account_admin',
    can_create_positions BOOLEAN DEFAULT TRUE,
    can_manage_positions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, account_id)
);

-- Create admin_audit_log for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON profiles(is_super_admin) WHERE is_super_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user ON user_tenant_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_tenant ON user_tenant_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_account_assignments_user ON user_account_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_account_assignments_account ON user_account_assignments(account_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

-- Insert default "global" tenant for super_admin
INSERT INTO tenants (id, name, slug, description, settings)
VALUES ('global', 'Global', 'global', 'System-wide global tenant for super admins', '{"type": "system"}')
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for tenant isolation
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can see all tenants
CREATE POLICY super_admin_all_tenants ON tenants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_super_admin = TRUE
        )
    );

-- Policy: Tenant admins can see their own tenant
CREATE POLICY tenant_admin_own_tenant ON tenants
    FOR SELECT
    USING (
        id IN (
            SELECT tenant_id FROM user_tenant_roles
            WHERE user_id = auth.uid()
            AND role = 'tenant_admin'
        )
    );

-- Policy: Users can see their tenant role assignments
CREATE POLICY users_own_tenant_roles ON user_tenant_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can see their account assignments
CREATE POLICY users_own_account_assignments ON user_account_assignments
    FOR SELECT
    USING (user_id = auth.uid());

COMMENT ON TABLE tenants IS 'Multi-tenant organizations (B2B companies, studios, circles)';
COMMENT ON TABLE user_tenant_roles IS 'User role assignments within specific tenants';
COMMENT ON TABLE user_account_assignments IS 'Account-level permissions for account_admin role';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all administrative actions';
