# Quick Admin View Access Guide

## 🚀 How to Access Admin View During Interview

### Method 1: Automatic Prompt (Recommended)
1. Start interview from landing page
2. After interview starts, a prompt will appear asking if you want to open Admin View
3. Click "OK" to open Admin View in a new tab

### Method 2: Manual URL
1. Start interview from landing page
2. Note the `session_id` from the URL or browser console
3. Open a new tab and navigate to:
   ```
   http://localhost:3000/interview?view=admin&session_id=YOUR_SESSION_ID&lang=python
   ```
   Replace `YOUR_SESSION_ID` with the actual session ID

### Method 3: From Browser Console
1. Open browser console (F12)
2. Type: `localStorage.getItem('current_session_id')`
3. Copy the session_id
4. Use it in the admin URL format above

### Method 4: Direct Link (After Starting)
The session_id is stored in localStorage, so you can use:
```javascript
const sessionId = localStorage.getItem('current_session_id')
const lang = localStorage.getItem('current_language')
const adminUrl = `http://localhost:3000/interview?view=admin&session_id=${sessionId}&lang=${lang}`
window.open(adminUrl, '_blank')
```

---

## 📊 What You'll See in Admin View

1. **Live Scores** - Real-time evaluation scores for each response
2. **Strategy Visualization** - Current active strategy (depth, clarification, breadth, challenge)
3. **Log Viewer** - Continuous log.json updates
4. **Progress Tracking** - Interview progress, questions answered, follow-ups remaining
5. **Session Details** - Session ID, language, timestamps

---

## 🎯 Testing Workflow

### Recommended Setup:
1. **Tab 1**: Candidate View - `http://localhost:3000/interview?view=candidate&session_id=XXX&lang=python`
2. **Tab 2**: Admin View - `http://localhost:3000/interview?view=admin&session_id=XXX&lang=python`
3. **Tab 3**: This guide + Candidate Testing Content

### Testing Steps:
1. Start interview from landing page
2. Accept prompt to open Admin View (or open manually)
3. Use responses from `CANDIDATE_TESTING_CONTENT.md`
4. Watch Admin View update in real-time as you submit responses
5. Compare candidate experience vs admin insights

---

## 🔍 Quick Tips

- **Same Session ID**: Both views must use the same `session_id`
- **Real-time Updates**: Admin view updates automatically via WebSocket
- **No Refresh Needed**: Both views stay in sync automatically
- **Test Different Profiles**: Use different response templates for different candidate types

---

## 📝 Example URLs

**Candidate View:**
```
http://localhost:3000/interview?view=candidate&session_id=abc123&lang=python
```

**Admin View:**
```
http://localhost:3000/interview?view=admin&session_id=abc123&lang=python
```

**Note**: Replace `abc123` with your actual session_id and `python` with `java` if testing Java interviews.

