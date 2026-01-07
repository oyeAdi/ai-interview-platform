# SwarmHire - SIMPLIFIED Core Concept

## 🎯 What It Really Is

**A multi-tenant AI interview platform that matches DEMAND with SUPPLY**

That's it. Nothing more.

---

## 🔄 The Simple Model

```
┌─────────────────────────────────────────────────┐
│                   DEMAND                         │
│  (Someone needs talent)                          │
│                                                  │
│  • Job Description (JD)                         │
│  • Requirements                                  │
│  • Skills needed                                 │
└─────────────────────────────────────────────────┘
                       │
                       │ AI Interview
                       ▼
┌─────────────────────────────────────────────────┐
│              6-AGENT SWARM                       │
│                                                  │
│  1. Strategy  → Plans interview                 │
│  2. Executioner → Asks questions                │
│  3. Evaluator → Scores responses                │
│  4. Observer → Watches for issues               │
│  5. Critique → Provides feedback                │
│  6. Monitor → Logs everything                   │
└─────────────────────────────────────────────────┘
                       │
                       │ Decision
                       ▼
┌─────────────────────────────────────────────────┐
│                   SUPPLY                         │
│  (Someone has talent)                            │
│                                                  │
│  • Candidate profile                            │
│  • Resume (optional)                            │
│  • Interview responses                          │
│                                                  │
│  Result: DEAL ✅ or NO DEAL ❌                  │
└─────────────────────────────────────────────────┘
```

---

## ✨ Core Features (Only These)

1. **Multi-Tenancy**
   - Organizations can create accounts
   - Data is isolated
   - Simple and secure

2. **Job Posting (Demand)**
   - Post JD
   - Define requirements
   - Get shareable link

3. **Candidate Application (Supply)**
   - Click link
   - Start interview
   - AI evaluates

4. **AI Interview**
   - 6 agents work together
   - Adaptive conversation
   - Natural flow (no forced rounds)

5. **Quick-Start (Free)**
   - Try without signup
   - See how it works
   - Then decide

6. **Results**
   - Deal or No Deal
   - Feedback for candidate
   - Report for recruiter

---

## 🚫 What We DON'T Have

- ❌ B2B/B2C/C2C nonsense
- ❌ 11-agent complexity
- ❌ Fixed 3-round structure
- ❌ Over-engineered landing page
- ❌ Vision-specific features
- ❌ Marketing fluff

---

## 👥 User Types (Simplified)

### 1. Recruiter (Creates Demand)
- Posts jobs
- Reviews candidates
- Makes hiring decisions

### 2. Candidate (Provides Supply)
- Takes interviews
- Gets feedback
- Gets hired (or not)

### 3. Super Admin
- Manages tenants
- System oversight
- That's it

---

## 🎨 UI (Simplified)

### Pages We Keep
1. **Landing** - Simple hero + quick-start
2. **Dashboard** - Job listings
3. **Interview** - AI conversation
4. **Super Admin** - Tenant management

### Pages We Remove
- Vision selection
- Business model pages
- Complex wizards
- Everything else

---

## 🤖 6-Agent Architecture

### 1. Strategy Agent
**Role**: The Brain  
**Does**: Analyzes JD, plans interview, designs question flow  
**Combines**: Analyst + Planner + Architect

### 2. Executioner Agent
**Role**: The Interviewer  
**Does**: Asks questions, presents challenges, drives conversation  
**Combines**: Question Generator + Conversation Driver

### 3. Evaluator Agent
**Role**: The Judge  
**Does**: Scores responses, assesses quality, makes final decision  
**Combines**: Evaluator + Decision Maker

### 4. Observer Agent
**Role**: The Watchdog  
**Does**: Detects plagiarism, monitors behavior, flags issues  
**Combines**: Plagiarism Detector + Behavior Monitor

### 5. Critique Agent
**Role**: The Coach  
**Does**: Provides feedback, generates follow-ups, ensures quality  
**Combines**: Follow-up Generator + Quality Assurance

### 6. Monitor Agent
**Role**: The Recorder  
**Does**: Logs everything, tracks time, watches state  
**Combines**: Interpreter + Logger + Watcher

---

## 📊 Data Model (Simplified)

```sql
-- Core tables only
tenants        → Organizations
profiles       → Users
jobs           → Demand (JD + requirements)
candidates     → Supply (people + resumes)
interviews     → AI conversations
decisions      → Deal or No Deal
```

---

## 🚀 User Journey

### Recruiter
```
1. Sign up
2. Post job (JD + requirements)
3. Get shareable link
4. Share with candidates
5. AI interviews them
6. Review results
7. Hire
```

### Candidate
```
1. Get link
2. (Optional) Try quick-start
3. Start interview
4. Talk to AI
5. Get feedback
6. Wait for decision
```

---

## 🎯 The Goal

**Make it so simple that**:
- A recruiter can post a job in 2 minutes
- A candidate can interview in 10 minutes
- The AI makes a decision in real-time
- Everyone understands what's happening

---

## 💡 Why This Works

**Before**: "We're a B2B/B2C/C2C universal platform with 11 agents and 3 rounds..."  
**After**: "We match jobs with candidates using AI interviews."

Simple. Clear. Focused.

---

**This is SwarmHire. Nothing more, nothing less.**
