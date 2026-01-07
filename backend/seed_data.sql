-- Seed data for SwarmHire Supabase Database
-- Run this in Supabase SQL Editor
-- All users will have password: Test@1234

-- ============================================
-- 1. INSERT TENANTS
-- ============================================
INSERT INTO tenants (name, slug, subscription_tier, is_active)
VALUES 
    ('Acme Corporation', 'acme-corp', 'enterprise', true),
    ('TechStart Inc', 'techstart', 'professional', true),
    ('Global Solutions Ltd', 'global-solutions', 'basic', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. INSERT ACCOUNTS
-- ============================================
INSERT INTO accounts (name, tenant_id, is_active)
SELECT 
    'Engineering Department',
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    true
WHERE EXISTS (SELECT 1 FROM tenants WHERE slug = 'acme-corp')
ON CONFLICT DO NOTHING;

INSERT INTO accounts (name, tenant_id, is_active)
SELECT 
    'Product Team',
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    true
WHERE EXISTS (SELECT 1 FROM tenants WHERE slug = 'acme-corp')
ON CONFLICT DO NOTHING;

INSERT INTO accounts (name, tenant_id, is_active)
SELECT 
    'Sales Division',
    (SELECT id FROM tenants WHERE slug = 'techstart'),
    true
WHERE EXISTS (SELECT 1 FROM tenants WHERE slug = 'techstart')
ON CONFLICT DO NOTHING;

INSERT INTO accounts (name, tenant_id, is_active)
SELECT 
    'Marketing Department',
    (SELECT id FROM tenants WHERE slug = 'techstart'),
    true
WHERE EXISTS (SELECT 1 FROM tenants WHERE slug = 'techstart')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INSERT POSITIONS
-- ============================================
INSERT INTO positions (title, account_id, tenant_id, description, status)
SELECT 
    'Senior Full Stack Engineer',
    (SELECT id FROM accounts WHERE name = 'Engineering Department' LIMIT 1),
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    'Looking for an experienced full-stack engineer to join our team',
    'active'
WHERE EXISTS (SELECT 1 FROM accounts WHERE name = 'Engineering Department')
ON CONFLICT DO NOTHING;

INSERT INTO positions (title, account_id, tenant_id, description, status)
SELECT 
    'Frontend Developer',
    (SELECT id FROM accounts WHERE name = 'Engineering Department' LIMIT 1),
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    'Frontend developer with React expertise',
    'active'
WHERE EXISTS (SELECT 1 FROM accounts WHERE name = 'Engineering Department')
ON CONFLICT DO NOTHING;

INSERT INTO positions (title, account_id, tenant_id, description, status)
SELECT 
    'Product Manager',
    (SELECT id FROM accounts WHERE name = 'Product Team' LIMIT 1),
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    'Experienced PM to lead product initiatives',
    'active'
WHERE EXISTS (SELECT 1 FROM accounts WHERE name = 'Product Team')
ON CONFLICT DO NOTHING;

INSERT INTO positions (title, account_id, tenant_id, description, status)
SELECT 
    'Sales Representative',
    (SELECT id FROM accounts WHERE name = 'Sales Division' LIMIT 1),
    (SELECT id FROM tenants WHERE slug = 'techstart'),
    'B2B sales professional',
    'active'
WHERE EXISTS (SELECT 1 FROM accounts WHERE name = 'Sales Division')
ON CONFLICT DO NOTHING;

INSERT INTO positions (title, account_id, tenant_id, description, status)
SELECT 
    'DevOps Engineer',
    (SELECT id FROM accounts WHERE name = 'Engineering Department' LIMIT 1),
    (SELECT id FROM tenants WHERE slug = 'acme-corp'),
    'DevOps engineer with Kubernetes experience',
    'closed'
WHERE EXISTS (SELECT 1 FROM accounts WHERE name = 'Engineering Department')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. VERIFY DATA
-- ============================================
SELECT 'Tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'Accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions;

-- ============================================
-- MANUAL STEPS FOR AUTH USERS
-- ============================================
/*
⚠️  IMPORTANT: Create these users manually in Supabase Dashboard:
   Go to: Authentication > Users > Add User

   Password for ALL users: Test@1234

   Users to create:
   1. super.admin@swarmhire.com (Super Admin)
   2. admin@acme.com (Acme Admin)
   3. recruiter@acme.com (Acme Recruiter)
   4. hiring.manager@acme.com (Acme Hiring Manager)
   5. admin@techstart.com (TechStart Admin)
   6. recruiter@techstart.com (TechStart Recruiter)

   After creating auth users, update their profiles:
*/

-- Update profiles after auth users are created
-- Run this AFTER creating the auth users above

-- Super Admin
UPDATE profiles 
SET 
    full_name = 'Super Admin',
    role = 'SUPER_ADMIN',
    is_super_admin = true,
    tenant_id = NULL
WHERE email = 'super.admin@swarmhire.com';

-- Acme Corp Admin
UPDATE profiles 
SET 
    full_name = 'Alice Admin',
    role = 'ADMIN',
    is_super_admin = false,
    tenant_id = (SELECT id FROM tenants WHERE slug = 'acme-corp')
WHERE email = 'admin@acme.com';

-- Acme Corp Recruiter
UPDATE profiles 
SET 
    full_name = 'Bob Recruiter',
    role = 'RECRUITER',
    is_super_admin = false,
    tenant_id = (SELECT id FROM tenants WHERE slug = 'acme-corp')
WHERE email = 'recruiter@acme.com';

-- Acme Corp Hiring Manager
UPDATE profiles 
SET 
    full_name = 'Carol Manager',
    role = 'HIRING_MANAGER',
    is_super_admin = false,
    tenant_id = (SELECT id FROM tenants WHERE slug = 'acme-corp')
WHERE email = 'hiring.manager@acme.com';

-- TechStart Admin
UPDATE profiles 
SET 
    full_name = 'David Admin',
    role = 'ADMIN',
    is_super_admin = false,
    tenant_id = (SELECT id FROM tenants WHERE slug = 'techstart')
WHERE email = 'admin@techstart.com';

-- TechStart Recruiter
UPDATE profiles 
SET 
    full_name = 'Eve Recruiter',
    role = 'RECRUITER',
    is_super_admin = false,
    tenant_id = (SELECT id FROM tenants WHERE slug = 'techstart')
WHERE email = 'recruiter@techstart.com';
