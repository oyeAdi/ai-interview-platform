# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
**Expected**: Server running on `http://localhost:8000`

### Step 2: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
**Expected**: Server running on `http://localhost:3000`

### Step 3: Test Landing Page
1. Open `http://localhost:3000`
2. You should see the landing page with orange/black theme
3. Try uploading a JD and Resume (or use textarea)

---

## 🧪 Quick Test Checklist

### ✅ Basic Checks (Do These First)
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Landing page loads
- [ ] Can see "AI Interviewer" title in orange

### ✅ Candidate View Test
1. Upload JD + Resume
2. Click "Start Interview"
3. Should redirect to interview page
4. Wait for first question to appear
5. Type an answer and submit
6. Should see follow-up question

### ✅ Admin View Test
1. Copy the interview URL
2. Change `view=candidate` to `view=admin`
3. Should see two panels:
   - Left: Candidate preview
   - Right: Admin dashboard with scores

---

## 🔍 Where to Check for Issues

### Backend Issues
- Check terminal where `python main.py` is running
- Look for error messages
- Check `backend/logs/log.json` exists

### Frontend Issues
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Check WebSocket connection in Network → WS

### WebSocket Issues
- In DevTools → Network → WS tab
- Should see `ws://localhost:8000/ws?view=candidate` or `?view=admin`
- Status should be "101 Switching Protocols"

---

## 📞 Test Results Format

When reporting test results, use this format:

```
✅ Level X.Y - Feature Name
- Tested: [what you did]
- Result: Working / Not Working
- Issues: [if any]
```

Example:
```
✅ Level 3.1 - Candidate View Page Loads
- Tested: Opened candidate URL
- Result: Working
- Issues: None
```

---

## 🎯 Start Testing Now!

1. **First**: Complete Level 1 (Basic Setup)
2. **Then**: Complete Level 2 (Landing Page)
3. **Critical**: Complete Level 3 (Candidate View) ⚠️
4. **Critical**: Complete Level 4 (Admin View) ⚠️
5. **After**: Continue with remaining levels

**Report back after each level!**


