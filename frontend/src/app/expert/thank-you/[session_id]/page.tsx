'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiUrl } from '@/config/api'

export default function ExpertThankYou() {
    const params = useParams()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSessionInfo()
    }, [params.session_id])

    const fetchSessionInfo = async () => {
        try {
            const resp = await fetch(apiUrl(`api/expert/thank-you/${params.session_id}`))
            if (resp.ok) {
                const result = await resp.json()
                setData(result)
            }
        } catch (e) {
            console.error('Failed to fetch session info:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleProcessResult = () => {
        router.push(`/expert/results?session=${params.session_id}`)
    }

    const handleReturnToDashboard = () => {
        router.push('/expert/results')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-[#00E5FF]/10 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Thank You Message */}
                <h1 className="text-3xl font-bold text-white text-center mb-2">
                    Thank You for Your Service!
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    The interview has been completed successfully.
                </p>

                {/* Interview Details */}
                {data && (
                    <div className="bg-[#0A0A0A] border border-[#333] rounded-xl p-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Candidate</p>
                                <p className="text-white font-medium">{data.candidate_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">Position</p>
                                <p className="text-white font-medium">{data.position_title}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Next Steps */}
                <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6 mb-6">
                    <h3 className="text-white font-bold mb-2">What's Next?</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        You can now process the interview results and generate feedback for the candidate.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-[#00E5FF] mt-0.5">•</span>
                            <span>Review interview transcript and responses</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#00E5FF] mt-0.5">•</span>
                            <span>Generate AI-powered feedback (short or detailed)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#00E5FF] mt-0.5">•</span>
                            <span>Approve and publish feedback to candidate</span>
                        </li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleProcessResult}
                        className="flex-1 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Process Result / Generate Feedback
                    </button>

                    <button
                        onClick={handleReturnToDashboard}
                        className="bg-[#2A2A2A] hover:bg-[#333] text-white font-medium py-4 px-6 rounded-xl transition-all"
                    >
                        Return to Dashboard
                    </button>
                </div>

                {/* Note */}
                <p className="text-gray-500 text-xs text-center mt-6">
                    You can also process results later from the Feedback tab
                </p>
            </div>
        </div>
    )
}
