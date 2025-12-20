"""
Comprehensive AI Interview Configurator
Extracts all configuration from JD in one LLM call
"""
from typing import Dict, List, Any
from llm.gemini_client import GeminiClient
import json
import re

class AIConfigurator:
    def __init__(self):
        self.llm_client = GeminiClient()
    
    def configure_interview(self, jd_text: str) -> Dict[str, Any]:
        """
        Comprehensive AI configuration from JD
        Returns all interview configuration in one call
        """
        prompt = f"""Analyze this job description and provide comprehensive interview configuration.

Job Description:
{jd_text}

Return a JSON object with:
1. interview_parameters: {{duration_minutes, experience_level, expectations, urgency}}
2. skills_categories: {{category_name: [{{name, proficiency, type}}]}}
3. interview_flow: [{{category, duration, difficulty}}]
4. sample_questions: {{category: {{difficulty: [{{q, a}}]}}}}

Rules:
- duration_minutes: 30, 45, 60, or 90
- experience_level: junior, mid, senior, or lead
- expectations: low, medium, or high
- urgency: low, medium, high, or critical (if not in JD, analyze and mark as AI-suggested)
- proficiency: basic_knowledge, comfortable, strong, or expert
- type: must_have or nice_to_have
- difficulty: easy, medium, hard, or expert
- Categories are role-specific (NOT hardcoded - e.g., HR Manager → hr_management, behavioral; Software Engineer → technical, system_design)
- 4 questions per difficulty level (16 total per category)
- Questions must be short (<200 chars)
- Include answers for AI's reference

Example for HR Manager:
{{
  "interview_parameters": {{
    "duration_minutes": 45,
    "experience_level": "senior",
    "expectations": "high",
    "urgency": "high",
    "urgency_source": "jd_text"
  }},
  "skills_categories": {{
    "hr_management": [
      {{"name": "recruitment", "proficiency": "expert", "type": "must_have"}},
      {{"name": "hr_policies", "proficiency": "strong", "type": "must_have"}}
    ],
    "behavioral": [
      {{"name": "leadership", "proficiency": "strong", "type": "must_have"}}
    ]
  }},
  "interview_flow": [
    {{"category": "hr_management", "duration": 15, "difficulty": "medium"}},
    {{"category": "behavioral", "duration": 20, "difficulty": "medium"}},
    {{"category": "situational", "duration": 10, "difficulty": "hard"}}
  ],
  "sample_questions": {{
    "hr_management": {{
      "easy": [
        {{"q": "What is the purpose of an employee handbook?", "a": "To communicate company policies and procedures"}},
        {{"q": "Define onboarding", "a": "Process of integrating new employees"}},
        {{"q": "What is a job description?", "a": "Document outlining role duties and requirements"}},
        {{"q": "What does attrition mean?", "a": "Rate at which employees leave"}}
      ],
      "medium": [
        {{"q": "How would you handle a conflict between team members?", "a": "Listen, identify root cause, facilitate resolution"}},
        {{"q": "Explain recruitment vs talent acquisition", "a": "Recruitment is reactive, talent acquisition is proactive"}},
        {{"q": "What metrics track hiring effectiveness?", "a": "Time-to-hire, cost-per-hire, quality-of-hire"}},
        {{"q": "How ensure diversity in hiring?", "a": "Structured interviews, diverse panels, blind screening"}}
      ],
      "hard": [
        {{"q": "Design a retention strategy for high performers", "a": "Career development, competitive compensation, recognition"}},
        {{"q": "How restructure a team during change?", "a": "Assess skills, align with goals, communicate transparently"}},
        {{"q": "Create a performance improvement plan", "a": "Set goals, provide coaching, document progress"}},
        {{"q": "Handle a discrimination complaint", "a": "Immediate investigation, maintain confidentiality, take action"}}
      ],
      "expert": [
        {{"q": "Design HR transformation for 500-person company", "a": "Audit current state, define future, technology roadmap"}},
        {{"q": "Build employer brand from scratch", "a": "Define EVP, testimonials, social media, career site"}},
        {{"q": "Create succession planning framework", "a": "Identify critical roles, assess talent, development plans"}},
        {{"q": "Design global compensation across 5 countries", "a": "Market benchmarking, cost adjustments, compliance"}}
      ]
    }}
  }}
}}

Return ONLY valid JSON, nothing else."""

        try:
            response = self.llm_client.model.generate_content(prompt)
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                config = json.loads(json_match.group())
                
                # Validate
                self._validate_configuration(config)
                
                return config
            
            raise ValueError("Could not parse configuration from LLM response")
            
        except Exception as e:
            print(f"Error in AI configuration: {str(e)}")
            raise
    
    def _validate_configuration(self, config: Dict[str, Any]) -> bool:
        """Validate LLM output"""
        # Check required keys
        required = ['interview_parameters', 'skills_categories', 'interview_flow', 'sample_questions']
        for key in required:
            if key not in config:
                raise ValueError(f"Missing required key: {key}")
        
        # Validate parameters
        params = config['interview_parameters']
        assert params['duration_minutes'] in [30, 45, 60, 90]
        assert params['experience_level'] in ['junior', 'mid', 'senior', 'lead']
        assert params['expectations'] in ['low', 'medium', 'high']
        assert params['urgency'] in ['low', 'medium', 'high', 'critical']
        
        # Validate skills
        for category, skills in config['skills_categories'].items():
            for skill in skills:
                assert 'name' in skill and 'proficiency' in skill and 'type' in skill
                assert skill['proficiency'] in ['basic_knowledge', 'comfortable', 'strong', 'expert']
                assert skill['type'] in ['must_have', 'nice_to_have']
        
        # Validate flow
        total_time = sum(phase['duration'] for phase in config['interview_flow'])
        assert total_time <= params['duration_minutes']
        
        # Validate questions
        for category, difficulties in config['sample_questions'].items():
            for difficulty in ['easy', 'medium', 'hard', 'expert']:
                if difficulty in difficulties:
                    assert len(difficulties[difficulty]) == 4
                    for qa in difficulties[difficulty]:
                        assert 'q' in qa and 'a' in qa
                        assert len(qa['q']) < 200
        
        return True
