# Production WebSocket Hotfix Implementation Plan

## Problem Statement

**Production Status**: BROKEN  
**Error**: asyncio and WebSocket errors  
**Production Commit**: `e4e2f2c` (master)  
**Fix Branch**: `fix/websocket-session-restoration` (created from earlier commit)

## Current Situation

1. **Production (master)** is at commit `e4e2f2c`
2. **fix/websocket** branch has the fix but is way behind master
3. **verify-axg-found-changes** has all recent work (Global Learning Repository, etc.)
4. **chore/save-axg-work** also has improvements made after `e4e2f2c`

## Strategy

Create a **NEW hotfix branch** from master and manually apply ONLY the WebSocket fix.

---

## Proposed Changes

### Step 0: Verify Current Master State (CRITICAL FIRST STEP)

**Before creating hotfix, we MUST verify**:

1. **Check local master vs remote production**
```bash
git checkout master
git status
git log --oneline -5
git diff origin/master  # Check if there are unpushed changes
```

2. **Test if WebSocket issue exists in current master**
```bash
cd backend
python main.py
# In another terminal, test WebSocket connection
```

3. **Document the exact error**
- What is the error message?
- When does it occur?
- Can we reproduce it locally?

**Why this is critical**:
- Master might have unpushed changes that already fix the issue
- Master might have changes from chore/save-axg-work or other branches
- We need to know the EXACT current state before creating hotfix

**Expected outcomes**:
- ✅ If issue exists: Proceed with hotfix
- ✅ If issue doesn't exist: Master already has fix, just need to push
- ⚠️ If master has unpushed changes: Review and test those first

### Step 1: Create Hotfix Branch

```bash
git checkout master
git checkout -b hotfix/websocket-production
```

### Step 2: Analyze the WebSocket Fix

**Files to examine from fix/websocket branch**:
1. `backend/websocket/connection_manager.py`
2. `backend/websocket/message_handler.py`  
3. `backend/main.py` (WebSocket endpoint)

**Current connection_manager.py** (in our branch):
- Has admin/candidate separation
- Has error handling in send methods
- Removes disconnected connections

**Need to check**:
- What was the asyncio error?
- What was the WebSocket error?
- What specific fix was applied?

### Step 3: Identify Specific Fix

**Common WebSocket/asyncio issues**:
1. **Missing `await`** - async functions not awaited
2. **Connection not closed properly** - causes asyncio errors
3. **Session restoration** - WebSocket reconnection handling
4. **Error handling** - unhandled exceptions in async code

**Action**: Compare these files between:
- `e4e2f2c` (master/production)
- `fix/websocket-session-restoration` (has fix)

### Step 4: Apply Fix to Hotfix Branch

**Likely fixes needed**:

#### A. Connection Manager (`backend/websocket/connection_manager.py`)
```python
# Ensure proper async/await
async def connect(self, websocket: WebSocket, view: str):
    await websocket.accept()  # Must be awaited
    
# Proper error handling
async def send_to_candidate(self, message: Dict):
    disconnected = set()
    for connection in self.candidate_connections:
        try:
            await connection.send_json(message)
        except Exception as e:
            # Log the error
            disconnected.add(connection)
    
    # Clean up disconnected
    for conn in disconnected:
        self.candidate_connections.discard(conn)
```

#### B. Main.py WebSocket Endpoint
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, view: str = "candidate"):
    await manager.connect(websocket, view)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle message
            await handler.handle_message(data, websocket, view)
    except WebSocketDisconnect:
        manager.disconnect(websocket, view)
    except Exception as e:
        # Log error
        manager.disconnect(websocket, view)
```

#### C. Session Restoration
```python
# Ensure session is restored on reconnect
async def handle_reconnect(session_id: str, websocket: WebSocket):
    # Load session from SSOT
    session = load_session(session_id)
    if session:
        # Send current state to client
        await websocket.send_json({
            "type": "session_restored",
            "session": session
        })
```

### Step 5: Files to Modify

1. **backend/websocket/connection_manager.py**
   - Add proper error logging
   - Ensure async/await correctness
   - Add session tracking

2. **backend/websocket/message_handler.py**
   - Add session restoration logic
   - Handle reconnection properly
   - Add error recovery

3. **backend/main.py**
   - Fix WebSocket endpoint error handling
   - Add proper disconnect handling
   - Add session restoration endpoint

---

## Verification Plan

### Automated Tests

**1. Backend Server Startup**
```bash
cd backend
python main.py
```
**Expected**: Server starts without errors on port 8000

**2. WebSocket Connection Test**
```bash
# In Python console
import asyncio
import websockets

async def test_connection():
    uri = "ws://localhost:8000/ws?view=candidate"
    async with websockets.connect(uri) as websocket:
        print("Connected!")
        await websocket.send('{"type": "ping"}')
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(test_connection())
```
**Expected**: Connection successful, no asyncio errors

**3. Session Restoration Test**
```bash
# Start interview
# Disconnect
# Reconnect with same session_id
# Verify session state is restored
```

### Manual Testing (User to perform)

**Test 1: Basic Interview Flow**
1. Start backend server
2. Start frontend server
3. Create new interview
4. Verify WebSocket connection (check browser console)
5. Ask a question
6. Verify question appears in both admin and candidate views

**Test 2: Session Restoration**
1. Start interview
2. Refresh browser (simulates disconnect/reconnect)
3. Verify session continues from where it left off
4. No asyncio errors in backend logs

**Test 3: Multiple Connections**
1. Open admin view in one browser
2. Open candidate view in another browser
3. Verify both receive appropriate messages
4. No connection errors

---

## Deployment Plan

### Step 1: Test Locally
- Run all verification tests
- Ensure no errors

### Step 2: Create PR
- Push `hotfix/websocket-production` branch
- Create PR to master
- User reviews and approves

### Step 3: Deploy to Production
- Merge to master
- Deploy to production server
- Monitor for errors

---

## Rollback Plan

If hotfix causes issues:
```bash
git revert <hotfix-commit>
git push origin master
```

---

## Next Steps

1. **Checkout master** and create hotfix branch
2. **Examine fix/websocket** branch files carefully
3. **Identify exact changes** needed
4. **Apply fixes** to hotfix branch
5. **Test thoroughly**
6. **Deploy to production**

---

## Questions for User

1. What is the exact error message from production?
2. When does the error occur (on connect, disconnect, or during session)?
3. Are there any backend logs we can review?

This information will help identify the exact fix needed.
