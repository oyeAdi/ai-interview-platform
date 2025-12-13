'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'
import { apiUrl } from '@/config/api'

interface CodeSubmission {
  id: string
  session_id: string
  question_id: string
  code: string
  language: string
  submitted_at: string
  time_taken_seconds: number
  evaluation: {
    combined_score: number
    rubric_scores: {
      correctness: number
      efficiency: number
      code_quality: number
      edge_cases: number
    }
    static_analysis: {
      lines_of_code: number
      cyclomatic_complexity: number
      functions_count: number
      detected_patterns: string[]
      style_issues: string[]
      syntax_valid: boolean
    }
    llm_review: {
      feedback: string
      approach: string
    }
    admin_review: {
      status: string
      reviewer: string | null
      notes: string
      score_override: number | null
      reviewed_at: string | null
      reason: string
    }
    activity_flags: string[]
  }
}

interface AdminCodeReviewProps {
  submissionId?: string
  onClose?: () => void
}

export default function AdminCodeReview({ submissionId, onClose }: AdminCodeReviewProps) {
  const [pendingReviews, setPendingReviews] = useState<any[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewNotes, setReviewNotes] = useState('')
  const [scoreOverride, setScoreOverride] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (submissionId) {
      fetchSubmission(submissionId)
    } else {
      fetchPendingReviews()
    }
  }, [submissionId])

  const fetchPendingReviews = async () => {
    try {
      const res = await fetch(apiUrl('api/code/pending-reviews'))
      const data = await res.json()
      setPendingReviews(data.pending_reviews || [])
    } catch (err) {
      console.error('Error fetching pending reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmission = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`api/code/submission/${id}`))
      const data = await res.json()
      setSelectedSubmission(data)
    } catch (err) {
      console.error('Error fetching submission:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (status: 'approved' | 'reviewed' | 'rejected') => {
    if (!selectedSubmission) return

    setSubmitting(true)
    try {
      const res = await fetch(apiUrl(`api/code/review/${selectedSubmission.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: 'Admin', // In real app, get from auth
          notes: reviewNotes,
          score_override: scoreOverride ? parseFloat(scoreOverride) : null,
          status
        })
      })

      if (res.ok) {
        // Refresh the list
        if (submissionId) {
          fetchSubmission(submissionId)
        } else {
          fetchPendingReviews()
          setSelectedSubmission(null)
        }
        setReviewNotes('')
        setScoreOverride('')
      }
    } catch (err) {
      console.error('Error submitting review:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getFlagColor = (flag: string) => {
    if (flag.includes('paste')) return 'bg-red-500/10 text-red-500 border-red-500/20'
    if (flag.includes('focus')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-epam-cyan border-t-transparent rounded-full" />
      </div>
    )
  }

  // Show submission detail view
  if (selectedSubmission) {
    const { evaluation } = selectedSubmission

    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-black dark:text-white">
                Code Review: {selectedSubmission.question_id}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSubmission.language} • {selectedSubmission.time_taken_seconds}s • {selectedSubmission.submitted_at}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-light ${getScoreColor(evaluation.combined_score)}`}>
                {evaluation.combined_score}
              </div>
              {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Activity Flags */}
          {evaluation.activity_flags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {evaluation.activity_flags.map((flag, i) => (
                <span key={i} className={`px-2 py-1 text-xs border ${getFlagColor(flag)}`}>
                  ⚠️ {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-[#2A2A2A]">
          {/* Code Panel */}
          <div className="p-6">
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-4">
              Submitted Code
            </h3>
            <pre className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] overflow-x-auto text-sm font-mono text-black dark:text-white">
              {selectedSubmission.code}
            </pre>

            {/* Static Analysis */}
            <div className="mt-6">
              <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-3">
                Static Analysis
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                  <div className="text-xs text-gray-500">Lines of Code</div>
                  <div className="text-lg text-black dark:text-white">{evaluation.static_analysis.lines_of_code}</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                  <div className="text-xs text-gray-500">Complexity</div>
                  <div className="text-lg text-black dark:text-white">{evaluation.static_analysis.cyclomatic_complexity}</div>
                </div>
              </div>

              {evaluation.static_analysis.detected_patterns.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">Detected Patterns</div>
                  <div className="flex flex-wrap gap-2">
                    {evaluation.static_analysis.detected_patterns.map((p, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-epam-cyan/10 text-epam-cyan border border-epam-cyan/20">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {evaluation.static_analysis.style_issues.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">Style Issues</div>
                  <ul className="text-xs text-amber-500 space-y-1">
                    {evaluation.static_analysis.style_issues.slice(0, 5).map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Evaluation Panel */}
          <div className="p-6">
            {/* Rubric Scores */}
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-4">
              Rubric Scores
            </h3>
            <div className="space-y-3">
              {Object.entries(evaluation.rubric_scores).map(([key, score]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>{score}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-[#2A2A2A]">
                    <div 
                      className={`h-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* LLM Feedback */}
            <div className="mt-6">
              <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-3">
                AI Feedback
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Approach:</strong> {evaluation.llm_review.approach}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {evaluation.llm_review.feedback}
                </p>
              </div>
            </div>

            {/* Admin Review Form */}
            {evaluation.admin_review.status === 'pending' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2A2A2A]">
                <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-4">
                  Your Review
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add your review notes..."
                      className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A]
                               text-black dark:text-white text-sm focus:outline-none focus:border-epam-cyan
                               resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                      Score Override (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreOverride}
                      onChange={(e) => setScoreOverride(e.target.value)}
                      placeholder={`Current: ${evaluation.combined_score}`}
                      className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A]
                               text-black dark:text-white text-sm focus:outline-none focus:border-epam-cyan"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview('approved')}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-green-500 text-white text-sm font-medium
                               hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReview('reviewed')}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-epam-cyan text-black text-sm font-medium
                               hover:bg-epam-cyan-light disabled:opacity-50 transition-colors"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleReview('rejected')}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 border border-red-500 text-red-500 text-sm font-medium
                               hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      Flag
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show existing review */}
            {evaluation.admin_review.status !== 'pending' && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2A2A2A]">
                <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-wide mb-3">
                  Review Complete
                </h3>
                <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs ${
                      evaluation.admin_review.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                      evaluation.admin_review.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      'bg-epam-cyan/10 text-epam-cyan'
                    }`}>
                      {evaluation.admin_review.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {evaluation.admin_review.reviewer} • {evaluation.admin_review.reviewed_at}
                    </span>
                  </div>
                  {evaluation.admin_review.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {evaluation.admin_review.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show pending reviews list
  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A]">
      <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
        <h2 className="text-lg font-medium text-black dark:text-white">
          Pending Code Reviews
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {pendingReviews.length} submission{pendingReviews.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No pending reviews
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-[#2A2A2A]">
          {pendingReviews.map((review) => (
            <button
              key={review.id}
              onClick={() => fetchSubmission(review.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors text-left"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black dark:text-white">{review.question_id}</span>
                  <span className="text-xs text-gray-500">{review.language}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{review.submitted_at}</div>
                {review.activity_flags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.activity_flags.map((flag: string, i: number) => (
                      <span key={i} className={`px-2 py-0.5 text-xs border ${getFlagColor(flag)}`}>
                        {flag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-light ${getScoreColor(review.combined_score)}`}>
                  {review.combined_score}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


