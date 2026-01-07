'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowRight, Brain, Zap, TrendingUp, Shield, Users, CheckCircle, Twitter, Linkedin, Github } from 'lucide-react'

export default function SimplifiedLanding() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50">

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="inline-block mb-6 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                            <span className="text-sm font-medium text-brand-primary">AI-Powered Hiring Platform</span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
                            The <span className="text-brand-primary">Universal</span><br />
                            <span className="bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text text-transparent">
                                Hiring Platform
                            </span>
                        </h1>

                        <p className="text-2xl md:text-3xl text-gray-700 mb-4 max-w-3xl mx-auto font-semibold">
                            Any role. Any industry. Any requirement.
                        </p>

                        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                            SwarmHire's dynamic agent architecture adapts to <strong>every hiring decision</strong> - from technical interviews to executive assessments. One unified platform, infinite possibilities.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/quick-start"
                                className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                            >
                                <span>Try Free Interview</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/how-it-works"
                                className="px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <span>See How It Works</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Simple Value Prop */}
                <section id="features" className="py-20 px-4 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                                    <span className="text-brand-primary">Demand:</span> You're Hiring
                                </h2>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Post Your Requirement</p>
                                            <p className="text-gray-600">Add requirements description and skills needed</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Share the Link</p>
                                            <p className="text-gray-600">Send to candidates or post publicly</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Review Results</p>
                                            <p className="text-gray-600">AI provides scores and recommendations on your dashboard</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                                    <span className="text-purple-600">Supply:</span> You're the Candidate
                                </h2>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Get the Link</p>
                                            <p className="text-gray-600">From provider, requirement board, or try Quick-Start</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Talk to AI</p>
                                            <p className="text-gray-600">Natural conversation, adaptive questions</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-900">Get Feedback</p>
                                            <p className="text-gray-600">Instant results for practice mode</p>
                                            <p className="text-gray-600">Recruiter reviews for formal assessments</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Big Picture */}
                <section id="about" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-6 text-gray-900">
                            The <span className="text-brand-primary">Big Picture</span>
                        </h2>
                        <p className="text-center text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                            SwarmHire isn't just an interaction platform. It's a universal matching framework that adapts to any requirement you can imagine.
                        </p>

                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                                <div className="text-5xl mb-4">🎓</div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">For Organizations</h3>
                                <p className="text-gray-600 text-lg">
                                    Configure requirement templates once. Match software engineers, product managers, executives - all from one platform.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                                <div className="text-5xl mb-4">🚀</div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">For Candidates</h3>
                                <p className="text-gray-600 text-lg">
                                    Practice interviews/interaction for any role. Get AI-powered feedback. Improve your skills continuously.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6-Agent System */}
                <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
                            Powered by <span className="text-brand-primary">6 Specialized AI Agents</span>
                        </h2>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            Each agent has a specific role in conducting the perfect interaction
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            <AgentCard
                                icon={<Brain className="w-8 h-8" />}
                                title="Strategy Agent"
                                description="Analyzes your requirements and plans the perfect interaction flow"
                                color="orange"
                            />
                            <AgentCard
                                icon={<Zap className="w-8 h-8" />}
                                title="Executioner Agent"
                                description="Asks intelligent questions and drives the conversation"
                                color="blue"
                            />
                            <AgentCard
                                icon={<TrendingUp className="w-8 h-8" />}
                                title="Evaluator Agent"
                                description="Scores responses and powers the 5-strategy swarm for intelligent follow-ups"
                                color="green"
                            />
                            <AgentCard
                                icon={<Shield className="w-8 h-8" />}
                                title="Observer Agent"
                                description="Detects plagiarism, monitors behavior, and learns to improve system intelligence"
                                color="red"
                            />
                            <AgentCard
                                icon={<Users className="w-8 h-8" />}
                                title="Critique Agent"
                                description="Provides feedback and ensures interaction quality"
                                color="purple"
                            />
                            <AgentCard
                                icon={<CheckCircle className="w-8 h-8" />}
                                title="Monitor Agent"
                                description="Logs everything and tracks interaction progress"
                                color="gray"
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-purple-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                            Ready to Transform <span className="text-brand-primary">Hiring</span>?
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Join EPAM and other leading organizations using SwarmHire
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/quick-start"
                                className="px-10 py-5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 text-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/how-it-works"
                                className="px-10 py-5 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all text-lg"
                            >
                                Learn More
                            </Link>
                            <Link
                                href="/subscription"
                                className="px-10 py-5 border-2 border-gray-400 text-gray-700 font-semibold rounded-lg hover:border-black hover:text-black transition-all text-lg"
                            >
                                View Pricing
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-100 border-t border-gray-200 py-12 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">
                                    Swarm<span className="text-brand-primary">Hire</span>
                                </h3>
                                <p className="text-gray-600 text-sm mb-6">
                                    AI-powered interaction platform matching demand with supply.
                                </p>
                                <div className="flex gap-4">
                                    <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                                        <Linkedin className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-brand-primary transition-colors">
                                        <Github className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4 text-gray-900">Product</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li><Link href="/how-it-works" className="hover:text-brand-primary transition-colors">How It Works</Link></li>
                                    <li><Link href="/subscription" className="hover:text-brand-primary transition-colors">Pricing</Link></li>
                                    <li><Link href="/features" className="hover:text-brand-primary transition-colors">Features</Link></li>
                                    <li><Link href="/quick-start" className="hover:text-brand-primary transition-colors">Quick Start</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4 text-gray-900">Resources</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li><Link href="/wiki" className="hover:text-brand-primary transition-colors">Documentation</Link></li>
                                    <li><Link href="/login" className="hover:text-brand-primary transition-colors">Login</Link></li>
                                    <li><Link href="/signup" className="hover:text-brand-primary transition-colors">Sign Up</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4 text-gray-900">Platform</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li><Link href="/about" className="hover:text-brand-primary transition-colors">About</Link></li>
                                    <li><Link href="/contact" className="hover:text-brand-primary transition-colors">Contact</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-600">
                            <p>© 2024 SwarmHire. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}

function AgentCard({ icon, title, description, color }: any) {
    const colorClasses: any = {
        orange: 'border-orange-300 hover:border-orange-500 hover:shadow-orange-200',
        blue: 'border-blue-300 hover:border-blue-500 hover:shadow-blue-200',
        green: 'border-green-300 hover:border-green-500 hover:shadow-green-200',
        red: 'border-red-300 hover:border-red-500 hover:shadow-red-200',
        purple: 'border-purple-300 hover:border-purple-500 hover:shadow-purple-200',
        gray: 'border-gray-300 hover:border-gray-500 hover:shadow-gray-200',
    }

    const iconColorClasses: any = {
        orange: 'text-orange-600',
        blue: 'text-blue-600',
        green: 'text-green-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
        gray: 'text-gray-600',
    }

    return (
        <div className={`p-6 rounded-xl border-2 bg-white ${colorClasses[color]} hover:shadow-lg transition-all`}>
            <div className={`mb-4 ${iconColorClasses[color]}`}>{icon}</div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    )
}

function FeatureCard({ icon, title, description, color }: any) {
    const colorClasses: any = {
        orange: 'from-orange-500/10 to-red-500/10 border-orange-500/20',
        blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
        green: 'from-green-500/10 to-emerald-500/10 border-green-500/20',
    }

    const iconColorClasses: any = {
        orange: 'text-orange-600',
        blue: 'text-blue-600',
        green: 'text-green-600',
    }

    return (
        <div className={`p-8 rounded-2xl border bg-gradient-to-br ${colorClasses[color]} hover:shadow-lg transition-all`}>
            <div className={`mb-4 ${iconColorClasses[color]}`}>{icon}</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}

function PricingCard({ tier, price, period, description, features, cta, ctaLink, highlighted, badge }: any) {
    return (
        <div className={`relative p-8 rounded-2xl ${highlighted ? 'bg-black text-white ring-4 ring-brand-primary transform scale-105' : 'bg-white border border-gray-200'}`}>
            {badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-brand-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                        {badge}
                    </span>
                </div>
            )}
            <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-gray-900'}`}>{tier}</h3>
            <p className={`text-sm mb-6 ${highlighted ? 'text-gray-300' : 'text-gray-600'}`}>{description}</p>
            <div className="mb-6">
                <span className="text-4xl font-bold">{price}</span>
                {period && <span className={highlighted ? 'text-gray-300' : 'text-gray-600'}>{period}</span>}
            </div>
            <ul className="space-y-3 mb-8">
                {features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlighted ? 'text-brand-primary' : 'text-green-500'}`} />
                        <span className={`text-sm ${highlighted ? 'text-gray-200' : 'text-gray-700'}`}>{feature}</span>
                    </li>
                ))}
            </ul>
            <Link
                href={ctaLink}
                className={`block w-full py-3 rounded-lg font-semibold text-center transition-all ${highlighted
                    ? 'bg-brand-primary text-white hover:bg-orange-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
            >
                {cta}
            </Link>
        </div>
    )
}
