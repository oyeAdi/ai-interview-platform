# SwarmHire - System Architecture

High-level overview of how everything fits together.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │ Landing  │  │Dashboard │  │  Interview UI      │   │
│  │  Page    │  │          │  │  (CandidateView)   │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
│                                        │                 │
│                                        │ WebSocket       │
└────────────────────────────────────────┼─────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (FastAPI + Python)                  │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  REST API        │  │  WebSocket Handler       │   │
│  │  - Auth          │  │  - Real-time messages    │   │
│  │  - CRUD          │  │  - Interview flow        │   │
│  └──────────────────┘  └──────────────────────────┘   │
│                                        │                 │
│                                        ▼                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │         6-Agent Swarm Orchestrator              │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │Agent 1 │ │Agent 2 │ │Agent 3 │ │  ...   │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Database (Supabase PostgreSQL)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Tenants  │  │  Users   │  │Interviews│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  Row-Level Security (RLS) for Multi-Tenancy            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. Frontend (Next.js 14)
**Location**: `/frontend`

**Responsibilities**:
- User interface rendering
- Client-side routing
- WebSocket client for real-time updates
- State management
- Authentication UI

**Key Files**:
- `src/app/page.tsx` - Landing page
- `src/app/interview/` - Interview interface
- `src/components/CandidateView.tsx` - Main interview UI
- `src/app/super-admin/` - Admin dashboard

### 2. Backend (FastAPI)
**Location**: `/backend`

**Responsibilities**:
- REST API endpoints
- WebSocket server
- Business logic
- Database operations
- Agent orchestration

**Key Files**:
- `main.py` - FastAPI app entry point
- `core/interview_controller.py` - Interview logic
- `websocket/message_handler.py` - WebSocket handling
- `agents/` - 11-agent swarm

### 3. Database (Supabase)
**Technology**: PostgreSQL with Row-Level Security

**Responsibilities**:
- Data persistence
- Multi-tenant isolation
- Authentication
- Real-time subscriptions

**Key Tables**:
- `tenants` - Multi-tenant organizations
- `profiles` - User profiles
- `accounts` - Business entities
- `interviews` - Interview sessions
- `interview_messages` - Chat history

---

## 🔄 Data Flow

### Interview Flow
```
1. User starts interview
   ↓
2. Frontend sends WebSocket connection
   ↓
3. Backend creates interview session
   ↓
4. Swarm Orchestrator initializes 11 agents
   ↓
5. Round 1: Conceptual Questions
   - Agent asks question
   - Candidate responds
   - Agent evaluates
   - Repeat 2-3 times
   ↓
6. Round 2: Coding Challenge
   - Agent presents LeetCode-style problem
   - Candidate codes in Monaco editor
   - Agent evaluates code
   ↓
7. Round 3: System Design
   - Agent asks design question
   - Candidate explains architecture
   - Agent evaluates
   ↓
8. Generate final summary
   ↓
9. Store results in database
```

### Authentication Flow
```
1. User signs up/logs in
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token issued
   ↓
4. Middleware checks tenant access
   ↓
5. RLS policies enforce data isolation
   ↓
6. User accesses tenant-specific data
```

---

## 🏢 Multi-Tenancy Architecture

### Tenant Isolation
- **Database Level**: Row-Level Security (RLS) policies
- **Application Level**: Middleware checks tenant_id
- **URL Level**: `/[tenant]/...` routing

### Tenant Types
1. **B2B (Enterprise Hub)**
   - Corporate hiring at scale
   - Multiple users per tenant
   - Custom role templates

2. **B2C (Expert Studio)**
   - Individual coaches/experts
   - Monetized lab packages
   - Personal review queue

3. **C2C (Private Circle)**
   - Personal hiring (nannies, roommates)
   - Privacy-focused
   - ID verification

---

## 🤖 11-Agent Swarm

### Agent Roles
Each agent has a specific responsibility in the interview process:

1. **Orchestrator Agent** - Coordinates other agents
2. **Question Generator** - Creates interview questions
3. **Evaluator Agent** - Assesses responses
4. **Code Analyzer** - Reviews coding solutions
5. **Plagiarism Detector** - Checks for AI-generated content
6. **Follow-up Agent** - Generates follow-up questions
7. **Summary Agent** - Creates final reports
8. **Skill Matcher** - Matches questions to skills
9. **Difficulty Adjuster** - Adapts question difficulty
10. **Time Manager** - Tracks interview timing
11. **Quality Assurance** - Ensures interview quality

### Agent Communication
- Agents communicate via message passing
- State managed by Orchestrator
- Handoffs between agents for different tasks

---

## 🔐 Security

### Authentication
- Supabase Auth (JWT tokens)
- Email/password + OAuth providers
- Session management

### Authorization
- Role-based access control (RBAC)
- Super admin vs regular users
- Tenant-level permissions

### Data Protection
- Row-Level Security (RLS)
- Encrypted connections (HTTPS/WSS)
- Environment variables for secrets

---

## 🚀 Deployment

### Frontend
- **Platform**: Vercel (recommended) or any Next.js host
- **Build**: `npm run build`
- **Environment**: `.env.local`

### Backend
- **Platform**: Railway, Render, or AWS
- **Runtime**: Python 3.10+
- **Environment**: `.env`

### Database
- **Platform**: Supabase (managed PostgreSQL)
- **Backups**: Automated daily backups
- **Scaling**: Automatic with Supabase

---

## 📊 Performance Considerations

### Frontend
- Server-side rendering (SSR) for landing page
- Client-side rendering for dashboard
- WebSocket for real-time updates
- Code splitting for faster loads

### Backend
- Async/await for concurrent operations
- Connection pooling for database
- Caching for frequently accessed data
- Rate limiting for API endpoints

### Database
- Indexes on frequently queried columns
- RLS policies optimized for performance
- Connection pooling
- Read replicas for scaling

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000

# Backend
cd backend
pip install -r requirements.txt
python main.py  # http://localhost:8000
```

---

## 📚 Technology Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React hooks
- **Editor**: Monaco Editor
- **Auth**: Supabase Auth

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **WebSocket**: FastAPI WebSockets
- **AI**: OpenAI API (for agents)
- **Database Client**: Supabase Python client

### Database
- **Database**: PostgreSQL (Supabase)
- **ORM**: Supabase client
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

---

**Last Updated**: 2025-12-31
