'use client'

interface Feature {
    title: string
    description: string
    icon: string
}

const features: Feature[] = [
    {
        title: '6-Agent Swarm Architecture',
        description: 'Specialized AI agents work together to conduct comprehensive, adaptive interviews.',
        icon: '🤖',
    },
    {
        title: 'Real-time Adaptive Scoring',
        description: 'Dynamic evaluation that adjusts based on candidate responses and performance.',
        icon: '📈',
    },
    {
        title: 'Multi-modal Input Support',
        description: 'Process code, video, audio, and text inputs seamlessly in a single interview.',
        icon: '🎥',
    },
    {
        title: 'Human-in-the-Loop Control',
        description: 'Expert oversight and intervention capabilities for critical hiring decisions.',
        icon: '👨‍💼',
    },
    {
        title: 'Recursive Learning',
        description: 'Platform learns and improves from every interview conducted.',
        icon: '🔄',
    },
    {
        title: 'Multi-tenant Security',
        description: 'Enterprise-grade isolation and security for organizations and teams.',
        icon: '🔒',
    },
]

export default function FeaturesSection() {
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900">
                        Powerful <span className="text-brand-primary">Platform Features</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Everything you need to conduct intelligent, fair, and efficient interviews at scale.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-brand-primary transition-all shadow-sm hover:shadow-md"
                        >
                            <div className="text-3xl mb-4">{feature.icon}</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

