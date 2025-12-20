'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useParams } from 'next/navigation'

export default function PrivateCirclePage() {
    const params = useParams()
    const tenant = (params?.tenant as string) || 'global'

    const [stats] = useState({
        activeInvites: 2,
        completedChecks: 8,
        identityVerified: true,
        privacyLevel: 'High'
    })

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
            <Header showQuickStart={true} title={`Private Circle - ${tenant || 'Global'}`} />

            <main className="flex-1">
                {/* Security Header */}
                <section className="bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#1A1A1A]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 rounded-full">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-medium text-black dark:text-white">
                                        Private <span className="text-green-500">Circle</span> (C2C)
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[10px]">
                                        Vault: {tenant}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Vault-Level Privacy for your home hiring.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">Privacy Status: <span className="text-green-500">Locked</span></span>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar: Invite Status */}
                        <div className="lg:col-span-1 space-y-6">
                            <h2 className="text-lg font-medium text-black dark:text-white">Invite Center</h2>
                            <div className="p-4 bg-white dark:bg-[#111111] border border-dashed border-gray-300 dark:border-[#333] rounded-xl flex flex-col items-center justify-center text-center py-8">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                    <span className="text-xl">+</span>
                                </div>
                                <p className="text-sm font-medium text-black dark:text-white mb-1">New Private Link</p>
                                <p className="text-[10px] text-gray-500 px-4">Generate a 24h high-entropy link for your next applicant.</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Active Sessions</p>
                                {[
                                    { name: 'Nanny Vibe-Check', status: 'Sent' },
                                    { name: 'Home Tutor Demo', status: 'In Progress' }
                                ].map((s, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between text-xs">
                                        <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                                        <span className="text-orange-500">{s.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Main Feed: Vibe Checks */}
                        <div className="lg:col-span-3 space-y-8">
                            <h2 className="text-xl font-medium text-black dark:text-white">Safety Insights Hub</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="group relative overflow-hidden bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-6 hover:shadow-xl transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                                    P{i}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-black dark:text-white">Potential Hire {i}</p>
                                                    <p className="text-[10px] text-gray-500">Identity Verified • 15min Interview</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-green-500">92% Match</p>
                                                <p className="text-[10px] text-gray-400">Safety Score</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6 text-xs text-gray-600 dark:text-gray-400">
                                            <div className="flex justify-between">
                                                <span>Communication Vibe:</span>
                                                <span className="text-black dark:text-white font-medium italic">"Patient & Warm"</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Emergency Logic:</span>
                                                <span className="text-green-500 font-medium">Passed</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                            View Full Vibe Report
                                        </button>
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
