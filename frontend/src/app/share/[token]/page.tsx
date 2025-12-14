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

        fetch(apiUrl(`api/results/shared/${token}`))
            .then(res => {
                if (!res.ok) throw new Error('Result not found or link expired')
                return res.json()
            })
            .then(data => setResult(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
    }, [token])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-4 border-epam-cyan border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Unavailable</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    if (!result) return null

    return (
        <div className="min-h-screen bg-gray-50 print:bg-white animate-fade-in">
            {/* Print Controls - Hidden in print */}
            <div className="fixed top-6 right-6 print:hidden z-50">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-epam-cyan hover:bg-epam-cyan/90 text-white rounded-md shadow-lg transition-colors font-medium"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Download PDF
                </button>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white min-h-screen shadow-xl print:shadow-none print:w-full print:max-w-none">
                {/* Header with EPAM Branding */}
                <header className="px-12 py-8 border-b-4 border-epam-cyan flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* EPAM Logo Placeholder / Text */}
                        <div className="text-3xl font-bold tracking-tight text-[#39C2D7]">
                            EPAM
                            <span className="text-gray-400 font-light text-lg ml-2">Systems</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-xl font-semibold text-gray-900">Interview Result</h1>
                        <p className="text-sm text-gray-500">Confidential Assessment</p>
                    </div>
                </header>

                <main className="px-12 py-10">
                    {/* Candidate Info Grid */}
                    <section className="grid grid-cols-2 gap-y-6 gap-x-12 mb-12">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Candidate</label>
                            <div className="text-xl font-medium text-gray-900">{result.candidate?.name || 'Unknown'}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Position</label>
                            <div className="text-xl font-medium text-gray-900">{result.position?.title || 'Unknown'}</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
                            <div className="text-lg text-gray-900">
                                {new Date(result.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${result.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {result.status?.charAt(0).toUpperCase() + result.status?.slice(1)}
                            </span>
                        </div>
                    </section>

                    {/* Scores Section */}
                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-12 print:bg-white print:border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">Overall Performance</h2>
                                <p className="text-sm text-gray-500">Based on technical assessment</p>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold text-gray-900">
                                    {Math.round(result.overall_metrics?.total_score || result.overall_score || result.metrics?.average_score || 0)}%
                                </div>
                                <div className="text-sm text-gray-500">Total Score</div>
                            </div>
                        </div>
                    </section>

                    {/* Feedback Summary */}
                    <section className="mb-12">
                        <h3 className="text-md font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-4">
                            Assessment Summary
                        </h3>
                        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                            <p>{result.feedback_summary || "No specific feedback provided."}</p>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-20 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                        <p>&copy; {new Date().getFullYear()} EPAM Systems. Confidential & Proprietary.</p>
                        <p className="mt-1">Generated by AI Interview Platform</p>
                    </footer>
                </main>
            </div>
        </div>
    )
}
