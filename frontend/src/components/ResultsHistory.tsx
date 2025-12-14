'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'

interface Result {
    session_id: string
    result_id: string
    candidate_name: string
    position_title: string
    account_name: string
    main_skill: string
    date: string
    overall_score: number
    status: 'PENDING' | 'APPROVED'
    candidate_file: string
    share_token?: string
    recommendation?: string
}

import ShareModal from './ShareModal'

interface ActiveSession {
    session_id: string
    candidate_name: string
    language: string
    created_at: string
    duration_minutes: number
    status: string
    candidate_account: string
    candidate_role: string
}

export default function ResultsHistory() {
    const [results, setResults] = useState<Result[]>([])
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedResult, setSelectedResult] = useState<Result | null>(null)

    // Share Modal State
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [shareData, setShareData] = useState({ url: '', name: '' })

    // Feedback Generation State
    const [generating, setGenerating] = useState(false)
    const [feedbackContent, setFeedbackContent] = useState('')
    const [feedbackType, setFeedbackType] = useState<'detailed' | 'short'>('detailed')
    const [viewingFeedback, setViewingFeedback] = useState(false)
    const [approvalStatus, setApprovalStatus] = useState<'idle' | 'approving' | 'approved'>('idle')

    const fetchResults = async () => {
        try {
            const resp = await fetch(apiUrl('api/admin/results'))
            if (resp.ok) {
                const data = await resp.json()
                setResults(data.results)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const fetchActiveSessions = async () => {
        try {
            const resp = await fetch(apiUrl('api/sessions/active'))
            if (resp.ok) {
                const data = await resp.json()
                setActiveSessions(data.sessions || [])
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleRejoin = (session: ActiveSession) => {
        // Clear the sessionStorage flag so we can rejoin
        sessionStorage.removeItem(`admin_session_${session.session_id}`)
        window.location.href = `/interview?view=admin&session_id=${session.session_id}&lang=${session.language}`
    }

    const handleAbandon = async (session: ActiveSession) => {
        if (!confirm(`Abandon session for ${session.candidate_name}?`)) return
        try {
            const resp = await fetch(apiUrl(`api/sessions/${session.session_id}/abandon`), {
                method: 'POST'
            })
            if (resp.ok) {
                setActiveSessions(activeSessions.filter(s => s.session_id !== session.session_id))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleCleanup = async () => {
        try {
            const resp = await fetch(apiUrl('api/sessions/cleanup'), { method: 'POST' })
            if (resp.ok) {
                const data = await resp.json()
                alert(`Cleaned up ${data.cleaned_count} stale sessions`)
                fetchActiveSessions()
            }
        } catch (e) {
            console.error(e)
        }
    }

    // Pagination state
    const [resultsPage, setResultsPage] = useState(1)
    const ITEMS_PER_PAGE = 10
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
    const paginatedResults = results.slice((resultsPage - 1) * ITEMS_PER_PAGE, resultsPage * ITEMS_PER_PAGE)

    useEffect(() => {
        fetchResults()
        fetchActiveSessions()
    }, [])

    const handleGenerate = async () => {
        if (!selectedResult) return
        setGenerating(true)
        try {
            const resp = await fetch(apiUrl('api/feedback/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedResult.session_id,
                    feedback_type: feedbackType
                })
            })
            if (resp.ok) {
                const data = await resp.json()
                setFeedbackContent(data.content)
                setViewingFeedback(true)
            }
        } catch (e) {
            alert('Failed to generate feedback')
        } finally {
            setGenerating(false)
        }
    }

    const handleApprove = async () => {
        if (!selectedResult) return
        setApprovalStatus('approving')
        try {
            const resp = await fetch(apiUrl('api/feedback/approve'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedResult.session_id,
                    content: feedbackContent
                })
            })
            if (resp.ok) {
                setApprovalStatus('approved')
                alert('Feedback published successfully!')
                setViewingFeedback(false)
                fetchResults() // Refresh list
            }
        } catch (e) {
            alert('Failed to approve')
            setApprovalStatus('idle')
        }
    }

    const handleReject = async () => {
        if (!selectedResult) return
        const reason = prompt('Enter rejection reason:')
        if (!reason) return

        try {
            const resp = await fetch(apiUrl('api/feedback/reject'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedResult.session_id,
                    reason: reason
                })
            })
            if (resp.ok) {
                alert('Feedback rejected')
                setViewingFeedback(false)
                setSelectedResult(null)
                fetchResults()
            }
        } catch (e) {
            alert('Failed to reject')
        }
    }

    const handleCheckStatus = async (result: Result) => {
        // Determine if we should show existing feedback
        if (result.status === 'APPROVED') {
            try {
                const resp = await fetch(apiUrl(`api/results/${result.session_id}/status`))
                const data = await resp.json()
                if (data.content) {
                    setFeedbackContent(data.content)
                    setSelectedResult(result)
                    setViewingFeedback(true)
                }
            } catch (e) { console.error(e) }
        } else {
            // Just select it for generation
            setSelectedResult(result)
            setFeedbackContent('')
            setViewingFeedback(false)
        }
    }

    const copyShareLink = async (result: Result) => {
        let token = result.share_token

        if (!token) {
            try {
                const resp = await fetch(apiUrl(`api/results/${result.result_id}/share`), {
                    method: 'POST'
                })
                if (!resp.ok) throw new Error('Failed to create link')
                const data = await resp.json()
                token = data.token

                // Update local list to avoid re-fetching immediately
                setResults(results.map(r =>
                    r.result_id === result.result_id ? { ...r, share_token: token } : r
                ))
            } catch (e) {
                alert('Failed to generate share link')
                return
            }
        }

        if (token) {
            const shareUrl = `${window.location.origin}/share/${token}`
            setShareData({ url: shareUrl, name: result.candidate_name })
            setShareModalOpen(true)
        }
    }

    return (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Interview Results History</h2>
                <button
                    onClick={fetchResults}
                    className="p-2 bg-[#2A2A2A] hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Active Sessions Section */}
            {activeSessions.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-[#39FF14] uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse"></span>
                            Active Sessions ({activeSessions.length})
                        </h3>
                        <button
                            onClick={handleCleanup}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            title="Clean up stale sessions"
                        >
                            🧹 Clean Up Stale
                        </button>
                    </div>
                    <div className="grid gap-3">
                        {activeSessions.map((session) => (
                            <div
                                key={session.session_id}
                                className="bg-[#1A1A1A] border border-[#39FF14]/30 rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-white font-medium">{session.candidate_name}</span>
                                        <span className="px-2 py-0.5 bg-[#39FF14]/10 text-[#39FF14] text-xs rounded-full font-mono uppercase">
                                            {session.language}
                                        </span>
                                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full">
                                            {session.status}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {session.candidate_role} • {session.candidate_account} • {session.duration_minutes} min
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAbandon(session)}
                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors"
                                    >
                                        Abandon
                                    </button>
                                    <button
                                        onClick={() => handleRejoin(session)}
                                        className="px-4 py-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.857-.649 1.666-1.116 2.408" />
                                        </svg>
                                        Rejoin
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs text-gray-500 border-b border-[#2A2A2A]">
                            <th className="py-3 px-4">Candidate</th>
                            <th className="py-3 px-4">Role / Account</th>
                            <th className="py-3 px-4">Primary Skill</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading history...</td></tr>
                        ) : results.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500 gap-2">
                                        <p>No interviews found.</p>
                                        <a href="/active" className="text-[#00E5FF] hover:underline text-sm font-medium">Start a new Quick Start Session &rarr;</a>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedResults.map((r) => (
                                <tr key={r.result_id || r.session_id} className="border-b border-[#2A2A2A]/50 hover:bg-[#1A1A1A] transition-colors">
                                    <td className="py-3 px-4 font-medium text-white">
                                        {r.candidate_name}
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{r.session_id}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {r.account_name !== 'N/A' ? (
                                            <>
                                                <div className="text-white">{r.position_title}</div>
                                                <div className="text-xs text-gray-500">{r.account_name}</div>
                                            </>
                                        ) : (
                                            <div className="text-gray-400 italic">Quick Start Session</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">
                                        <span className="px-2 py-1 bg-[#2A2A2A] rounded text-xs">
                                            {r.main_skill}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        {r.status === 'APPROVED' ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${r.recommendation === 'hire'
                                                ? 'bg-[#39FF14]/10 border-[#39FF14]/20 text-[#39FF14]'
                                                : r.recommendation === 'no_hire'
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                    : 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${r.recommendation === 'hire' ? 'bg-[#39FF14]'
                                                    : r.recommendation === 'no_hire' ? 'bg-red-500'
                                                        : 'bg-[#00E5FF]'
                                                    }`}></span>
                                                {r.recommendation === 'hire' ? 'Recommended'
                                                    : r.recommendation === 'no_hire' ? 'Not Recommended'
                                                        : 'Published'}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-800 border-gray-700 text-gray-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                Pending Review
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleCheckStatus(r)}
                                            className="text-[#00E5FF] hover:text-[#00E5FF]/80 text-xs font-medium"
                                        >
                                            {r.status === 'APPROVED' ? 'View Report' : 'Review'}
                                        </button>
                                        {r.status === 'APPROVED' && (
                                            <button
                                                onClick={() => copyShareLink(r)}
                                                className="text-gray-400 hover:text-white text-xs"
                                            >
                                                Share
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2A2A2A]">
                        <div className="text-sm text-gray-500">
                            Showing {((resultsPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(resultsPage * ITEMS_PER_PAGE, results.length)} of {results.length}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setResultsPage(p => Math.max(1, p - 1))}
                                disabled={resultsPage === 1}
                                className="px-3 py-1 bg-[#2A2A2A] hover:bg-[#333] text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-gray-400 text-sm">
                                Page {resultsPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setResultsPage(p => Math.min(totalPages, p + 1))}
                                disabled={resultsPage === totalPages}
                                className="px-3 py-1 bg-[#2A2A2A] hover:bg-[#333] text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                shareUrl={shareData.url}
                candidateName={shareData.name}
            />

            {/* Review Modal */}
            {(selectedResult && (viewingFeedback || !selectedResult.status || selectedResult.status !== 'APPROVED')) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    Feedback Review: {selectedResult.candidate_name}
                                </h3>
                                <p className="text-gray-400 text-sm">Session ID: {selectedResult.session_id}</p>
                            </div>
                            <button
                                onClick={() => { setSelectedResult(null); setViewingFeedback(false); }}
                                className="p-2 hover:bg-[#2A2A2A] rounded-lg text-gray-400"
                            >
                                Close
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
                            {!viewingFeedback ? (
                                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                    <div className="text-center space-y-2">
                                        <h4 className="text-lg font-medium text-white">Generate Feedback Report</h4>
                                        <p className="text-gray-400 text-sm max-w-md">
                                            Use the AI Agent to generate a structured feedback report based on the interview transcript.
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => { setFeedbackType('detailed'); }}
                                            className={`px-6 py-4 rounded-xl border transition-all text-left w-64 ${feedbackType === 'detailed'
                                                ? 'bg-[#00E5FF]/10 border-[#00E5FF] ring-1 ring-[#00E5FF]'
                                                : 'bg-[#1A1A1A] border-[#333] hover:border-gray-500'
                                                }`}
                                        >
                                            <div className={`font-semibold mb-1 ${feedbackType === 'detailed' ? 'text-[#00E5FF]' : 'text-gray-200'}`}>Detailed Summary</div>
                                            <div className="text-xs text-gray-500">Formal EPAM-style technical evaluation with strengths/weaknesses.</div>
                                        </button>

                                        <button
                                            onClick={() => { setFeedbackType('short'); }}
                                            className={`px-6 py-4 rounded-xl border transition-all text-left w-64 ${feedbackType === 'short'
                                                ? 'bg-[#00E5FF]/10 border-[#00E5FF] ring-1 ring-[#00E5FF]'
                                                : 'bg-[#1A1A1A] border-[#333] hover:border-gray-500'
                                                }`}
                                        >
                                            <div className={`font-semibold mb-1 ${feedbackType === 'short' ? 'text-[#00E5FF]' : 'text-gray-200'}`}>Short Summary</div>
                                            <div className="text-xs text-gray-500">Concise bullet points with positive/negative highlights.</div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        className="px-8 py-3 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {generating ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                                Generate Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-4">
                                    <textarea
                                        value={feedbackContent}
                                        onChange={(e) => setFeedbackContent(e.target.value)}
                                        className="flex-1 w-full bg-[#0A0A0A] border border-[#333] rounded-xl p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:border-[#00E5FF]"
                                        placeholder="Generated feedback will appear here..."
                                    />
                                    <div className="flex justify-between items-center bg-[#1A1A1A] p-4 rounded-xl border border-[#333]">
                                        <div className="text-sm text-gray-400">
                                            <span className="text-yellow-500 font-medium">⚠️ Review requested</span>: Please verify the content before publishing.
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setViewingFeedback(false)}
                                                className="px-4 py-2 hover:bg-[#333] text-gray-300 rounded-lg transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleReject}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={approvalStatus === 'approving'}
                                                className="px-6 py-2 bg-[#39FF14] hover:bg-[#32E612] text-black font-bold rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {approvalStatus === 'approving' ? 'Publishing...' : 'Approve & Publish'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
