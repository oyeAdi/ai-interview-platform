"""
Generate complete tenant, account, and position data structure
Maintains backward compatibility with existing Supabase schema
"""
import os
import json
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

# Load environment
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.supabase')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ============================================================================
# B2B TENANT DATA
# ============================================================================

b2b_tenants = [
    {
        "name": "EPAM Systems",
        "slug": "epam",
        "description": "Global IT services and software engineering company",
        "vision": "b2b",
        "accounts": [
            {
                "name": "Uber",
                "slug": "uber",
                "description": "Global mobility and delivery platform",
                "positions": [
                    {"title": "Senior Backend Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["python", "microservices", "aws"]},
                    {"title": "iOS Developer", "seniority": "mid", "role_type": "software_engineer", "skills": ["swift", "ios", "mobile"]},
                    {"title": "Product Manager - Rider Experience", "seniority": "senior", "role_type": "product_manager", "skills": ["product_strategy", "metrics_analytics"]},
                    {"title": "Data Analyst", "seniority": "mid", "role_type": "data_analyst", "skills": ["sql", "python", "tableau"]},
                    {"title": "Marketing Manager - Growth", "seniority": "senior", "role_type": "marketing_manager", "skills": ["marketing_strategy", "growth_hacking"]},
                    {"title": "DevOps Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["kubernetes", "docker", "ci_cd"]},
                    {"title": "UX Designer", "seniority": "mid", "role_type": "product_designer", "skills": ["ux_design", "figma", "user_research"]},
                    {"title": "HR Manager - Talent Acquisition", "seniority": "senior", "role_type": "hr_manager", "skills": ["recruitment", "stakeholder_management"]},
                ]
            },
            {
                "name": "Amazon",
                "slug": "amazon",
                "description": "E-commerce and cloud computing company",
                "positions": [
                    {"title": "Software Development Engineer II", "seniority": "mid", "role_type": "software_engineer", "skills": ["java", "aws", "distributed_systems"]},
                    {"title": "Frontend Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["react", "typescript", "javascript"]},
                    {"title": "Solutions Architect", "seniority": "senior", "role_type": "software_engineer", "skills": ["aws", "system_design", "cloud_architecture"]},
                    {"title": "Business Analyst", "seniority": "mid", "role_type": "business_analyst", "skills": ["data_analysis", "sql", "business_acumen"]},
                    {"title": "Operations Manager", "seniority": "senior", "role_type": "operations_manager", "skills": ["operations", "process_optimization", "leadership"]},
                    {"title": "Machine Learning Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["python", "machine_learning", "tensorflow"]},
                    {"title": "Content Writer", "seniority": "junior", "role_type": "content_writer", "skills": ["writing", "seo", "content_strategy"]},
                    {"title": "Customer Success Manager", "seniority": "mid", "role_type": "customer_success", "skills": ["customer_service", "communication", "crm"]},
                ]
            },
            {
                "name": "ServiceNow",
                "slug": "servicenow",
                "description": "Enterprise cloud computing platform",
                "positions": [
                    {"title": "Senior Java Developer", "seniority": "senior", "role_type": "software_engineer", "skills": ["java", "spring_boot", "microservices"]},
                    {"title": "Full Stack Developer", "seniority": "mid", "role_type": "software_engineer", "skills": ["javascript", "react", "node_js"]},
                    {"title": "QA Engineer", "seniority": "mid", "role_type": "qa_engineer", "skills": ["testing", "automation", "selenium"]},
                    {"title": "Technical Writer", "seniority": "mid", "role_type": "technical_writer", "skills": ["documentation", "writing", "api_documentation"]},
                    {"title": "Scrum Master", "seniority": "mid", "role_type": "scrum_master", "skills": ["agile", "scrum", "project_management"]},
                    {"title": "Security Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["security", "penetration_testing", "compliance"]},
                    {"title": "Sales Engineer", "seniority": "mid", "role_type": "sales_engineer", "skills": ["sales", "technical_presentation", "customer_engagement"]},
                    {"title": "Finance Analyst", "seniority": "junior", "role_type": "financial_analyst", "skills": ["financial_analysis", "excel", "forecasting"]},
                ]
            },
            {
                "name": "Expedia",
                "slug": "expedia",
                "description": "Online travel shopping company",
                "positions": [
                    {"title": "Full Stack Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["javascript", "react", "node_js"]},
                    {"title": "Mobile Developer - Android", "seniority": "mid", "role_type": "software_engineer", "skills": ["kotlin", "android", "mobile"]},
                    {"title": "Data Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["python", "spark", "sql"]},
                    {"title": "Product Designer", "seniority": "mid", "role_type": "product_designer", "skills": ["ui_design", "ux_design", "prototyping"]},
                    {"title": "Travel Operations Specialist", "seniority": "junior", "role_type": "operations_specialist", "skills": ["operations", "customer_service", "travel_industry"]},
                    {"title": "SEO Specialist", "seniority": "mid", "role_type": "seo_specialist", "skills": ["seo", "analytics", "content_optimization"]},
                    {"title": "Partnership Manager", "seniority": "senior", "role_type": "partnership_manager", "skills": ["business_development", "negotiation", "stakeholder_management"]},
                    {"title": "Legal Counsel", "seniority": "senior", "role_type": "legal_counsel", "skills": ["legal", "contracts", "compliance"]},
                ]
            }
        ]
    },
    {
        "name": "Google TA",
        "slug": "google",
        "description": "Global technology and talent acquisition company",
        "vision": "b2b",
        "accounts": [
            {
                "name": "Meta",
                "slug": "meta",
                "description": "Social media and metaverse technology",
                "positions": [
                    {"title": "React Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["react", "javascript", "frontend"]},
                    {"title": "Infrastructure Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["distributed_systems", "linux", "networking"]},
                    {"title": "AR/VR Developer", "seniority": "mid", "role_type": "software_engineer", "skills": ["unity", "c_sharp", "3d_graphics"]},
                    {"title": "Research Scientist - AI", "seniority": "lead", "role_type": "research_scientist", "skills": ["machine_learning", "deep_learning", "python"]},
                    {"title": "Community Manager", "seniority": "mid", "role_type": "community_manager", "skills": ["community_management", "social_media", "communication"]},
                    {"title": "Privacy Counsel", "seniority": "senior", "role_type": "legal_counsel", "skills": ["legal", "privacy_law", "compliance"]},
                    {"title": "Brand Marketing Manager", "seniority": "senior", "role_type": "marketing_manager", "skills": ["brand_marketing", "strategy", "creative"]},
                    {"title": "Workplace Coordinator", "seniority": "junior", "role_type": "coordinator", "skills": ["operations", "coordination", "event_planning"]},
                ]
            },
            {
                "name": "OpenAI",
                "slug": "openai",
                "description": "AI research and deployment company",
                "positions": [
                    {"title": "ML Research Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["machine_learning", "python", "pytorch"]},
                    {"title": "Applied AI Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["python", "machine_learning", "api_development"]},
                    {"title": "Safety Researcher", "seniority": "senior", "role_type": "research_scientist", "skills": ["ai_safety", "research", "ethics"]},
                    {"title": "Platform Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["kubernetes", "distributed_systems", "cloud"]},
                    {"title": "Technical Program Manager", "seniority": "senior", "role_type": "program_manager", "skills": ["program_management", "technical_leadership", "coordination"]},
                    {"title": "Developer Relations Engineer", "seniority": "mid", "role_type": "developer_advocate", "skills": ["technical_writing", "public_speaking", "api_documentation"]},
                    {"title": "Policy Analyst", "seniority": "mid", "role_type": "policy_analyst", "skills": ["policy_analysis", "research", "writing"]},
                    {"title": "Recruiter - Technical", "seniority": "mid", "role_type": "recruiter", "skills": ["recruitment", "technical_screening", "sourcing"]},
                ]
            },
            {
                "name": "NVIDIA",
                "slug": "nvidia",
                "description": "Graphics and AI computing company",
                "positions": [
                    {"title": "GPU Software Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["cuda", "c_plus_plus", "gpu_programming"]},
                    {"title": "Deep Learning Engineer", "seniority": "senior", "role_type": "software_engineer", "skills": ["deep_learning", "python", "tensorflow"]},
                    {"title": "Graphics Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["opengl", "vulkan", "3d_graphics"]},
                    {"title": "Hardware Engineer", "seniority": "senior", "role_type": "hardware_engineer", "skills": ["hardware_design", "verilog", "fpga"]},
                    {"title": "Developer Tools Engineer", "seniority": "mid", "role_type": "software_engineer", "skills": ["tooling", "python", "debugging"]},
                    {"title": "Technical Marketing Engineer", "seniority": "mid", "role_type": "marketing_engineer", "skills": ["technical_marketing", "demos", "presentations"]},
                    {"title": "Supply Chain Analyst", "seniority": "mid", "role_type": "supply_chain_analyst", "skills": ["supply_chain", "analytics", "forecasting"]},
                    {"title": "Customer Support Engineer", "seniority": "junior", "role_type": "support_engineer", "skills": ["customer_support", "troubleshooting", "technical_knowledge"]},
                ]
            },
            {
                "name": "Microsoft",
                "slug": "microsoft",
                "description": "Enterprise software and cloud services",
                "positions": [
                    {"title": "Azure Cloud Developer", "seniority": "senior", "role_type": "software_engineer", "skills": ["azure", "cloud", "c_sharp"]},
                    {"title": ".NET Tech Lead", "seniority": "lead", "role_type": "software_engineer", "skills": ["dotnet", "c_sharp", "leadership"]},
                    {"title": "Power BI Developer", "seniority": "mid", "role_type": "software_engineer", "skills": ["power_bi", "data_visualization", "sql"]},
                    {"title": "Dynamics 365 Consultant", "seniority": "senior", "role_type": "consultant", "skills": ["dynamics_365", "crm", "consulting"]},
                    {"title": "Cloud Solutions Architect", "seniority": "senior", "role_type": "software_engineer", "skills": ["azure", "architecture", "cloud_design"]},
                    {"title": "Technical Account Manager", "seniority": "mid", "role_type": "account_manager", "skills": ["account_management", "technical_knowledge", "customer_success"]},
                    {"title": "Learning & Development Specialist", "seniority": "mid", "role_type": "l_and_d_specialist", "skills": ["training", "curriculum_design", "facilitation"]},
                    {"title": "Compliance Officer", "seniority": "senior", "role_type": "compliance_officer", "skills": ["compliance", "risk_management", "auditing"]},
                ]
            }
        ]
    }
]

# ============================================================================
# B2C TENANT DATA
# ============================================================================

b2c_tenants = [
    {
        "name": "System Design Coach",
        "slug": "system-design-coach",
        "description": "Expert system design interview coaching platform",
        "vision": "b2c",
        "accounts": [
            {
                "name": "Senior Level Coaching",
                "slug": "senior-coaching",
                "description": "System design coaching for senior engineers (L5-L6)",
                "positions": [
                    {"title": "Senior System Design Expert - FAANG Focus", "seniority": "principal", "role_type": "coach", "skills": ["system_design", "distributed_systems", "scalability"]},
                    {"title": "Senior System Design Expert - Microservices", "seniority": "principal", "role_type": "coach", "skills": ["microservices", "architecture", "cloud"]},
                    {"title": "Senior System Design Expert - Data Systems", "seniority": "principal", "role_type": "coach", "skills": ["databases", "data_architecture", "big_data"]},
                    {"title": "Senior System Design Expert - Infrastructure", "seniority": "principal", "role_type": "coach", "skills": ["infrastructure", "devops", "kubernetes"]},
                ]
            },
            {
                "name": "Mid Level Coaching",
                "slug": "mid-coaching",
                "description": "System design coaching for mid-level engineers (L3-L4)",
                "positions": [
                    {"title": "Mid-Level System Design Coach - Web Applications", "seniority": "senior", "role_type": "coach", "skills": ["system_design", "web_architecture", "apis"]},
                    {"title": "Mid-Level System Design Coach - Mobile Backend", "seniority": "senior", "role_type": "coach", "skills": ["mobile_backend", "apis", "databases"]},
                    {"title": "Mid-Level System Design Coach - E-commerce", "seniority": "senior", "role_type": "coach", "skills": ["e_commerce", "payment_systems", "inventory"]},
                    {"title": "Mid-Level System Design Coach - Social Media", "seniority": "senior", "role_type": "coach", "skills": ["social_media", "feeds", "notifications"]},
                ]
            },
            {
                "name": "Junior Level Coaching",
                "slug": "junior-coaching",
                "description": "System design coaching for junior engineers (L1-L2)",
                "positions": [
                    {"title": "Junior System Design Mentor - Fundamentals", "seniority": "mid", "role_type": "coach", "skills": ["system_design_basics", "architecture_patterns", "databases"]},
                    {"title": "Junior System Design Mentor - API Design", "seniority": "mid", "role_type": "coach", "skills": ["api_design", "rest", "http"]},
                    {"title": "Junior System Design Mentor - Database Design", "seniority": "mid", "role_type": "coach", "skills": ["database_design", "sql", "normalization"]},
                    {"title": "Junior System Design Mentor - Caching Strategies", "seniority": "mid", "role_type": "coach", "skills": ["caching", "redis", "performance"]},
                ]
            },
            {
                "name": "Architecture Review",
                "slug": "architecture-review",
                "description": "Expert architecture review and consultation services",
                "positions": [
                    {"title": "Principal Architect - Cloud Native", "seniority": "principal", "role_type": "architect", "skills": ["cloud_architecture", "aws", "kubernetes"]},
                    {"title": "Principal Architect - Enterprise Systems", "seniority": "principal", "role_type": "architect", "skills": ["enterprise_architecture", "integration", "legacy_modernization"]},
                    {"title": "Principal Architect - Security", "seniority": "principal", "role_type": "architect", "skills": ["security_architecture", "compliance", "encryption"]},
                    {"title": "Principal Architect - Performance", "seniority": "principal", "role_type": "architect", "skills": ["performance_optimization", "scalability", "profiling"]},
                ]
            }
        ]
    },
    {
        "name": "Tech Interview Mock-Up Expert",
        "slug": "mock-interview-pro",
        "description": "Professional mock interview practice platform",
        "vision": "b2c",
        "accounts": [
            {
                "name": "Technical Mock Interview",
                "slug": "technical-mock",
                "description": "Coding and technical problem-solving interviews",
                "positions": [
                    {"title": "Senior Technical Interviewer - Algorithms", "seniority": "senior", "role_type": "interviewer", "skills": ["algorithms", "data_structures", "coding"]},
                    {"title": "Senior Technical Interviewer - Python", "seniority": "senior", "role_type": "interviewer", "skills": ["python", "coding", "problem_solving"]},
                    {"title": "Senior Technical Interviewer - Java", "seniority": "senior", "role_type": "interviewer", "skills": ["java", "coding", "oop"]},
                    {"title": "Senior Technical Interviewer - JavaScript", "seniority": "senior", "role_type": "interviewer", "skills": ["javascript", "coding", "frontend"]},
                ]
            },
            {
                "name": "Behavioral Mock Interview",
                "slug": "behavioral-mock",
                "description": "Behavioral and leadership interview practice",
                "positions": [
                    {"title": "Senior HR Interview Coach - Leadership", "seniority": "senior", "role_type": "coach", "skills": ["behavioral_interview", "leadership", "communication"]},
                    {"title": "Senior HR Interview Coach - Conflict Resolution", "seniority": "senior", "role_type": "coach", "skills": ["conflict_resolution", "teamwork", "communication"]},
                    {"title": "Senior HR Interview Coach - Career Growth", "seniority": "senior", "role_type": "coach", "skills": ["career_coaching", "goal_setting", "development"]},
                    {"title": "Senior HR Interview Coach - Culture Fit", "seniority": "senior", "role_type": "coach", "skills": ["culture_assessment", "values_alignment", "soft_skills"]},
                ]
            },
            {
                "name": "System Design Mock",
                "slug": "system-design-mock",
                "description": "System design interview simulation",
                "positions": [
                    {"title": "Principal System Design Interviewer - FAANG", "seniority": "principal", "role_type": "interviewer", "skills": ["system_design", "faang_interview", "scalability"]},
                    {"title": "Principal System Design Interviewer - Startups", "seniority": "principal", "role_type": "interviewer", "skills": ["system_design", "mvp_design", "rapid_scaling"]},
                    {"title": "Principal System Design Interviewer - Infrastructure", "seniority": "principal", "role_type": "interviewer", "skills": ["infrastructure_design", "devops", "reliability"]},
                    {"title": "Principal System Design Interviewer - Data Intensive", "seniority": "principal", "role_type": "interviewer", "skills": ["data_systems", "big_data", "streaming"]},
                ]
            },
            {
                "name": "Full Stack Mock",
                "slug": "fullstack-mock",
                "description": "Full stack development interview practice",
                "positions": [
                    {"title": "Senior Full Stack Interviewer - MERN", "seniority": "senior", "role_type": "interviewer", "skills": ["mern_stack", "react", "node_js"]},
                    {"title": "Senior Full Stack Interviewer - Django", "seniority": "senior", "role_type": "interviewer", "skills": ["django", "python", "postgresql"]},
                    {"title": "Senior Full Stack Interviewer - Ruby on Rails", "seniority": "senior", "role_type": "interviewer", "skills": ["ruby_on_rails", "ruby", "postgresql"]},
                    {"title": "Senior Full Stack Interviewer - .NET", "seniority": "senior", "role_type": "interviewer", "skills": ["dotnet", "c_sharp", "sql_server"]},
                ]
            }
        ]
    }
]

# ============================================================================
# C2C TENANT DATA
# ============================================================================

c2c_tenants = [
    {
        "name": "Guardian Nanny Circle",
        "slug": "nanny-circle",
        "description": "Trusted nanny and childcare services marketplace",
        "vision": "c2c",
        "accounts": [
            {
                "name": "The Johnson Family",
                "slug": "johnson-family",
                "description": "Family seeking childcare in San Francisco",
                "positions": [
                    {"title": "Infant Care Specialist (0-1 year)", "seniority": "mid", "role_type": "nanny", "skills": ["infant_care", "feeding", "sleep_training"]},
                    {"title": "Part-time Nanny (Weekends)", "seniority": "junior", "role_type": "nanny", "skills": ["childcare", "activities", "supervision"]},
                    {"title": "After-School Care Provider", "seniority": "junior", "role_type": "nanny", "skills": ["homework_help", "activities", "meal_prep"]},
                    {"title": "Live-in Nanny with Cooking", "seniority": "senior", "role_type": "nanny", "skills": ["childcare", "cooking", "housekeeping"]},
                ]
            },
            {
                "name": "The Martinez Family",
                "slug": "martinez-family",
                "description": "Family seeking special needs care in Austin",
                "positions": [
                    {"title": "Special Needs Caregiver", "seniority": "senior", "role_type": "nanny", "skills": ["special_needs", "therapy_support", "patience"]},
                    {"title": "Toddler Nanny (1-3 years)", "seniority": "mid", "role_type": "nanny", "skills": ["toddler_care", "potty_training", "activities"]},
                    {"title": "Night Nanny", "seniority": "mid", "role_type": "nanny", "skills": ["night_care", "infant_care", "sleep_training"]},
                    {"title": "Emergency Backup Caregiver", "seniority": "junior", "role_type": "nanny", "skills": ["flexibility", "childcare", "reliability"]},
                ]
            },
            {
                "name": "The Chen Family",
                "slug": "chen-family",
                "description": "Family seeking bilingual nanny in Seattle",
                "positions": [
                    {"title": "Bilingual Nanny (Mandarin-English)", "seniority": "mid", "role_type": "nanny", "skills": ["bilingual", "childcare", "cultural_education"]},
                    {"title": "Newborn Care Specialist", "seniority": "senior", "role_type": "nanny", "skills": ["newborn_care", "breastfeeding_support", "postpartum"]},
                    {"title": "Weekend Babysitter", "seniority": "junior", "role_type": "babysitter", "skills": ["babysitting", "activities", "safety"]},
                    {"title": "Summer Nanny", "seniority": "mid", "role_type": "nanny", "skills": ["summer_activities", "outdoor_play", "swimming"]},
                ]
            },
            {
                "name": "The Patel Family",
                "slug": "patel-family",
                "description": "Family seeking experienced nanny in Boston",
                "positions": [
                    {"title": "Experienced Nanny (5+ years)", "seniority": "senior", "role_type": "nanny", "skills": ["childcare", "education", "discipline"]},
                    {"title": "Nanny with Driver's License", "seniority": "mid", "role_type": "nanny", "skills": ["driving", "childcare", "scheduling"]},
                    {"title": "Nanny for Twins", "seniority": "senior", "role_type": "nanny", "skills": ["multiples_care", "organization", "patience"]},
                    {"title": "Nanny-Housekeeper Combo", "seniority": "mid", "role_type": "nanny", "skills": ["childcare", "housekeeping", "meal_prep"]},
                ]
            }
        ]
    },
    {
        "name": "Private Home Tutor",
        "slug": "home-tutor",
        "description": "Personalized home tutoring services marketplace",
        "vision": "c2c",
        "accounts": [
            {
                "name": "The Anderson Family",
                "slug": "anderson-family",
                "description": "Seeking math and science tutors in Chicago",
                "positions": [
                    {"title": "High School Math Tutor (Calculus)", "seniority": "mid", "role_type": "tutor", "skills": ["calculus", "algebra", "teaching"]},
                    {"title": "Physics Tutor (AP Level)", "seniority": "senior", "role_type": "tutor", "skills": ["physics", "ap_curriculum", "problem_solving"]},
                    {"title": "Chemistry Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["chemistry", "lab_work", "exam_prep"]},
                    {"title": "SAT Math Prep Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["sat_prep", "math", "test_strategies"]},
                ]
            },
            {
                "name": "The Williams Family",
                "slug": "williams-family",
                "description": "Seeking language and music tutors in New York",
                "positions": [
                    {"title": "Spanish Language Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["spanish", "language_teaching", "conversation"]},
                    {"title": "Piano Teacher (Beginner to Intermediate)", "seniority": "mid", "role_type": "music_teacher", "skills": ["piano", "music_theory", "teaching"]},
                    {"title": "English Literature Tutor", "seniority": "senior", "role_type": "tutor", "skills": ["literature", "writing", "critical_thinking"]},
                    {"title": "French Tutor (Native Speaker)", "seniority": "mid", "role_type": "tutor", "skills": ["french", "native_speaker", "cultural_immersion"]},
                ]
            },
            {
                "name": "The Lee Family",
                "slug": "lee-family",
                "description": "Seeking coding and STEM tutors in San Jose",
                "positions": [
                    {"title": "Python Programming Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["python", "programming", "project_based"]},
                    {"title": "Robotics Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["robotics", "engineering", "hands_on"]},
                    {"title": "Computer Science Tutor (AP CS)", "seniority": "senior", "role_type": "tutor", "skills": ["computer_science", "java", "ap_curriculum"]},
                    {"title": "Math Competition Coach", "seniority": "senior", "role_type": "tutor", "skills": ["competition_math", "problem_solving", "coaching"]},
                ]
            },
            {
                "name": "The Brown Family",
                "slug": "brown-family",
                "description": "Seeking elementary tutors in Denver",
                "positions": [
                    {"title": "Elementary Reading Tutor", "seniority": "junior", "role_type": "tutor", "skills": ["reading", "phonics", "elementary_education"]},
                    {"title": "Elementary Math Tutor", "seniority": "junior", "role_type": "tutor", "skills": ["elementary_math", "arithmetic", "teaching"]},
                    {"title": "Homework Help Tutor (Grades 3-5)", "seniority": "junior", "role_type": "tutor", "skills": ["homework_help", "organization", "study_skills"]},
                    {"title": "Art & Creativity Tutor", "seniority": "mid", "role_type": "tutor", "skills": ["art", "creativity", "hands_on_activities"]},
                ]
            }
        ]
    }
]

print("="*80)
print("GENERATING COMPLETE TENANT DATA STRUCTURE")
print("="*80)

# Combine all tenant data
all_tenants = b2b_tenants + b2c_tenants + c2c_tenants

stats = {
    "tenants_created": 0,
    "accounts_created": 0,
    "positions_created": 0,
    "errors": []
}

# Process each tenant
for tenant_data in all_tenants:
    try:
        print(f"\n{'='*80}")
        print(f"Processing Tenant: {tenant_data['name']} ({tenant_data['vision'].upper()})")
        print(f"{'='*80}")
        
        # Check if tenant already exists
        existing = supabase.table('tenants').select('id').eq('slug', tenant_data['slug']).execute()
        
        if existing.data:
            tenant_id = existing.data[0]['id']
            print(f"✓ Tenant already exists: {tenant_data['name']} (ID: {tenant_id})")
        else:
            # Create tenant
            new_tenant = {
                "name": tenant_data['name'],
                "slug": tenant_data['slug'],
                "parent_tenant_id": None,  # Top-level tenant
                "settings": {
                    "vision": tenant_data['vision'],
                    "description": tenant_data['description']
                }
            }
            
            result = supabase.table('tenants').insert(new_tenant).execute()
            tenant_id = result.data[0]['id']
            stats["tenants_created"] += 1
            print(f"✓ Created tenant: {tenant_data['name']} (ID: {tenant_id})")
        
        # Process accounts for this tenant
        for account_data in tenant_data['accounts']:
            try:
                # Check if account already exists
                existing_account = supabase.table('tenants').select('id').eq('slug', account_data['slug']).execute()
                
                if existing_account.data:
                    account_id = existing_account.data[0]['id']
                    print(f"  ✓ Account already exists: {account_data['name']}")
                else:
                    # Create account (child tenant)
                    new_account = {
                        "name": account_data['name'],
                        "slug": account_data['slug'],
                        "parent_tenant_id": tenant_id,  # Child of parent tenant
                        "settings": {"description": account_data['description']}
                    }
                    
                    result = supabase.table('tenants').insert(new_account).execute()
                    account_id = result.data[0]['id']
                    stats["accounts_created"] += 1
                    print(f"  ✓ Created account: {account_data['name']} (ID: {account_id})")
                
                # Create positions for this account
                for pos_data in account_data['positions']:
                    try:
                        # Generate description based on role type
                        description = f"We are seeking a {pos_data['seniority']} {pos_data['role_type'].replace('_', ' ')} with expertise in {', '.join(pos_data['skills'][:3])}."
                        
                        new_position = {
                            "tenant_id": account_id,
                            "title": pos_data['title'],
                            "description": description,
                            "status": "active",
                            "seniority_level": pos_data['seniority'],
                            "skills": pos_data['skills'],
                            "analyst_output": {
                                "duration_minutes": 45,
                                "experience_level": pos_data['seniority'],
                                "expectations": "high" if pos_data['seniority'] in ['senior', 'lead', 'principal'] else "medium",
                                "required_skills": [{"skill": skill, "proficiency": "advanced", "weight": 0.2} for skill in pos_data['skills'][:5]]
                            },
                            "requirements": {
                                "role_type": pos_data['role_type'],
                                "created_via": "data_generation_script"
                            }
                        }
                        
                        supabase.table('job_descriptions').insert(new_position).execute()
                        stats["positions_created"] += 1
                        print(f"    ✓ Created position: {pos_data['title']}")
                        
                    except Exception as e:
                        error_msg = f"Error creating position '{pos_data['title']}': {str(e)}"
                        stats["errors"].append(error_msg)
                        print(f"    ✗ {error_msg}")
                
            except Exception as e:
                error_msg = f"Error creating account '{account_data['name']}': {str(e)}"
                stats["errors"].append(error_msg)
                print(f"  ✗ {error_msg}")
        
    except Exception as e:
        error_msg = f"Error creating tenant '{tenant_data['name']}': {str(e)}"
        stats["errors"].append(error_msg)
        print(f"✗ {error_msg}")

# Print summary
print("\n" + "="*80)
print("GENERATION SUMMARY")
print("="*80)
print(f"Tenants created: {stats['tenants_created']}")
print(f"Accounts created: {stats['accounts_created']}")
print(f"Positions created: {stats['positions_created']}")
print(f"Errors: {len(stats['errors'])}")

if stats['errors']:
    print("\nErrors:")
    for error in stats['errors'][:10]:  # Show first 10 errors
        print(f"  - {error}")

print("\n✅ Data generation complete!")
