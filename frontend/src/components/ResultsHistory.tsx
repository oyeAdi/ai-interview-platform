'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'
import FeedbackStatusBadge from './FeedbackStatusBadge'
import RejectFeedbackModal from './RejectFeedbackModal'
import ShareFeedbackModal from './ShareFeedbackModal'
import { FeedbackStatus } from '@/types/feedback'

// Simplified state management - single enum
type FeedbackState = 'NOT_GENERATED' | 'GENERATING' | 'GENERATED' | 'APPROVING' | 'APPROVED' | 'PUBLISHING' | 'PUBLISHED' | 'REJECTED'
type FeedbackType = 'short' | 'long' | null

interface Result {
    session_id: string
    candidate: {
        name: string
        email: string
    }
    position: {
        title: string
    }
    overall_metrics: {
        total_score: number
    }
    feedback: {
        status: FeedbackState
        type: FeedbackType
        content: string | null
    }
    share?: {
        token: string
        url: string
    }
    date: string
}

export default function ResultsHistory() {
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [selectedResult, setSelectedResult] = useState<Result | null>(null)

    // Feedback workflow state
    const [feedbackState, setFeedbackState] = useState<FeedbackState>('NOT_GENERATED')
    const [feedbackType, setFeedbackType] = useState<FeedbackType>(null)
    const [feedbackContent, setFeedbackContent] = useState('')

    // Share modal
    const [shareModalOpen, setShareModalOpen] = useState(false)
    const [shareData, setShareData] = useState({ url: '', name: '' })

    // Reject modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false)

    useEffect(() => {
        fetchResults()
    }, [])

    const fetchResults = async () => {
        try {
            const resp = await fetch(apiUrl('api/expert/results'))
            if (resp.ok) {
                const data = await resp.json()
                setResults(Array.isArray(data.results) ? data.results : [])
            }
        } catch (e) {
            console.error('Failed to fetch results:', e)
        } finally {
            setLoading(false)
        }
    }

    const handleReview = (result: Result) => {
        setSelectedResult(result)

        // Handle both old and new data formats
        const feedbackStatus = result.feedback?.status || 'NOT_GENERATED'
        const feedbackType = result.feedback?.type || null
        const feedbackContent = result.feedback?.content || ''

        setFeedbackState(feedbackStatus as FeedbackState)
        setFeedbackType(feedbackType)
        setFeedbackContent(feedbackContent)
        setShowModal(true)
    }

    const handleGenerate = async () => {
        if (!feedbackType || !selectedResult) {
            alert('Please select feedback type (Short or Long)')
            return
        }

        setFeedbackState('GENERATING')

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
                setFeedbackState('GENERATED')
                fetchResults() // Refresh list
            } else {
                alert('Failed to generate feedback')
                setFeedbackState('NOT_GENERATED')
            }
        } catch (e) {
            console.error('Generate failed:', e)
            alert('Error generating feedback')
            setFeedbackState('NOT_GENERATED')
        }
    }

    const handleApprove = async () => {
        if (!selectedResult) return

        setFeedbackState('APPROVING')

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
                setFeedbackState('APPROVED')
                fetchResults()
            } else {
                alert('Failed to approve feedback')
                setFeedbackState('GENERATED')
            }
        } catch (e) {
            console.error('Approve failed:', e)
            setFeedbackState('GENERATED')
        }
    }

    const handleRejectClick = () => {
        setRejectModalOpen(true)
    }

    const handleReject = async (reason: string) => {
        if (!selectedResult) return

        setRejectModalOpen(false)

        try {
            const resp = await fetch(apiUrl('api/feedback/reject'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedResult.session_id,
                    reason
                })
            })

            if (resp.ok) {
                setFeedbackState('NOT_GENERATED')
                setFeedbackType(null)
                setFeedbackContent('')
                fetchResults()
            }
        } catch (e) {
            console.error('Reject failed:', e)
        }
    }

    const handlePublish = async () => {
        if (!selectedResult) return

        setFeedbackState('PUBLISHING')

        try {
            const resp = await fetch(apiUrl('api/feedback/publish'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: selectedResult.session_id
                })
            })

            if (resp.ok) {
                const data = await resp.json()
                setFeedbackState('PUBLISHED')
                fetchResults()
                alert(`Feedback published! Share URL: ${data.share_url}`)
            } else {
                alert('Failed to publish feedback')
                setFeedbackState('APPROVED')
            }
        } catch (e) {
            console.error('Publish failed:', e)
            setFeedbackState('APPROVED')
        }
    }

    const handleShare = async (result: any) => {
        // Ensure we have a share URL - if not, publish first
        if (!result?.share?.url) {
            try {
                const response = await fetch('http://localhost:8000/api/feedback/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: result?.session_id })
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update result with share URL
                    result.share = {
                        url: data.share_url,
                        token: data.share_url.split('/').pop() || ''
                    };
                    // Refresh results to get updated data
                    fetchResults();
                }
            } catch (error) {
                console.error('Failed to publish:', error);
                alert('Failed to generate share link. Please try again.');
                return;
            }
        }

        // Open share modal with QR code
        if (result?.share?.url) {
            setShareData({
                url: result.share.url,
                name: result.candidate?.name || 'Candidate'
            });
            setShareModalOpen(true);
        } else {
            alert('Share URL not available. Please try publishing again.');
        }
    }

    const getStatusBadge = (status: FeedbackState) => {
        const badges = {
            'NOT_GENERATED': { color: 'bg-gray-500', text: 'Pending' },
            'GENERATING': { color: 'bg-blue-500 animate-pulse', text: 'Generating...' },
            'GENERATED': { color: 'bg-yellow-500', text: 'Review' },
            'APPROVING': { color: 'bg-blue-500 animate-pulse', text: 'Approving...' },
            'APPROVED': { color: 'bg-green-500', text: 'Approved' },
            'PUBLISHING': { color: 'bg-blue-500 animate-pulse', text: 'Publishing...' },
            'PUBLISHED': { color: 'bg-[#39FF14]', text: 'Published' },
            'REJECTED': { color: 'bg-red-500', text: 'Rejected' }
        }
        const badge = badges[status] || badges['NOT_GENERATED']
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-black ${badge.color}`}>
                {badge.text}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-400">Loading results...</div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Interview Results</h2>

            {/* Results Table */}
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Candidate</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Position</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Score</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No results yet
                                </td>
                            </tr>
                        ) : (
                            results.map((result) => {
                                // Handle both old and new data formats
                                const candidateName = result.candidate?.name || (result as any).candidate_name || 'Unknown'
                                const positionTitle = result.position?.title || (result as any).position_title || 'Unknown'
                                const score = result.overall_metrics?.total_score || (result as any).overall_score || 0
                                const feedbackStatus = result.feedback?.status || 'NOT_GENERATED'

                                return (
                                    <tr key={result.session_id} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-6 py-4 text-white">{candidateName}</td>
                                        <td className="px-6 py-4 text-gray-300">{positionTitle}</td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {score}/10
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(result.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(feedbackStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReview(result)}
                                                    className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-medium rounded-lg transition-all"
                                                >
                                                    Review
                                                </button>
                                                {feedbackStatus === 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handleShare(result)}
                                                        className="px-4 py-2 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-medium rounded-lg transition-all"
                                                    >
                                                        Share
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Feedback Modal */}
            {showModal && selectedResult && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-[#141414] border-b border-[#2A2A2A] p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    {selectedResult.candidate?.name || (selectedResult as any).candidate_name || 'Candidate'}
                                </h3>
                                <p className="text-gray-400">
                                    {selectedResult.position?.title || (selectedResult as any).position_title || 'Position'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* State: NOT_GENERATED or REJECTED */}
                            {(feedbackState === 'NOT_GENERATED' || feedbackState === 'REJECTED') && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-4">Select Feedback Type</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#00E5FF] transition-colors">
                                                <input
                                                    type="radio"
                                                    name="feedbackType"
                                                    checked={feedbackType === 'short'}
                                                    onChange={() => setFeedbackType('short')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className="text-white font-medium">Short Feedback</div>
                                                    <div className="text-sm text-gray-400">1-2 paragraphs, key highlights only (~800 chars)</div>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-3 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl cursor-pointer hover:border-[#00E5FF] transition-colors">
                                                <input
                                                    type="radio"
                                                    name="feedbackType"
                                                    checked={feedbackType === 'long'}
                                                    onChange={() => setFeedbackType('long')}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <div className="text-white font-medium">Long Feedback</div>
                                                    <div className="text-sm text-gray-400">Detailed analysis, 3-5 paragraphs (~3000 chars)</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!feedbackType}
                                        className="w-full py-4 bg-[#00E5FF] hover:bg-[#00E5FF]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all"
                                    >
                                        Generate Feedback
                                    </button>
                                </div>
                            )}

                            {/* State: GENERATING */}
                            {feedbackState === 'GENERATING' && (
                                <div className="text-center py-12">
                                    <div className="inline-block w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-white text-lg">Generating {feedbackType} feedback...</p>
                                    <p className="text-gray-400 text-sm mt-2">This may take 10-30 seconds</p>
                                </div>
                            )}

                            {/* State: GENERATED */}
                            {feedbackState === 'GENERATED' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#39FF14]">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-bold">Feedback Generated ({feedbackType})</span>
                                    </div>
                                    <textarea
                                        value={feedbackContent}
                                        onChange={(e) => setFeedbackContent(e.target.value)}
                                        className="w-full h-64 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white resize-none focus:outline-none focus:border-[#00E5FF]"
                                        placeholder="Feedback content..."
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#333] text-white font-medium rounded-xl transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleRejectClick}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex-1 px-6 py-3 bg-[#39FF14] hover:bg-[#39FF14]/90 text-black font-bold rounded-xl transition-all"
                                        >
                                            Approve & Publish
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* State: APPROVING */}
                            {feedbackState === 'APPROVING' && (
                                <div className="text-center py-12">
                                    <div className="inline-block w-16 h-16 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-white text-lg">Approving feedback...</p>
                                </div>
                            )}

                            {/* State: APPROVED */}
                            {feedbackState === 'APPROVED' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#39FF14]">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-bold">Feedback Approved</span>
                                    </div>
                                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white whitespace-pre-wrap">
                                        {feedbackContent}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#333] text-white font-medium rounded-xl transition-all"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={handlePublish}
                                            className="flex-1 px-6 py-3 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-bold rounded-xl transition-all"
                                        >
                                            Publish to Candidate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* State: PUBLISHING */}
                            {feedbackState === 'PUBLISHING' && (
                                <div className="text-center py-12">
                                    <div className="inline-block w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-white text-lg">Publishing feedback...</p>
                                </div>
                            )}

                            {/* State: PUBLISHED */}
                            {feedbackState === 'PUBLISHED' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-[#39FF14]">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="font-bold">Feedback Published!</span>
                                    </div>
                                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white whitespace-pre-wrap">
                                        {feedbackContent}
                                    </div>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-3 bg-[#2A2A2A] hover:bg-[#333] text-white font-medium rounded-xl transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {shareModalOpen && (
                <ShareFeedbackModal
                    shareUrl={shareData.url}
                    candidateName={shareData.name}
                    onClose={() => setShareModalOpen(false)}
                />
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <RejectFeedbackModal
                    onReject={handleReject}
                    onCancel={() => setRejectModalOpen(false)}
                />
            )}
        </div>
    )
}
