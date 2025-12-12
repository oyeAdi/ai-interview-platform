# How to Start the Servers

## Option 1: Using Batch Files (Easiest)

### Backend:
Double-click `run_backend.bat` or run in terminal:
```bash
run_backend.bat
```

### Frontend:
Double-click `run_frontend.bat` or run in terminal:
```bash
run_frontend.bat
```

## Option 2: Manual Start

### Backend (Terminal 1):
```powershell
cd C:\Users\aditya_raj\Documents\intelliJ-workspace\cursor-code
$env:PYTHONPATH="C:\Users\aditya_raj\Documents\intelliJ-workspace\cursor-code"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Terminal 2):
```powershell
cd C:\Users\aditya_raj\Documents\intelliJ-workspace\cursor-code\frontend
npm run dev
```

## Verify Servers Are Running

1. **Backend**: Open `http://localhost:8000` - should see `{"message": "AI Interviewer API"}`
2. **Frontend**: Open `http://localhost:3000` - should see landing page

## Troubleshooting

If servers don't start:
1. Check if ports 8000 and 3000 are already in use
2. Make sure all dependencies are installed
3. Check for error messages in the terminal

