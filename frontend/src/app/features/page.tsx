'use client'

import Header from '@/components/Header'
import FeaturesSection from '../components/landing/FeaturesSection'
import StatsSection from '../components/landing/StatsSection'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function FeaturesPage() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            The <span className="text-brand-primary">Features</span> that Power<br />
                            Modern Hiring
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            Explore the advanced AI technology and 6-agent swarm systems that make SwarmHire the most versatile hiring platform on the market.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href="/signup"
                                className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                            >
                                <span>Try for Free</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                <StatsSection />
                <FeaturesSection />

                {/* Configuration Section */}
                <section className="py-20 px-4 bg-gray-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
                            <span className="text-brand-primary">Infinitely</span> Configurable
                        </h2>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            Role templates + Assessment modules + Domain knowledge = Unlimited hiring scenarios
                        </p>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-8 bg-white rounded-xl border border-gray-200 hover:border-brand-primary transition-all shadow-sm hover:shadow-md">
                                <div className="text-4xl mb-4">🎯</div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">Role Templates</h3>
                                <p className="text-gray-600 mb-4">
                                    Pre-configured for 100+ roles. Add new ones in minutes.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Technical roles (20+ templates)</li>
                                    <li>✓ Business roles (12+ templates)</li>
                                    <li>✓ Specialized domains (60+ templates)</li>
                                    <li>✓ Custom templates (unlimited)</li>
                                </ul>
                            </div>

                            <div className="p-8 bg-white rounded-xl border border-gray-200 hover:border-brand-primary transition-all shadow-sm hover:shadow-md">
                                <div className="text-4xl mb-4">🔧</div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">Assessment Modules</h3>
                                <p className="text-gray-600 mb-4">
                                    Mix and match evaluation methods for any role.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Live coding & problem solving</li>
                                    <li>✓ Portfolio & file review</li>
                                    <li>✓ Video & role-play scenarios</li>
                                    <li>✓ Custom modules (build your own)</li>
                                </ul>
                            </div>

                            <div className="p-8 bg-white rounded-xl border border-gray-200 hover:border-brand-primary transition-all shadow-sm hover:shadow-md">
                                <div className="text-4xl mb-4">🧠</div>
                                <h3 className="text-2xl font-bold mb-3 text-gray-900">Domain Knowledge</h3>
                                <p className="text-gray-600 mb-4">
                                    Agents spawn with specialized expertise.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Software engineering KB</li>
                                    <li>✓ Medical & healthcare KB</li>
                                    <li>✓ Legal & compliance KB</li>
                                    <li>✓ Custom knowledge bases</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Placeholder for visual consistency - simplified */}
                <footer className="bg-gray-100 border-t border-gray-200 py-12 px-4 mt-20">
                    <div className="max-w-6xl mx-auto text-center text-gray-600">
                        <p>© 2024 SwarmHire. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}
