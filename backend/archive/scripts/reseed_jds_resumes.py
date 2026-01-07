import os
import sys
from supabase import create_client
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load env from .env.supabase (adjust path as needed logic matches reseed_demo_data.py)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.supabase')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- Data Definitions ---

JDS = [
    # B2B Models
    {
        "title": "Senior Backend Engineer (B2B SaaS)",
        "description": """
**Company:** Enterprise Cloud Solutions (B2B SaaS)
**Role:** Senior Backend Engineer
**Summary:** We are building a high-scale multi-tenant SaaS platform for enterprise cloud management. We need a backend expert to design microservices, optimize database performance, and ensure 99.99% uptime.
**Responsibilities:**
- Architect and build scalable microservices using Python and scalable databases.
- Design RESTful APIs for third-party integrations.
- Optimize high-concurrency data pipelines.
**Requirements:**
- 5+ years of Python/Django or Go experience.
- Deep understanding of distributed systems and microservices.
- Experience with PostgreSQL, Redis, and message queues (Kafka/RabbitMQ).
""",
        "tags": ["B2B", "SaaS", "Backend", "Python", "Microservices"]
    },
    {
        "title": "DevOps Infrastructure Lead (B2B Platform)",
        "description": """
**Company:** InfraSecure (B2B)
**Role:** DevOps Lead
**Summary:** Our B2B platform serves Fortune 500 clients. We need a DevOps Lead to manage our AWS infrastructure, automate CI/CD pipelines, and ensure strict security compliance (SOC2)
**Responsibilities:**
- Manage AWS cloud infrastructure using Terraform.
- Build and maintain K8s clusters.
- Automate deployment pipelines (GitLab CI/Jenkins).
**Requirements:**
- 5+ years in DevOps/SRE.
- Expert in AWS, Docker, Kubernetes, and Terraform.
- Strong security mindset (IAM, VPC, Encryption).
""",
        "tags": ["B2B", "DevOps", "AWS", "Security"]
    },
    
    # B2C Models
    {
        "title": "Lead Mobile Developer (B2C Consumer App)",
        "description": """
**Company:** FitLife (B2C)
**Role:** Lead React Native Developer
**Summary:** FitLife is a fast-growing consumer fitness app with 2M+ users. We are looking for a lead developer to take our React Native app to the next level with smooth animations and offline-first capabilities.
**Responsibilities:**
- Lead development of the FitLife iOS/Android app.
- Optimize app performance and battery usage.
- Implement complex UI/UX designs.
**Requirements:**
- 4+ years React Native experience.
- Experience publishing apps to App Store and Play Store.
- Strong knowledge of state management and native bridging.
""",
        "tags": ["B2C", "Mobile", "React Native", "Consumer"]
    },
    {
        "title": "Growth Product Manager (B2C Marketplace)",
        "description": """
**Company:** ShopTrendy (B2C)
**Role:** Growth Product Manager
**Summary:** ShopTrendy is a fashion marketplace. We need a data-driven PM to lead our growth squad, focusing on user acquisition, retention, and conversion rate optimization.
**Responsibilities:**
- Run A/B tests to improve funnel conversion.
- Analyze user behavior using Mixpanel/Amplitude.
- Collaborate with engineering and design to ship growth features.
**Requirements:**
- 3+ years in Product Management, preferably B2C.
- Strong analytical skills (SQL is a plus).
- Experience with A/B testing frameworks.
""",
        "tags": ["B2C", "Product", "Growth", "Analytics"]
    },

    # C2C Models
    {
        "title": "Professional Nanny (C2C Services)",
        "description": """
**Role:** Professional Nanny (High Net Worth Family)
**Summary:** A private family in San Francisco is seeking a dedicated and experienced nanny for two children (ages 2 and 5).
**Responsibilities:**
- Manage daily routine involved with children (meals, naps, activities).
- Plan educational and recreational activities.
- Light housekeeping related to children.
**Requirements:**
- 5+ years of professional nanny experience.
- CPR/First Aid Certified.
- Valid Driver's License and clean record.
- Early childhood education background preferred.
""",
        "tags": ["C2C", "Nanny", "Care", "Personal Services"]
    },
    {
        "title": "Private Math Tutor (C2C Education)",
        "description": """
**Role:** Private High School Math Tutor
**Summary:** Seeking an expert Math Tutor for high school students (Algebra II, Calculus, SAT Math). Flexible hours, remote or in-person.
**Responsibilities:**
- Conduct 1-on-1 tutoring sessions.
- Create customized lesson plans and practice problems.
- Track student progress and prepare for exams.
**Requirements:**
- Bachelor's degree in Math or related field.
- Previous tutoring or teaching experience.
- Patience and excellent communication skills.
""",
        "tags": ["C2C", "Tutor", "Education", "Math"]
    },
    
    # Staffing / Agency Model
    {
        "title": "Technical Recruiter (Staffing Agency)",
        "description": """
**Company:** TechTalent Hunters (Staffing)
**Role:** Senior Technical Recruiter
**Summary:** We are a premier staffing agency connecting top tech talent with silicon valley startups. We need a recruiter who speaks "engineer" and can close hard-to-fill roles.
**Responsibilities:**
- Source candidates for specialized tech roles (AI, Crypto, Systems).
- Screen candidates for technical fit and culture add.
- Manage the full recruitment lifecycle.
**Requirements:**
- 3+ years technical recruiting experience.
- Strong network on LinkedIn and other platforms.
- Understanding of modern tech stacks.
""",
        "tags": ["Staffing", "Recruiter", "HR"]
    }
]

RESUMES = [
    {
        "file_name": "backend_engineer_profile.txt",
        "parsed_data": {
            "text": """
**ALEX CHEN**
Senior Backend Engineer
San Francisco, CA

**SUMMARY**
Backend engineer with 6 years of experience building scalable distributed systems. Expert in Python, Go, and AWS. Passionate about code quality and performance optimization.

**EXPERIENCE**
**Senior Software Engineer | CloudScale Inc.** (2020 - Present)
- Designed and implemented a microservices architecture handling 50k RPS.
- Reduced API latency by 40% through Redis caching and query optimization.
- Led a team of 4 engineers in migrating from monolith to microservices.

**Software Engineer | StartupX** (2017 - 2020)
- Built REST APIs for a B2B SaaS platform using Django Rest Framework.
- Maintained PostgreSQL databases and wrote complex aggregation queries.
- Implemented CI/CD pipelines using Jenkins.

**SKILLS**
Languages: Python, Go, Java, SQL
Tech: Django, FastAPI, Docker, Kubernetes, AWS (EC2, RDS, Lambda), Redis, Kafka
"""
        },
        "analyst_output": {"language": "python"}
    },
    {
        "file_name": "mobile_dev_profile.txt",
        "parsed_data": {
            "text": """
**SARAH JONES**
Lead Mobile Developer
New York, NY

**SUMMARY**
Product-focused mobile developer specializing in React Native and iOS. 5 years of experience delivering 5-star consumer apps.

**EXPERIENCE**
**Lead Mobile Dev | AppWorks** (2021 - Present)
- Developed 'FoodNow' delivery app (1M+ downloads) using React Native.
- Improved app startup time by 50% using Hermes engine.
- Mentored junior developers and established code review standards.

**iOS Developer | Creative Studio** (2018 - 2021)
- Built native iOS apps using Swift and UIKit.
- Integrated third-party SDKs for maps, payments, and analytics.

**SKILLS**
Mobile: React Native, iOS (Swift), Android (Kotlin)
Frontend: React, TypeScript, Redux
Tools: Xcode, Android Studio, Firebase, App Store Connect
"""
        },
        "analyst_output": {"language": "javascript"}
    },
    {
        "file_name": "nanny_profile.txt",
        "parsed_data": {
            "text": """
**MARIA RODRIGUEZ**
Professional Nanny
Los Angeles, CA

**SUMMARY**
Compassionate and energetic nanny with over 8 years of experience in private childcare. Certified in CPR and First Aid. Specialized in toddler development and schedule management.

**EXPERIENCE**
**Private Nanny | The Smith Family** (2019 - Present)
- Provide full-time care for 3 children (ages 6 months to 4 years).
- Organize educational activities, playdates, and outings.
- Prepare healthy meals and manage nap schedules.

**Nanny | The Wilson Family** (2015 - 2019)
- Cared for two school-aged children.
- Assisted with homework, school pickups, and extracurriculars.

**CERTIFICATIONS**
- CPR & First Aid (Red Cross)
- Early Childhood Education Certificate
- Safe Driver
"""
        },
        "analyst_output": {"language": "english"}  # N/A strictly speaking, but english works
    },
    {
        "file_name": "product_manager_profile.txt",
        "parsed_data": {
            "text": """
**DAVID KIM**
Product Manager
Seattle, WA

**SUMMARY**
Data-driven Product Manager with a background in data analytics. Experienced in B2C growth strategies and A/B testing.

**EXPERIENCE**
**Product Manager | E-Shop** (2020 - Present)
- Led the 'Checkout Optimization' squad, increasing conversion by 15%.
- Conducted user research and usability testing to validate new features.
- Defined product roadmap and prioritized backlog based on business metrics.

**Data Analyst | FinTech Co** (2018 - 2020)
- Analyzed user retention cohorts using SQL and Tableau.
- Provided actionable insights to the product team.

**SKILLS**
Product: Agile/Scrum, User Stories, Roadmap Planning, A/B Testing
Tools: Jira, Mixpanel, Amplitude, Figma, SQL
"""
        },
        "analyst_output": {"language": "python"} # Often PMs use SQL/Python
    },
    {
        "file_name": "tutor_profile.txt",
        "parsed_data": {
            "text": """
**EMILY WHITE**
Mathematics Tutor
Chicago, IL

**SUMMARY**
Dedicated Math Tutor with a B.S. in Mathematics and 4 years of teaching experience. Proven track record of helping students improve their SAT Math scores by 100+ points.

**EXPERIENCE**
**Private Tutor | Self-Employed** (2019 - Present)
- Tutoring high school students in Algebra, Geometry, and Calculus.
- developing customized study plans for SAT/ACT prep.

**Teaching Assistant | University of Illinois** (2017 - 2019)
- Assisted professors with grading and held office hours for Calculus I & II.

**EDUCATION**
B.S. Mathematics, University of Illinois
"""
        },
        "analyst_output": {"language": "english"}
    }
]

def seed():
    print("Clearing 'job_descriptions' and 'resumes' tables...")
    try:
        # Note: Delete without where clause is tricky in Supabase-py sometimes depending on policies
        # but 'neq' on a non-existent ID usually works or just select all IDs and delete
        
        # Determine IDs to delete
        existing_jds = supabase.table('job_descriptions').select('id').execute()
        if existing_jds.data:
            ids = [x['id'] for x in existing_jds.data]
            supabase.table('job_descriptions').delete().in_('id', ids).execute()
        
        existing_resumes = supabase.table('resumes').select('id').execute()
        if existing_resumes.data:
            ids = [x['id'] for x in existing_resumes.data]
            supabase.table('resumes').delete().in_('id', ids).execute()
            
        print("Tables cleared.")
    except Exception as e:
        print(f"Error clearing tables: {e}")

    print("\nInserting curated JDs...")
    for jd in JDS:
        try:
            data = {
                "title": jd["title"],
                # "company": jd.get("company", "Unknown"), # Column does not exist
                "description": jd["description"],
                "analyst_output": {
                    "language": "python",
                    "tags": jd.get("tags", [])
                },
                # "file_path": f"jds/curated/{jd['title'].lower().replace(' ', '_')}.txt" # Add dummy path
            }
            supabase.table('job_descriptions').insert(data).execute()
            print(f"  + Added JD: {jd['title']}")
        except Exception as e:
            print(f"  - Failed to add JD {jd['title']}: {e}")

    print("\nInserting curated Resumes...")
    for res in RESUMES:
        try:
            data = {
                "file_name": res["file_name"],
                "parsed_data": res["parsed_data"],
                "analyst_output": res["analyst_output"],
                "file_url": f"https://placeholder.com/{res['file_name']}" # Dummy URL required by DB
            }
            supabase.table('resumes').insert(data).execute()
            print(f"  + Added Resume: {res['file_name']}")
        except Exception as e:
             print(f"  - Failed to add Resume {res['file_name']}: {e}")

    print("\nDone!")

if __name__ == "__main__":
    seed()
