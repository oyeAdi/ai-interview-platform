-- ============================================
-- 1. PROMPT TEMPLATES (Intelligence Quick Win)
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    category TEXT NOT NULL,
    variant TEXT NOT NULL,
    template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]',
    generation_config JSONB NOT NULL DEFAULT '{}',
    knobs JSONB NOT NULL DEFAULT '{}',
    author TEXT NOT NULL DEFAULT 'system',
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_category_variant ON prompt_templates(category, variant);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompt_templates(status);

-- ============================================
-- 2. LEARNING REPOSITORY (System IQ)
-- ============================================

CREATE TABLE IF NOT EXISTS learning_repository (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_id TEXT UNIQUE NOT NULL,
    pattern TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    confidence_score FLOAT DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    frequency INTEGER DEFAULT 1,
    applicable_to TEXT[] DEFAULT '{}',
    decision_context TEXT,
    impact_on_confidence FLOAT DEFAULT 0.0,
    source_sessions UUID[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_category_confidence ON learning_repository(category, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_learning_tags ON learning_repository USING GIN (tags);

-- ============================================
-- 3. INITIAL SEED DATA
-- ============================================

-- Seed typical prompt for question generation
INSERT INTO prompt_templates (id, name, category, variant, template, variables, generation_config, knobs)
VALUES (
  'architect_generate_questions_v1',
  'Architect - Personalized Questions',
  'question_generation',
  'personalized',
  'You are an expert technical interviewer. Generate {total_questions} questions for a {seniority} {role}.\n\nContext:\n{jd_text}\n\nLearnings:\n{learning_context}',
  '[{"name": "total_questions", "type": "int"}, {"name": "seniority", "type": "string"}, {"name": "role", "type": "string"}, {"name": "jd_text", "type": "string"}, {"name": "learning_context", "type": "string"}]',
  '{"temperature": 0.7, "max_output_tokens": 1024}',
  '{"truncate_jd_length": 2000}'
) ON CONFLICT (id) DO NOTHING;

-- Seed analytics language prompt
INSERT INTO prompt_templates (id, name, category, variant, template, variables, generation_config, knobs)
VALUES (
  'question_generation_analyze_language_v1',
  'Analyze Language',
  'question_generation',
  'analyze_language',
  'Analyze the following job description and resume to determine which programming language is primarily required for this role.\n\nJob Description:\n{jd_text}\n\nResume:\n{resume_text}\n\nBased on the job requirements and the candidate''s experience, determine if this role requires primarily Java or Python skills.\n\nRespond with ONLY one word: either "Java" or "Python".',
  '[{"name": "jd_text", "type": "string", "max_length": 3000}, {"name": "resume_text", "type": "string", "max_length": 3000}]',
  '{"temperature": 0.1, "max_output_tokens": 10}',
  '{"output_format": "text"}'
) ON CONFLICT (id) DO NOTHING;

-- Seed initial learnings
INSERT INTO learning_repository (learning_id, pattern, category, subcategory, confidence_score, frequency, applicable_to, tags)
VALUES 
('plan_001', 'Experts prefer practical coding exercises over theoretical questions', 'planning', 'question_design', 0.92, 23, ARRAY['PlannerAgent', 'ArchitectAgent'], ARRAY['coding', 'practical']),
('exec_001', 'Provide hints after 2 minutes of silence, not immediately', 'execution', 'hint_giving', 0.88, 18, ARRAY['ExecutorAgent', 'SwarmCoordinator'], ARRAY['hints', 'timing'])
ON CONFLICT (learning_id) DO NOTHING;
