'use client'

import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowRight, Users, Heart, Target, Globe, Shield, Brain } from 'lucide-react'

export default function AboutPage() {
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            The <span className="text-brand-primary">Big Picture</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                            SwarmHire is on a mission to revolutionize how organizations match with talent using the power of specialized AI swarms.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                                    Our <span className="text-brand-primary">Story</span>
                                </h2>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    SwarmHire isn't just an interview platform. It's a universal hiring framework that adapts to any role you can imagine. We started with a simple observation: traditional hiring is slow, biased, and often fails to identify the best talent.
                                </p>
                                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                    By leveraging a unique 6-agent AI swarm, we've created a system that doesn't just ask questions—it understands requirements, assesses deep technical skills, and provides meaningful insights that help both candidates and companies grow.
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <Users className="w-8 h-8 text-brand-primary mb-2" />
                                        <span className="font-bold text-gray-900">10k+</span>
                                        <span className="text-xs text-gray-600">Interviews</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <Heart className="w-8 h-8 text-purple-600 mb-2" />
                                        <span className="font-bold text-gray-900">500+</span>
                                        <span className="text-xs text-gray-600">Companies</span>
                                    </div>
                                    <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <Globe className="w-8 h-8 text-blue-600 mb-2" />
                                        <span className="font-bold text-gray-900">20+</span>
                                        <span className="text-xs text-gray-600">Countries</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="aspect-square bg-gradient-to-br from-brand-primary/20 to-purple-600/20 rounded-3xl flex items-center justify-center text-8xl">
                                    🚀
                                </div>
                                <div className="absolute -bottom-6 -right-6 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-xs">
                                    <p className="text-sm font-semibold text-gray-900 mb-2 italic">
                                        "The swarm is the brain. You are the soul."
                                    </p>
                                    <p className="text-xs text-gray-600">— SwarmHire Philosophy</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-20 px-4 bg-gray-50">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-12 text-gray-900">What Drives Us</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <ValueCard
                                icon={<Target className="w-10 h-10 text-orange-600" />}
                                title="Precision"
                                description="We believe in finding the perfect match through data-driven AI assessment."
                            />
                            <ValueCard
                                icon={<Shield className="w-10 h-10 text-blue-600" />}
                                title="Fairness"
                                description="Removing human bias through objective, standardized AI evaluation."
                            />
                            <ValueCard
                                icon={<Brain className="w-10 h-10 text-purple-600" />}
                                title="Innovation"
                                description="Continuously pushing the boundaries of what AI can do for human growth."
                            />
                        </div>
                    </div>
                </section>

                {/* Footer Placeholder */}
                <footer className="bg-gray-100 border-t border-gray-200 py-12 px-4">
                    <div className="max-w-6xl mx-auto text-center text-gray-600">
                        <p>© 2024 SwarmHire. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}

function ValueCard({ icon, title, description }: any) {
    return (
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4 flex justify-center">{icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}
