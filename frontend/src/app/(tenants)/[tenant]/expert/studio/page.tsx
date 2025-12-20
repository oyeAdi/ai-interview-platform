'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useParams } from 'next/navigation'

export default function ExpertStudioPage() {
    const params = useParams()
    const tenant = (params?.tenant as string) || 'global'

    const [stats] = useState({
        totalStudents: 42,
        pendingAudits: 5,
        avgRating: 4.9,
        activeSlots: 12
    })

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
            <Header showQuickStart={true} title={`Expert Studio - ${tenant || 'Global'}`} />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white leading-tight mb-3">
                                    Expert <span className="font-normal text-brand-primary">Studio</span> (B2C)
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-light uppercase tracking-widest text-[10px]">
                                    Tenant: {tenant}
                                </p>
                                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-light">
                                    Manage your students, review AI-audits, and grow your coaching brand.
                                </p>
                            </div>
                            <button className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors">
                                Create New Lab
                            </button>
                        </div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Students', value: stats.totalStudents, color: 'text-blue-500' },
                            { label: 'Pending Audits', value: stats.pendingAudits, color: 'text-orange-500' },
                            { label: 'Avg Teacher Rating', value: stats.avgRating, color: 'text-yellow-500' },
                            { label: 'Active Slots', value: stats.activeSlots, color: 'text-green-500' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-[#111111] p-6 rounded-xl border border-gray-200 dark:border-[#2A2A2A]">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{stat.label}</p>
                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Main Content Area */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Audit Queue */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-medium text-black dark:text-white mb-4">Audit Queue</h2>
                            <div className="space-y-4">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="p-4 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-xl hover:border-brand-primary transition-all cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                    S{item}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-black dark:text-white">Student {item}</p>
                                                    <p className="text-xs text-gray-500">System Design Practice • 2h ago</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">AI Analysis Ready</span>
                                                <span className="text-gray-400 group-hover:text-brand-primary">→</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sidebar: My Labs */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-medium text-black dark:text-white mb-4">My Private Labs</h2>
                            <div className="space-y-4">
                                {[
                                    { name: 'FAANG Interview Prep', type: 'Technical' },
                                    { name: 'Leadership Workshop', type: 'Soft Skills' }
                                ].map((lab, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-200 dark:border-[#2A2A2A]">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-medium text-black dark:text-white">{lab.name}</p>
                                            <span className="text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                                {lab.type}
                                            </span>
                                        </div>
                                        <button className="text-xs text-brand-primary hover:underline">Edit Lab Parameters</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        </div>
    )
}
