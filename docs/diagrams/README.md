# AI Interview Platform - Architecture Diagrams

This folder contains architecture diagrams for the AI Interview Platform.

## Diagrams

### System Overview
```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        UI[Web UI]
        Admin[Admin Dashboard]
        Candidate[Candidate View]
    end
    
    subgraph Backend["Backend (FastAPI)"]
        API[REST API]
        WS[WebSocket Server]
        IC[Interview Controller]
        Eval[Evaluator]
        QM[Question Manager]
        FB[Feedback Agent]
    end
    
    subgraph LLM["LLM Layer"]
        Gemini[Gemini API]
    end
    
    subgraph Storage["Data Storage"]
        Sessions[(interview_sessions.json)]
        QBank[(question_bank.json)]
        Wiki[(wiki.json)]
        Results[(candidate_results/)]
    end
    
    UI --> API
    Admin --> WS
    Candidate --> WS
    
    API --> IC
    WS --> IC
    IC --> Eval
    IC --> QM
    IC --> FB
    
    Eval --> Gemini
    FB --> Gemini
    QM --> Gemini
    
    IC --> Sessions
    QM --> QBank
    API --> Wiki
    IC --> Results
```

### Interview Flow Sequence
```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant G as Gemini AI
    participant C as Candidate
    
    A->>F: Start Interview (Quick Start)
    F->>B: POST /api/interviews/quick-start
    B->>B: Create session
    B-->>F: session_id + links
    F-->>A: Show admin dashboard
    
    C->>F: Open candidate link
    F->>B: WebSocket connect
    B->>B: Load first question
    B-->>C: send_question
    B-->>A: sync_question
    
    loop Each Question
        C->>B: submit_answer
        B->>G: Evaluate response
        G-->>B: score + follow-up
        B->>B: Store evaluation
        B-->>A: sync_answer + score
        alt Expert Mode ON
            A->>B: approve_question / override
        end
        B-->>C: send_question (follow-up)
    end
    
    A->>B: end_interview
    B->>B: Save results
    B-->>A: Interview complete
    B-->>C: Interview complete
```

### Data Flow
```mermaid
flowchart LR
    subgraph Input
        QS[Quick Start Form]
        QB[Question Bank]
    end
    
    subgraph Processing
        SM[Session Manager]
        QM[Question Manager]
        EV[Evaluator]
        LLM[Gemini Client]
    end
    
    subgraph Output
        RS[Results JSON]
        FB[Feedback Report]
        SH[Shareable Link]
    end
    
    QS --> SM
    QB --> QM
    SM --> QM
    QM --> EV
    EV --> LLM
    LLM --> EV
    EV --> RS
    RS --> FB
    FB --> SH
```

### Component Architecture
```mermaid
graph TD
    subgraph Frontend Components
        HD[Header]
        FT[Footer]
        AD[AdminDashboard]
        CV[CandidateView]
        RH[ResultsHistory]
        SM[ShareModal]
        WW[WikiWidget]
    end
    
    subgraph Pages
        HP[Home Page]
        IP[Interview Page]
        RP[Results Page]
        WP[Wiki Page]
        SP[Share Page]
    end
    
    HP --> HD
    HP --> FT
    IP --> AD
    IP --> CV
    RP --> RH
    RP --> SM
    WP --> WW
    SP --> RH
```

## File Locations

| Diagram | Description |
|---------|-------------|
| System Overview | High-level component architecture |
| Interview Flow | Step-by-step sequence diagram |
| Data Flow | How data moves through the system |
| Component Architecture | Frontend component hierarchy |

## Rendering

These diagrams use [Mermaid](https://mermaid.js.org/) syntax and can be rendered:
- In GitHub/GitLab README files
- In VS Code with Mermaid extension
- On the Wiki page (planned feature)
- At [mermaid.live](https://mermaid.live/)
