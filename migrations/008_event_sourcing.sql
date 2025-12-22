-- ============================================
-- 1. EVENT STORE (Write Side - Immutable)
-- ============================================

CREATE TABLE IF NOT EXISTS interview_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    event_metadata JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    sequence_number INTEGER NOT NULL,
    
    -- Ensure events are ordered and unique per session
    UNIQUE(session_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_events_session_seq ON interview_events(session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_events_type ON interview_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON interview_events(occurred_at);

-- ============================================
-- 2. PROJECTIONS (Read Side - Mutable)
-- ============================================

-- Projection 1: Current Session State (for real-time dashboard)
CREATE TABLE IF NOT EXISTS session_state_projection (
    session_id UUID PRIMARY KEY,
    current_state TEXT DEFAULT 'initialized', -- 'started', 'questioning', 'evaluating', 'completed'
    current_phase TEXT, -- 'intro', 'coding', 'system_design', 'behavioral'
    current_question_id TEXT,
    questions_asked INTEGER DEFAULT 0,
    time_elapsed_seconds INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Denormalized data for fast reads
    candidate_name TEXT,
    position_title TEXT,
    expert_name TEXT,
    detected_language TEXT
);

-- Projection 2: Question-Answer Pairs (for results generation)
CREATE TABLE IF NOT EXISTS qa_projection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    question_number INTEGER,
    question_text TEXT,
    question_category TEXT,
    answer_text TEXT,
    score INTEGER,
    evaluation_reasoning TEXT,
    asked_at TIMESTAMPTZ,
    answered_at TIMESTAMPTZ,
    
    UNIQUE(session_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_qa_session ON qa_projection(session_id);

-- Projection 3: Performance Metrics (Real-time Gauge)
CREATE TABLE IF NOT EXISTS performance_projection (
    session_id UUID PRIMARY KEY,
    overall_score FLOAT DEFAULT 0.0,
    category_scores JSONB DEFAULT '{}', -- {coding: 85, system_design: 78}
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    recommendation TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projection 4: Learning Events (Live Feed Source)
CREATE TABLE IF NOT EXISTS learning_projection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    learning_type TEXT, -- 'critic_correction', 'hitl_feedback', 'observer_insight'
    learning_data JSONB,
    extracted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_proj_session ON learning_projection(session_id);
