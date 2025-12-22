'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiUrl } from '@/config/api'

export default function ThanksPage() {
  const router = useRouter()
  const [thankYouUrl, setThankYouUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get the personalized thank you URL from localStorage
    const url = localStorage.getItem('candidate_thank_you_url')
    setThankYouUrl(url)
  }, [])

  const handleCheckFeedback = async () => {
    // If we already have the URL, use it
    if (thankYouUrl) {
      router.push(thankYouUrl)
      return
    }

    // Otherwise, fetch it from backend using session_id
    setLoading(true)
    try {
      const sessionId = localStorage.getItem('current_session_id')
      if (!sessionId) {
        alert('Session not found. Please start a new interview.')
        return
      }

      const response = await fetch(apiUrl(`api/interview/${sessionId}/end`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ended_by: 'candidate',
          reason: 'check_feedback'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.redirect_urls?.candidate) {
          localStorage.setItem('candidate_thank_you_url', data.redirect_urls.candidate)
          router.push(data.redirect_urls.candidate)
        } else {
          alert('Unable to get feedback URL. Please try again.')
        }
      }
    } catch (error) {
      console.error('Failed to get thank you URL:', error)
      alert('Failed to load feedback page. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#00E5FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Interview Completed
          </h1>
          <p className="text-gray-400">
            Thank you for your time. Your session has been recorded.
          </p>
        </div>

        {/* Content Area */}
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl min-h-[400px] flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-gray-400 mb-6">
              Your interview has been completed successfully. Our expert is reviewing your performance and preparing detailed feedback.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Click the button below to check your feedback status. You can return to this page anytime to see if your feedback is ready.
            </p>
          </div>

          <button
            onClick={handleCheckFeedback}
            disabled={loading}
            className="px-8 py-4 bg-[#39FF14] hover:bg-[#7FFF5C] text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Check Your Feedback Status
              </>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">
            💡 Tip: Bookmark the feedback status page for easy access
          </p>
        </div>
      </div>
    </div>
  )
}



