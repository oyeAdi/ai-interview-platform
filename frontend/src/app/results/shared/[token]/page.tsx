'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface SharedResult {
  id: string
  position: { id: string; title: string }
  candidate: { name: string }
  created_at: string
  status: string
  overall_metrics: {
    total_score: number
    questions_asked: number
    score_trend: string
  }
  feedback_summary: string
}

export default function SharedResultsPage() {
  const params = useParams()
  const token = params.token as string
  
  const [result, setResult] = useState<SharedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSharedResult()
  }, [token])

  const fetchSharedResult = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/api/results/shared/${token}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('This link is invalid or has expired')
        }
        throw new Error('Failed to load results')
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/10' }
    if (score >= 60) return { text: 'Good', color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10' }
    if (score >= 40) return { text: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
    return { text: 'Needs Improvement', color: 'text-orange-500', bg: 'bg-orange-500/10' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <Header showQuickStart={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-black dark:text-white mb-2">Unable to Load Results</h1>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const scoreInfo = getScoreMessage(result.overall_metrics.total_score)

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header showQuickStart={false} />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        {/* Thank You Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-[#00E5FF]">
            <svg className="w-10 h-10 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-black dark:text-white mb-3">
            Thank You, {result.candidate.name}!
          </h1>
          <p className="text-gray-500">
            Your interview for <strong className="text-black dark:text-white">{result.position.title}</strong> has been completed.
          </p>
        </div>

        {/* Result Card */}
        <div className="border border-gray-200 dark:border-[#2A2A2A] mb-8">
          {/* Status Header */}
          <div className="p-6 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#2A2A2A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Interview Status</p>
                <p className="text-lg text-black dark:text-white capitalize mt-1">{result.status}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-sm text-black dark:text-white mt-1">
                  {new Date(result.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className={`text-5xl font-light ${scoreInfo.color}`}>
                  {result.overall_metrics.total_score}%
                </div>
                <div className={`mt-2 px-3 py-1 text-xs font-medium ${scoreInfo.color} ${scoreInfo.bg}`}>
                  {scoreInfo.text}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-200 dark:border-[#2A2A2A] pt-6">
              <div>
                <p className="text-2xl font-light text-black dark:text-white">
                  {result.overall_metrics.questions_asked}
                </p>
                <p className="text-xs text-gray-500 mt-1">Questions Answered</p>
              </div>
              <div>
                <p className="text-2xl font-light text-black dark:text-white capitalize">
                  {result.overall_metrics.score_trend === 'improving' ? '↗ Improving' 
                    : result.overall_metrics.score_trend === 'declining' ? '↘ Declining'
                    : '→ Stable'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Performance Trend</p>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          {result.feedback_summary && (
            <div className="p-6 bg-[#00E5FF]/5 border-t border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-xs text-[#00E5FF] uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Feedback
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {result.feedback_summary}
              </p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="border border-gray-200 dark:border-[#2A2A2A] p-6">
          <h3 className="text-sm font-medium text-black dark:text-white mb-4">What Happens Next?</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium">1</span>
              <p>Our team will review your interview performance in detail.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium">2</span>
              <p>You will be contacted by our recruitment team with next steps.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium">3</span>
              <p>If you have any questions, please reach out to your recruiter.</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Have questions? Contact us at{' '}
            <a href="mailto:recruitment@epam.com" className="text-[#00E5FF] hover:underline">
              recruitment@epam.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}


