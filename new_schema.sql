-- NEW RBAC & MULTI-TENANT SCHEMA DESIGN

-- 0. AGGRESSIVE PURGE (Run this first in SQL Editor to clear the slate)
/*
do $$ 
declare
    r record;
begin
    -- 1. Drop all tables in public schema
    for r in (select tablename from pg_tables where schemaname = 'public') loop
        execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
    end loop;

    -- 2. Drop all views in public schema
    for r in (select viewname from pg_views where schemaname = 'public') loop
        execute 'drop view if exists public.' || quote_ident(r.viewname) || ' cascade';
    end loop;

    -- 3. Drop all custom types/enums in public schema
    for r in (select typname 
              from pg_type t 
              join pg_namespace n on n.oid = t.typnamespace 
              where n.nspname = 'public' 
              and t.typtype = 'e') loop -- 'e' for enum
        execute 'drop type if exists public.' || quote_ident(r.typname) || ' cascade';
    end loop;

    -- 4. Drop all functions in public schema (be careful not to drop built-ins)
    for r in (select proname, oidvectortypes(proargtypes) as args
              from pg_proc p
              join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public') loop
        execute 'drop function if exists public.' || quote_ident(r.proname) || '(' || r.args || ') cascade';
    end loop;

    -- OPTIONAL: Clean up Storage (uncomment if needed)
    -- delete from storage.objects;
    -- delete from storage.buckets;

    -- OPTIONAL: Clean up Auth (uncomment if needed - will log everyone out)
    -- delete from auth.users;
end $$;
*/

-- IMPORTANT: After running the purge above, run the rest of the script below to rebuild.

-- 1. ORGANIZATIONS (TENANTS)
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (USERS)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ORGANIZATION MEMBERS (RBAC)
CREATE TYPE public.org_role AS ENUM ('ADMIN', 'PROVIDER', 'MEMBER');

CREATE TABLE public.organization_members (
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.org_role NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

-- 4. REQUIREMENTS (Formerly Job Descriptions)
CREATE TABLE public.requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- NEW: Hierarchical link
    creator_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    skills TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INTERACTIONS (Formerly Interviews)
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID REFERENCES public.requirements(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.profiles(id), -- The person who initiated it
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    feedback JSONB,
    transcript_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5.5. ACCOUNTS (Hierarchical structure under Organizations)
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (org_id, name) -- Ensure account names are unique within an organization
);

-- 6. INVITES
CREATE TABLE public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.org_role NOT NULL DEFAULT 'MEMBER',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PROMPT TEMPLATES (IQ Layer)
CREATE TABLE public.prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    category TEXT NOT NULL,
    variant TEXT NOT NULL,
    template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]',
    generation_config JSONB NOT NULL DEFAULT '{}',
    knobs JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LEARNING REPOSITORY (System Growth)
CREATE TABLE public.learning_repository (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_id TEXT UNIQUE NOT NULL,
    pattern TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    frequency INTEGER DEFAULT 1,
    applicable_to TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ADMIN ACCESS REQUESTS (Super-Admin Flow)
CREATE TABLE public.admin_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. RLS POLICIES (BASIC)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_repository ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_requests ENABLE ROW LEVEL SECURITY;

-- Development Policies: Allow authenticated users to read and manage their own data
CREATE POLICY "Public Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Organizations are viewable by members" ON public.organizations FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = id AND user_id = auth.uid()) OR (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenants are viewable by everyone in development" ON public.organizations FOR SELECT USING (true);

-- 11. TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- 12. AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 13. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 14. RBAC POLICIES
-- ============================================================================

-- PROFILES: Users can view their own profile, Super Admins see all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR is_super_admin = true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ORGANIZATIONS: Members can view their organization
CREATE POLICY "Members can view own organization" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE org_id = organizations.id AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- ORGANIZATION MEMBERS: Members can see other members in the same org
CREATE POLICY "Members can view co-members" ON public.organization_members
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- ACCOUNTS: Members can view accounts in their org
CREATE POLICY "Members can view org accounts" ON public.accounts
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Admins can manage org accounts" ON public.accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE org_id = accounts.org_id AND user_id = auth.uid() AND role = 'ADMIN'
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- REQUIREMENTS: Members can view jobs in their org
CREATE POLICY "Members can view org requirements" ON public.requirements
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

CREATE POLICY "Providers can manage requirements" ON public.requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organization_members 
            WHERE org_id = requirements.org_id AND user_id = auth.uid() AND role IN ('ADMIN', 'PROVIDER')
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- INTERACTIONS: Members can view interactions in their org
CREATE POLICY "Members can view org interactions" ON public.interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.requirements r
            JOIN public.organization_members om ON om.org_id = r.org_id
            WHERE r.id = interactions.requirement_id AND om.user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
        )
    );
