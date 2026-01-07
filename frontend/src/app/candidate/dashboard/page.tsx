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
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-inter selection:bg-orange-100">
            {/* Background Blobs - Softer for Light Mode */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.2] animate-blob" />
                <div className="absolute top-0 -right-4 w-[500px] h-[500px] bg-sky-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.2] animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[128px] opacity-[0.2] animate-blob animation-delay-4000" />
            </div>

            <Header showQuickStart={false} />

            <main className="flex-1 relative z-10 pt-8 pb-20 px-6">
                <div className="max-w-6xl mx-auto">

                    {/* Profile Header Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-end">
                        <div className="lg:col-span-2">
                            <h1 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight text-slate-900">
                                Welcome back, <span className="text-orange-600">{userName}</span>
                            </h1>
                            <p className="text-xl text-slate-500 max-w-xl font-medium">
                                Access your active interview invitations and track your application progress.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 lg:items-end">
                            <div className="flex items-center gap-4 p-2 bg-white border border-slate-200 shadow-sm rounded-2xl w-fit">
                                <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-600/20">
                                    {userName[0]}
                                </div>
                                <div className="pr-4">
                                    <div className="text-sm font-bold text-slate-800">{userName}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black leading-none mt-1">
                                        {user?.role
                                            ? user.role.replace(/_/g, ' ') + ' Account'
                                            : 'Candidate Account'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                        {/* Main Stream */}
                        <div className="lg:col-span-3 space-y-10">

                            {/* Readiness Alert - Light Theme */}
                            <div className="relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="bg-white border border-slate-200 rounded-3xl p-8 flex gap-6 items-start shadow-sm relative z-10">
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <Info className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Systems Check: Ready for Launch</h3>
                                        <p className="text-slate-600 leading-relaxed max-w-2xl font-medium">
                                            For the best experience, please use a modern browser (Chrome/Safari) and ensure your microphone is functional.
                                            Our AI Interviewers will provide real-time guidance once the session starts.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interviews List */}
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-4">
                                    <Briefcase className="w-4 h-4" />
                                    Active Invitations
                                    <div className="h-[1px] flex-1 bg-slate-200" />
                                </h2>

                                <div className="space-y-6">
                                    {interviews.length > 0 ? (
                                        interviews.map(interview => (
                                            <InterviewCard key={interview.id} interview={interview} />
                                        ))
                                    ) : (
                                        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-sm">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                                <AlertCircle className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-semibold italic tracking-wide">No active interview invitations found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Stats / Info - Light Theme */}
                        <div className="space-y-8">
                            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 font-mono">Activity Snapshot</h4>
                                <div className="space-y-6 text-slate-800">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                        <span className="text-slate-500 font-medium text-sm">Active Sessions</span>
                                        <span className="text-xl font-black text-orange-600">{interviews.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                        <span className="text-slate-500 font-medium text-sm">Completed</span>
                                        <span className="text-xl font-black text-slate-400 font-mono">00</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium text-sm">Status</span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tight border border-emerald-100">
                                            Optimal
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400 shadow-xl shadow-indigo-500/10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-4 opacity-70">Support & FAQ</h4>
                                <p className="text-xs text-white leading-relaxed mb-6 font-medium">
                                    Encountered a technical glitch during your session? Our support team is active 24/7.
                                </p>
                                <button className="w-full h-10 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors shadow-lg">
                                    Get Help
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
        pending: { label: 'Validation Required', class: 'text-amber-600 border-amber-200 bg-amber-50' },
        ready: { label: 'Ready for Launch', class: 'text-emerald-600 border-emerald-200 bg-emerald-50' },
        in_progress: { label: 'Live Session', class: 'text-blue-600 border-blue-200 bg-blue-50' },
        completed: { label: 'Archived', class: 'text-slate-500 border-slate-200 bg-slate-50' },
        rejected: { label: 'Not Available', class: 'text-rose-600 border-rose-200 bg-rose-50' }
    }

    const config = statusConfig[interview.status]

    return (
        <div className="group bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 hover:border-orange-200 transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/5 cursor-default">
            <div className="flex flex-col md:flex-row justify-between gap-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`
                            px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border
                            ${config.class}
                        `}>
                            {config.label}
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {new Date(interview.invited_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <h3 className="text-3xl font-extrabold mb-4 tracking-tight text-slate-800 transition-colors group-hover:text-slate-900">
                        {interview.position_title}
                    </h3>
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                            {interview.company_name[0]}
                        </div>
                        <span className="text-slate-500 font-semibold tracking-tight text-lg">{interview.company_name}</span>
                    </div>

                    <div className="flex flex-wrap gap-8 items-center text-xs text-slate-400 font-black uppercase tracking-[0.1em]">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-orange-500" />
                            {interview.estimated_duration}
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            On-Demand Access
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-10 md:pt-0 md:pl-12 lg:min-w-[280px]">
                    {interview.status === 'ready' || interview.status === 'in_progress' ? (
                        <div className="space-y-4">
                            <button className="w-full h-16 bg-slate-900 text-white hover:bg-orange-600 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-orange-600/20">
                                {interview.status === 'ready' ? 'Launch Interview' : 'Resume Session'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                AI Swarm Engine Verified
                            </p>
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-300 text-xs font-black uppercase tracking-widest italic">
                            Session Locked
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
