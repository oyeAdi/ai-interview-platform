'use client'

import Link from 'next/link'

interface Plan {
    name: string
    price: string
    description: string
    features: string[]
    cta: string
    highlight?: boolean
}

const plans: Plan[] = [
    {
        name: 'Free',
        price: '$0',
        description: 'Perfect for trying out the platform',
        features: ['Up to 5 interviews/interaction per month', 'Basic agent features', 'Community support'],
        cta: 'Get Started',
        highlight: false,
    },
    {
        name: 'Starter',
        price: '$99',
        description: 'For small teams and individual users',
        features: ['Up to 50 interviews/interaction per month', 'All agent features', 'Email support', 'Custom templates'],
        cta: 'Start Free Trial',
        highlight: true,
    },
    {
        name: 'Pro',
        price: '$299',
        description: 'For growing companies',
        features: [
            'Unlimited interviews/interaction',
            'Advanced analytics',
            'Priority support',
            'Multi-tenant support',
            'Custom integrations',
        ],
        cta: 'Start Free Trial',
        highlight: false,
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations',
        features: [
            'Everything in Pro',
            'Dedicated support',
            'SLA guarantees',
            'Custom deployment',
            'On-premise options',
        ],
        cta: 'Contact Sales',
        highlight: false,
    },
]

export default function PricingPreviewSection() {
    return (
        <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900">
                        Simple, <span className="text-brand-primary">Transparent</span> Pricing
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Choose the plan that fits your needs. All plans include our core AI interview platform.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`p-6 rounded-xl border-2 transition-all shadow-sm hover:shadow-lg ${plan.highlight
                                ? 'border-brand-primary bg-white transform scale-105'
                                : 'border-gray-200 bg-white hover:border-brand-primary'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="text-xs font-semibold text-brand-primary mb-2 text-center">
                                    MOST POPULAR
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                            <div className="mb-2">
                                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                {plan.price !== 'Custom' && (
                                    <span className="text-gray-600 text-sm">/month</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                                        <span className="text-brand-primary mr-2">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={plan.price === 'Custom' ? '/contact' : '/subscription'}
                                className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all ${plan.highlight
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        href="/subscription"
                        className="inline-block px-6 py-3 text-brand-primary font-semibold hover:underline"
                    >
                        View All Plans & Features →
                    </Link>
                </div>
            </div>
        </section>
    )
}

