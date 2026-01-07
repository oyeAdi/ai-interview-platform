# SwarmHire - Project Status & Overview

**Last Updated**: 2025-12-31

## 🎯 What Is This Project?

SwarmHire is a **Universal AI Hiring Platform** that uses an 11-agent swarm architecture to conduct automated interviews for any role, any industry, any seniority level.

### Core Value Proposition
- **B2B (Enterprise Hub)**: Companies hire at scale (e.g., EPAM managing 1000s of candidates)
- **B2C (Expert Studio)**: Coaches/experts monetize their expertise
- **C2C (Private Circle)**: Personal hiring (nannies, roommates) with privacy

---

## 📊 Current Project State

### ✅ What's Working
1. **Multi-tenant architecture** with Row-Level Security (RLS)
2. **11-agent Swarm** for conducting interviews
3. **3-round interview process**:
   - Round 1: Conceptual questions
   - Round 2: Coding challenges with Monaco editor
   - Round 3: System design
4. **Real-time WebSocket** communication
5. **Landing page** with modern design
6. **Authentication** via Supabase
7. **Super-admin dashboard** for managing tenants/users/accounts

### 🚧 Known Issues
1. **Swarm sometimes gets stuck** after processing candidate input
2. **AI detection confidence** always shows 65%
3. **Coding round** - boilerplate code not always displaying in chat
4. **Question formatting** needs refinement for each round

---

## 🗂️ Project Structure

### Frontend (`/frontend`)
```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page
│   ├── super-admin/       # Super admin dashboard
│   ├── dashboard/         # Main dashboard
│   ├── interview/         # Interview interface
│   └── wiki/              # Documentation
├── components/            # Reusable components
│   ├── CandidateView.tsx  # Interview UI
│   ├── TimeMetrics.tsx    # Time tracking
│   └── admin/             # Admin components
└── utils/                 # Utilities
```

### Backend (`/backend`)
```
backend/
├── core/
│   └── interview_controller.py  # Main interview logic
├── websocket/
│   └── message_handler.py       # WebSocket handling
├── agents/                       # 11-agent swarm
└── api/                         # FastAPI endpoints
```

---

## 🎨 Design System

### Colors
- **Primary**: Orange (`#F97316` / `brand-primary`)
- **Secondary**: Purple (`#9333EA`)
- **Accent**: Black for CTAs
- **Backgrounds**: Gradient `from-white via-orange-50 to-purple-50`

### Components
- **Buttons**: Black with white text, `rounded-lg`, hover scale
- **Cards**: White with glassmorphism, subtle shadows
- **Typography**: Bold headings with gradient text effects

---

## 🔑 Key Features by Module

### 1. Interview System
- **Location**: `frontend/src/app/interview/`, `backend/core/interview_controller.py`
- **Status**: ✅ Working, needs refinement
- **Features**:
  - 3-round adaptive interviews
  - Real-time AI responses
  - Code editor integration
  - AI plagiarism detection

### 2. Multi-Tenancy
- **Location**: Database RLS policies, `backend/api/`
- **Status**: ✅ Working
- **Features**:
  - Complete data isolation per tenant
  - B2B/B2C/C2C support
  - Custom branding per tenant

### 3. Admin Dashboard
- **Location**: `frontend/src/app/super-admin/`
- **Status**: ✅ Just redesigned
- **Features**:
  - Manage tenants, users, accounts
  - Approve access requests
  - View audit logs

### 4. Landing Page
- **Location**: `frontend/src/app/page.tsx`
- **Status**: ✅ Complete
- **Features**:
  - Modern gradient design
  - Feature showcases
  - Pricing preview

---

## 📋 Development Workflow

### Making Changes
1. **Frontend changes**: Edit files in `/frontend/src/`
2. **Backend changes**: Edit files in `/backend/`
3. **Test locally**: Frontend runs on `localhost:3000`, Backend on `localhost:8000`

### Running the Project
```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
python main.py  # or your startup script
```

---

## 🐛 Bug Tracking

See [KNOWN_ISSUES.md](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/KNOWN_ISSUES.md) for detailed bug list and fixes.

---

## 📚 Documentation

- **[FEATURE_TRACKER.md](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/FEATURE_TRACKER.md)**: All features and their status
- **[ARCHITECTURE.md](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/ARCHITECTURE.md)**: System architecture overview
- **[KNOWN_ISSUES.md](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/KNOWN_ISSUES.md)**: Bugs and fixes

---

## 🎯 Next Steps (Prioritized)

1. **Fix Swarm stuck issue** - Debug `SwarmOrchestrator.py`
2. **Improve question formatting** - Refine prompts for each round
3. **Fix AI detection** - Investigate 65% confidence issue
4. **Code display bug** - Ensure boilerplate shows in chat

---

## 💡 Quick Reference

### Important Files
- **Interview Logic**: `backend/core/interview_controller.py`
- **WebSocket**: `backend/websocket/message_handler.py`
- **Candidate UI**: `frontend/src/components/CandidateView.tsx`
- **Landing Page**: `frontend/src/app/page.tsx`
- **Super Admin**: `frontend/src/app/super-admin/page.tsx`

### Environment Variables
- Check `.env.local` in frontend
- Check `.env` in backend

---

**Remember**: This is a complex project, but it's organized. Use this document as your north star. When confused, come back here.
