# Project Backlog

## ~~🐛 Bugs~~ ✅ FIXED
- ~~[x] **Wiki Answer Not Sticky** - The wiki question and answer disappears upon page refresh and does not persist. It should remain sticky/persisted.~~

## High Priority
- [ ] **Database Transition (Scalability & Maintainability)**
  - **Goal:** Move from flat file JSON structure (`/models/*.json`) to a proper Database (PostgreSQL/SQLAlchemy).
  - Design schema, handle migration of existing data, and update repositories.

- [ ] **Admin Authentication** (Post-MVP)
  - Implement login/protection for the Feedback page.

## Strategic Roadmap
- [ ] **Strategy Selection & Execution**
  - Ref: `strategy_selection_plan.md`
  - Implementation of the "Grand Plan" core features.

- [ ] **RBAC (Role-Based Access Control)**
  - Define roles (Admin, Interviewer, Viewer).
  - Enforce permissions across API endpoints.

## Cheating Control Measures (Modular)
> **Goal:** Plug-and-play architecture for cheating detection & prevention.

- [ ] **Pre-Interview Disclaimer & Instructions Page**
- [ ] **Full-Screen Mode Enforcement**
- [ ] **Browser Tab/Window Switch Detection**
- [ ] **Modular Proctoring Interface** (webcam, clipboard, idle)

## Prompt Microservice Architecture (Strangler Fig Pattern)
> **Goal:** Extract system prompts into a modular, versioned microservice.

### ~~Phase 1: Design Prompt Service~~ ✅ DELIVERED
- ~~[x] Design API contract, define prompt structure `{id, name, version, template, variables}`~~
- ~~[x] Categories: `question_generation`, `evaluation`, `feedback`, `followup`~~
- ~~[x] Implement `backend/prompts/` module with `PromptService`, models, 12 JSON templates~~
- [ ] **Review & Approval**: Validate extracted prompts match original behavior
  - [ ] Review [models.py](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/backend/prompts/models.py)
  - [ ] Review [prompt_service.py](file:///c:/Users/aditya_raj/Documents/intelliJ-workspace/cursor-code/backend/prompts/prompt_service.py)
  - [ ] Spot-check template JSONs in `prompts/templates/`

### Phase 2: Build Prompt Library
- [ ] Audit all LLM calls, extract to versioned library with A/B testing, rollback

### Phase 3: Strangler Fig Integration
- [ ] PromptClient wrapper, shadow mode, gradual cutover

## ~~Wiki & Documentation Expansion~~ ✅ DELIVERED
> ~~**Goal:** Exhaustive knowledge base with >90% cache hit rate.~~

- ~~[x] **Comprehensive Wiki Entries** - 89 entries with semantic search~~
- ~~[x] **Semantic Index v3.0** - 38 synonyms, 21 shortforms, 16 patterns~~
- ~~[x] **Wiki UI Enhancements** - Pagination, sort, semantic index panel~~
- ~~[x] **Architecture Diagrams Folder** (`/docs/diagrams/README.md`)~~
  - ~~System Overview, Interview Flow, Data Flow, Component diagrams~~
  - ~~Mermaid format, renders in GitHub/VS Code~~
  - ~~[x] **DeepWiki Logic** - Interactive Diagrams in Wiki & `/docs` page~~

