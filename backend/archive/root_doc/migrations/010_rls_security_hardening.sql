-- Migration: 010_rls_security_hardening.sql
-- Description: Fixes security vulnerabilities (RLS, search_path) and type mismatches.

-- 1. Fix Profiles Type Mismatch
-- Change tenant_id to TEXT to support 'global' and other text-based tenant slugs
ALTER TABLE public.profiles ALTER COLUMN tenant_id TYPE TEXT;

-- 2. Enable Row Level Security (RLS) on all core tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Fix Function Search Paths (Security Hardening)
-- This prevents search_path injection attacks

ALTER FUNCTION public.set_tenant_context(tenant_id uuid) SET search_path = public;
ALTER FUNCTION public.get_current_tenant() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.user_belongs_to_tenant(t_id uuid) SET search_path = public, auth;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;

-- 4. Create RLS Policies

-- 4a. Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins have full access to profiles" ON public.profiles;
CREATE POLICY "Super admins have full access to profiles" 
ON public.profiles FOR ALL 
USING (is_super_admin = true);

-- 4b. Tenants Policies
DROP POLICY IF EXISTS "Super admins manage tenants" ON public.tenants;
CREATE POLICY "Super admins manage tenants" 
ON public.tenants FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

DROP POLICY IF EXISTS "Users view their own tenant" ON public.tenants;
CREATE POLICY "Users view their own tenant" 
ON public.tenants FOR SELECT 
USING (id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4c. Accounts Policies
DROP POLICY IF EXISTS "Tenant admins manage accounts" ON public.accounts;
CREATE POLICY "Tenant admins manage accounts" 
ON public.accounts FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role = 'tenant_admin')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- 4d. Positions Policies
DROP POLICY IF EXISTS "Managed accounts position access" ON public.positions;
CREATE POLICY "Managed accounts position access" 
ON public.positions FOR ALL 
USING (
  account_id = ANY (SELECT unnest(managed_accounts) FROM public.profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- 4e. Audit Log Policies
DROP POLICY IF EXISTS "Only super admins view audit logs" ON public.admin_audit_log;
CREATE POLICY "Only super admins view audit logs" 
ON public.admin_audit_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- 5. Helper Function for Account IDs (fixing the UUID/TEXT ambiguity if any)
-- Ensure 'global' is handled correctly in RLS logic above.
