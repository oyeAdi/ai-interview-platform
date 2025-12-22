"""
Verification test for Architect Agent.
"""

import uuid
from services.agents.architect_agent import get_architect_agent
from services.event_store import get_event_store

def test_architect():
    architect = get_architect_agent()
    event_store = get_event_store()
    
    session_id = str(uuid.uuid4())
    print(f"Testing Architect Agent for session: {session_id}")
    
    resume_text = "Experienced Java developer with 5 years in Spring Boot and Microservices. Worked at EPAM as a Senior Engineer."
    required_skills = ["Java", "Spring Boot", "AWS"]
    
    print("Generating personalized question...")
    question = architect.generate_initial_question(
        session_id=session_id,
        jd_id=None,
        resume_text=resume_text,
        required_skills=required_skills,
        experience_level="senior",
        position_title="Senior Java Developer"
    )
    
    print(f"\nArchitect's Question: {question['text']}")
    print(f"Agent: {question.get('agent')}")
    
    # Verify event was emitted
    events = event_store.get_events(session_id)
    print(f"\nEvents in store ({len(events)}):")
    for e in events:
        print(f"- {e['event_type']}: {json.dumps(e['event_data'], indent=2) if hasattr(e, 'event_data') else e.get('event_data')}")
        
    if any(e['event_type'] == "QuestionAsked" for e in events):
        print("\nSUCCESS: Architect Agent correctly emitted QuestionAsked event.")
    else:
        print("\nFAILURE: QuestionAsked event not found in Event Store.")

if __name__ == "__main__":
    import json
    test_architect()
