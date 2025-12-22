"""Migration script for SwarmHire Intelligence Layer."""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

try:
    from supabase_config import supabase_admin
    print("Supabase admin client initialized.")
except ImportError as e:
    print(f"Error importing supabase_config: {e}")
    sys.exit(1)

MIGRATION_SQL = """
-- 1. PROMPT TEMPLATES
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

-- 2. LEARNING REPOSITORY
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
"""

SEED_SQL = """
-- Seed logic here
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

INSERT INTO learning_repository (learning_id, pattern, category, subcategory, confidence_score, frequency, applicable_to, tags)
VALUES 
('plan_001', 'Experts prefer practical coding exercises over theoretical questions', 'planning', 'question_design', 0.92, 23, ARRAY['PlannerAgent', 'ArchitectAgent'], ARRAY['coding', 'practical']),
('exec_001', 'Provide hints after 2 minutes of silence, not immediately', 'execution', 'hint_giving', 0.88, 18, ARRAY['ExecutorAgent', 'SwarmCoordinator'], ARRAY['hints', 'timing'])
ON CONFLICT (learning_id) DO NOTHING;
"""

def apply_migration():
    print("Applying table migrations...")
    # Supabase Python client doesn't have a direct 'execute_sql' for arbitrary DDL in standard way via 'table'
    # We use PostgreSQL raw execution if available, or we use the 'rpc' if a function exists.
    # Alternatively, we can use the postgrest 'rpc' if we created one.
    
    # Since we don't have a direct raw SQL executor in the client by default without custom setup, 
    # and MCP is failing, I'll try to use the client to upsert data which might imply table exists.
    # Actually, the best way is to use psycopg2 if I have it, or just use the management API?
    
    # Let's try to run a simple select to see if it works
    try:
        # Check if table exists by trying a select
        supabase_admin.table('prompt_templates').select('count', count='exact').limit(0).execute()
        print("Tables already exist.")
    except Exception:
        print("Tables might be missing. Attempting to create via RPC if exists...")
        # If the user has an 'exec_sql' RPC (common in Supabase setups)
        try:
             supabase_admin.rpc('exec_sql', {'sql': MIGRATION_SQL + SEED_SQL}).execute()
             print("Migration applied via RPC.")
        except Exception as e:
             print(f"Could not apply migration: {e}")
             print("Falling back to data-first approach: trying to insert into possibly missing tables.")
             # This will fail if table missing. 
             # I'll suggest the user to apply the SQL in Supabase dashboard if I can't do it here.
             sys.exit(1)

if __name__ == "__main__":
    apply_migration()
