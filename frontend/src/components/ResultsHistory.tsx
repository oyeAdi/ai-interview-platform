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
            'NOT_GENERATED': { color: 'bg-gray-100 text-gray-500', text: 'Pending' },
            'GENERATING': { color: 'bg-blue-50 text-blue-600 animate-pulse', text: 'Generating...' },
            'GENERATED': { color: 'bg-yellow-50 text-yellow-600', text: 'Review' },
            'APPROVING': { color: 'bg-blue-50 text-blue-600 animate-pulse', text: 'Approving...' },
            'APPROVED': { color: 'bg-green-50 text-green-600', text: 'Approved' },
            'PUBLISHING': { color: 'bg-blue-50 text-blue-600 animate-pulse', text: 'Publishing...' },
            'PUBLISHED': { color: 'bg-brand-primary/10 text-brand-primary', text: 'Published' },
            'REJECTED': { color: 'bg-red-50 text-red-600', text: 'Rejected' }
        }
        const badge = badges[status] || badges['NOT_GENERATED']
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.color}`}>
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
        <div className="p-2">
            <h2 className="text-2xl font-black text-gray-900 mb-8">Interview Results</h2>

            {/* Results Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
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
                                    <tr key={result.session_id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-gray-900 font-bold">{candidateName}</td>
                                        <td className="px-6 py-4 text-gray-600">{positionTitle}</td>
                                        <td className="px-6 py-4 text-gray-900 font-black">
                                            {score}/10
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {new Date(result.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(feedbackStatus)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReview(result)}
                                                    className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                >
                                                    Review
                                                </button>
                                                {feedbackStatus === 'PUBLISHED' && (
                                                    <button
                                                        onClick={() => handleShare(result)}
                                                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-gray-200 rounded-[2rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 p-8 flex justify-between items-center z-10">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {selectedResult.candidate?.name || (selectedResult as any).candidate_name || 'Candidate'}
                                </h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    {selectedResult.position?.title || (selectedResult as any).position_title || 'Position'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8">
                            {/* State: NOT_GENERATED or REJECTED */}
                            {(feedbackState === 'NOT_GENERATED' || feedbackState === 'REJECTED') && (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Select Feedback Type</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={`flex flex-col gap-4 p-6 border-2 rounded-2xl cursor-pointer transition-all ${feedbackType === 'short' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="feedbackType"
                                                    checked={feedbackType === 'short'}
                                                    onChange={() => setFeedbackType('short')}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feedbackType === 'short' ? 'bg-brand-primary text-white' : 'bg-white text-gray-400'}`}>
                                                        <span className="text-lg">📄</span>
                                                    </div>
                                                    {feedbackType === 'short' && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <div className="text-gray-900 font-bold">Short Feedback</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-1">1-2 paragraphs, key highlights only</div>
                                                </div>
                                            </label>
                                            <label className={`flex flex-col gap-4 p-6 border-2 rounded-2xl cursor-pointer transition-all ${feedbackType === 'long' ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                                                <input
                                                    type="radio"
                                                    name="feedbackType"
                                                    checked={feedbackType === 'long'}
                                                    onChange={() => setFeedbackType('long')}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center justify-between">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feedbackType === 'long' ? 'bg-brand-primary text-white' : 'bg-white text-gray-400'}`}>
                                                        <span className="text-lg">📚</span>
                                                    </div>
                                                    {feedbackType === 'long' && <div className="w-2 h-2 bg-brand-primary rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <div className="text-gray-900 font-bold">Long Feedback</div>
                                                    <div className="text-[10px] text-gray-400 font-medium mt-1">Detailed analysis, comprehensive report</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!feedbackType}
                                        className="w-full py-5 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg"
                                    >
                                        Generate Intelligence Report
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
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 text-brand-primary">
                                        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="font-black uppercase tracking-widest text-xs">Intelligence Report Ready ({feedbackType})</span>
                                    </div>
                                    <textarea
                                        value={feedbackContent}
                                        onChange={(e) => setFeedbackContent(e.target.value)}
                                        className="w-full h-80 bg-gray-50 border border-gray-100 rounded-[2rem] p-8 text-gray-700 leading-relaxed resize-none focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
                                        placeholder="Feedback content..."
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={handleRejectClick}
                                            className="px-8 py-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 text-xs font-black uppercase tracking-widest border border-red-100 rounded-2xl transition-all"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex-1 px-8 py-4 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-brand-primary/20"
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
