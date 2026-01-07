'use client'

import { useState, useEffect, useRef } from 'react'
import { apiUrl } from '@/config/api'

interface WikiEntry {
  question: string
  answer: string
  category: string
  code_refs: string[]
  source: 'cache' | 'pending_llm'
  followup_suggestion?: string
}

interface RecentQuestion {
  id: string
  question: string
  category: string
}

export default function WikiWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<WikiEntry | null>(null)
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([])
  const [stats, setStats] = useState<{ cache_hit_rate: number; total_entries: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent questions and stats
  useEffect(() => {
    if (isOpen) {
      fetchRecentQuestions()
      fetchStats()
    }
  }, [isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const fetchRecentQuestions = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/entries?limit=5'))
      const data = await res.json()
      setRecentQuestions(data.entries?.map((e: any) => ({
        id: e.id,
        question: e.question,
        category: e.category
      })) || [])
    } catch (err) {
      console.error('Failed to fetch recent questions:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/stats'))
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch wiki stats:', err)
    }
  }

  const handleAsk = async (q?: string) => {
    const queryText = q || question
    if (!queryText.trim()) return

    setLoading(true)
    setAnswer(null)

    try {
      const res = await fetch(apiUrl('api/wiki/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText })
      })
      const data = await res.json()
      setAnswer(data)
      setQuestion('')
      fetchRecentQuestions() // Refresh recent
      fetchStats() // Refresh stats
    } catch (err) {
      console.error('Failed to ask wiki:', err)
      setAnswer({
        question: queryText,
        answer: 'Failed to get answer. Please try again.',
        category: 'Error',
        code_refs: [],
        source: 'pending_llm'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#00E5FF] text-black rounded-full shadow-lg hover:bg-[#00E5FF]/90 transition-all flex items-center justify-center z-50 group"
        title="Open Wiki Assistant"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute right-full mr-3 px-2 py-1 bg-black text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Ask Wiki
        </span>
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'w-64' : 'w-96'}`}>
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#00E5FF]/10 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-sm font-medium text-black dark:text-white">Wiki Assistant</span>
            {stats && (
              <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-[#1A1A1A] px-1.5 py-0.5">
                {stats.total_entries} entries
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-gray-400 hover:text-[#00E5FF] transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 dark:border-[#2A2A2A]">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about the codebase..."
                  className="w-full pl-3 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white focus:outline-none focus:border-[#00E5FF] placeholder:text-gray-400"
                  disabled={loading}
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !question.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#00E5FF] hover:bg-[#00E5FF]/10 disabled:opacity-40 transition-colors"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin rounded-full"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Answer Area */}
            {answer && (
              <div className="p-3 border-b border-gray-200 dark:border-[#2A2A2A] max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 ${answer.source === 'cache' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {answer.source === 'cache' ? 'CACHED' : 'PENDING'}
                    </span>
                    <span className="text-[10px] text-gray-500">{answer.category}</span>
                  </div>
                  <p className="text-sm text-black dark:text-white leading-relaxed">
                    {answer.answer}
                  </p>
                  {answer.code_refs && answer.code_refs.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {answer.code_refs.map((ref, i) => (
                        <span key={i} className="text-[10px] text-[#00E5FF] bg-[#00E5FF]/10 px-1.5 py-0.5 font-mono">
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                  {answer.followup_suggestion && (
                    <button
                      onClick={() => handleAsk(answer.followup_suggestion)}
                      className="text-xs text-[#00E5FF] hover:underline mt-2"
                    >
                      💡 {answer.followup_suggestion}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent Questions */}
            <div className="p-3 flex-1 overflow-y-auto max-h-48">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Recent Questions</p>
              {recentQuestions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No questions yet. Ask something!</p>
              ) : (
                <div className="space-y-1">
                  {recentQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleAsk(q.question)}
                      className="w-full text-left p-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors truncate"
                    >
                      <span className="text-[#00E5FF] mr-1">→</span>
                      {q.question}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111]">
              <a
                href="/wiki"
                className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                Open Full Wiki
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


