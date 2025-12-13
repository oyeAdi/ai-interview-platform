'use client'

import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import AnswerInput from './AnswerInput'
import EndInterviewModal from './EndInterviewModal'
import InterviewCompleteModal from './InterviewCompleteModal'
import { apiUrl, wsUrl } from '@/config/api'

// Lazy load Monaco editor for better performance
const CodeEditor = lazy(() => import('./CodeEditor'))

interface CandidateViewProps {
  sessionId: string
  language: string
}

export default function CandidateView({ sessionId, language }: CandidateViewProps) {
  const router = useRouter()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionType, setQuestionType] = useState<string>('')
  const [isCodingQuestion, setIsCodingQuestion] = useState(false)
  const [codingLanguage, setCodingLanguage] = useState('python')
  const [starterCode, setStarterCode] = useState('')
  const [isFollowup, setIsFollowup] = useState(false)
  const [followupNumber, setFollowupNumber] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [progress, setProgress] = useState({
    rounds_completed: 0,
    total_rounds: 3,
    percentage: 0,
    current_followup: 0,
    max_followups: 2
  })
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [answerMode, setAnswerMode] = useState<'text' | 'code'>('text')
  const [codeAnswer, setCodeAnswer] = useState('')

  // End Interview Modal
  const [showEndModal, setShowEndModal] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Timer (45 minutes)
  const [timeLeft, setTimeLeft] = useState(45 * 60)

  useEffect(() => {
    if (sessionEnded) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionEnded])

  const formatTime = (seconds: number) => {
    const start = seconds < 0 ? '-' : ''
    const absSeconds = Math.abs(seconds)
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    return `${start}${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!sessionId) return

    const connect = () => {
      setConnectionStatus('connecting')
      const websocket = new WebSocket(wsUrl('ws?view=candidate'))
      wsRef.current = websocket

      websocket.onopen = () => {
        console.log('WebSocket opened, waiting for connection confirmation...')
        setWs(websocket)
        setConnectionStatus('connected')
        // Wait a moment for connection confirmation, then send start_interview
        // Connection confirmed in onmessage handler

      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('disconnected')
      }

      websocket.onclose = (event) => {
        console.log('WebSocket closed, reconnecting...', event.code, event.reason)
        setConnectionStatus('disconnected')
        // Only reconnect if not intentionally closed (code 1000) and session hasn't ended
        if (event.code !== 1000 && sessionId && !sessionEnded) {
          setTimeout(() => {
            if (sessionId && !sessionEnded) {
              connect()
            }
          }, 2000)
        }
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message received:', message.type, message)

          if (message.type === 'configuration') {
            if (message.duration_minutes) {
              const totalSeconds = message.duration_minutes * 60
              let remaining = totalSeconds

              if (message.start_time) {
                const startTime = new Date(message.start_time).getTime()
                const now = new Date().getTime()
                // Convert UTC to local if needed, but timestamps should assume UTC
                // Actually created_at is saved as datetime.utcnow().isoformat() which is Z
                // JS new Date() handles Z correctly.
                // But backend sends isoformat without Z sometimes?
                // Assuming it's UTC-ish.
                // Ideally backend sends Z.

                // Correction: backend isoformat might not have Z.
                // Assuming client and server are loosely synced or just use delta
                const elapsedSeconds = Math.floor((now - new Date(message.start_time + (message.start_time.endsWith('Z') ? '' : 'Z')).getTime()) / 1000)

                // Safety: if elapsed is negative (clock skew), treat as 0
                if (elapsedSeconds > 0) {
                  remaining = totalSeconds - elapsedSeconds
                }
              }

              setTimeLeft(Math.max(0, remaining))
            }
          }

          if (message.type === 'connected') {
            console.log('WebSocket connection confirmed:', message.message)
            // Now send start_interview
            if (websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                type: 'start_interview',
                session_id: sessionId
              }))
            }
            return
          }

          if (message.type === 'error') {
            console.error('WebSocket error:', message.message)
            // Close WebSocket gracefully before navigating
            if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
              websocket.onclose = null // Prevent reconnection logic from firing
              websocket.close(1000, 'Error received')
            }
            setSessionEnded(true) // Prevent reconnection
            alert(`Error: ${message.message}\n\nPlease start a new interview from the landing page.`)
            router.push('/')
            return
          } else if (message.type === 'greeting') {
            // Greeting received
            return
          } else if (message.type === 'question') {
            setIsSubmitting(false)
            const data = message.data || {}
            setCurrentQuestion(data.text || message.text || '')
            setQuestionType(data.question_type || '')
            setIsFollowup(false)
            setFollowupNumber(0)

            // Check if this is a coding question
            const isCoding = data.question_type === 'coding' || data.is_coding === true
            setIsCodingQuestion(isCoding)
            if (isCoding) {
              setAnswerMode('code')
              setCodingLanguage(data.coding_language || language || 'python')
              setStarterCode(data.starter_code || '')
              setCodeAnswer(data.starter_code || '')
            } else {
              setAnswerMode('text')
            }

            const roundNum = data.round_number || questionNumber
            setQuestionNumber(roundNum)
            setProgress(prev => ({ ...prev, current_followup: 0 }))
          } else if (message.type === 'followup') {
            setIsSubmitting(false)
            setCurrentQuestion(message.data?.text || message.text || '')
            setIsFollowup(true)
            const fNum = message.data?.followup_number || 1
            setFollowupNumber(fNum)
            setProgress(prev => ({ ...prev, current_followup: fNum }))
          } else if (message.type === 'progress') {
            setProgress(prev => ({ ...prev, ...message.data }))
          } else if (message.type === 'session_end') {
            setIsSubmitting(false)
            setSessionEnded(true)
            setTimeout(() => {
              router.push('/thanks')
            }, 2000)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [sessionId, router])

  const handleSubmitAnswer = (answer: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !answer.trim() || isSubmitting) return

    setIsSubmitting(true)
    const responseType = isFollowup ? 'followup' : 'initial'
    wsRef.current.send(JSON.stringify({
      type: 'response',
      text: answer,
      response_type: responseType,
      session_id: sessionId,
      is_code: answerMode === 'code'
    }))
  }

  const handleSubmitCode = () => {
    if (!codeAnswer.trim()) return
    handleSubmitAnswer(codeAnswer)
    setCodeAnswer('')
  }

  const handleTyping = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'typing',
      text: text,
      session_id: sessionId
    }))
  }

  const handleEndInterview = async () => {
    setIsEndingInterview(true)
    try {
      const response = await fetch(apiUrl(`api/interview/${sessionId}/end`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ended_by: 'candidate',
          reason: 'ended_early'
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Interview ended:', data)
        setSessionEnded(true)
        setShowEndModal(false)

        // Notify through WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'interview_ended',
            session_id: sessionId,
            ended_by: 'candidate'
          }))
        }
      } else {
        const errorData = await response.json()
        alert(errorData.detail || 'Failed to end interview')
      }
    } catch (error) {
      console.error('Error ending interview:', error)
      alert('Failed to end interview. Please try again.')
    } finally {
      setIsEndingInterview(false)
    }
  }

  if (sessionEnded) {
    if (sessionEnded) {
      return <InterviewCompleteModal isOpen={true} />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* EPAM Header */}
      <header className="bg-black border-b border-[#1A1A1A] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <span className="text-white font-bold text-xl">&lt;epam&gt;</span>
              <div className="h-6 w-px bg-[#2A2A2A]"></div>
              <span className="text-white font-medium">AI Interview</span>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] ml-2 ${timeLeft <= 0
                ? 'text-red-500 border-red-900/50 animate-pulse'
                : timeLeft < 300
                  ? 'text-yellow-400 border-yellow-900/30'
                  : 'text-[#00E5FF]'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono font-bold text-sm tracking-widest">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Status & End Button */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium ${connectionStatus === 'connected'
                ? 'text-[#00E5FF]'
                : connectionStatus === 'connecting'
                  ? 'text-yellow-400'
                  : 'text-red-400'
                }`}>
                <span className={`w-2 h-2 ${connectionStatus === 'connected'
                  ? 'bg-[#00E5FF] animate-pulse'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-400'
                  }`}></span>
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </div>
              <span className="text-xs text-gray-600 font-mono">{sessionId?.slice(0, 12)}...</span>

              {/* End Interview Button */}
              <button
                onClick={() => setShowEndModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
              >
                End Interview
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Progress Section */}


        {/* Question Card */}
        <div className="border border-[#1A1A1A] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1A1A1A] flex items-center justify-between bg-[#0A0A0A]">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-medium ${isFollowup
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                }`}>
                {isFollowup ? 'Follow-up Question' : `Question ${questionNumber}`}
              </span>
              {questionType && (
                <span className="text-xs text-gray-500 capitalize">{questionType.replace(/_/g, ' ')}</span>
              )}
              {isCodingQuestion && (
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 uppercase tracking-wide">
                  Coding
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600 uppercase tracking-wider">{language}</span>
          </div>

          <div className="p-6 bg-[#0A0A0A]">
            {currentQuestion ? (
              <p className="text-white text-lg leading-relaxed">{currentQuestion}</p>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 border border-[#2A2A2A] flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Preparing your question...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Section */}
        <div className="border border-[#1A1A1A] overflow-hidden">
          {/* Answer Mode Toggle (for coding questions) */}
          {isCodingQuestion && (
            <div className="flex border-b border-[#1A1A1A]">
              <button
                type="button"
                onClick={() => setAnswerMode('code')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${answerMode === 'code'
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-b-2 border-[#00E5FF]'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
                Code Editor
              </button>
              <button
                type="button"
                onClick={() => setAnswerMode('text')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${answerMode === 'text'
                  ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-b-2 border-[#00E5FF]'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Text Answer
              </button>
            </div>
          )}

          <div className="px-6 py-4 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {answerMode === 'code' ? 'Your Code' : 'Your Answer'}
              </h3>
              {answerMode !== 'code' && (
                <div className="group relative flex items-center gap-1 cursor-help">
                  <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#00E5FF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] text-gray-500 group-hover:text-[#00E5FF] transition-colors hidden sm:inline">Type faster?</span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 right-0 w-60 p-3 bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-[#00E5FF] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-200 font-medium mb-1">Use Voice Typing</p>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono text-gray-300">Win</kbd> + <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono text-gray-300">H</kbd> (Windows) or <kbd className="px-1 py-0.5 bg-gray-800 rounded border border-gray-700 font-mono text-gray-300">Fn</kbd> (Mac) to use system dictation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {answerMode === 'code' ? (
              <div className="space-y-4">
                {/* Language indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Language:</span>
                    <span className="text-xs text-[#00E5FF] uppercase font-mono">{codingLanguage}</span>
                  </div>
                </div>

                {/* Monaco Editor */}
                <Suspense fallback={
                  <div className="h-[350px] bg-[#0A0A0A] border border-[#1A1A1A] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-gray-500">Loading code editor...</p>
                    </div>
                  </div>
                }>
                  <CodeEditor
                    language={codingLanguage}
                    initialCode={starterCode}
                    onChange={(value) => {
                      const val = value || ''
                      setCodeAnswer(val)

                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current)
                      }

                      typingTimeoutRef.current = setTimeout(() => {
                        handleTyping(val)
                      }, 500)
                    }}
                    height="350px"
                  />
                </Suspense>

                {/* Submit button for code */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    Write your solution and click submit when ready
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitCode}
                    disabled={!codeAnswer.trim() || isSubmitting}
                    className="px-6 py-2.5 bg-[#00E5FF] hover:bg-[#66F2FF] 
                               disabled:bg-[#1A1A1A] disabled:text-gray-600 disabled:cursor-not-allowed 
                               text-black font-medium transition-colors duration-200
                               flex items-center gap-2"
                  >
                    Submit Code
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <AnswerInput
                onSubmit={handleSubmitAnswer}
                onTyping={handleTyping}
                isCodingQuestion={isCodingQuestion}
                language={codingLanguage}
              />
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="flex items-start gap-3 p-4 border border-[#00E5FF]/20 bg-[#00E5FF]/5">
          <svg className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-sm text-gray-400">
            {answerMode === 'code'
              ? 'Write clean, well-commented code. The AI will evaluate your solution and may ask follow-up questions about your approach.'
              : 'Take your time to provide a thorough answer. The AI interviewer will ask follow-up questions based on your responses.'
            }
          </p>
        </div>
      </main>

      {/* End Interview Confirmation Modal */}
      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndInterview}
        isEnding={isEndingInterview}
      />
    </div>
  )
}
