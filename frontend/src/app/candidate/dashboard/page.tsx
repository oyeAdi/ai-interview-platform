'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Briefcase,
    Calendar,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Info,
    User,
    Settings,
    LogOut,
    Bell
} from 'lucide-react'
import Header from '@/components/Header'

interface Interview {
    id: string
    position_title: string
    company_name: string
    status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'rejected'
    invited_at: string
    estimated_duration: string
    description?: string
}

export default function CandidateDashboard() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setUserName(user?.user_metadata?.full_name || 'Candidate')

            // Mock data for initial preview (Replace with real API call later)
            setInterviews([
                {
                    id: '1',
                    position_title: 'Backend Software Engineer',
                    company_name: 'TechFlow Systems',
                    status: 'ready',
                    invited_at: new Date().toISOString(),
                    estimated_duration: '45 mins',
                    description: 'This interview will cover system design, Node.js internals, and architectural patterns.'
                }
            ])
        } catch (error) {
            console.error('Failed to fetch candidate data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gray-400 animate-pulse font-mono tracking-widest text-xs uppercase">Initializing Portal...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-inter selection:bg-orange-500/30">
            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.07] animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.07] animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.05] animate-blob animation-delay-4000" />
            </div>

            <Header showQuickStart={false} />

            <main className="flex-1 relative z-10 pt-8 pb-20 px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Profile Header Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-end">
                        <div className="lg:col-span-2">
                            <h1 className="text-5xl font-bold mb-4 tracking-tight leading-tight">
                                Welcome back, <span className="bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">{userName}</span>
                            </h1>
                            <p className="text-xl text-gray-500 max-w-xl">
                                Your centralized hub for all active interview sessions and application progress.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 lg:items-end">
                            <div className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
                                    {userName[0]}
                                </div>
                                <div className="pr-4">
                                    <div className="text-sm font-bold text-gray-200">{userName}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black leading-none mt-1">Candidate Account</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                        {/* Main Stream */}
                        <div className="lg:col-span-3 space-y-10">

                            {/* Readiness Alert */}
                            <div className="relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 flex gap-6 items-start backdrop-blur-sm relative z-10">
                                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                        <Info className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-200 mb-2">Systems Check: Ready for Launch</h3>
                                        <p className="text-gray-400 leading-relaxed max-w-2xl">
                                            For the best experience, please use a modern browser (Chrome/Safari) and ensure your microphone is functional.
                                            Our AI Interviewers will provide real-time guidance once the session starts.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interviews List */}
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-4">
                                    <Briefcase className="w-4 h-4" />
                                    Active Invitations
                                    <div className="h-[1px] flex-1 bg-white/5" />
                                </h2>

                                <div className="space-y-6">
                                    {interviews.length > 0 ? (
                                        interviews.map(interview => (
                                            <InterviewCard key={interview.id} interview={interview} />
                                        ))
                                    ) : (
                                        <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-16 text-center">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                                <AlertCircle className="w-8 h-8 text-gray-700" />
                                            </div>
                                            <p className="text-gray-500 font-medium italic tracking-wide">No active interview invitations found at this time.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Stats / Info */}
                        <div className="space-y-8">
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Activity Snapshot</h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-gray-400 text-sm">Active Sessions</span>
                                        <span className="text-xl font-bold text-orange-400">{interviews.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                        <span className="text-gray-400 text-sm">Completed</span>
                                        <span className="text-xl font-bold text-gray-600">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Response Time</span>
                                        <span className="text-xl font-bold text-green-400">Optimal</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4">Support & FAQ</h4>
                                <p className="text-xs text-blue-200/60 leading-relaxed mb-6">
                                    Encountered a technical glitch during your session? Our support team is active 24/7.
                                </p>
                                <button className="text-xs font-bold text-blue-400 flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    Visit Help Center <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

function InterviewCard({ interview }: { interview: Interview }) {
    const statusConfig = {
        pending: { label: 'Validation Required', class: 'text-amber-500 border-amber-500/20 bg-amber-500/5' },
        ready: { label: 'Ready for Launch', class: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' },
        in_progress: { label: 'Live Session', class: 'text-blue-500 border-blue-500/20 bg-blue-500/5' },
        completed: { label: 'Archived', class: 'text-gray-500 border-white/10 bg-white/5' },
        rejected: { label: 'Not Available', class: 'text-rose-500 border-rose-500/20 bg-rose-500/5' }
    }

    const config = statusConfig[interview.status]

    return (
        <div className="group bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 md:p-10 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/5">
            <div className="flex flex-col md:flex-row justify-between gap-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`
                            px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border
                            ${config.class}
                        `}>
                            {config.label}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(interview.invited_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <h3 className="text-3xl font-bold mb-4 tracking-tight group-hover:text-white transition-colors">
                        {interview.position_title}
                    </h3>
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400">
                            T
                        </div>
                        <span className="text-gray-400 font-medium tracking-tight text-lg">{interview.company_name}</span>
                    </div>

                    <div className="flex flex-wrap gap-8 items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-orange-500/50" />
                            {interview.estimated_duration}
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-orange-500/50" />
                            On-Demand Access
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-10 md:pt-0 md:pl-12 lg:min-w-[280px]">
                    {interview.status === 'ready' || interview.status === 'in_progress' ? (
                        <div className="space-y-4">
                            <button className="w-full h-16 bg-white text-black hover:bg-orange-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-white/5 hover:shadow-orange-500/20">
                                {interview.status === 'ready' ? 'Launch Interview' : 'Resume Session'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-center text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                Swarm Engine Verified
                            </p>
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 text-gray-600 text-xs font-bold uppercase tracking-widest italic">
                            Session Locked
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
