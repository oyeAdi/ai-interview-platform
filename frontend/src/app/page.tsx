'use client'

import Link from 'next/link'
import Header from '@/components/Header'

export default function LandingV2() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50">

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="inline-block mb-6 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                            <span className="text-sm font-medium text-brand-primary">Universal AI Hiring Platform</span>
                        </div>

                        <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
                            The <span className="text-brand-primary">Universal</span><br />
                            <span className="bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text text-transparent">
                                Hiring Platform
                            </span>
                        </h1>

                        <p className="text-2xl md:text-3xl text-gray-700 mb-4 max-w-3xl mx-auto font-semibold">
                            Any role. Any industry. Any seniority.
                        </p>

                        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                            SwarmHire's dynamic agent architecture adapts to <strong>every hiring decision</strong> - from technical interviews to executive assessments. Configure once, hire infinitely.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/quick-start"
                                className="px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                href="/technology"
                                className="px-8 py-4 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all"
                            >
                                See How It Works
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Extensibility Section */}
                <section className="py-20 px-4">
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

                {/* Dynamic Agent Spawning */}
                <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-4">
                            Dynamic <span className="text-brand-primary">Agent Spawning</span>
                        </h2>
                        <p className="text-center text-gray-300 mb-12 text-lg">
                            Agents adapt to each role automatically - no configuration needed
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">☕</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Backend Engineer (Java)</h3>
                                        <p className="text-sm text-gray-300">Java-specific agents spawn</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>Java knowledge base loaded</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>Spring Boot questions generated</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>JVM optimization scenarios</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">Sales Representative</h3>
                                        <p className="text-sm text-gray-300">Persuasion analysis agents</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>Sales methodology KB loaded</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>Objection handling scenarios</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-brand-primary">→</span>
                                        <span>Closing effectiveness analysis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* B2B/B2C/C2C Section */}
                <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
                            <span className="text-brand-primary">Three</span> Business Models, One Platform
                        </h2>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            SwarmHire adapts to your business model - whether you're hiring, practicing, or building a marketplace
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            {/* B2B: Enterprise Hub */}
                            <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-xl border-2 border-blue-200 dark:border-blue-900/30 hover:border-blue-400 transition-all shadow-md group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">🏢</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise Hub (B2B)</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                                    Strategic hiring for companies & teams at scale.
                                </p>
                                <div className="space-y-3 mb-8 text-xs text-gray-700 dark:text-gray-400">
                                    <div className="flex items-start gap-2 italic">"EPAM uses this to manage 1000s of candidates."</div>
                                    <div className="flex items-center gap-2">✓ Dynamic JD Analysis</div>
                                    <div className="flex items-center gap-2">✓ Multi-Stage Pipelines</div>
                                </div>
                                <Link href="/dashboard" className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Enter Hub →
                                </Link>
                            </div>

                            {/* B2C: Expert Studio */}
                            <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-xl border-2 border-green-200 dark:border-green-900/30 hover:border-green-400 transition-all shadow-md group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-2xl">👤</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Expert Studio (B2C)</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                                    Sell your expertise. Coach & vet students.
                                </p>
                                <div className="space-y-3 mb-8 text-xs text-gray-700 dark:text-gray-400">
                                    <div className="flex items-start gap-2 italic">"Teach Soft Skills or Tech with your own Bar."</div>
                                    <div className="flex items-center gap-2">✓ Personal Review Queue</div>
                                    <div className="flex items-center gap-2">✓ Monetized Lab Packages</div>
                                </div>
                                <Link href="/expert/studio" className="block w-full text-center py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    Open Studio →
                                </Link>
                            </div>

                            {/* C2C: Private Circle */}
                            <div className="p-8 bg-white dark:bg-[#0A0A0A] rounded-xl border-2 border-purple-200 dark:border-purple-900/30 hover:border-purple-400 transition-all shadow-md group">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-2xl">🏠</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Private Circle (C2C)</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                                    Trust-based hiring for your private life.
                                </p>
                                <div className="space-y-3 mb-8 text-xs text-gray-700 dark:text-gray-400">
                                    <div className="flex items-start gap-2 italic">"Hire a Nanny or Roommate with Vibe-Checks."</div>
                                    <div className="flex items-center gap-2">✓ Anti-Leak Privacy</div>
                                    <div className="flex items-center gap-2">✓ ID & Safety Verification</div>
                                </div>
                                <Link href="/private/circle" className="block w-full text-center py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    Access Circle →
                                </Link>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600 italic">
                                💡 <strong>The best part?</strong> All three models run on the same universal platform architecture.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Multi-Tenancy Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
                            <span className="text-brand-primary">Secure</span> Multi-Tenancy
                        </h2>
                        <p className="text-center text-gray-600 mb-12 text-lg">
                            Enterprise-grade data isolation. Each company's data is completely separate.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                                        E
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">EPAM Systems</h3>
                                        <p className="text-sm text-gray-600">Tenant ID: epam</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Isolated database with Row-Level Security</li>
                                    <li>✓ Custom role templates & workflows</li>
                                    <li>✓ Private interview data & analytics</li>
                                    <li>✓ EPAM-specific branding & settings</li>
                                </ul>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                                        G
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Google</h3>
                                        <p className="text-sm text-gray-600">Tenant ID: google</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li>✓ Completely separate from EPAM data</li>
                                    <li>✓ Custom role templates & workflows</li>
                                    <li>✓ Private interview data & analytics</li>
                                    <li>✓ Google-specific branding & settings</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-lg mb-2 text-gray-900">🔒 Database-Level Isolation</h4>
                            <p className="text-gray-700 text-sm">
                                PostgreSQL Row-Level Security (RLS) ensures EPAM can never see Google's data and vice versa.
                                Each tenant operates in a completely isolated environment with zero data leakage risk.
                            </p>
                        </div>
                    </div>
                </section>

                {/* The Big Picture */}
                <section className="py-20 px-4 bg-gradient-to-br from-orange-50 to-purple-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">
                            The <span className="text-brand-primary">Big Picture</span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            SwarmHire isn't just an interview platform. It's a <strong>universal hiring framework</strong> that adapts to <strong>any role you can imagine</strong>.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 text-left">
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-lg mb-2 text-gray-900">🎓 For Companies</h3>
                                <p className="text-gray-700">
                                    Configure role templates once. Hire software engineers, product managers, executives - all from one platform.
                                </p>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                <h3 className="font-bold text-lg mb-2 text-gray-900">🚀 For Candidates</h3>
                                <p className="text-gray-700">
                                    Practice interviews for any role. Get AI-powered feedback. Improve your skills continuously.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                            Ready to Transform <span className="text-brand-primary">Hiring</span>?
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Join EPAM and other leading companies using SwarmHire
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/quick-start"
                                className="px-10 py-5 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-primary-dark transition-all transform hover:scale-105 text-lg shadow-lg"
                            >
                                Start Free Trial →
                            </Link>
                            <Link
                                href="/demo"
                                className="px-10 py-5 border-2 border-gray-300 bg-white text-black font-semibold rounded-lg hover:border-brand-primary transition-all text-lg"
                            >
                                Watch Demo
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <h3 className="text-2xl font-bold mb-4">
                                    Swarm<span className="text-brand-primary">Hire</span>
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    The universal AI hiring platform for any role, any industry, any seniority.
                                </p>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Product</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/features" className="hover:text-brand-primary">Features</Link></li>
                                    <li><Link href="/pricing" className="hover:text-brand-primary">Pricing</Link></li>
                                    <li><Link href="/demo" className="hover:text-brand-primary">Demo</Link></li>
                                    <li><Link href="/docs" className="hover:text-brand-primary">Documentation</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Company</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/about" className="hover:text-brand-primary">About</Link></li>
                                    <li><Link href="/blog" className="hover:text-brand-primary">Blog</Link></li>
                                    <li><Link href="/careers" className="hover:text-brand-primary">Careers</Link></li>
                                    <li><Link href="/contact" className="hover:text-brand-primary">Contact</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-4">Legal</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href="/privacy" className="hover:text-brand-primary">Privacy Policy</Link></li>
                                    <li><Link href="/terms" className="hover:text-brand-primary">Terms of Service</Link></li>
                                    <li><Link href="/security" className="hover:text-brand-primary">Security</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                            <p>© 2024 SwarmHire. All rights reserved.</p>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    )
}
