# Known Issues & Bug Tracker

Track all bugs, their priority, and resolution status.

---

## 🔴 Critical Issues (Fix ASAP)

### 1. Swarm Gets Stuck After Candidate Input
- **Status**: 🐛 Active
- **Priority**: Critical
- **Affected**: Interview flow
- **Location**: `backend/SwarmOrchestrator.py`
- **Description**: The 11-agent swarm sometimes enters a "thinking" state and doesn't respond after processing candidate input
- **Impact**: Interviews cannot proceed
- **Next Steps**:
  1. Add debug logging to SwarmOrchestrator
  2. Check for infinite loops in agent handoffs
  3. Add timeout mechanisms
  4. Review agent state management

---

## 🟠 High Priority Issues

### 2. AI Plagiarism Detection Always 65%
- **Status**: 🐛 Active
- **Priority**: High
- **Affected**: Interview evaluation
- **Location**: `backend/core/interview_controller.py`
- **Description**: AI detection confidence always returns 65% regardless of actual candidate response
- **Impact**: Cannot accurately detect AI-generated responses
- **Scenarios Checked**: Need to understand what scenarios are being analyzed
- **Next Steps**:
  1. Review AI detection logic
  2. Check if detection is actually running
  3. Verify confidence calculation
  4. Add logging for detection process

### 3. Coding Round Boilerplate Not Displaying
- **Status**: 🐛 Active
- **Priority**: High
- **Affected**: Round 2 (Coding)
- **Location**: `frontend/src/components/CandidateView.tsx`, Interview controller
- **Description**: Complete question and boilerplate code not consistently showing in chat bubble, despite being in feedback protocol
- **Impact**: Candidates don't see the full problem
- **Next Steps**:
  1. Check message formatting in backend
  2. Verify frontend parsing logic
  3. Ensure boilerplate is in correct format
  4. Add fallback display logic

---

## 🟡 Medium Priority Issues

### 4. Round 1 Question Formatting
- **Status**: 🐛 Active
- **Priority**: Medium
- **Affected**: Round 1 (Conceptual)
- **Location**: Interview controller prompts
- **Description**: Questions should be strictly conceptual, prioritize customSkills, limit follow-ups to 2-3
- **Impact**: Interview quality
- **Next Steps**:
  1. Update system prompts
  2. Add validation for question types
  3. Implement follow-up counter
  4. Test with various skill sets

### 5. Round 2 Question Format Inconsistency
- **Status**: 🐛 Active
- **Priority**: Medium
- **Affected**: Round 2 (Coding)
- **Location**: Interview controller
- **Description**: Need consistent LeetCode-style formatting (Title, Description, Examples, Constraints)
- **Impact**: User experience
- **Next Steps**:
  1. Create question template
  2. Update prompts to enforce format
  3. Add format validation
  4. Auto-generate boilerplate

### 6. Round 3 Scope Creep
- **Status**: 🐛 Active
- **Priority**: Medium
- **Affected**: Round 3 (System Design)
- **Location**: Interview controller
- **Description**: Should be strictly system design, no coding implementation requests
- **Impact**: Interview consistency
- **Next Steps**:
  1. Update system prompts
  2. Add validation to prevent code requests
  3. Focus on architecture discussions

---

## 🟢 Low Priority Issues

### 7. TypeScript Type Errors (Fixed)
- **Status**: ✅ Resolved
- **Priority**: Low
- **Affected**: Build process
- **Resolution**: Fixed indexing errors in `app/api/interview/route.ts`
- **Date Fixed**: 2025-12-25

---

## 📋 Issue Template

When adding new issues, use this format:

```markdown
### [Issue Number]. [Brief Title]
- **Status**: 🐛 Active / 🚧 In Progress / ✅ Resolved
- **Priority**: Critical / High / Medium / Low
- **Affected**: [What's affected]
- **Location**: [File paths]
- **Description**: [Detailed description]
- **Impact**: [How it affects users]
- **Next Steps**:
  1. [Action item 1]
  2. [Action item 2]
```

---

## 🔍 Debugging Tips

### For Swarm Issues
1. Check `backend/logs/` for agent traces
2. Monitor WebSocket messages in browser DevTools
3. Add breakpoints in `SwarmOrchestrator.py`
4. Check agent state transitions

### For Frontend Issues
1. Open browser DevTools Console
2. Check Network tab for API calls
3. Inspect WebSocket messages
4. Check React component state

### For Backend Issues
1. Check FastAPI logs
2. Monitor database queries
3. Check Supabase logs
4. Review error traces

---

## 📊 Issue Statistics

- **Total Issues**: 6 active
- **Critical**: 1
- **High**: 2
- **Medium**: 3
- **Low**: 0
- **Resolved**: 1

---

**Last Updated**: 2025-12-31
