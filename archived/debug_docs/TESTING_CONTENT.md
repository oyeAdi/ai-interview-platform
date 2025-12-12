# Testing Content - Copy/Paste for UI Testing

## Sample Job Descriptions

### Python JD (Option 1)
```
We are looking for a Senior Python Developer with 5+ years of experience in Python development. The ideal candidate should have strong knowledge of Python fundamentals, data structures, and advanced Python concepts including decorators, generators, and memory management. Experience with frameworks like Django or Flask is a plus. The role requires expertise in object-oriented programming, exception handling, and working with databases. Knowledge of RESTful APIs, microservices architecture, and cloud platforms (AWS, Azure) would be beneficial.
```

### Java JD (Option 2)
```
Join our team as a Java Backend Engineer. We need someone with solid Java fundamentals, understanding of object-oriented programming, exception handling, and Java collections. Knowledge of Spring framework and multithreading is preferred. The candidate should be familiar with design patterns, JVM internals, and building scalable applications. Experience with Spring Boot, Hibernate, and database design is required. Knowledge of microservices, Docker, and Kubernetes is a plus.
```

### Full Stack Python JD (Option 3)
```
Full Stack Python Developer needed. Must have experience with Python backend development (Django/Flask) and frontend technologies (React/Vue). Should understand database design, API development, and deployment processes. Knowledge of Python web frameworks, REST APIs, and modern JavaScript is essential.
```

---

## Sample Resumes

### Python Developer Resume (Option 1)
```
John Smith
Senior Python Developer
Email: john.smith@email.com | Phone: +1-234-567-8900

PROFESSIONAL SUMMARY
Experienced Python developer with 6 years of expertise in building scalable web applications. Strong background in Python fundamentals, data structures, and advanced concepts including decorators, generators, and memory management. Proficient in Django and Flask frameworks.

TECHNICAL SKILLS
- Python (Advanced)
- Django, Flask
- RESTful APIs
- PostgreSQL, MySQL
- Docker, AWS
- Git, CI/CD

EXPERIENCE
Senior Python Developer | Tech Solutions Inc. | 2020 - Present
- Developed and maintained Python-based web applications using Django
- Implemented RESTful APIs and microservices architecture
- Optimized database queries and improved application performance
- Worked with decorators, generators, and advanced Python features

Python Developer | StartupXYZ | 2018 - 2020
- Built web applications using Flask framework
- Implemented data processing pipelines
- Collaborated on memory management and optimization projects

EDUCATION
Bachelor of Science in Computer Science | University ABC | 2018
```

### Java Developer Resume (Option 2)
```
Sarah Johnson
Java Backend Engineer
Email: sarah.johnson@email.com | Phone: +1-234-567-8901

PROFESSIONAL SUMMARY
Java backend engineer with 5 years of experience in enterprise application development. Expertise in Java fundamentals, Spring framework, and building scalable backend systems. Strong understanding of object-oriented programming, exception handling, and Java collections.

TECHNICAL SKILLS
- Java (Advanced)
- Spring Boot, Spring Framework
- Hibernate, JPA
- MySQL, PostgreSQL
- Microservices Architecture
- Docker, Kubernetes

EXPERIENCE
Java Backend Engineer | Enterprise Solutions | 2019 - Present
- Developed RESTful APIs using Spring Boot
- Implemented microservices architecture
- Worked with Java collections, multithreading, and concurrency
- Designed and optimized database schemas

Junior Java Developer | TechCorp | 2017 - 2019
- Built Java applications using Spring Framework
- Implemented exception handling and error management
- Worked with design patterns and best practices

EDUCATION
Bachelor of Science in Software Engineering | University XYZ | 2017
```

### Full Stack Developer Resume (Option 3)
```
Michael Chen
Full Stack Developer
Email: michael.chen@email.com | Phone: +1-234-567-8902

PROFESSIONAL SUMMARY
Full stack developer with expertise in Python backend and modern frontend technologies. 4 years of experience building end-to-end web applications. Strong knowledge of Python web frameworks, REST APIs, and React.

TECHNICAL SKILLS
- Python, Django, Flask
- JavaScript, React, Vue.js
- RESTful APIs
- PostgreSQL, MongoDB
- Docker, AWS
- Git, Agile

EXPERIENCE
Full Stack Developer | Digital Innovations | 2020 - Present
- Developed full stack applications using Python (Django) and React
- Built and maintained RESTful APIs
- Implemented responsive frontend interfaces
- Deployed applications on cloud platforms

Software Developer | WebStart | 2018 - 2020
- Built web applications using Python and JavaScript
- Worked on both backend and frontend development
- Collaborated on database design and API development

EDUCATION
Bachelor of Science in Computer Science | Tech University | 2018
```

---

## Quick Test Scenarios

### Scenario 1: Python Match
- **JD**: Use "Python JD (Option 1)" from above
- **Resume**: Use "Python Developer Resume (Option 1)" from above
- **Expected**: System should detect "python" as language

### Scenario 2: Java Match
- **JD**: Use "Java JD (Option 2)" from above
- **Resume**: Use "Java Developer Resume (Option 2)" from above
- **Expected**: System should detect "java" as language

### Scenario 3: Full Stack Match
- **JD**: Use "Full Stack Python JD (Option 3)" from above
- **Resume**: Use "Full Stack Developer Resume (Option 3)" from above
- **Expected**: System should detect "python" as language

### Scenario 4: Mixed Content
- **JD**: Paste Python JD
- **Resume**: Paste Java Resume
- **Expected**: System should detect based on JD (likely Python)

---

## File Upload Test Content

Save these as text files for file upload testing:

### jd_python.txt
```
We are looking for a Senior Python Developer with 5+ years of experience in Python development. The ideal candidate should have strong knowledge of Python fundamentals, data structures, and advanced Python concepts including decorators, generators, and memory management.
```

### resume_python.txt
```
John Smith
Senior Python Developer
Experienced Python developer with 6 years of expertise in building scalable web applications. Strong background in Python fundamentals, data structures, and advanced concepts.
```

---

## Testing Checklist

- [ ] Copy Python JD into JD textarea
- [ ] Copy Python Resume into Resume textarea
- [ ] Click "Start Interview"
- [ ] Verify language detection (should be "python")
- [ ] Test with Java JD and Java Resume
- [ ] Test file uploads (upload .txt files)
- [ ] Test JD dropdown selection
- [ ] Test Resume dropdown selection
- [ ] Test mixed inputs (textarea + file)

