'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Briefcase, Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react'

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
    const [userName, setUserName] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUserName(user?.user_metadata?.full_name || 'Candidate')

            // Mock data for initial preview
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-gray-400 animate-pulse font-mono">Loading your interview portal...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-5xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3 tracking-tight">
                        Welcome back, <span className="text-blue-400">{userName}</span>
                    </h1>
                    <p className="text-gray-400">Your portal for active and upcoming interviews.</p>
                </div>

                {/* Action Needed Alert */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-12 flex gap-4 items-start">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Info className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-300">Ready to start?</h3>
                        <p className="text-sm text-blue-300/70 mt-1">
                            Ensure you are in a quiet environment with a stable internet connection.
                            Our AI swarms will guide you through the process once you launch.
                        </p>
                    </div>
                </div>

                {/* Interviews List */}
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-gray-400" />
                    My Interviews
                </h2>

                <div className="space-y-6">
                    {interviews.length > 0 ? (
                        interviews.map(interview => (
                            <InterviewCard key={interview.id} interview={interview} />
                        ))
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500">No interview invitations found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function InterviewCard({ interview }: { interview: Interview }) {
    const statusConfig = {
        pending: { label: 'Awaiting Validation', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
        ready: { label: 'Ready to Start', class: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
        in_progress: { label: 'In Progress', class: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        completed: { label: 'Completed', class: 'text-gray-400 bg-white/5 border-white/10' },
        rejected: { label: 'Unavailable', class: 'text-red-400 bg-red-400/10 border-red-400/20' }
    }

    const config = statusConfig[interview.status]

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.class}`}>
                            {config.label}
                        </span>
                        <span className="text-xs text-gray-500">
                            Invited {new Date(interview.invited_at).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
                        {interview.position_title}
                    </h3>
                    <p className="text-lg text-gray-400 mb-6">{interview.company_name}</p>

                    <div className="flex gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Est. {interview.estimated_duration}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Flexible Timing
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-12 min-w-[200px]">
                    {interview.status === 'ready' || interview.status === 'in_progress' ? (
                        <button className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                            {interview.status === 'ready' ? 'Start Interview' : 'Continue Interview'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10 text-gray-500 text-sm italic">
                            Access will open after validation
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
