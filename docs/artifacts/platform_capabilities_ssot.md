# Platform Capabilities - Single Source of Truth (SSOT)

**Version**: 3.0.0  
**Last Updated**: 2025-12-16  
**Purpose**: Master reference for ALL platform capabilities

---

## 🎯 Phase Configurations (PERFECTED)

### Planning Phase
**Status**: ✅ **PERFECTED** (1000+ lines)  
**File**: `backend/config/phases/planning.json`

**Comprehensive Features**:
- **Inputs**: 8 required + 4 optional (all with `reason_needed`)
  - Job description, candidate resume, interview config, round info
  - Previous rounds data, observer insights, company context
  - Pre-screen data, competency frameworks, time constraints
- **Outputs**: Detailed Session SSOT destinations
  - Interview template (WHAT to assess)
  - Interview plan (HOW to assess - guideline, not script)
  - Personalization insights (Resume-JD alignment)
  - Plan metadata with confidence scoring
- **EPAM Round Model** (TI0-TI5):
  - **TI0**: Pre-screening conversational (recruiter, 20-30 min)
  - **TI1**: Basic coding (2 simple problems, LeetCode Easy, 45-60 min)
  - **TI2**: Template-based comprehensive (Java/OOPS/Java8/DS/SQL/JUnit, 60-90 min)
  - **TI3**: Advanced depth (Spring Boot/Microservices/System Design/Cloud, 60-90 min)
  - **TI4**: Optional hiring manager/client round (30-60 min)
  - **TI5**: HR salary negotiation (20-30 min)
- **Example Simulations**: 3 scenarios (Junior/Senior/Staff)
- **Quality Enforcement**: Max 500 chars, frequently-asked, realistic questions
- **HITL Approval**: Required before execution starts

### Execution Phase
**Status**: ✅ **PERFECTED** (1320+ lines)  
**File**: `backend/config/phases/execution.json`

**Comprehensive Features**:
- **Inputs**: 14 required + 5 optional (all with `reason_needed`)
  - Interview plan, template, current question, candidate response
  - Observer insights, HITL feedback, performance trends
  - Previous rounds evaluation, critique feedback, candidate profile
  - Time pressure indicators, conversation quality metrics
- **Swarm Intelligence for Followup Strategy**:
  - 3 LLM agents with different personas (technical depth, clarity, engagement)
  - Weighted voting mechanism (weights: 0.4, 0.3, 0.3)
  - Confidence threshold: 0.6
  - Fallback strategies for low confidence/timeout/error
  - Example scenario with complete workflow
- **Question Quality Enforcement**:
  - Max 500 characters per question
  - Must be frequently-asked (verified via internet search)
  - No made-up questions (red flags detection)
  - Question format validation (single question, ends with '?')
  - Critique agent validation (min quality score: 80)
- **Tool Capabilities** (Agentic LLM):
  - Internet search for question verification
  - Question database lookup
  - Question validator (length, format, authenticity)
  - 6-step agentic workflow with max 3 iterations
- **Conversation Flow & Formatting**:
  - No blunt transitions - smooth, natural topic changes
  - Paragraph breaks (`\n\n`) for visual separation
  - Greetings/transitions separated from actual questions
  - Examples for first question, category change, followup
- **Comprehensive Fallback Strategy**:
  - 7-level safety chain (swarm → single LLM → heuristic → generation → alt models → plan question → HITL)
  - Plan availability guarantee (from planning phase HITL requirement)
  - Detailed reasoning for each fallback level

### Evaluation Phase
**Status**: ✅ **PERFECTED** (582 lines)  
**File**: `backend/config/phases/evaluation.json`

**Comprehensive Features**:
- **HITL-Centric Evaluation**: Human-in-the-loop is primary evaluator
- **LLM Scoring Frameworks**:
  - Coding questions: Correctness, efficiency, code quality, edge cases
  - Conceptual questions: Accuracy, depth, clarity, examples
  - System design: Scalability, trade-offs, components, feasibility
  - Non-coding: STAR framework, leadership competencies
- **Critique Agent Integration**: Validates evaluation quality
- **Observer Agent Integration**: Learns from HITL feedback patterns
- **Comprehensive Outputs**: Session SSOT destinations for all evaluations

---

## Supported Languages & Technologies

### Programming Languages
| Language | ID | Versions | Experience Levels | Question Categories | Status |
|----------|----|---------|--------------------|---------------------|--------|
| Python | `python` | 3.8+ | junior, mid, senior, lead, staff | coding, conceptual, system_design, debugging | ✅ Active |
| Java | `java` | 11, 17, 21 | junior, mid, senior, lead, staff | coding, conceptual, system_design, debugging | ✅ Active |
| JavaScript | `javascript` | ES6+ | junior, mid, senior, lead | coding, conceptual, debugging | ✅ Active |
| TypeScript | `typescript` | 4.x, 5.x | junior, mid, senior, lead | coding, conceptual, debugging | ✅ Active |
| Go | `go` | 1.19+ | mid, senior, lead | coding, conceptual, system_design | ✅ Active |
| Swift | `swift` | 5.x | mid, senior, lead | coding, conceptual | ✅ Active |
| Kotlin | `kotlin` | 1.8+ | junior, mid, senior | coding, conceptual | ✅ Active |
| C++ | `cpp` | C++17, C++20 | mid, senior, staff | coding, conceptual, algorithms | 📋 TODO: Add QB |
| Rust | `rust` | 1.70+ | mid, senior, staff | coding, conceptual, system_design | 📋 TODO: Add QB |
| Ruby | `ruby` | 3.x | junior, mid, senior | coding, conceptual | 📋 TODO: Add QB |

### Frameworks & Technologies
| Technology | ID | Related Language | Proficiency Levels |
|------------|----|-----------------|---------------------|
| React | `react` | JavaScript/TypeScript | beginner, intermediate, advanced, expert |
| Spring Boot | `spring` | Java | intermediate, advanced, expert |
| Node.js | `nodejs` | JavaScript | beginner, intermediate, advanced, expert |
| Django | `django` | Python | intermediate, advanced, expert |
| Flask | `flask` | Python | beginner, intermediate, advanced |
| Kubernetes | `kubernetes` | - | intermediate, advanced, expert |
| Docker | `docker` | - | beginner, intermediate, advanced, expert |
| AWS | `aws` | - | beginner, intermediate, advanced, expert |
| TensorFlow | `tensorflow` | Python | intermediate, advanced, expert |
| Spark | `spark` | Python/Java/Scala | intermediate, advanced, expert |

### Skills & Competencies
| Skill | ID | Category | Proficiency Levels |
|-------|----|-----------|---------------------|
| Coding | `coding` | Core | beginner, intermediate, advanced, expert |
| System Design | `system_design` | Core | intermediate, advanced, expert |
| Algorithms | `algorithms` | Core | beginner, intermediate, advanced, expert |
| Data Structures | `data_structures` | Core | beginner, intermediate, advanced, expert |
| Databases | `databases` | Technical | beginner, intermediate, advanced, expert |
| SQL | `sql` | Technical | beginner, intermediate, advanced, expert |
| Microservices | `microservices` | Architecture | intermediate, advanced, expert |
| Distributed Systems | `distributed_systems` | Architecture | advanced, expert |
| Security | `security` | Specialized | intermediate, advanced, expert |
| Cloud Security | `cloud_security` | Specialized | intermediate, advanced, expert |
| Machine Learning | `machine_learning` | Specialized | intermediate, advanced, expert |
| Networking | `networking` | Technical | intermediate, advanced, expert |
| Linux | `linux` | Technical | beginner, intermediate, advanced, expert |
| CI/CD | `ci_cd` | DevOps | intermediate, advanced, expert |
| Testing | `testing` | Quality | beginner, intermediate, advanced, expert |
| Leadership | `leadership` | Soft Skill | intermediate, advanced, expert |

---

## Interview Round Model (EPAM-Based)

### Round Progression
**Sequence**: TI0 → TI1 → TI2 → TI3 → TI4 (optional) → TI5

**Typical Patterns**:
- **Minimum**: TI1 + TI2 + TI5 (2 technical + 1 HR)
- **Comprehensive**: TI0 + TI1 + TI2 + TI3 + TI5 (5 rounds)

### Round Definitions

#### TI0 - Pre-Screening
- **Conducted by**: Recruiter
- **Duration**: 20-30 minutes
- **Coding**: ❌ No
- **Focus**: Resume verification, logistics, intent
- **Topics**: Notice period, relocation, salary expectations, experience overview
- **Pass Criteria**: Candidate is interested, available, resume verified

#### TI1 - Basic Coding
- **Duration**: 45-60 minutes
- **Coding**: ✅ Yes (2 simple problems)
- **Difficulty**: LeetCode Easy
- **Focus**: Basic problem-solving and coding ability
- **Examples**: Reverse string, find second largest, palindrome check
- **Pass Criteria**: Solve 1 of 2 correctly with minimal hints

#### TI2 - Comprehensive Template-Based
- **Duration**: 60-90 minutes
- **Coding**: ✅ Yes
- **Difficulty**: Medium
- **Focus**: Systematic assessment across multiple areas
- **Template Areas**:
  - Java & OOPS concepts
  - Java 8 features
  - Data Structures
  - SQL
  - JUnit/Testing
  - Coding/Problem Solving
- **Pass Criteria**: Solid understanding across majority of areas

#### TI3 - Advanced Depth
- **Duration**: 60-90 minutes
- **Coding**: Optional
- **System Design**: ✅ Required
- **Difficulty**: Hard
- **Focus**: Real-world complex scenarios, deep technical knowledge
- **Advanced Topics**:
  - Spring Boot & Spring Framework
  - Microservices Architecture
  - System Design
  - Cloud (AWS/Azure/GCP)
  - Kafka/Message Queues
  - Docker/Kubernetes
- **Pass Criteria**: Deep understanding + can architect complex solutions

#### TI4 - Hiring Manager/Client (Optional)
- **Duration**: 30-60 minutes
- **Coding**: Depends on configuration
- **Focus**: Variable (behavioral, machine round, or client-specific)
- **Configurations**:
  - Hiring manager behavioral
  - Machine round (live coding/take-home)
  - Client interview

#### TI5 - HR Round
- **Conducted by**: HR
- **Duration**: 20-30 minutes
- **Coding**: ❌ No
- **Focus**: Salary negotiation, offer details, formalities
- **Topics**: CTC, benefits, joining date, background verification
- **Pass Criteria**: Salary expectations aligned, candidate ready to join

---

## Question Categories

### Core Categories
| Category | ID | Time Allocation (minutes) | Supports Code Editor | Supports Test Cases | Difficulty Levels |
|----------|----|--------------------------|--------------------|---------------------|-------------------|
| Coding | `coding` | Per difficulty* | ✅ Yes | ✅ Yes | easy, medium, hard |
| Conceptual | `conceptual` | Per difficulty* | ❌ No | ❌ No | easy, medium, hard |
| System Design | `system_design` | Per difficulty* | ❌ No | ❌ No | medium, hard |
| Problem Solving | `problem_solving` | Per difficulty* | ✅ Optional | ❌ No | easy, medium, hard |
| Debugging | `debugging` | Per difficulty* | ✅ Yes | ✅ Yes | easy, medium, hard |

**Time Allocation by Difficulty**:
- **Easy**: 10 minutes
- **Medium**: 15 minutes
- **Hard**: 20 minutes

### Future Categories (TODO)
- Behavioral (`behavioral`) - Soft skills assessment
- Case Study (`case_study`) - Business problem solving
- Architecture Review (`architecture_review`) - Code/design review

---

## Difficulty Levels

| Level | ID | Experience Mapping | Score Threshold | Time Multiplier | Question Complexity |
|-------|----|--------------------|-----------------|-----------------|---------------------|
| Easy | `easy` | 0-2 years | 60% | 1.0x | Basic concepts, simple problems |
| Medium | `medium` | 2-5 years | 70% | 1.5x | Intermediate concepts, moderate complexity |
| Hard | `hard` | 5+ years | 75% | 2.0x | Advanced concepts, complex problems |

---

## Interview Modes

### Quick Start Mode (QSM)
**ID**: `quick_start`  
**Description**: Pre-configured interview with sensible defaults  
**Requires Expert Review**: ❌ No  
**Is Default**: ✅ Yes

**Defaults**:
```json
{
  "total_questions": 3,
  "max_followups_per_question": 10,
  "question_distribution": {
    "coding": 1,
    "conceptual": 1,
    "system_design": 1
  },
  "difficulty_distribution": {
    "easy": 0.2,
    "medium": 0.5,
    "hard": 0.3
  },
  "enable_adaptive_difficulty": true,
  "enable_dynamic_followups": true,
  "enable_expert_mode": false
}
```

**Duration Calculation**:
- Based on question categories and difficulty distribution
- Formula: `SUM(questions * time_per_difficulty)`
- Example: 1 easy (10m) + 1 medium (15m) + 1 hard (20m) = 45 minutes base
- Add buffer: 10% for transitions = ~50 minutes total

### Custom Configuration Mode (CCM)
**ID**: `custom_config`  
**Description**: Fully customizable interview configuration  
**Requires Expert Review**: ✅ Yes (Planning Phase)  
**Is Default**: ❌ No

**Configurable Parameters**:
- `total_questions` (1-10)
- `max_followups_per_question` (0-10)
- `question_distribution` (custom mix of categories)
- `difficulty_distribution` (custom percentages)
- `enable_adaptive_difficulty` (boolean)
- `enable_dynamic_followups` (boolean)
- `enable_expert_mode` (boolean)
- `custom_question_pool` (array of question IDs)
- `time_per_category` (override default timings)

---

## Followup Strategies (Swarm Intelligence)

### Strategy Selection
**Method**: Swarm Intelligence with 3 LLM agents
- **Agent 1**: Technical Depth Analyzer (weight: 0.4)
- **Agent 2**: Clarity Analyzer (weight: 0.3)
- **Agent 3**: Engagement Analyzer (weight: 0.3)
- **Voting**: Weighted majority
- **Confidence Threshold**: 0.6
- **Fallback**: Single LLM decision if confidence < 0.6

### Available Strategies
| Strategy | ID | Description | Use Cases | Max Depth |
|----------|----|-----------|-----------| ----------|
| Depth Focused | `depth_focused` | Probe deeper into same topic | Low score, incomplete answer, surface-level response | 3 levels |
| Clarification | `clarification` | Clarify ambiguous responses | Ambiguous answer, contradictory statements | 2 levels |
| Breadth Focused | `breadth_focused` | Explore related topics | High score, complete answer, demonstrate breadth | 2 levels |
| Challenge | `challenge` | Present edge cases/advanced scenarios | Very high score, senior candidate, demonstrate expertise | 2 levels |
| Move to Next Topic | `move_to_next_topic` | End current topic, move to next | Topic exhausted, time constraints | - |

---

## Evaluation Criteria

### Deterministic Scores
| Criterion | Weight | Max Score | Description |
|-----------|--------|-----------|-------------|
| Completeness | 0.20 | 100 | How complete is the answer |
| Accuracy | 0.25 | 100 | Technical correctness |
| Depth | 0.20 | 100 | Level of detail and understanding |
| Clarity | 0.15 | 100 | Communication clarity |
| Relevance | 0.20 | 100 | Relevance to question |

### LLM Evaluation
- **Enabled**: ✅ Yes
- **Weight**: 0.50 (combined with deterministic)
- **Model**: Gemini Pro
- **Confidence Threshold**: 0.70
- **Fallback**: Use deterministic only if LLM fails

---

## Multi-Agent System

### Planning Phase Agents
| Agent | Role | Responsibilities | Max Iterations |
|-------|------|------------------|----------------|
| Planner Agent | Orchestrator | Generate interview plan based on JD/Resume/Round | - |
| Critique Agent | Reviewer | Validate plan quality, suggest improvements | 1 |
| Observer Agent | Learner | Learn from HITL edits and feedback | - |

### Execution Phase Agents
| Agent | Role | Responsibilities |
|-------|------|------------------|
| Executor Agent | Orchestrator | Ask questions, generate followups, manage flow |
| Swarm Agents (3) | Strategy Selectors | Collaborative followup strategy selection |
| Critique Agent | Quality Monitor | Validate question quality before sending |
| Observer Agent | Learner | Observe and learn from HITL feedback |

### Evaluation Phase Agents
| Agent | Role | Responsibilities |
|-------|------|------------------|
| Evaluator Agent | Orchestrator | Generate comprehensive evaluation report |
| Critique Agent | Reviewer | Review and improve report quality |
| Observer Agent | Learner | Extract learnings for future interviews |

---

## Concurrency & Scalability Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Max Concurrent Interviews | 100 (start), 1M (goal) | Start conservative, scale up |
| WebSocket Connections per Session | 5 | Candidate + Admin + 3 Experts |
| Rate Limit (per IP) | 100 req/min | Prevent abuse |
| Session File Size | 500 KB | Reasonable for JSON |
| Max Questions per Interview | 10 | Keep interviews focused |
| Max Followups per Question | 10 | Prevent infinite loops |

---

## Storage & Database

### Current: File-Based (JSON)
- **Location**: `backend/data/sessions/`
- **Format**: JSON
- **Pros**: Simple, no setup, easy debugging
- **Cons**: Not scalable, no transactions, no concurrent writes

### Recommended: NoSQL Database
**Option 1: MongoDB** (Recommended)
- **Pros**: 
  - Native JSON support
  - Flexible schema (perfect for evolving SSOT)
  - Horizontal scaling
  - Good query performance
  - Rich aggregation framework
- **Cons**: 
  - Requires setup
  - Learning curve

**Option 2: PostgreSQL with JSONB**
- **Pros**:
  - ACID compliance
  - JSONB type for flexible schema
  - Powerful querying
  - Mature ecosystem
- **Cons**:
  - More rigid than MongoDB
  - Vertical scaling primarily

**Recommendation**: **MongoDB** for session storage
- Better fit for evolving schema
- Easier horizontal scaling
- Native JSON = less impedance mismatch
- Can use PostgreSQL for structured data (users, positions)

---

## Summary Statistics

- **Languages Supported**: 10 (7 active, 3 TODO)
- **Frameworks/Technologies**: 10+
- **Skills**: 20+
- **Question Categories**: 5 (3 TODO)
- **Difficulty Levels**: 3
- **Interview Modes**: 2
- **Interview Rounds**: 6 (TI0-TI5)
- **Followup Strategies**: 5 (with swarm intelligence)
- **Multi-Agent Agents**: 3 (Planning), 5 (Execution), 3 (Evaluation)
- **Max Concurrent Users**: 100 (start), 1M (goal)
- **Phase Configuration Lines**: 2,900+ (Planning: 1000+, Execution: 1320+, Evaluation: 582)

---

**Phase Configuration Status**:
1. ✅ **Planning Phase** - PERFECTED (1000+ lines)
2. ✅ **Execution Phase** - PERFECTED (1320+ lines)
3. ✅ **Evaluation Phase** - PERFECTED (582 lines)
4. ✅ **EPAM Round Model** - Implemented (TI0-TI5)
5. ✅ **Swarm Intelligence** - Implemented (3 LLM agents)
6. ✅ **Question Quality Enforcement** - Implemented (max 500 chars, frequently-asked)
7. ✅ **Tool Capabilities** - Implemented (internet search, validation)
8. ✅ **Conversation Flow** - Implemented (paragraph breaks, natural transitions)

**Next Actions**:
1. 📋 Implement `config_service.py` to load perfected phase configurations
2. 📋 Implement swarm intelligence logic for followup strategy
3. 📋 Integrate tool calling for question validation
4. 📋 Test all three phases end-to-end
5. 📋 Expand question banks for partial-coverage languages
6. 📋 Add new language support (C++, Rust, Ruby)
