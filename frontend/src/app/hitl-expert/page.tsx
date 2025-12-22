'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, XCircle, Play, Activity, Clock, Shield, Search, ExternalLink } from 'lucide-react'

interface SessionStats {
    pending: number
    active: number
    completed: number
    approvalRate: number
}

interface HITLSession {
    id: string
    position_title: string
    candidate_name: string
    status: 'pending_hitl' | 'approved' | 'rejected' | 'in_progress' | 'completed'
    created_at: string
    ai_plan_summary?: string
}

export default function HITLExpertDashboard() {
    const [stats, setStats] = useState<SessionStats | null>(null)
    const [sessions, setSessions] = useState<HITLSession[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'queue' | 'active' | 'history'>('queue')

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Mock data for now until API is ready
            setSessions([
                {
                    id: '1',
                    position_title: 'Senior Frontend Engineer',
                    candidate_name: 'Alice Johnson',
                    status: 'pending_hitl',
                    created_at: new Date().toISOString(),
                    ai_plan_summary: 'Focus on React performance and state management patterns.'
                },
                {
                    id: '2',
                    position_title: 'Fullstack Developer',
                    candidate_name: 'Bob Smith',
                    status: 'in_progress',
                    created_at: new Date().toISOString()
                }
            ])
            setStats({
                pending: 1,
                active: 1,
                completed: 12,
                approvalRate: 94
            })
        } catch (error) {
            console.error('Failed to fetch HITL data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id: string) => {
        // API call placeholder
        alert(`Approved session ${id}`)
        fetchData()
    }

    const handleReject = async (id: string) => {
        // API call placeholder
        alert(`Rejected session ${id}`)
        fetchData()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-emerald-400 animate-pulse font-mono">Initializing HITL core...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8 text-emerald-500" />
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                                HITL Expert Dashboard
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm">Human-In-The-Loop Validation & Session Monitoring</p>
                    </div>

                    <div className="flex gap-4 mb-1">
                        <TabButton
                            active={activeTab === 'queue'}
                            onClick={() => setActiveTab('queue')}
                            label="Queue"
                            count={stats?.pending}
                        />
                        <TabButton
                            active={activeTab === 'active'}
                            onClick={() => setActiveTab('active')}
                            label="Active"
                            count={stats?.active}
                        />
                        <TabButton
                            active={activeTab === 'history'}
                            onClick={() => setActiveTab('history')}
                            label="History"
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard icon={<Clock />} label="Pending HITL" value={stats?.pending || 0} color="emerald" />
                    <StatCard icon={<Activity />} label="Live Interviews" value={stats?.active || 0} color="teal" />
                    <StatCard icon={<CheckCircle />} label="Total Reviewed" value={stats?.completed || 0} color="cyan" />
                    <StatCard icon={<Shield />} label="Approval Rate" value={`${stats?.approvalRate}%`} color="blue" />
                </div>

                {/* Content Area */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            {activeTab === 'queue' ? 'Validation Queue' : activeTab === 'active' ? 'Live Monitoring' : 'Session History'}
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                className="bg-black/40 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-black/20">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Session Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">AI Strategy</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sessions.filter(s => {
                                    if (activeTab === 'queue') return s.status === 'pending_hitl'
                                    if (activeTab === 'active') return s.status === 'in_progress'
                                    return s.status === 'completed' || s.status === 'rejected' || s.status === 'approved'
                                }).map(session => (
                                    <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="font-semibold text-lg">{session.position_title}</div>
                                            <div className="text-sm text-gray-400 font-medium">{session.candidate_name}</div>
                                            <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
                                                Invited {new Date(session.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 max-w-md">
                                            {session.ai_plan_summary ? (
                                                <div className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-emerald-500/30 pl-3">
                                                    "{session.ai_plan_summary}"
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 text-xs italic italic">No strategy generated yet</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <StatusBadge status={session.status} />
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {activeTab === 'queue' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleReject(session.id)}
                                                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                            title="Reject Strategy"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(session.id)}
                                                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                                            title="Approve & Start"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                        Monitor
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                            No sessions found in the current view.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${active
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white text-emerald-600' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {count}
                </span>
            )}
        </button>
    )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colorClasses = {
        emerald: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
        teal: 'from-teal-500/20 to-cyan-500/20 text-teal-400',
        cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
        blue: 'from-blue-500/20 to-indigo-500/20 text-blue-400',
    }

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border border-white/10 rounded-xl p-6 backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; class: string }> = {
        pending_hitl: { label: 'Awaiting HITL', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        approved: { label: 'Approved', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        rejected: { label: 'Rejected', class: 'bg-red-500/20 text-red-400 border-red-500/30' },
        in_progress: { label: 'Live Now', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' },
        completed: { label: 'Completed', class: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    }

    const { label, class: className } = config[status] || { label: status, class: 'bg-gray-500/20 text-gray-400' }

    return (
        <span className={`px-3 py-1 border rounded-full text-xs font-semibold tracking-wide ${className}`}>
            {label}
        </span>
    )
}
