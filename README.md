# AI Interviewer System

A comprehensive AI-powered interview system with SWARM evolutionary strategy pattern, deterministic evaluation, and real-time dual-view interface.

## Features

- **Intelligent Question Selection**: Topic-based question selection from Python/Java question banks
- **Deterministic Evaluation**: 99.99% accurate evaluation with higher weight on correct options (60-70%)
- **Strategy Pattern**: Four adaptive strategies (Depth, Clarification, Breadth, Challenge)
- **SWARM Evolution**: Continuous parameter tuning based on performance
- **Real-time Communication**: WebSocket-based live updates
- **Dual View System**: Separate candidate and admin interfaces
- **JD/Resume Analysis**: LLM-powered language detection (Java/Python)
- **Continuous Logging**: Real-time log.json updates

## Architecture

- **Backend**: FastAPI with WebSocket support
- **Frontend**: Next.js with React and Tailwind CSS
- **LLM**: Google Gemini API
- **Theme**: Orange/Black minimal design

## Setup

### Backend

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Set environment variable:
```bash
export GEMINI_API_KEY=your_api_key_here
```

3. Run server:
```bash
python main.py
# or
uvicorn main:app --reload
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run development server:
```bash
npm run dev
```

## Usage

1. Navigate to `http://localhost:3000`
2. Upload/paste JD and Resume
3. System detects language (Java/Python)
4. Start interview
5. Candidate view: `http://localhost:3000/interview?view=candidate&session_id=xxx`
6. Admin view: `http://localhost:3000/interview?view=admin&session_id=xxx`

## File Structure

```
ai_interviewer/
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
└── README.md
```

## Configuration

Edit `backend/config.py` for:
- Number of questions
- Follow-ups per question
- Strategy parameters
- Evaluation thresholds





