-- Migration: 003_auth_and_profiles.sql
-- Description: Integrates Supabase Auth with application profiles and multi-tenant memberships.
-- Supports: B2B (Organizations), B2C (Personal/Shared), C2C (Guest/Dynamic)

-- ============================================================================
-- 1. PROFILES TABLE (Extends auth.users)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE, -- Used for B2C: hire.swarmhire.ai/username
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  bio TEXT,
  preferred_vision TEXT CHECK (preferred_vision IN ('B2B', 'B2C', 'C2C')), -- Enforces Clean Walls
  metadata JSONB DEFAULT '{}',
  is_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================================================
-- 2. TENANT MEMBERSHIPS
-- ============================================================================
CREATE TABLE tenant_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, profile_id)
);

CREATE INDEX idx_membership_profile ON tenant_memberships(profile_id);
CREATE INDEX idx_membership_tenant ON tenant_memberships(tenant_id);

-- Enable RLS on membership
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Membership Policies
CREATE POLICY "Users can view their own memberships"
  ON tenant_memberships FOR SELECT
  USING (auth.uid() = profile_id);

-- ============================================================================
-- 3. GUEST ACCESS (C2C Vision)
-- ============================================================================
-- Used for dynamic URLs like swarmhire.ai/v/[session-id]
CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  email TEXT, -- Optional, for identity verification
  access_token TEXT UNIQUE NOT NULL, -- High-entropy token for the link
  expires_at TIMESTAMPTZ NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE, -- Set after Magic Link OTP
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guest_session_token ON guest_sessions(access_token);

-- ============================================================================
-- 4. TRIGGERS & FUNCTIONS
-- ============================================================================

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, preferred_vision, role, tenant_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'preferred_vision', 'B2B'),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    (new.raw_user_meta_data->>'tenant_id')::UUID
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. RLS UPDATES FOR OTHER TABLES
-- ============================================================================
-- We need to update existing RLS to use the authenticated user's tenant memberships

-- This function helps check if a user belongs to a tenant
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE profile_id = auth.uid() AND tenant_id = t_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Users table policies (if using the users table from universal schema)
-- Note: profiles replaces the need for a separate 'users' table in some architectures,
-- but we'll keep 'users' for now if it's integrated with legacy logic.
-- Ideally, we migrate 'users' data to 'profiles'.
