// Bulletproof Keyword Matching for Category Selection
// Comprehensive mapping with synonyms, variations, and fuzzy matching

export const CATEGORY_KEYWORDS = {
    // ========================================
    // ENGINEERING & TECHNICAL
    // ========================================
    coding: [
        // Languages
        'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'c++', 'cpp', 'c#', 'csharp', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala',
        // Concepts
        'coding', 'programming', 'algorithm', 'algorithms', 'data structure', 'data structures', 'ds', 'dsa',
        // Platforms
        'leetcode', 'hackerrank', 'codility', 'competitive programming',
        // General
        'code', 'develop', 'implementation', 'logic', 'problem solving code'
    ],

    system_design: [
        'system design', 'system architecture', 'architecture', 'distributed system', 'distributed systems',
        'scalability', 'scalable', 'high availability', 'load balancing', 'load balancer',
        'microservices', 'micro services', 'service oriented', 'soa',
        'design patterns', 'architectural patterns', 'hld', 'high level design', 'lld', 'low level design',
        'caching', 'cache', 'cdn', 'message queue', 'kafka', 'rabbitmq', 'redis cache'
    ],

    debugging: [
        'debugging', 'debug', 'troubleshooting', 'troubleshoot', 'bug fix', 'bug fixing',
        'error handling', 'exception handling', 'root cause analysis', 'rca',
        'log analysis', 'monitoring', 'profiling', 'performance tuning'
    ],

    api_design: [
        'api', 'rest', 'restful', 'rest api', 'graphql', 'grpc', 'soap',
        'endpoint', 'endpoints', 'api design', 'api development',
        'microservice api', 'web service', 'web services', 'http', 'https'
    ],

    database: [
        // SQL
        'database', 'sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'sql server',
        // NoSQL
        'nosql', 'mongodb', 'cassandra', 'dynamodb', 'couchdb',
        // Concepts
        'rdbms', 'acid', 'transactions', 'indexing', 'query optimization',
        'database design', 'schema design', 'normalization', 'denormalization',
        // In-memory
        'redis', 'memcached', 'cache database'
    ],

    cloud: [
        // AWS
        'aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'rds', 'dynamodb aws', 'eks', 'ecs',
        // Azure
        'azure', 'microsoft azure', 'azure functions', 'azure devops',
        // GCP
        'gcp', 'google cloud', 'google cloud platform', 'gke', 'cloud functions',
        // General
        'cloud', 'cloud computing', 'cloud infrastructure', 'cloud native',
        'serverless', 'iaas', 'paas', 'saas'
    ],

    security: [
        'security', 'cybersecurity', 'appsec', 'application security', 'infosec',
        'encryption', 'decryption', 'ssl', 'tls', 'https',
        'authentication', 'authorization', 'oauth', 'jwt', 'saml', 'sso',
        'penetration testing', 'pen test', 'vulnerability', 'owasp',
        'secure coding', 'security best practices'
    ],

    performance: [
        'performance', 'optimization', 'optimize', 'performance tuning',
        'profiling', 'benchmarking', 'latency', 'throughput',
        'memory optimization', 'cpu optimization', 'query optimization',
        'caching strategy', 'lazy loading', 'code optimization'
    ],

    testing: [
        'testing', 'test', 'qa', 'quality assurance',
        'unit test', 'unit testing', 'integration test', 'integration testing',
        'e2e', 'end to end', 'automation testing', 'test automation',
        'tdd', 'test driven development', 'bdd', 'behavior driven',
        'jest', 'mocha', 'chai', 'junit', 'pytest', 'selenium', 'cypress'
    ],

    devops: [
        'devops', 'dev ops', 'ci/cd', 'ci cd', 'continuous integration', 'continuous deployment',
        'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci',
        'deployment', 'release management', 'infrastructure as code', 'iac',
        'terraform', 'ansible', 'puppet', 'chef', 'cloudformation'
    ],

    frontend: [
        // Frameworks
        'react', 'reactjs', 'react.js', 'vue', 'vuejs', 'vue.js', 'angular', 'angularjs',
        'next', 'nextjs', 'next.js', 'nuxt', 'svelte',
        // Languages
        'javascript', 'js', 'typescript', 'ts', 'html', 'css', 'scss', 'sass', 'less',
        // Concepts
        'frontend', 'front end', 'front-end', 'ui development', 'web development',
        'responsive design', 'mobile first', 'spa', 'single page application',
        // Tools
        'webpack', 'vite', 'babel', 'eslint', 'prettier'
    ],

    mobile: [
        // iOS
        'ios', 'swift', 'objective-c', 'objective c', 'xcode', 'cocoa', 'uikit', 'swiftui',
        // Android
        'android', 'kotlin', 'java android', 'android studio', 'jetpack compose',
        // Cross-platform
        'react native', 'flutter', 'ionic', 'xamarin', 'cordova',
        // General
        'mobile development', 'mobile app', 'app development'
    ],

    data_structures: [
        'data structure', 'data structures', 'ds', 'dsa',
        'array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'heap', 'hash table', 'hashmap',
        'binary tree', 'bst', 'trie', 'segment tree', 'fenwick tree',
        'dynamic programming', 'dp', 'greedy', 'backtracking', 'recursion'
    ],

    ml_ai: [
        // General
        'machine learning', 'ml', 'deep learning', 'dl', 'ai', 'artificial intelligence',
        'neural network', 'cnn', 'rnn', 'lstm', 'transformer',
        // Frameworks
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
        // Domains
        'nlp', 'natural language processing', 'computer vision', 'cv',
        'reinforcement learning', 'supervised learning', 'unsupervised learning',
        // Concepts
        'model training', 'feature engineering', 'data science'
    ],

    data_engineering: [
        'data engineering', 'data engineer', 'etl', 'elt', 'data pipeline', 'data pipelines',
        'data warehouse', 'data warehousing', 'data lake',
        'spark', 'apache spark', 'hadoop', 'hive', 'presto', 'airflow',
        'big data', 'data processing', 'batch processing', 'stream processing',
        'snowflake', 'redshift', 'bigquery'
    ],

    networking: [
        'networking', 'network', 'tcp/ip', 'tcp', 'ip', 'http', 'https', 'dns',
        'load balancing', 'load balancer', 'nginx', 'haproxy',
        'cdn', 'content delivery network', 'routing', 'firewall',
        'vpn', 'proxy', 'reverse proxy', 'websocket', 'socket'
    ],

    microservices: [
        'microservices', 'micro services', 'microservice architecture',
        'service mesh', 'istio', 'linkerd', 'api gateway', 'kong',
        'event driven', 'message queue', 'kafka', 'rabbitmq', 'sqs',
        'service discovery', 'consul', 'eureka', 'circuit breaker'
    ],

    containers: [
        'docker', 'container', 'containerization', 'dockerfile',
        'kubernetes', 'k8s', 'helm', 'kubectl', 'pod', 'deployment',
        'orchestration', 'container orchestration', 'ecs', 'eks', 'gke', 'aks',
        'docker compose', 'docker swarm'
    ],

    monitoring: [
        'monitoring', 'observability', 'logging', 'metrics', 'tracing',
        'prometheus', 'grafana', 'elk', 'elasticsearch', 'logstash', 'kibana',
        'datadog', 'new relic', 'splunk', 'cloudwatch',
        'apm', 'application performance monitoring', 'alerting'
    ],

    version_control: [
        'git', 'github', 'gitlab', 'bitbucket', 'version control', 'vcs',
        'source control', 'branching', 'merging', 'pull request', 'pr',
        'code review', 'commit', 'repository', 'repo'
    ],

    // ========================================
    // PRODUCT & DESIGN
    // ========================================
    product_strategy: [
        'product strategy', 'product vision', 'product roadmap', 'roadmap',
        'prioritization', 'okr', 'kpi', 'product planning',
        'go to market', 'gtm', 'product launch', 'mvp', 'minimum viable product',
        'product market fit', 'pmf', 'product lifecycle'
    ],

    user_research: [
        'user research', 'user interview', 'customer interview',
        'survey', 'usability testing', 'user testing', 'a/b testing', 'ab testing',
        'user feedback', 'customer feedback', 'persona', 'user persona',
        'journey map', 'user journey', 'empathy map'
    ],

    metrics_analytics: [
        'metrics', 'analytics', 'data analysis', 'kpi', 'okr',
        'a/b test', 'ab test', 'experimentation', 'funnel analysis',
        'cohort analysis', 'retention', 'churn', 'conversion rate',
        'google analytics', 'mixpanel', 'amplitude', 'segment'
    ],

    ux_design: [
        'ux', 'user experience', 'ux design', 'interaction design',
        'wireframe', 'wireframing', 'prototype', 'prototyping',
        'user flow', 'information architecture', 'ia',
        'usability', 'accessibility', 'a11y', 'user centered design'
    ],

    ui_design: [
        'ui', 'user interface', 'ui design', 'visual design',
        'figma', 'sketch', 'adobe xd', 'invision', 'zeplin',
        'design system', 'component library', 'style guide',
        'typography', 'color theory', 'layout', 'grid system'
    ],

    product_sense: [
        'product sense', 'product thinking', 'product intuition',
        'feature ideation', 'feature prioritization', 'trade-off', 'tradeoff',
        'product decision', 'product judgment', 'customer empathy'
    ],

    stakeholder_management: [
        'stakeholder management', 'stakeholder', 'cross functional', 'cross-functional',
        'collaboration', 'communication', 'alignment',
        'executive communication', 'influence', 'negotiation'
    ],

    go_to_market: [
        'go to market', 'gtm', 'launch strategy', 'product launch',
        'positioning', 'messaging', 'market entry',
        'competitive analysis', 'market research', 'target market'
    ],

    // ========================================
    // BUSINESS & LEADERSHIP
    // ========================================
    strategic_thinking: [
        'strategic thinking', 'strategy', 'strategic planning',
        'long term planning', 'vision', 'strategic vision',
        'business strategy', 'competitive strategy', 'growth strategy'
    ],

    business_acumen: [
        'business acumen', 'business', 'p&l', 'profit and loss',
        'revenue', 'cost', 'margin', 'roi', 'return on investment',
        'market dynamics', 'business model', 'unit economics'
    ],

    leadership: [
        'leadership', 'team management', 'people management',
        'mentoring', 'coaching', 'team building', 'motivation',
        'delegation', 'empowerment', 'servant leadership',
        'manager', 'lead', 'director', 'vp', 'ceo', 'cto'
    ],

    decision_making: [
        'decision making', 'decision', 'trade-off', 'tradeoff',
        'prioritization', 'judgment', 'critical thinking',
        'data driven decision', 'risk assessment'
    ],

    conflict_resolution: [
        'conflict resolution', 'conflict management', 'mediation',
        'dispute resolution', 'difficult conversation',
        'feedback', 'constructive feedback', 'performance management'
    ],

    hiring: [
        'hiring', 'recruitment', 'recruiting', 'talent acquisition',
        'interviewing', 'interview', 'candidate evaluation',
        'hiring manager', 'talent', 'onboarding'
    ],

    organizational_design: [
        'organizational design', 'org design', 'team structure',
        'scaling', 'scaling team', 'org chart', 'reporting structure',
        'matrix organization', 'functional organization'
    ],

    change_management: [
        'change management', 'transformation', 'organizational change',
        'adoption', 'change adoption', 'process improvement',
        'agile transformation', 'digital transformation'
    ],

    financial_planning: [
        'financial planning', 'budgeting', 'budget', 'forecasting',
        'financial analysis', 'cost management', 'roi',
        'capex', 'opex', 'financial model'
    ],

    risk_management: [
        'risk management', 'risk assessment', 'risk mitigation',
        'compliance', 'audit', 'governance', 'internal control'
    ],

    vendor_management: [
        'vendor management', 'vendor', 'supplier', 'procurement',
        'contract negotiation', 'partnership', 'third party'
    ],

    crisis_management: [
        'crisis management', 'incident response', 'disaster recovery',
        'business continuity', 'emergency response', 'crisis communication'
    ],

    // ========================================
    // SALES & MARKETING
    // ========================================
    sales_strategy: [
        'sales', 'sales strategy', 'sales process', 'pipeline',
        'forecasting', 'closing', 'deal closing', 'quota',
        'crm', 'salesforce', 'account management', 'b2b sales', 'b2c sales',
        'enterprise sales', 'inside sales', 'outbound sales'
    ],

    customer_success: [
        'customer success', 'cs', 'csm', 'customer success manager',
        'retention', 'churn', 'upsell', 'cross-sell', 'expansion',
        'customer satisfaction', 'nps', 'net promoter score',
        'customer support', 'account management'
    ],

    marketing_strategy: [
        'marketing', 'marketing strategy', 'campaign', 'marketing campaign',
        'branding', 'brand', 'positioning', 'messaging',
        'digital marketing', 'performance marketing', 'demand generation',
        'lead generation', 'funnel', 'marketing funnel'
    ],

    content_marketing: [
        'content marketing', 'content strategy', 'content creation',
        'seo', 'search engine optimization', 'sem', 'search engine marketing',
        'copywriting', 'blog', 'blogging', 'content writer',
        'editorial', 'content calendar'
    ],

    growth_hacking: [
        'growth hacking', 'growth', 'growth strategy', 'viral',
        'viral loop', 'acquisition', 'activation', 'retention',
        'referral', 'revenue', 'aarrr', 'pirate metrics',
        'product led growth', 'plg'
    ],

    brand_management: [
        'brand management', 'brand', 'branding', 'brand identity',
        'brand positioning', 'brand awareness', 'brand equity',
        'brand strategy', 'rebranding'
    ],

    // ========================================
    // SOFT SKILLS
    // ========================================
    communication: [
        'communication', 'verbal communication', 'written communication',
        'presentation', 'public speaking', 'articulation',
        'clarity', 'concise', 'storytelling', 'executive presence'
    ],

    collaboration: [
        'collaboration', 'teamwork', 'team player', 'cross functional',
        'partnership', 'cooperative', 'interpersonal',
        'working with others', 'team collaboration'
    ],

    problem_solving: [
        'problem solving', 'analytical', 'analytical thinking',
        'critical thinking', 'creative thinking', 'innovation',
        'troubleshooting', 'root cause analysis', 'solution oriented'
    ],

    adaptability: [
        'adaptability', 'flexibility', 'agile', 'learning agility',
        'quick learner', 'fast learner', 'adaptable', 'versatile',
        'change', 'dynamic environment'
    ],

    time_management: [
        'time management', 'prioritization', 'organization',
        'efficiency', 'productivity', 'multitasking', 'deadline',
        'project management', 'task management'
    ],

    emotional_intelligence: [
        'emotional intelligence', 'eq', 'empathy', 'self awareness',
        'social awareness', 'relationship management',
        'emotional regulation', 'interpersonal skills'
    ],

    cultural_fit: [
        'cultural fit', 'culture', 'values', 'company culture',
        'team dynamics', 'workplace culture', 'diversity',
        'inclusion', 'belonging'
    ],

    work_ethic: [
        'work ethic', 'dedication', 'commitment', 'accountability',
        'responsibility', 'reliability', 'dependable', 'self motivated',
        'proactive', 'ownership'
    ],

    // ========================================
    // FREELANCE & GIG ECONOMY
    // ========================================
    copywriting: [
        'copywriting', 'copywriter', 'content writing', 'content writer',
        'ad copy', 'advertising copy', 'blog writing', 'article writing',
        'web content', 'marketing copy', 'creative writing'
    ],

    graphic_design: [
        'graphic design', 'graphic designer', 'visual design',
        'logo design', 'branding design', 'photoshop', 'illustrator',
        'indesign', 'canva', 'visual assets', 'print design'
    ],

    video_editing: [
        'video editing', 'video editor', 'video production',
        'premiere pro', 'final cut', 'after effects', 'motion graphics',
        'videography', 'post production', 'editing'
    ],

    social_media: [
        'social media', 'social media management', 'social media manager', 'smm',
        'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok',
        'content calendar', 'engagement', 'community management',
        'social media marketing', 'influencer'
    ],

    seo_specialist: [
        'seo', 'search engine optimization', 'seo specialist', 'seo expert',
        'keyword research', 'on page seo', 'off page seo', 'link building',
        'google search', 'ranking', 'serp', 'organic traffic'
    ],

    virtual_assistant: [
        'virtual assistant', 'va', 'administrative assistant', 'admin',
        'scheduling', 'calendar management', 'email management',
        'data entry', 'administrative support', 'remote assistant'
    ],

    data_entry: [
        'data entry', 'data processing', 'data operator',
        'typing', 'accuracy', 'spreadsheet', 'excel',
        'data management', 'clerical'
    ],

    translation: [
        'translation', 'translator', 'language translation',
        'localization', 'interpreter', 'bilingual', 'multilingual',
        'language', 'foreign language'
    ],

    voice_over: [
        'voice over', 'voice actor', 'voiceover', 'narration',
        'voice acting', 'audio recording', 'voice talent',
        'dubbing', 'voice artist'
    ],

    illustration: [
        'illustration', 'illustrator', 'digital art', 'digital artist',
        'character design', 'concept art', 'drawing',
        'artwork', 'artistic'
    ],

    animation: [
        'animation', 'animator', '2d animation', '3d animation',
        'motion design', 'motion graphics', 'animated',
        'blender', 'maya', 'cinema 4d'
    ],

    photography: [
        'photography', 'photographer', 'photo', 'photoshoot',
        'product photography', 'portrait', 'event photography',
        'photo editing', 'lightroom', 'camera'
    ],

    web_development: [
        'web development', 'web developer', 'website',
        'wordpress', 'shopify', 'wix', 'squarespace',
        'html', 'css', 'javascript', 'web design',
        'full stack', 'fullstack', 'mern', 'mean', 'lamp'
    ],

    app_development: [
        'app development', 'mobile app', 'application development',
        'no code', 'low code', 'bubble', 'webflow',
        'custom app', 'mobile development'
    ],

    consulting: [
        'consulting', 'consultant', 'advisor', 'advisory',
        'strategy consulting', 'management consulting',
        'business consulting', 'expert', 'expertise'
    ],

    // ========================================
    // GAMING INDUSTRY
    // ========================================
    game_development: [
        'game development', 'game developer', 'game programmer',
        'unity', 'unreal', 'unreal engine', 'game engine',
        'gameplay', 'game programming', 'game dev',
        'godot', 'cocos2d', 'game logic'
    ],

    game_design: [
        'game design', 'game designer', 'level design', 'level designer',
        'game mechanics', 'gameplay mechanics', 'balancing',
        'systems designer', 'game systems', 'game balance'
    ],

    game_art: [
        'game art', 'game artist', '3d modeling', '3d artist',
        'texturing', 'environment art', 'character art',
        'concept art', 'game assets', 'asset creation'
    ],

    game_qa: [
        'game qa', 'game tester', 'game testing', 'qa tester',
        'playtesting', 'playtest', 'bug testing', 'quality assurance game',
        'game quality'
    ],

    game_audio: [
        'game audio', 'sound design', 'audio designer', 'sound designer',
        'music composition', 'game music', 'audio implementation',
        'sfx', 'sound effects', 'game sound'
    ],

    game_production: [
        'game production', 'game producer', 'producer',
        'project management game', 'game project', 'production',
        'scheduling', 'coordination', 'game development management'
    ],

    esports: [
        'esports', 'e-sports', 'competitive gaming', 'tournament',
        'esports manager', 'coach', 'analyst', 'caster',
        'shoutcaster', 'gaming competition', 'professional gaming'
    ],

    community_management: [
        'community management', 'community manager', 'moderator',
        'player engagement', 'player support', 'community',
        'discord', 'forum', 'player feedback'
    ],

    game_monetization: [
        'game monetization', 'monetization', 'liveops', 'live ops',
        'iap', 'in app purchase', 'economy design', 'game economy',
        'f2p', 'free to play', 'gacha'
    ],

    game_analytics: [
        'game analytics', 'game analyst', 'player metrics',
        'retention game', 'game data', 'player behavior',
        'game metrics', 'analytics game'
    ]
}

// ========================================
// SEMANTIC/FUZZY MATCHING HELPERS
// ========================================

/**
 * Calculate Levenshtein distance for fuzzy matching
 * Handles typos like "javascrpt" → "javascript"
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            )
        }
    }

    return matrix[len1][len2]
}

/**
 * Check if two strings are similar (fuzzy match)
 * Allows for typos and minor variations
 */
function isSimilar(str1: string, str2: string, threshold: number = 2): boolean {
    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
    const maxLength = Math.max(str1.length, str2.length)

    // Allow up to 'threshold' character differences
    // OR allow 20% difference for longer strings
    return distance <= threshold || distance <= maxLength * 0.2
}

/**
 * Extract words from text (handles camelCase, snake_case, etc.)
 */
function extractWords(text: string): string[] {
    return text
        .toLowerCase()
        // Split on non-alphanumeric characters
        .split(/[^a-z0-9]+/)
        // Also split camelCase
        .flatMap(word => word.split(/(?=[A-Z])/))
        .filter(word => word.length > 2) // Ignore very short words
}

/**
 * Enhanced category selection with semantic/fuzzy matching
 * 
 * Features:
 * - Exact keyword matching (highest score)
 * - Fuzzy matching for typos (medium score)
 * - Partial word matching (lower score)
 * - Multi-word phrase detection
 */
export function selectCategoriesFromJD(jdText: string): string[] {
    if (!jdText) return []

    const text = jdText.toLowerCase()
    const words = extractWords(jdText)
    const categoryScores: Record<string, number> = {}

    // Calculate score for each category based on keyword matches
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0

        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase()

            // 1. EXACT MATCH (highest score)
            if (text.includes(keywordLower)) {
                const wordCount = keyword.split(' ').length
                score += wordCount * 10 // Multi-word keywords get 10x weight
                continue
            }

            // 2. FUZZY MATCH for typos (medium score)
            // e.g., "javascrpt" matches "javascript"
            const keywordWords = keyword.split(' ')
            if (keywordWords.length === 1) {
                for (const word of words) {
                    if (word.length > 3 && isSimilar(word, keywordLower, 2)) {
                        score += 5 // Fuzzy match gets 5 points
                        break
                    }
                }
            }

            // 3. PARTIAL WORD MATCH (lower score)
            // e.g., "react" matches "reactjs", "react-native"
            if (keywordLower.length > 4) {
                for (const word of words) {
                    if (word.includes(keywordLower) || keywordLower.includes(word)) {
                        if (Math.abs(word.length - keywordLower.length) <= 3) {
                            score += 3 // Partial match gets 3 points
                            break
                        }
                    }
                }
            }

            // 4. ACRONYM MATCH
            // e.g., "ML" matches "machine learning", "AI" matches "artificial intelligence"
            if (keyword.includes(' ')) {
                const acronym = keyword.split(' ').map(w => w[0]).join('')
                if (words.includes(acronym) || text.includes(` ${acronym} `) || text.includes(` ${acronym},`)) {
                    score += 7 // Acronym match gets 7 points
                }
            }
        }

        if (score > 0) {
            categoryScores[category] = score
        }
    }

    // Select categories with score > 0, sorted by score (highest first)
    const sortedCategories = Object.entries(categoryScores)
        .sort(([, a], [, b]) => b - a)
        .map(([category]) => category)

    // Return top categories (limit to avoid overwhelming)
    // But include all with score >= 10 (strong matches)
    const strongMatches = sortedCategories.filter((cat) => categoryScores[cat] >= 10)
    const otherMatches = sortedCategories.filter((cat) => categoryScores[cat] < 10).slice(0, 5)

    return [...strongMatches, ...otherMatches]
}

/**
 * Get category match details for debugging/display
 */
export function getCategoryMatchDetails(jdText: string): Record<string, { score: number; matches: string[] }> {
    if (!jdText) return {}

    const text = jdText.toLowerCase()
    const words = extractWords(jdText)
    const categoryDetails: Record<string, { score: number; matches: string[] }> = {}

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        let score = 0
        const matches: string[] = []

        for (const keyword of keywords) {
            const keywordLower = keyword.toLowerCase()

            if (text.includes(keywordLower)) {
                const wordCount = keyword.split(' ').length
                score += wordCount * 10
                matches.push(`"${keyword}" (exact)`)
            } else {
                // Check fuzzy/partial matches
                const keywordWords = keyword.split(' ')
                if (keywordWords.length === 1) {
                    for (const word of words) {
                        if (word.length > 3 && isSimilar(word, keywordLower, 2)) {
                            score += 5
                            matches.push(`"${keyword}" (fuzzy: ${word})`)
                            break
                        }
                    }
                }
            }
        }

        if (score > 0) {
            categoryDetails[category] = { score, matches }
        }
    }

    return categoryDetails
}

export default CATEGORY_KEYWORDS
