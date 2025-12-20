'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiUrl } from '@/config/api'

export default function CandidateThankYou() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStatus()
        // Removed auto-polling to reduce server load per user request
        // Candidate can manually refresh the page to check status
    }, [params.token])

    const fetchStatus = async () => {
        try {
            const resp = await fetch(apiUrl(`api/candidate/thank-you/${params.token}`))
            if (resp.ok) {
                const result = await resp.json()
                setData(result)
                setLoading(false)
                // Removed redirect - just display feedback status on this page
            }
        } catch (e) {
            console.error('Failed to fetch status:', e)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-red-500">Invalid link</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-[#39FF14]/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Candidate Profile Section */}
                <div className="bg-gradient-to-r from-[#00E5FF]/10 to-[#39FF14]/10 border border-[#00E5FF]/20 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF] to-[#39FF14] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-black">
                                {data.candidate_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                        </div>

                        {/* Candidate Info */}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-1">
                                {data.candidate_name}
                            </h2>
                            <p className="text-sm text-gray-400">
                                Candidate Profile
                            </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                            <div className="px-3 py-1 bg-[#39FF14]/20 border border-[#39FF14]/30 rounded-full">
                                <span className="text-xs font-medium text-[#39FF14]">✓ Completed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thank You Message */}
                <h1 className="text-3xl font-bold text-white text-center mb-2">
                    Thank You, {data.candidate_name}!
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Your interview has been completed successfully.
                </p>

                {/* Interview Details */}
                <div className="bg-[#0A0A0A] border border-[#333] rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Position</p>
                            <p className="text-white font-medium">{data.position_title}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">Date</p>
                            <p className="text-white font-medium">
                                {new Date(data.interview_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feedback Status */}
                {data.feedback_status === 'PUBLISHED' ? (
                    <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 bg-[#39FF14] rounded-full"></span>
                            <h3 className="text-[#39FF14] font-bold">Feedback Published!</h3>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">
                            Your personalized feedback is now available!
                        </p>
                        <a
                            href={data.share_url || '#'}
                            className="inline-block px-6 py-3 bg-[#39FF14] hover:bg-[#7FFF5C] text-black font-bold rounded-lg transition-colors"
                        >
                            View Your Feedback
                        </a>
                    </div>
                ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                            <h3 className="text-yellow-500 font-bold">Feedback Pending Review</h3>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">
                            Our expert is currently reviewing your performance and preparing detailed feedback.
                        </p>
                        <p className="text-gray-400 text-xs">
                            You'll receive an email notification once your feedback is ready. You can also revisit this page anytime using this link.
                        </p>
                    </div>
                )}

                {/* Bookmark Reminder */}
                <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4">
                    <p className="text-gray-400 text-sm text-center">
                        💡 <strong className="text-white">Tip:</strong> Bookmark this page to check your feedback status anytime.
                    </p>
                </div>
            </div>
        </div>
    )
}
