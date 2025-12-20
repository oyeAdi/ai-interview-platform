// Comprehensive Interview Question Categories for Tech Industry
// 50+ categories organized by role type

export const INTERVIEW_CATEGORIES = {
    // ========================================
    // ENGINEERING & TECHNICAL (20 categories)
    // ========================================
    technical: {
        coding: {
            icon: '💻',
            label: 'Coding',
            description: 'Algorithms & data structures',
            roles: ['software_engineer', 'backend', 'frontend', 'fullstack', 'mobile', 'devops', 'data_engineer']
        },
        system_design: {
            icon: '🏗️',
            label: 'System Design',
            description: 'Architecture & scalability',
            roles: ['senior_engineer', 'architect', 'tech_lead', 'staff_engineer', 'principal_engineer']
        },
        debugging: {
            icon: '🐛',
            label: 'Debugging',
            description: 'Problem diagnosis & resolution',
            roles: ['software_engineer', 'backend', 'frontend', 'fullstack', 'devops', 'sre']
        },
        api_design: {
            icon: '🔌',
            label: 'API Design',
            description: 'RESTful, GraphQL, gRPC',
            roles: ['backend', 'fullstack', 'architect', 'tech_lead']
        },
        database: {
            icon: '🗄️',
            label: 'Database',
            description: 'SQL, NoSQL, optimization',
            roles: ['backend', 'data_engineer', 'dba', 'architect']
        },
        cloud: {
            icon: '☁️',
            label: 'Cloud',
            description: 'AWS, Azure, GCP',
            roles: ['devops', 'cloud_engineer', 'sre', 'architect', 'backend']
        },
        security: {
            icon: '🔒',
            label: 'Security',
            description: 'AppSec, encryption, auth',
            roles: ['security_engineer', 'backend', 'fullstack', 'devops']
        },
        performance: {
            icon: '⚡',
            label: 'Performance',
            description: 'Optimization & profiling',
            roles: ['senior_engineer', 'backend', 'frontend', 'sre']
        },
        testing: {
            icon: '🧪',
            label: 'Testing',
            description: 'Unit, integration, E2E',
            roles: ['qa_engineer', 'sdet', 'software_engineer']
        },
        devops: {
            icon: '🚀',
            label: 'DevOps',
            description: 'CI/CD, deployment, automation',
            roles: ['devops', 'sre', 'platform_engineer']
        },
        frontend: {
            icon: '🎨',
            label: 'Frontend',
            description: 'React, Vue, Angular, UI/UX',
            roles: ['frontend', 'fullstack', 'ui_engineer']
        },
        mobile: {
            icon: '📱',
            label: 'Mobile',
            description: 'iOS, Android, React Native',
            roles: ['mobile', 'ios', 'android']
        },
        data_structures: {
            icon: '📊',
            label: 'Data Structures',
            description: 'Arrays, trees, graphs, heaps',
            roles: ['software_engineer', 'backend', 'data_engineer']
        },
        ml_ai: {
            icon: '🤖',
            label: 'ML/AI',
            description: 'Machine learning, deep learning',
            roles: ['ml_engineer', 'data_scientist', 'ai_engineer']
        },
        data_engineering: {
            icon: '🔄',
            label: 'Data Engineering',
            description: 'ETL, pipelines, warehousing',
            roles: ['data_engineer', 'analytics_engineer']
        },
        networking: {
            icon: '🌐',
            label: 'Networking',
            description: 'TCP/IP, HTTP, DNS, load balancing',
            roles: ['network_engineer', 'devops', 'sre', 'backend']
        },
        microservices: {
            icon: '🧩',
            label: 'Microservices',
            description: 'Service architecture, messaging',
            roles: ['backend', 'architect', 'tech_lead', 'senior_engineer']
        },
        containers: {
            icon: '📦',
            label: 'Containers',
            description: 'Docker, Kubernetes, orchestration',
            roles: ['devops', 'sre', 'platform_engineer', 'backend']
        },
        monitoring: {
            icon: '📈',
            label: 'Monitoring',
            description: 'Observability, logging, metrics',
            roles: ['sre', 'devops', 'backend']
        },
        version_control: {
            icon: '🔀',
            label: 'Version Control',
            description: 'Git, branching strategies',
            roles: ['software_engineer', 'all']
        }
    },

    // ========================================
    // PRODUCT & DESIGN (8 categories)
    // ========================================
    product: {
        product_strategy: {
            icon: '🎯',
            label: 'Product Strategy',
            description: 'Vision, roadmap, prioritization',
            roles: ['product_manager', 'cpo', 'product_lead']
        },
        user_research: {
            icon: '🔍',
            label: 'User Research',
            description: 'User interviews, surveys, analysis',
            roles: ['product_manager', 'ux_researcher', 'product_designer']
        },
        metrics_analytics: {
            icon: '📊',
            label: 'Metrics & Analytics',
            description: 'KPIs, A/B testing, data analysis',
            roles: ['product_manager', 'growth_pm', 'data_analyst']
        },
        ux_design: {
            icon: '✨',
            label: 'UX Design',
            description: 'User experience, wireframes, flows',
            roles: ['ux_designer', 'product_designer', 'ui_ux']
        },
        ui_design: {
            icon: '🎨',
            label: 'UI Design',
            description: 'Visual design, prototyping',
            roles: ['ui_designer', 'product_designer']
        },
        product_sense: {
            icon: '💡',
            label: 'Product Sense',
            description: 'Feature ideation, trade-offs',
            roles: ['product_manager', 'cpo']
        },
        stakeholder_management: {
            icon: '🤝',
            label: 'Stakeholder Management',
            description: 'Cross-functional collaboration',
            roles: ['product_manager', 'program_manager', 'tpm']
        },
        go_to_market: {
            icon: '🚀',
            label: 'Go-to-Market',
            description: 'Launch strategy, positioning',
            roles: ['product_manager', 'product_marketing', 'cpo']
        }
    },

    // ========================================
    // BUSINESS & LEADERSHIP (12 categories)
    // ========================================
    business: {
        strategic_thinking: {
            icon: '🧠',
            label: 'Strategic Thinking',
            description: 'Long-term planning, vision',
            roles: ['ceo', 'cto', 'cpo', 'vp', 'director']
        },
        business_acumen: {
            icon: '💼',
            label: 'Business Acumen',
            description: 'P&L, revenue, market dynamics',
            roles: ['ceo', 'cfo', 'business_analyst', 'consultant']
        },
        leadership: {
            icon: '👑',
            label: 'Leadership',
            description: 'Team management, mentoring',
            roles: ['manager', 'director', 'vp', 'ceo', 'cto', 'tech_lead']
        },
        decision_making: {
            icon: '⚖️',
            label: 'Decision Making',
            description: 'Trade-offs, prioritization',
            roles: ['manager', 'director', 'product_manager', 'ceo']
        },
        conflict_resolution: {
            icon: '🤝',
            label: 'Conflict Resolution',
            description: 'Mediation, problem-solving',
            roles: ['manager', 'hr', 'director', 'team_lead']
        },
        hiring: {
            icon: '🎯',
            label: 'Hiring',
            description: 'Recruitment, interviewing, talent',
            roles: ['hr', 'recruiter', 'hiring_manager', 'manager']
        },
        organizational_design: {
            icon: '🏢',
            label: 'Organizational Design',
            description: 'Team structure, scaling',
            roles: ['ceo', 'cto', 'vp', 'hr_director']
        },
        change_management: {
            icon: '🔄',
            label: 'Change Management',
            description: 'Transformation, adoption',
            roles: ['director', 'vp', 'program_manager', 'hr']
        },
        financial_planning: {
            icon: '💰',
            label: 'Financial Planning',
            description: 'Budgeting, forecasting, ROI',
            roles: ['cfo', 'finance_manager', 'ceo']
        },
        risk_management: {
            icon: '⚠️',
            label: 'Risk Management',
            description: 'Risk assessment, mitigation',
            roles: ['ceo', 'cto', 'compliance', 'security']
        },
        vendor_management: {
            icon: '🤝',
            label: 'Vendor Management',
            description: 'Partnerships, negotiations',
            roles: ['procurement', 'operations', 'cto']
        },
        crisis_management: {
            icon: '🚨',
            label: 'Crisis Management',
            description: 'Incident response, recovery',
            roles: ['ceo', 'cto', 'operations', 'sre']
        }
    },

    // ========================================
    // SALES & MARKETING (6 categories)
    // ========================================
    sales_marketing: {
        sales_strategy: {
            icon: '📈',
            label: 'Sales Strategy',
            description: 'Pipeline, forecasting, closing',
            roles: ['sales', 'account_executive', 'sales_manager', 'cro']
        },
        customer_success: {
            icon: '🌟',
            label: 'Customer Success',
            description: 'Retention, upselling, support',
            roles: ['csm', 'account_manager', 'customer_success']
        },
        marketing_strategy: {
            icon: '📣',
            label: 'Marketing Strategy',
            description: 'Campaigns, branding, positioning',
            roles: ['marketing_manager', 'cmo', 'growth_marketer']
        },
        content_marketing: {
            icon: '✍️',
            label: 'Content Marketing',
            description: 'Content strategy, SEO, copywriting',
            roles: ['content_marketer', 'marketing_manager']
        },
        growth_hacking: {
            icon: '🚀',
            label: 'Growth Hacking',
            description: 'Viral loops, acquisition, retention',
            roles: ['growth_pm', 'growth_marketer', 'cmo']
        },
        brand_management: {
            icon: '🎨',
            label: 'Brand Management',
            description: 'Brand identity, positioning',
            roles: ['brand_manager', 'cmo', 'marketing_director']
        }
    },

    // ========================================
    // SOFT SKILLS & BEHAVIORAL (8 categories)
    // ========================================
    soft_skills: {
        communication: {
            icon: '💬',
            label: 'Communication',
            description: 'Clarity, articulation, presentation',
            roles: ['all']
        },
        collaboration: {
            icon: '🤝',
            label: 'Collaboration',
            description: 'Teamwork, cross-functional work',
            roles: ['all']
        },
        problem_solving: {
            icon: '🧩',
            label: 'Problem Solving',
            description: 'Analytical thinking, creativity',
            roles: ['all']
        },
        adaptability: {
            icon: '🔄',
            label: 'Adaptability',
            description: 'Flexibility, learning agility',
            roles: ['all']
        },
        time_management: {
            icon: '⏰',
            label: 'Time Management',
            description: 'Prioritization, efficiency',
            roles: ['all']
        },
        emotional_intelligence: {
            icon: '❤️',
            label: 'Emotional Intelligence',
            description: 'Self-awareness, empathy',
            roles: ['manager', 'hr', 'leadership']
        },
        cultural_fit: {
            icon: '🌍',
            label: 'Cultural Fit',
            description: 'Values alignment, team dynamics',
            roles: ['all']
        },
        work_ethic: {
            icon: '💪',
            label: 'Work Ethic',
            description: 'Dedication, accountability',
            roles: ['all']
        }
    },

    // ========================================
    // DOMAIN SPECIFIC (6 categories)
    // ========================================
    domain: {
        compliance: {
            icon: '📋',
            label: 'Compliance',
            description: 'Regulations, audits, governance',
            roles: ['compliance', 'legal', 'security', 'cfo']
        },
        legal: {
            icon: '⚖️',
            label: 'Legal',
            description: 'Contracts, IP, employment law',
            roles: ['legal', 'general_counsel', 'hr']
        },
        operations: {
            icon: '⚙️',
            label: 'Operations',
            description: 'Process optimization, efficiency',
            roles: ['operations', 'coo', 'program_manager']
        },
        supply_chain: {
            icon: '🚚',
            label: 'Supply Chain',
            description: 'Logistics, inventory, procurement',
            roles: ['operations', 'supply_chain', 'coo']
        },
        hr_policies: {
            icon: '📖',
            label: 'HR Policies',
            description: 'Employee relations, benefits',
            roles: ['hr', 'hr_manager', 'chro']
        },
        training_development: {
            label: 'Translation',
            description: 'Language translation, localization',
            roles: ['translator', 'interpreter', 'localizer']
        },
        voice_over: {
            icon: '🎙️',
            label: 'Voice Over',
            description: 'Narration, voice acting, audio quality',
            roles: ['voice_actor', 'narrator', 'voice_artist']
        },
        illustration: {
            icon: '🖌️',
            label: 'Illustration',
            description: 'Digital art, character design, concept art',
            roles: ['illustrator', 'digital_artist', 'concept_artist']
        },
        animation: {
            icon: '🎞️',
            label: 'Animation',
            description: '2D/3D animation, motion design',
            roles: ['animator', '3d_artist', 'motion_designer']
        },
        photography: {
            icon: '📸',
            label: 'Photography',
            description: 'Product, portrait, event photography',
            roles: ['photographer', 'photo_editor', 'visual_content']
        },
        web_development: {
            icon: '💻',
            label: 'Web Development',
            description: 'WordPress, Shopify, custom sites',
            roles: ['web_developer', 'wordpress_dev', 'freelance_dev']
        },
        app_development: {
            icon: '📱',
            label: 'App Development',
            description: 'Mobile apps, no-code, custom apps',
            roles: ['app_developer', 'mobile_dev', 'freelance_mobile']
        },
        consulting: {
            icon: '💡',
            label: 'Consulting',
            description: 'Strategy, advisory, expertise',
            roles: ['consultant', 'advisor', 'freelance_consultant']
        }
    },

    // ========================================
    // GAMING INDUSTRY (10 categories)
    // ========================================
    gaming: {
        game_development: {
            icon: '🎮',
            label: 'Game Development',
            description: 'Unity, Unreal, game engines, gameplay',
            roles: ['game_developer', 'game_programmer', 'gameplay_engineer']
        },
        game_design: {
            icon: '🎨',
            label: 'Game Design',
            description: 'Level design, mechanics, balancing',
            roles: ['game_designer', 'level_designer', 'systems_designer']
        },
        game_art: {
            icon: '🖼️',
            label: 'Game Art',
            description: '3D modeling, texturing, environment art',
            roles: ['game_artist', '3d_artist', 'environment_artist', 'character_artist']
        },
        game_qa: {
            icon: '🐛',
            label: 'Game QA',
            description: 'Bug testing, playtesting, quality assurance',
            roles: ['game_tester', 'qa_tester', 'playtester']
        },
        game_audio: {
            icon: '🎵',
            label: 'Game Audio',
            description: 'Sound design, music, audio implementation',
            roles: ['audio_designer', 'sound_designer', 'composer']
        },
        game_production: {
            icon: '📋',
            label: 'Game Production',
            description: 'Project management, scheduling, coordination',
            roles: ['producer', 'game_producer', 'project_manager']
        },
        esports: {
            icon: '🏆',
            label: 'Esports',
            description: 'Competitive gaming, tournaments, coaching',
            roles: ['esports_manager', 'coach', 'analyst', 'caster']
        },
        community_management: {
            icon: '👥',
            label: 'Community Management',
            description: 'Player engagement, moderation, feedback',
            roles: ['community_manager', 'moderator', 'player_support']
        },
        game_monetization: {
            icon: '💰',
            label: 'Game Monetization',
            description: 'LiveOps, IAP, economy design',
            roles: ['monetization_designer', 'liveops', 'economy_designer']
        },
        game_analytics: {
            icon: '📊',
            label: 'Game Analytics',
            description: 'Player metrics, retention, A/B testing',
            roles: ['game_analyst', 'data_analyst', 'analytics_engineer']
        }
    }
}

// Role-to-category mapping for intelligent filtering
export const ROLE_CATEGORY_MAPPING = {
    // Engineering roles
    software_engineer: ['coding', 'debugging', 'testing', 'version_control', 'data_structures', 'problem_solving', 'collaboration'],
    senior_engineer: ['coding', 'system_design', 'performance', 'debugging', 'leadership', 'mentoring'],
    tech_lead: ['system_design', 'leadership', 'api_design', 'microservices', 'decision_making', 'stakeholder_management'],
    architect: ['system_design', 'api_design', 'database', 'cloud', 'microservices', 'strategic_thinking'],

    // Product roles
    product_manager: ['product_strategy', 'product_sense', 'metrics_analytics', 'stakeholder_management', 'user_research', 'go_to_market'],
    cpo: ['product_strategy', 'strategic_thinking', 'leadership', 'business_acumen', 'organizational_design'],

    // Leadership roles
    ceo: ['strategic_thinking', 'leadership', 'business_acumen', 'decision_making', 'organizational_design', 'crisis_management'],
    cto: ['strategic_thinking', 'system_design', 'leadership', 'organizational_design', 'risk_management'],
    vp: ['leadership', 'strategic_thinking', 'decision_making', 'organizational_design', 'change_management'],

    // HR roles
    hr: ['hiring', 'conflict_resolution', 'hr_policies', 'training_development', 'emotional_intelligence', 'cultural_fit'],
    recruiter: ['hiring', 'communication', 'cultural_fit', 'stakeholder_management'],

    // Sales & Marketing
    sales: ['sales_strategy', 'communication', 'customer_success', 'problem_solving'],
    marketing_manager: ['marketing_strategy', 'content_marketing', 'growth_hacking', 'metrics_analytics'],

    // Operations
    operations: ['operations', 'supply_chain', 'process_optimization', 'vendor_management'],

    // Freelance & Gig Economy roles
    copywriter: ['copywriting', 'content_marketing', 'communication', 'creativity', 'time_management'],
    graphic_designer: ['graphic_design', 'ui_design', 'creativity', 'communication', 'time_management'],
    video_editor: ['video_editing', 'creativity', 'time_management', 'communication'],
    social_media_manager: ['social_media', 'content_marketing', 'communication', 'metrics_analytics'],
    seo_specialist: ['seo_specialist', 'content_marketing', 'metrics_analytics', 'problem_solving'],
    virtual_assistant: ['virtual_assistant', 'time_management', 'communication', 'adaptability'],
    translator: ['translation', 'communication', 'cultural_fit', 'time_management'],
    photographer: ['photography', 'creativity', 'communication', 'time_management'],
    web_developer: ['web_development', 'frontend', 'coding', 'problem_solving'],
    consultant: ['consulting', 'strategic_thinking', 'communication', 'problem_solving', 'business_acumen'],

    // Gaming industry roles
    game_developer: ['game_development', 'coding', 'debugging', 'performance', 'problem_solving'],
    game_designer: ['game_design', 'product_sense', 'creativity', 'problem_solving', 'collaboration'],
    game_artist: ['game_art', 'creativity', 'collaboration', 'time_management'],
    game_producer: ['game_production', 'stakeholder_management', 'decision_making', 'leadership'],
    esports_manager: ['esports', 'strategic_thinking', 'leadership', 'communication'],
    community_manager: ['community_management', 'communication', 'emotional_intelligence', 'conflict_resolution'],

    // Default for unknown roles
    default: ['communication', 'problem_solving', 'collaboration', 'adaptability', 'work_ethic']
}

export default INTERVIEW_CATEGORIES
