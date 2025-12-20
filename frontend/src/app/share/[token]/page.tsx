'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiUrl } from '@/config/api'

export default function SharedResultPage() {
    const params = useParams()
    const token = params.token as string
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) return

        fetch(apiUrl(`api/share/${token}`))
            .then(res => {
                if (!res.ok) throw new Error('Result not found or link expired')
                return res.json()
            })
            .then(data => setResult(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white text-lg">Loading feedback...</p>
                </div>
            </div>
        )
    }

    if (error || !result) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Feedback Not Found</h1>
                    <p className="text-gray-400">This feedback link is invalid or has expired.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00E5FF]/10 to-[#39FF14]/10 border-b border-[#2A2A2A]">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00E5FF] to-[#39FF14] rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Interview Feedback</h1>
                            <p className="text-gray-400">Technical Interview Results</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Candidate Info Card */}
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{result.candidate_name}</h2>
                            <p className="text-lg text-gray-300">{result.position_title}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400 mb-1">Overall Score</div>
                            <div className="text-3xl font-bold text-[#39FF14]">{result.overall_score}/10</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(result.interview_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                </div>

                {/* Feedback Content */}
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <svg className="w-6 h-6 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-bold text-white">Detailed Feedback</h3>
                    </div>
                    <div className="prose prose-invert max-w-none">
                        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {result.feedback_content}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>This feedback was generated by AI Interview Platform</p>
                    <p className="mt-2">© {new Date().getFullYear()} All rights reserved</p>
                </div>
            </div>
        </div>
    )
}
