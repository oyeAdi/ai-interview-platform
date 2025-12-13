'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface QuestionResult {
  question_id: string
  question_text: string
  topic: string
  candidate_answer: string
  scores: {
    deterministic: {
      factual_correctness?: number
      completeness?: number
      technical_accuracy?: number
      depth?: number
      clarity?: number
      keyword_coverage?: number
    }
    llm_score: number
    combined_score: number
  }
  ai_feedback: {
    summary: string
    strengths: string[]
    weaknesses: string[]
  }
  followup_count?: number
  followup_stop_reason?: string
  followup_confidence?: number
  followups: Array<{
    question: string
    answer: string
    score: number
  }>
}

interface InterviewResult {
  id: string
  session_id: string
  candidate: { id: string; name: string; experience_level?: string }
  position: { id: string; title: string }
  created_at: string
  ended_by: string
  end_reason: string
  status: string
  overall_metrics: {
    total_score: number
    questions_asked: number
    avg_response_time_sec: number
    score_trend: string
    topics_covered: string[]
  }
  question_results: QuestionResult[]
  followup_metrics?: {
    total_followups_asked: number
    per_question: Record<string, {
      count: number
      stopped_reason: string
      confidence: number
    }>
  }
  admin_feedback: {
    overall_notes: string
    question_notes: Record<string, string>
    recommendation: string
    added_by: string | null
    added_at: string | null
  }
  shareable_link: {
    token: string | null
    expires_at: string | null
    views: string[]
  }
}

function ScoreBar({ label, score, color = 'cyan' }: { label: string; score: number; color?: string }) {
  const colorClasses = {
    cyan: 'bg-[#00E5FF]',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-[#1A1A1A]">
        <div 
          className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.cyan}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-10 text-right">{score}%</span>
    </div>
  )
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const resultId = params.result_id as string
  
  const [result, setResult] = useState<InterviewResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  
  // Admin feedback state
  const [overallNotes, setOverallNotes] = useState('')
  const [recommendation, setRecommendation] = useState('pending')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    fetchResult()
  }, [resultId])

  const fetchResult = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/results/${resultId}?admin=true`)
      if (!res.ok) {
        throw new Error('Result not found')
      }
      const data = await res.json()
      setResult(data)
      setOverallNotes(data.admin_feedback?.overall_notes || '')
      setRecommendation(data.admin_feedback?.recommendation || 'pending')
    } catch (err) {
      setError('Failed to load interview result')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const saveFeedback = async () => {
    setSavingFeedback(true)
    try {
      const res = await fetch(`http://localhost:8000/api/results/${resultId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall_notes: overallNotes,
          question_notes: {},
          recommendation
        })
      })
      if (res.ok) {
        fetchResult() // Refresh
      }
    } catch (err) {
      console.error('Failed to save feedback:', err)
    } finally {
      setSavingFeedback(false)
    }
  }

  const generateShareLink = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/results/${resultId}/share`, {
        method: 'POST'
      })
      const data = await res.json()
      const fullUrl = `${window.location.origin}${data.share_url}`
      setShareUrl(fullUrl)
    } catch (err) {
      console.error('Failed to generate share link:', err)
    }
  }

  const copyShareUrl = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setTimeout(() => setCopying(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      setCopying(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500'
    if (score >= 50) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↗'
    if (trend === 'declining') return '↘'
    return '→'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Header showQuickStart={false} showBackToDashboard={true} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl text-black dark:text-white mb-2">Result Not Found</h1>
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={() => router.push('/')} className="text-[#00E5FF] hover:underline">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header showQuickStart={false} showBackToDashboard={true} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-black dark:text-white mb-2">Interview Results</h1>
            <p className="text-gray-500">
              {result.candidate.name} • {result.position.title}
            </p>
          </div>
          <div className="flex gap-3">
            {shareUrl ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={shareUrl}
                  readOnly
                  className="px-3 py-2 text-xs bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2A2A2A] w-64"
                />
                <button
                  onClick={copyShareUrl}
                  className={`px-3 py-2 text-xs ${copying ? 'bg-green-500 text-white' : 'bg-[#00E5FF] text-black'}`}
                >
                  {copying ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <button
                onClick={generateShareLink}
                className="px-4 py-2 text-sm border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF]/10 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share with Candidate
              </button>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Date</p>
            <p className="text-sm text-black dark:text-white">
              {new Date(result.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Session ID</p>
            <p className="text-sm text-[#00E5FF] font-mono">{result.session_id}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status</p>
            <p className="text-sm text-black dark:text-white capitalize">{result.status}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ended By</p>
            <p className="text-sm text-black dark:text-white capitalize">{result.ended_by}</p>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Overall Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-center">
              <p className={`text-4xl font-light ${getScoreColor(result.overall_metrics.total_score)}`}>
                {result.overall_metrics.total_score}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Overall Score</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-center">
              <p className="text-4xl font-light text-black dark:text-white">
                {result.overall_metrics.questions_asked}
              </p>
              <p className="text-xs text-gray-500 mt-1">Questions</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-center">
              <p className="text-4xl font-light text-black dark:text-white">
                {result.overall_metrics.avg_response_time_sec}s
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg Response</p>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-center">
              <p className="text-4xl font-light text-[#00E5FF]">
                {getTrendIcon(result.overall_metrics.score_trend)}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{result.overall_metrics.score_trend}</p>
            </div>
          </div>
          
          {/* Topics Covered */}
          {result.overall_metrics.topics_covered.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Topics:</span>
              {result.overall_metrics.topics_covered.map((topic, i) => (
                <span key={i} className="px-2 py-0.5 text-xs bg-[#00E5FF]/10 text-[#00E5FF]">
                  {topic}
                </span>
              ))}
            </div>
          )}
          
          {/* Follow-up Analysis Summary */}
          {result.followup_metrics && (
            <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20">
              <h3 className="text-sm font-medium text-purple-400 mb-3">Follow-up Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-light text-purple-400">
                    {result.followup_metrics.total_followups_asked}
                  </p>
                  <p className="text-xs text-gray-500">Total Follow-ups</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-green-400">
                    {Object.values(result.followup_metrics.per_question).filter(q => q.stopped_reason === 'sufficient_skill').length}
                  </p>
                  <p className="text-xs text-gray-500">Sufficient Skill</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-red-400">
                    {Object.values(result.followup_metrics.per_question).filter(q => q.stopped_reason === 'no_knowledge').length}
                  </p>
                  <p className="text-xs text-gray-500">No Knowledge</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-light text-yellow-400">
                    {Object.values(result.followup_metrics.per_question).filter(q => q.stopped_reason === 'max_reached').length}
                  </p>
                  <p className="text-xs text-gray-500">Max Reached</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question-by-Question Analysis */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Question-by-Question Analysis</h2>
          <div className="space-y-4">
            {result.question_results.map((q, index) => (
              <div 
                key={q.question_id}
                className="border border-gray-200 dark:border-[#2A2A2A]"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(q.question_id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xs text-gray-400 flex-shrink-0">Q{index + 1}</span>
                    <span className="text-sm text-black dark:text-white truncate">
                      {q.question_text.slice(0, 100)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-medium ${getScoreColor(q.scores.combined_score)}`}>
                      {q.scores.combined_score}%
                    </span>
                    <svg 
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedQuestions.has(q.question_id) ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedQuestions.has(q.question_id) && (
                  <div className="border-t border-gray-200 dark:border-[#2A2A2A]">
                    {/* Full Question */}
                    <div className="p-4 bg-gray-50 dark:bg-[#111]">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Question</p>
                      <p className="text-sm text-black dark:text-white">{q.question_text}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Candidate Answer</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {q.candidate_answer || 'No answer provided'}
                      </p>
                    </div>

                    {/* Score Breakdown */}
                    <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Score Breakdown</p>
                      <div className="space-y-2">
                        {q.scores.deterministic.factual_correctness !== undefined && (
                          <ScoreBar label="Factual" score={q.scores.deterministic.factual_correctness} />
                        )}
                        {q.scores.deterministic.technical_accuracy !== undefined && (
                          <ScoreBar label="Technical" score={q.scores.deterministic.technical_accuracy} />
                        )}
                        {q.scores.deterministic.completeness !== undefined && (
                          <ScoreBar label="Completeness" score={q.scores.deterministic.completeness} />
                        )}
                        {q.scores.deterministic.depth !== undefined && (
                          <ScoreBar label="Depth" score={q.scores.deterministic.depth} />
                        )}
                        {q.scores.deterministic.clarity !== undefined && (
                          <ScoreBar label="Clarity" score={q.scores.deterministic.clarity} />
                        )}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-[#00E5FF]/5">
                      <p className="text-xs text-[#00E5FF] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Feedback
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{q.ai_feedback.summary}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-green-500 mb-2">✓ Strengths</p>
                          <ul className="space-y-1">
                            {q.ai_feedback.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-gray-500">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs text-red-400 mb-2">✗ Areas to Improve</p>
                          <ul className="space-y-1">
                            {q.ai_feedback.weaknesses.map((w, i) => (
                              <li key={i} className="text-xs text-gray-500">• {w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Follow-ups with Analysis */}
                    {q.followups.length > 0 && (
                      <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Follow-up Questions</p>
                          {/* Follow-up Analysis Badge */}
                          {q.followup_count !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs">
                                {q.followup_count} follow-ups
                              </span>
                              {q.followup_stop_reason && (
                                <span className={`px-2 py-0.5 text-xs ${
                                  q.followup_stop_reason === 'sufficient_skill' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : q.followup_stop_reason === 'no_knowledge'
                                      ? 'bg-red-500/20 text-red-400'
                                      : q.followup_stop_reason === 'max_reached'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {q.followup_stop_reason.replace(/_/g, ' ')}
                                </span>
                              )}
                              {q.followup_confidence !== undefined && (
                                <span className="text-xs text-gray-500">
                                  ({Math.round(q.followup_confidence * 100)}% conf)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {q.followups.map((f, i) => (
                            <div key={i} className="pl-4 border-l-2 border-[#00E5FF]/30">
                              <p className="text-xs text-[#00E5FF] mb-1">{f.question}</p>
                              <p className="text-xs text-gray-500">{f.answer || 'No answer'}</p>
                              <p className="text-xs text-gray-400 mt-1">Score: {f.score}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Admin Feedback Section */}
        <div className="mb-8 p-6 border border-[#00E5FF]/30 bg-[#00E5FF]/5">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Admin Recommendation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                Overall Notes
              </label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={4}
                placeholder="Add your notes about this candidate..."
                className="w-full px-4 py-3 text-sm bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                Recommendation
              </label>
              <div className="flex gap-3">
                {['proceed', 'hold', 'reject'].map((rec) => (
                  <button
                    key={rec}
                    onClick={() => setRecommendation(rec)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      recommendation === rec
                        ? rec === 'proceed' ? 'bg-green-500 text-white'
                        : rec === 'hold' ? 'bg-yellow-500 text-black'
                        : 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                    }`}
                  >
                    {rec.charAt(0).toUpperCase() + rec.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveFeedback}
                disabled={savingFeedback}
                className="px-6 py-2.5 text-sm font-medium bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {savingFeedback ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save Feedback'
                )}
              </button>
            </div>

            {result.admin_feedback.added_at && (
              <p className="text-xs text-gray-500 text-right">
                Last updated: {new Date(result.admin_feedback.added_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

