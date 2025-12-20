-- Migration: 004_seed_personas.sql
-- Description: Seeds the initial persona tenants for B2B, B2C, and C2C visions.

-- 0. FIX SCHEMA: Add 'type' column if missing from 001
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='tenants' AND COLUMN_NAME='type') THEN
        ALTER TABLE tenants ADD COLUMN type TEXT;
    END IF;
END $$;

-- 1. B2B: Enterprise Hub
INSERT INTO tenants (name, slug, type, domain, settings, subscription_tier) VALUES
  ('Google TA', 'google', 'b2b_enterprise', 'google.com', '{"industry": "Tech", "branding": {"primary_color": "#4285F4"}}', 'enterprise')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, settings = EXCLUDED.settings;

-- 2. B2C: Expert Studio
INSERT INTO tenants (name, slug, type, settings, subscription_tier) VALUES
  ('System Design Coach', 'system-design-coach', 'b2c_platform', '{"expert_type": "Technical", "focus": "Architecture"}', 'professional'),
  ('Tech Interview Mock-Up Expert', 'mock-interview-pro', 'b2c_platform', '{"expert_type": "Technical", "focus": "Interviews"}', 'professional')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, settings = EXCLUDED.settings;

-- 3. C2C: Private Circle
INSERT INTO tenants (name, slug, type, settings, subscription_tier) VALUES
  ('Guardian Nanny Circle', 'nanny-circle', 'c2c_marketplace', '{"safe_hiring": true, "context": "Home"}', 'standard'),
  ('Private Home Tutor', 'home-tutor', 'c2c_marketplace', '{"safe_hiring": true, "context": "Education"}', 'standard')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, settings = EXCLUDED.settings;
