-- SwarmHire Database Schema Migration
-- Multi-Tenant Architecture with Row-Level Security
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TENANTS TABLE (Companies: EPAM, Google)
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'enterprise',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Seed EPAM and Google
INSERT INTO tenants (name, slug, domain, subscription_tier) VALUES
  ('EPAM Systems', 'epam', 'epam.com', 'enterprise'),
  ('Google', 'google', 'google.com', 'enterprise');

-- ============================================================================
-- 2. USERS TABLE (3 Personas: Expert, Candidate, Company Admin)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('expert', 'candidate', 'company_admin')),
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email',
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Enable Row-Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see users from their tenant
CREATE POLICY "Users can view own tenant users"
  ON users FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 3. JOB DESCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  skills JSONB,
  seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'lead', 'principal')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  analyst_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jd_tenant_id ON job_descriptions(tenant_id);
CREATE INDEX idx_jd_status ON job_descriptions(status);

ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "JDs visible to tenant users"
  ON job_descriptions FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 4. RESUMES TABLE
-- ============================================================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  parsed_data JSONB,
  skills JSONB,
  experience_years INTEGER,
  analyst_output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_tenant_id ON resumes(tenant_id);
CREATE INDEX idx_resumes_candidate_id ON resumes(candidate_id);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resumes visible to tenant users"
  ON resumes FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 5. INTERVIEWS TABLE
-- ============================================================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  jd_id UUID REFERENCES job_descriptions(id),
  candidate_id UUID REFERENCES users(id),
  expert_id UUID REFERENCES users(id),
  
  -- Interview metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Agent outputs
  planner_strategy JSONB,
  questions JSONB,
  transcript JSONB[],
  
  -- Scores
  real_time_scores JSONB[],
  final_scores JSONB,
  critique_feedback JSONB,
  
  -- HITL
  hitl_approvals JSONB[],
  hitl_edits JSONB[],
  
  -- Observer learning
  observer_events JSONB[],
  
  -- Guardian violations
  guardian_violations JSONB[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_tenant_id ON interviews(tenant_id);
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_expert_id ON interviews(expert_id);
CREATE INDEX idx_interviews_status ON interviews(status);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interviews visible to tenant users"
  ON interviews FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 6. QUESTIONS TABLE
-- ============================================================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT,
  context JSONB,
  
  -- Candidate response
  answer_text TEXT,
  answer_timestamp TIMESTAMPTZ,
  response_time_seconds INTEGER,
  
  -- Scoring
  evaluator_score INTEGER CHECK (evaluator_score BETWEEN 0 AND 10),
  evaluator_confidence TEXT CHECK (evaluator_confidence IN ('high', 'medium', 'low')),
  critique_feedback TEXT,
  hitl_override_score INTEGER CHECK (hitl_override_score BETWEEN 0 AND 10),
  final_score INTEGER CHECK (final_score BETWEEN 0 AND 10),
  
  -- Follow-ups
  triggered_followup BOOLEAN DEFAULT FALSE,
  followup_reason TEXT,
  parent_question_id UUID REFERENCES questions(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_interview_id ON questions(interview_id);
CREATE INDEX idx_questions_tenant_id ON questions(tenant_id);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions visible to tenant users"
  ON questions FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 7. AGENT LOGS TABLE
-- ============================================================================
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id),
  
  agent_name TEXT NOT NULL,
  action TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  execution_time_ms INTEGER,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_tenant_id ON agent_logs(tenant_id);
CREATE INDEX idx_agent_logs_interview_id ON agent_logs(interview_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent logs visible to tenant users"
  ON agent_logs FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 8. HITL EVENTS TABLE
-- ============================================================================
CREATE TABLE hitl_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id),
  expert_id UUID REFERENCES users(id),
  
  event_type TEXT NOT NULL CHECK (event_type IN ('approve', 'edit', 'reject')),
  agent_name TEXT NOT NULL,
  original_output JSONB,
  edited_output JSONB,
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hitl_events_tenant_id ON hitl_events(tenant_id);
CREATE INDEX idx_hitl_events_interview_id ON hitl_events(interview_id);
CREATE INDEX idx_hitl_events_expert_id ON hitl_events(expert_id);

ALTER TABLE hitl_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HITL events visible to tenant users"
  ON hitl_events FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- 9. OBSERVER LEARNING EVENTS TABLE
-- ============================================================================
CREATE TABLE observer_learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id),
  
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('critique_criticism', 'hitl_edit', 'hitl_override')),
  context JSONB,
  learning_pattern TEXT,
  applied_to_future BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observer_events_tenant_id ON observer_learning_events(tenant_id);
CREATE INDEX idx_observer_events_interview_id ON observer_learning_events(interview_id);

ALTER TABLE observer_learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Observer events visible to tenant users"
  ON observer_learning_events FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE)::UUID;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jd_updated_at BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tenants
SELECT * FROM tenants;

-- Check table counts
SELECT 
  'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'job_descriptions', COUNT(*) FROM job_descriptions
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'agent_logs', COUNT(*) FROM agent_logs
UNION ALL
SELECT 'hitl_events', COUNT(*) FROM hitl_events
UNION ALL
SELECT 'observer_learning_events', COUNT(*) FROM observer_learning_events;
