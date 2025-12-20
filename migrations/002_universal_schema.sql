-- SwarmHire Universal Database Schema
-- Supports ANY hiring role with extensible architecture
-- MVP: Software Engineering (20 sub-roles)
-- Future: 100+ roles across 12 categories

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE MULTI-TENANCY
-- ============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('b2b_enterprise', 'b2c_platform', 'c2c_marketplace')),
  domain TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Seed EPAM (MVP demo tenant)
INSERT INTO tenants (name, slug, type, domain) VALUES
  ('EPAM Systems', 'epam', 'b2b_enterprise', 'epam.com');

-- ============================================================================
-- UNIVERSAL ROLE SYSTEM
-- ============================================================================

-- Role Categories (Extensible - add new categories anytime)
CREATE TABLE role_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- "Software Engineering"
  slug TEXT UNIQUE NOT NULL, -- "software_engineering"
  description TEXT,
  icon TEXT, -- For UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial category
INSERT INTO role_categories (name, slug, description) VALUES
  ('Software Engineering', 'software_engineering', 'All software development roles');

-- Role Templates (100+ eventually, start with 20 SWE roles)
CREATE TABLE role_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES role_categories(id),
  
  -- Role details
  name TEXT NOT NULL, -- "Backend Engineer - Python"
  slug TEXT UNIQUE NOT NULL, -- "backend_engineer_python"
  description TEXT,
  subcategory TEXT, -- "backend", "frontend", "fullstack"
  
  -- Assessment configuration
  assessment_modules JSONB DEFAULT '[]', -- ["coding_challenge", "system_design"]
  scoring_criteria JSONB DEFAULT '{}', -- {"code_quality": 0.3, "problem_solving": 0.3}
  
  -- Agent configuration
  agent_config JSONB DEFAULT '{}', -- Domain-specific agent settings
  
  -- Tenant customization
  tenant_id UUID REFERENCES tenants(id), -- NULL = global template
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_templates_category ON role_templates(category_id);
CREATE INDEX idx_role_templates_slug ON role_templates(slug);

-- Seed Software Engineering roles (Java Backend + React Frontend)
INSERT INTO role_templates (category_id, name, slug, subcategory, assessment_modules, scoring_criteria) VALUES
  (
    (SELECT id FROM role_categories WHERE slug = 'software_engineering'),
    'Backend Engineer - Java',
    'backend_engineer_java',
    'backend',
    '["problem_solving", "conceptual", "system_design", "communication", "code_review"]',
    '{"problem_solving": 0.30, "conceptual": 0.25, "system_design": 0.20, "communication": 0.15, "code_review": 0.10}'
  ),
  (
    (SELECT id FROM role_categories WHERE slug = 'software_engineering'),
    'Frontend Engineer - React',
    'frontend_engineer_react',
    'frontend',
    '["problem_solving", "conceptual", "communication", "code_review"]',
    '{"problem_solving": 0.35, "conceptual": 0.25, "communication": 0.25, "code_review": 0.15}'
  );

-- ============================================================================
-- ASSESSMENT MODULES (Multi-modal)
-- ============================================================================

CREATE TABLE assessment_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- "Coding Challenge"
  slug TEXT UNIQUE NOT NULL, -- "coding_challenge"
  description TEXT,
  
  -- Input/Output types
  input_type TEXT NOT NULL, -- "code", "video", "file", "text", "presentation"
  evaluation_method TEXT NOT NULL, -- "automated", "human", "hybrid"
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed assessment modules (5 core types for Software Engineering)
INSERT INTO assessment_modules (name, slug, input_type, evaluation_method, config) VALUES
  (
    'Problem Solving',
    'problem_solving',
    'code',
    'hybrid',
    '{"timing": "sync", "interaction": "interactive", "description": "Live coding challenges testing algorithmic thinking and problem-solving skills"}'
  ),
  (
    'Conceptual Knowledge',
    'conceptual',
    'text',
    'hybrid',
    '{"timing": "sync", "interaction": "interactive", "description": "Theoretical questions on fundamentals, design patterns, and core concepts"}'
  ),
  (
    'Communication Skills',
    'communication',
    'text',
    'hybrid',
    '{"timing": "sync", "interaction": "interactive", "description": "Behavioral questions and soft skills assessment"}'
  ),
  (
    'System Design',
    'system_design',
    'whiteboard',
    'hybrid',
    '{"timing": "sync", "interaction": "interactive", "description": "Architecture design and scalability scenarios for senior roles"}'
  ),
  (
    'Code Review',
    'code_review',
    'code',
    'hybrid',
    '{"timing": "async", "interaction": "one-way", "description": "Review existing code, identify bugs and suggest improvements"}'
  );

-- ============================================================================
-- DYNAMIC AGENT SYSTEM
-- ============================================================================

CREATE TABLE domain_knowledge_bases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL, -- "software_engineering"
  
  -- Knowledge source
  vector_db_url TEXT, -- RAG/vector DB endpoint
  knowledge_config JSONB DEFAULT '{}',
  
  -- Agent prompts
  analyst_prompt TEXT,
  planner_prompt TEXT,
  architect_prompt TEXT,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed software engineering domain
INSERT INTO domain_knowledge_bases (domain, analyst_prompt, planner_prompt, architect_prompt) VALUES
  (
    'software_engineering',
    'You are an expert technical recruiter analyzing software engineering candidates...',
    'You are designing an interview strategy for software engineering roles...',
    'You are creating technical interview questions for software engineers...'
  );

-- ============================================================================
-- USERS & PERSONAS
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('interviewer', 'hiring_manager', 'company_admin', 'candidate')),
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tenant data"
  ON users FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- JOB DESCRIPTIONS
-- ============================================================================

CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  
  -- Role template link
  role_template_id UUID REFERENCES role_templates(id),
  
  -- JD content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  skills JSONB,
  
  -- Analyst output
  analyst_output JSONB,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jd_tenant_id ON job_descriptions(tenant_id);
CREATE INDEX idx_jd_role_template ON job_descriptions(role_template_id);

ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INTERVIEWS
-- ============================================================================

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  jd_id UUID REFERENCES job_descriptions(id),
  candidate_id UUID REFERENCES users(id),
  expert_id UUID REFERENCES users(id),
  
  -- Interview state
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Agent outputs
  planner_strategy JSONB,
  questions JSONB,
  transcript JSONB[],
  
  -- Scores
  final_scores JSONB,
  critique_feedback JSONB,
  
  -- HITL
  hitl_events JSONB[],
  
  -- Observer
  observer_events JSONB[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_tenant_id ON interviews(tenant_id);
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INTERVIEW ARTIFACTS (Multi-modal)
-- ============================================================================

CREATE TABLE interview_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Artifact type
  artifact_type TEXT CHECK (artifact_type IN (
    'code_submission',
    'portfolio_file',
    'video_recording',
    'audio_recording',
    'document',
    'presentation',
    'design_mockup',
    'whiteboard_diagram'
  )),
  
  -- File details
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size_bytes INTEGER,
  
  -- AI analysis
  ai_analysis JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artifacts_interview_id ON interview_artifacts(interview_id);

ALTER TABLE interview_artifacts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- QUESTIONS
-- ============================================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT,
  
  -- Response
  answer_text TEXT,
  answer_timestamp TIMESTAMPTZ,
  
  -- Scoring
  evaluator_score INTEGER CHECK (evaluator_score BETWEEN 0 AND 10),
  final_score INTEGER CHECK (final_score BETWEEN 0 AND 10),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_interview_id ON questions(interview_id);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AGENT LOGS
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
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_interview_id ON agent_logs(interview_id);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jd_updated_at BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_templates_updated_at BEFORE UPDATE ON role_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
