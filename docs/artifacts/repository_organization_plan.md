# Repository Organization Plan

## Current Problem

The repository root has **29 files** scattered, making it difficult to find anything:
- Demo scripts mixed with logs
- Old strategy plans mixed with current docs
- Temp files everywhere
- Master backup files in root
- Multiple log files (log.json, log_2.json, log_3.json)

## Proposed Structure

```
cursor-code/
├── README.md (keep)
├── QUICK_START.md (keep)
├── .gitignore (keep)
├── .cursorrules (keep)
├── run_backend.bat (keep)
├── run_frontend.bat (keep)
│
├── backend/ (already organized)
├── frontend/ (already organized)
├── dashboards/ (already organized)
│
├── scripts/ ✨ NEW
│   ├── demos/
│   │   ├── demo_planner_agent.py
│   │   ├── demo_executor_agent.py
│   │   └── demo_evaluator_agent.py
│   └── utils/
│       └── verify_logic.py
│
├── logs/ ✨ NEW
│   ├── log.json
│   ├── log_2.json
│   └── log_3.json
│
├── docs/ (reorganize)
│   ├── README.md (index of all docs)
│   ├── setup/
│   │   ├── RENDER_SETUP.md
│   │   └── RENDER_MCP_SETUP.md
│   ├── planning/
│   │   ├── BACKLOG.md
│   │   ├── BACKLOG_ARCHIVE.md
│   │   ├── TESTING_CHECKLIST.md
│   │   └── WIKI_INDEX_CATEGORIES.md
│   ├── implementation/
│   │   ├── IMPLEMENTATION_SUMMARY.md
│   │   └── ISSUE-1-prompt-microservice.md
│   ├── archived_plans/ (move old strategy plans)
│   │   ├── strategy_selection_plan.md
│   │   └── strategy_selection_plan_old.md
│   ├── artifacts/ (already exists)
│   └── design/ (already exists)
│
├── archived/ (reorganize)
│   ├── old_files/ ✨ NEW
│   │   ├── master_AdminDashboard.tsx
│   │   ├── master_CandidateView.tsx
│   │   ├── planning_demo.html
│   │   └── deatiled feedback.png
│   ├── debug_docs/ (already exists)
│   └── simulations/ (already exists)
│
└── temp/ ✨ NEW (gitignored)
    └── temp_table_functions.js
```

## Files to Move

### To `scripts/demos/`:
- demo_planner_agent.py
- demo_executor_agent.py
- demo_evaluator_agent.py

### To `scripts/utils/`:
- verify_logic.py

### To `logs/`:
- log.json
- log_2.json
- log_3.json

### To `docs/setup/`:
- RENDER_SETUP.md
- RENDER_MCP_SETUP.md

### To `docs/planning/`:
- BACKLOG.md
- BACKLOG_ARCHIVE.md
- TESTING_CHECKLIST.md
- WIKI_INDEX_CATEGORIES.md

### To `docs/implementation/`:
- IMPLEMENTATION_SUMMARY.md
- ISSUE-1-prompt-microservice.md

### To `docs/archived_plans/`:
- strategy_selection_plan.md
- strategy_selection_plan_old.md

### To `archived/old_files/`:
- master_AdminDashboard.tsx
- master_CandidateView.tsx
- planning_demo.html
- deatiled feedback.png
- epam_logo_light.svg

### To `temp/` (will be gitignored):
- temp_table_functions.js

## Implementation Steps

1. Create new directories
2. Move files using `git mv` (preserves history)
3. Update .gitignore for temp/
4. Create README.md in docs/ as index
5. Commit changes

## Benefits

✅ **Easy Navigation**: Logical grouping of related files
✅ **Clean Root**: Only essential files in root
✅ **Better Discoverability**: Know where to find things
✅ **Scalable**: Easy to add new files in right place
✅ **Professional**: Industry-standard structure

## Root Directory After Cleanup

```
cursor-code/
├── README.md
├── QUICK_START.md
├── .gitignore
├── .cursorrules
├── run_backend.bat
├── run_frontend.bat
├── backend/
├── frontend/
├── dashboards/
├── scripts/
├── logs/
├── docs/
├── archived/
└── temp/
```

**From 29 files → 6 files in root!** 🎉
