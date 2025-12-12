# AI Interviewer System - Testing Checklist

## 🔑 Setup First
- [ ] Set Gemini API key (already provided)
- [ ] Install backend dependencies: `cd backend && pip install -r requirements.txt`
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Start backend: `python backend/main.py` (should run on port 8000)
- [ ] Start frontend: `cd frontend && npm run dev` (should run on port 3000)

---

## 📋 Testing Checklist (Easiest → Toughest)

### 🟢 LEVEL 1: Basic Setup & Configuration (EASIEST)

#### 1.1 Backend Server Startup
- [ ] **Test**: Start backend server
- [ ] **Expected**: Server starts on `http://localhost:8000`
- [ ] **Check**: Visit `http://localhost:8000` - should see `{"message": "AI Interviewer API"}`
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 1.2 Frontend Server Startup
- [ ] **Test**: Start frontend server
- [ ] **Expected**: Server starts on `http://localhost:3000`
- [ ] **Check**: Visit `http://localhost:3000` - should see landing page with orange/black theme
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 1.3 API Endpoints
- [ ] **Test**: Check `/api/jds` endpoint
- [ ] **Expected**: Returns JSON with list of JDs
- [ ] **Check**: Visit `http://localhost:8000/api/jds` in browser
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🟡 LEVEL 2: Landing Page Features (EASY)

#### 2.1 Landing Page Display
- [ ] **Test**: Open `http://localhost:3000`
- [ ] **Expected**: See "AI Interviewer" title, JD and Resume input sections
- [ ] **Check**: Orange/black theme, no emojis, clean design
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.2 JD Selector Dropdown
- [ ] **Test**: Check if JD dropdown loads
- [ ] **Expected**: Dropdown shows available JDs from backend
- [ ] **Check**: Select a JD - textarea should be disabled
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.3 File Upload (JD)
- [ ] **Test**: Upload a text file for JD
- [ ] **Expected**: File name appears, can remove file
- [ ] **Check**: Drag & drop or click to upload
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.4 Textarea Input (JD)
- [ ] **Test**: Type JD text in textarea
- [ ] **Expected**: Text is editable (unless JD selected)
- [ ] **Check**: Can paste and type text
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.5 File Upload (Resume)
- [ ] **Test**: Upload resume file (PDF/DOCX/TXT)
- [ ] **Expected**: File name appears
- [ ] **Check**: File uploads successfully
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.6 Textarea Input (Resume)
- [ ] **Test**: Type resume text in textarea
- [ ] **Expected**: Text is editable
- [ ] **Check**: Can paste resume content
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.7 Language Detection API
- [ ] **Test**: Submit JD + Resume, check language detection
- [ ] **Expected**: Returns `{"language": "python" | "java", "confidence": 0.95, "session_id": "..."}`
- [ ] **Check**: Console/Network tab shows API response
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 2.8 Start Interview Button
- [ ] **Test**: Click "Start Interview" with valid inputs
- [ ] **Expected**: Redirects to `/interview?view=candidate&session_id=xxx&lang=python`
- [ ] **Check**: URL changes, page navigates
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🟠 LEVEL 3: Candidate View (MODERATE) ⚠️ CRUCIAL

#### 3.1 Candidate View Page Loads
- [ ] **Test**: Open candidate view URL
- [ ] **Expected**: Interview page loads, WebSocket connects
- [ ] **Check**: No errors in browser console
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.2 WebSocket Connection (Candidate)
- [ ] **Test**: Check WebSocket connection
- [ ] **Expected**: Connection established (check browser DevTools → Network → WS)
- [ ] **Check**: WebSocket shows "connected" status
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.3 Greeting Message
- [ ] **Test**: Wait for greeting after connection
- [ ] **Expected**: "Hello! I'll be conducting your interview today. Let's begin."
- [ ] **Check**: Message appears (may be in console or displayed)
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.4 First Question Display
- [ ] **Test**: Wait for first question
- [ ] **Expected**: Question appears in QuestionCard component
- [ ] **Check**: Question text is visible, formatted correctly
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.5 Progress Bar (Candidate)
- [ ] **Test**: Check progress bar
- [ ] **Expected**: Shows "Question 1 of 3" and "0% Complete" initially
- [ ] **Check**: Progress bar visible, updates correctly
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.6 Answer Input Field
- [ ] **Test**: Type answer in textarea
- [ ] **Expected**: Text is editable, can type/paste
- [ ] **Check**: Textarea works, submit button enabled
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.7 Submit Answer
- [ ] **Test**: Type answer and click "Submit Answer"
- [ ] **Expected**: Answer sent via WebSocket, textarea clears
- [ ] **Check**: Network tab shows WebSocket message sent
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.8 No Evaluation Visible (Candidate)
- [ ] **Test**: After submitting answer
- [ ] **Expected**: NO scores, NO evaluation, NO strategy info visible
- [ ] **Check**: Only question and answer input visible
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.9 Follow-up Question Display
- [ ] **Test**: After submitting initial answer
- [ ] **Expected**: Follow-up question appears (within 2-3 seconds)
- [ ] **Check**: Question text changes, shows "Follow-up Question 1"
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.10 Progress Updates
- [ ] **Test**: After each response
- [ ] **Expected**: Progress bar updates (percentage increases)
- [ ] **Check**: Progress shows correct question number and percentage
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.11 All 3 Follow-ups
- [ ] **Test**: Answer all 3 follow-ups for first question
- [ ] **Expected**: 3 follow-up questions appear sequentially
- [ ] **Check**: Each follow-up is numbered (1, 2, 3)
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.12 Next Question Transition
- [ ] **Test**: After 3 follow-ups, wait for next question
- [ ] **Expected**: Transition message, then new question appears
- [ ] **Check**: Question changes, round number updates
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 3.13 Complete Interview Flow
- [ ] **Test**: Complete all 3 questions with follow-ups
- [ ] **Expected**: After last question, redirects to `/thanks` page
- [ ] **Check**: Thank you page appears after 2 seconds
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🔴 LEVEL 4: Admin View (MODERATE-HARD) ⚠️ CRUCIAL

#### 4.1 Admin View Page Loads
- [ ] **Test**: Open admin view URL: `/interview?view=admin&session_id=xxx&lang=python`
- [ ] **Expected**: Admin dashboard loads with two panels
- [ ] **Check**: Left panel (candidate preview), Right panel (admin dashboard)
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.2 WebSocket Connection (Admin)
- [ ] **Test**: Check WebSocket for admin
- [ ] **Expected**: Connection to admin_channel established
- [ ] **Check**: DevTools shows WebSocket connected
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.3 Candidate Preview Panel
- [ ] **Test**: Check left panel
- [ ] **Expected**: Shows what candidate sees (question, answer input)
- [ ] **Check**: Preview matches candidate view
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.4 Live Evaluation Scores (Admin)
- [ ] **Test**: After candidate submits answer
- [ ] **Expected**: LiveScores component shows all metrics
- [ ] **Check**: Factual correctness, completeness, accuracy, depth, clarity, keyword coverage
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.5 Overall Score Display
- [ ] **Test**: Check overall score
- [ ] **Expected**: Large orange number showing overall score (0-100)
- [ ] **Check**: Score updates after each response
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.6 Strategy Visualization
- [ ] **Test**: After candidate submits answer
- [ ] **Expected**: StrategyVisualization shows current strategy
- [ ] **Check**: Strategy ID, name, and parameters visible
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.7 Progress Details (Admin)
- [ ] **Test**: Check progress in admin view
- [ ] **Expected**: Shows detailed progress (round, question, follow-up numbers)
- [ ] **Check**: More detailed than candidate view
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.8 Real-time Log Viewer
- [ ] **Test**: Check LogViewer component
- [ ] **Expected**: Shows log.json data, updates in real-time
- [ ] **Check**: Can expand/collapse, see latest entries
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.9 Log Download
- [ ] **Test**: Click "Download log.json" link
- [ ] **Expected**: Downloads log.json file
- [ ] **Check**: File contains interview session data
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.10 Admin Receives All Messages
- [ ] **Test**: Monitor admin WebSocket messages
- [ ] **Expected**: Receives: question, followup, evaluation, strategy_change, log_update, progress
- [ ] **Check**: All message types arrive
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 4.11 Dual View Synchronization
- [ ] **Test**: Open both candidate and admin views simultaneously
- [ ] **Expected**: Both views show same questions, admin shows additional data
- [ ] **Check**: Questions sync, admin has extra info
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🟣 LEVEL 5: Backend Evaluation (HARD)

#### 5.1 Deterministic Evaluation - True/False
- [ ] **Test**: Submit answer with "True" for a True/False question
- [ ] **Expected**: Factual correctness = 100 if correct, 0 if wrong
- [ ] **Check**: Admin view shows correct score
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 5.2 Deterministic Evaluation - Multiple Choice
- [ ] **Test**: Submit answer with correct options (e.g., "A, C, D")
- [ ] **Expected**: Option score calculated correctly
- [ ] **Check**: Score reflects correct/incorrect selections
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 5.3 Weight Distribution
- [ ] **Test**: Check score calculation
- [ ] **Expected**: 60-70% weight on correct option, 30-40% on explanation
- [ ] **Check**: Overall score reflects weight distribution
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 5.4 Keyword Coverage
- [ ] **Test**: Answer with/without expected keywords
- [ ] **Expected**: Keyword coverage score reflects matched keywords
- [ ] **Check**: Admin shows keyword coverage percentage
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 5.5 Explanation Metrics
- [ ] **Test**: Submit detailed vs brief explanation
- [ ] **Expected**: Completeness, depth, clarity scores differ
- [ ] **Check**: All metrics calculated correctly
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🔵 LEVEL 6: Strategy System (HARD)

#### 6.1 Strategy Selection - Low Completeness
- [ ] **Test**: Submit incomplete answer (< 70% completeness)
- [ ] **Expected**: Clarification strategy selected
- [ ] **Check**: Admin shows "clarification" strategy
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 6.2 Strategy Selection - Low Depth
- [ ] **Test**: Submit answer with low depth (< 60)
- [ ] **Expected**: Depth-focused strategy selected
- [ ] **Check**: Admin shows "depth_focused" strategy
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 6.3 Strategy Selection - High Score
- [ ] **Test**: Submit excellent answer (> 90 score)
- [ ] **Expected**: Challenge strategy selected
- [ ] **Check**: Admin shows "challenge" strategy
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 6.4 Strategy Selection - Default
- [ ] **Test**: Submit average answer
- [ ] **Expected**: Breadth-focused strategy selected
- [ ] **Check**: Admin shows "breadth_focused" strategy
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 6.5 Follow-up Generation
- [ ] **Test**: After strategy selection
- [ ] **Expected**: Follow-up question matches strategy type
- [ ] **Check**: Follow-up aligns with strategy guidance
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 6.6 Strategy Adaptation
- [ ] **Test**: Multiple responses, check if strategy changes
- [ ] **Expected**: Strategy may switch between follow-ups
- [ ] **Check**: Strategy ID changes in admin view
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### 🟤 LEVEL 7: Logging & Data (MODERATE)

#### 7.1 Log File Creation
- [ ] **Test**: Check `backend/logs/log.json` after starting interview
- [ ] **Expected**: File exists, contains session data
- [ ] **Check**: JSON is valid, has interview_sessions array
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 7.2 Continuous Logging
- [ ] **Test**: Submit answer, immediately check log.json
- [ ] **Expected**: New entry appended to log
- [ ] **Check**: Response entry appears in file
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 7.3 Log Entry Structure
- [ ] **Test**: Check log entry format
- [ ] **Expected**: Contains response, evaluation, strategy_used, timestamp
- [ ] **Check**: All required fields present
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 7.4 Session Finalization
- [ ] **Test**: Complete interview, check log
- [ ] **Expected**: Session has complete data, strategy_performance updated
- [ ] **Check**: All questions and responses logged
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

### ⚫ LEVEL 8: Advanced Features (TOUGHEST)

#### 8.1 SWARM Parameter Tuning
- [ ] **Test**: Complete multiple interviews, check parameter updates
- [ ] **Expected**: Strategy parameters adjust based on performance
- [ ] **Check**: Parameters change in log.json
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 8.2 Performance Analysis
- [ ] **Test**: Check aggregate statistics in log
- [ ] **Expected**: Strategy rankings calculated
- [ ] **Check**: Performance metrics aggregated correctly
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 8.3 Context Management
- [ ] **Test**: Check context object throughout interview
- [ ] **Expected**: Context updates with each response
- [ ] **Check**: Round summaries, overall metrics updated
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 8.4 Question Selection Intelligence
- [ ] **Test**: Complete interview, check question selection
- [ ] **Expected**: Questions from different topics, no duplicates
- [ ] **Check**: Topic coverage is diverse
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 8.5 Natural Transition Messages
- [ ] **Test**: Between questions
- [ ] **Expected**: Natural transition message appears
- [ ] **Check**: Message is conversational, not generic
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

#### 8.6 Error Handling
- [ ] **Test**: Submit empty answer, invalid data, etc.
- [ ] **Expected**: Graceful error handling, user-friendly messages
- [ ] **Check**: No crashes, errors handled properly
- [ ] **Status**: ⬜ Not Tested / ✅ Working / ❌ Not Working

---

## 🎯 Testing Priority

**CRITICAL (Test First):**
1. Candidate View (Level 3) - ⚠️ CRUCIAL
2. Admin View (Level 4) - ⚠️ CRUCIAL
3. Dual View Synchronization (4.11)

**IMPORTANT (Test Second):**
4. Evaluation System (Level 5)
5. Strategy System (Level 6)
6. Logging (Level 7)

**NICE TO HAVE (Test Last):**
7. Advanced Features (Level 8)

---

## 📝 Testing Notes Template

For each test, note:
- **What you tested**: 
- **What happened**: 
- **Expected vs Actual**: 
- **Errors (if any)**: 
- **Screenshots/Logs**: 

---

## 🚨 Common Issues to Watch For

1. **WebSocket not connecting**: Check CORS, port numbers
2. **API key error**: Verify GEMINI_API_KEY is set
3. **File upload fails**: Check file size, format
4. **Questions not appearing**: Check WebSocket messages, backend logs
5. **Admin view not showing data**: Check WebSocket channel routing
6. **Evaluation scores wrong**: Check scoring algorithm, weights

---

**Start testing from Level 1 and work your way up. Report back after each level!**


