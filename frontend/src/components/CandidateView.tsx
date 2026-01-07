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

const AGENTS = [
  'Analyst', 'Critic', 'Observer',
  'Planner', 'Architect', 'Executioner',
  'Evaluator', 'Interpreter', 'Guardian',
  'Watcher', 'Logger'
]

export default function CandidateView({ sessionId, language }: CandidateViewProps) {
  const router = useRouter()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [progress, setProgress] = useState({
    rounds_completed: 0,
    total_rounds: 5,
    percentage: 0
  })
  const [sessionEnded, setSessionEnded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [answerMode, setAnswerMode] = useState<'text' | 'code'>('text')
  const [codeAnswer, setCodeAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeAgents, setActiveAgents] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [showEndModal, setShowEndModal] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [isQuickMode, setIsQuickMode] = useState(false)
  const codeTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    if (mode === 'quick') {
      setIsQuickMode(true)
      setTimeLeft(15 * 60)
    }
  }, [])

  const [finalReport, setFinalReport] = useState<any>(null)

  useEffect(() => {
    if (sessionEnded) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [sessionEnded])

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds)
    const mins = Math.floor(absSeconds / 60)
    const secs = absSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!sessionId) return

    const connect = () => {
      setConnectionStatus('connecting')
      const websocket = new WebSocket(wsUrl(`ws/swarm/${sessionId}`))
      wsRef.current = websocket

      websocket.onopen = () => {
        setConnectionStatus('connected')
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'greeting') {
            setCurrentQuestion(message.data?.text || '')
            setQuestionNumber(1)
            triggerSwarmPulse(['Executioner', 'Guardian'])
            return
          }

          if (message.type === 'swarm_response') {
            setIsSubmitting(false)
            const data = message.data || {}
            setCurrentQuestion(data.response || '')
            if (data.progress) setProgress(data.progress)
            setQuestionNumber(data.progress?.rounds_completed + 1 || 1)
            triggerSwarmPulse(['Interpreter', 'Evaluator', 'Planner', 'Executioner', 'Guardian'])
            return
          }

          if (message.type === 'session_ended') {
            if (message.data?.final_report) {
              setFinalReport(message.data.final_report)
            }
            setSessionEnded(true)
            return
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [sessionId])

  const triggerSwarmPulse = (agents: string[]) => {
    setActiveAgents(agents)
    setTimeout(() => setActiveAgents([]), 3000)
  }

  const handleSubmitAnswer = (answer: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !answer.trim() || isSubmitting) return
    setIsSubmitting(true)
    triggerSwarmPulse(['Guardian', 'Watcher'])
    wsRef.current.send(JSON.stringify({
      type: 'candidate_response',
      text: answer,
      session_id: sessionId
    }))
  }

  const handleTyping = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({
      type: 'candidate_typing',
      text: text,
      session_id: sessionId
    }))
  }

  const handleCodeTyping = (text: string) => {
    if (codeTypingTimeoutRef.current) clearTimeout(codeTypingTimeoutRef.current)
    codeTypingTimeoutRef.current = setTimeout(() => {
      handleTyping(text)
    }, 500)
  }

  const handleEndInterview = async () => {
    setIsEndingInterview(true)
    try {
      const response = await fetch(apiUrl(`api/interview/${sessionId}/end`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_by: 'candidate', reason: 'ended_early' })
      })
      if (response.ok) setSessionEnded(true)
    } catch (error) {
      console.error('Error ending interview:', error)
    } finally {
      setIsEndingInterview(false)
    }
  }

  if (sessionEnded) return <InterviewCompleteModal isOpen={true} report={finalReport} />

  if (isQuickMode) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00E5FF]/30 flex flex-col">
        {/* Minimalist Header */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00E5FF] rounded flex items-center justify-center">
              <span className="text-black font-black text-[10px]">SH</span>
            </div>
            <span className="font-bold tracking-tight text-sm">SwarmHire</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Time Remaining</span>
              <span className={`font-mono text-lg font-bold tabular-nums ${timeLeft < 180 ? 'text-red-500 animate-pulse' : 'text-[#00E5FF]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black border border-red-500/20 rounded-lg transition-all duration-300 text-[10px] font-black uppercase tracking-widest"
            >
              End Session
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 py-12">
          {/* Question Area */}
          <div className="w-full mb-12 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest mb-8 border border-white/10">
              Question {questionNumber}
            </div>

            {currentQuestion ? (
              <h2 className="text-4xl md:text-5xl font-light leading-tight text-white/90 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {currentQuestion}
              </h2>
            ) : (
              <div className="flex items-center justify-center gap-4 py-8">
                <div className="w-2 h-2 bg-[#00E5FF] rounded-full animate-ping"></div>
                <span className="text-white/20 font-medium italic text-xl">Swarm is thinking...</span>
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div className="w-full space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00E5FF]/10 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative p-2 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                {answerMode === 'code' ? (
                  <div className="p-6 space-y-6">
                    <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-2xl"></div>}>
                      <CodeEditor
                        language={language.toLowerCase()}
                        initialCode={codeAnswer}
                        onChange={(val) => {
                          const text = val || ''
                          setCodeAnswer(text)
                          handleCodeTyping(text)
                        }}
                        height="400px"
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="p-4">
                    <AnswerInput
                      onSubmit={handleSubmitAnswer}
                      onTyping={handleTyping}
                      isCodingQuestion={false}
                      language={language}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-4">
              <div className="flex gap-6">
                <button
                  onClick={() => setAnswerMode('text')}
                  className={`text-[10px] uppercase tracking-[0.2em] font-black transition-all ${answerMode === 'text' ? 'text-[#00E5FF]' : 'text-white/20 hover:text-white/40'}`}
                >
                  Text Response
                </button>
                <button
                  onClick={() => setAnswerMode('code')}
                  className={`text-[10px] uppercase tracking-[0.2em] font-black transition-all ${answerMode === 'code' ? 'text-[#00E5FF]' : 'text-white/20 hover:text-white/40'}`}
                >
                  Code Mode
                </button>
              </div>

              {answerMode === 'code' && (
                <button
                  onClick={() => handleSubmitAnswer(codeAnswer)}
                  disabled={!codeAnswer.trim() || isSubmitting}
                  className="px-8 py-3 bg-[#00E5FF] hover:bg-[#00A3FF] text-black font-black uppercase tracking-widest text-[10px] transition-all rounded-xl disabled:opacity-20 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Code'}
                </button>
              )}
            </div>
          </div>
        </main>

        <EndInterviewModal
          isOpen={showEndModal}
          onClose={() => setShowEndModal(false)}
          onConfirm={handleEndInterview}
          isEnding={isEndingInterview}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50 text-gray-900 font-sans selection:bg-brand-primary/30">
      {/* Premium Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.3)] group-hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all duration-500">
                <span className="text-white font-black text-xs">SH</span>
              </div>
              <span className="font-bold tracking-tight text-lg text-gray-900">SwarmHire <span className="text-brand-primary font-light">2.0</span></span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-100 rounded-full border border-gray-200">
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-brand-primary animate-pulse shadow-[0_0_10px_#FF6B35]' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{connectionStatus}</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Time Remaining</span>
              <span className={`font-mono text-xl font-bold tabular-nums ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-500 border border-red-200 hover:bg-red-50 transition-all duration-300 rounded-lg"
            >
              Terminate Session
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-12 gap-8">
        {/* Left Column: Swarm Pulse & Progress */}
        <div className="col-span-3 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">Swarm Intelligence Pulse</h3>
            <div className="grid grid-cols-1 gap-2">
              {AGENTS.map(agent => (
                <div key={agent} className="flex items-center justify-between group">
                  <span className={`text-xs transition-all duration-500 ${activeAgents.includes(agent) ? 'text-brand-primary font-bold translate-x-1' : 'text-gray-400'}`}>
                    {agent}
                  </span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeAgents.includes(agent) ? 'bg-brand-primary shadow-[0_0_8px_#FF6B35] scale-125' : 'bg-gray-200'}`}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-4">Interview Trajectory</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-brand-primary">{Math.round(progress.percentage)}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Round {progress.rounds_completed} of {progress.total_rounds}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-1000 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Question & Answer */}
        <div className="col-span-9 space-y-8">
          {/* Question Card */}
          <div className="relative group">
            <div className="relative p-10 rounded-[2rem] bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest border border-brand-primary/20">
                  Question {questionNumber}
                </span>
                <div className="h-px flex-1 bg-gray-100"></div>
              </div>

              {currentQuestion ? (
                <h2 className="text-3xl font-bold leading-tight text-gray-900 tracking-tight">
                  {currentQuestion}
                </h2>
              ) : (
                <div className="flex items-center gap-4 py-4">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping"></div>
                  <span className="text-gray-400 font-medium italic">Swarm is synthesizing your next challenge...</span>
                </div>
              )}
            </div>
          </div>

          {/* Answer Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setAnswerMode('text')}
                  className={`text-[10px] uppercase tracking-[0.2em] font-black transition-all ${answerMode === 'text' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Textual Response
                </button>
                <button
                  onClick={() => setAnswerMode('code')}
                  className={`text-[10px] uppercase tracking-[0.2em] font-black transition-all ${answerMode === 'code' ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Code Implementation
                </button>
              </div>
            </div>

            <div className="p-2 rounded-[2rem] bg-white border border-gray-200 shadow-sm">
              {answerMode === 'code' ? (
                <div className="p-6 space-y-6">
                  <Suspense fallback={<div className="h-[400px] animate-pulse bg-white/5 rounded-2xl"></div>}>
                    <CodeEditor
                      language={language.toLowerCase()}
                      initialCode={codeAnswer}
                      onChange={(val) => {
                        const text = val || ''
                        setCodeAnswer(text)
                        handleCodeTyping(text)
                      }}
                      height="400px"
                    />
                  </Suspense>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmitAnswer(codeAnswer)}
                      disabled={!codeAnswer.trim() || isSubmitting}
                      className="px-8 py-4 bg-black hover:bg-gray-800 text-white font-black uppercase tracking-widest text-xs transition-all rounded-2xl disabled:opacity-20 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSubmitting ? 'Transmitting...' : 'Submit Implementation'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <AnswerInput
                    onSubmit={handleSubmitAnswer}
                    onTyping={handleTyping}
                    isCodingQuestion={false}
                    language={language}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndInterview}
        isEnding={isEndingInterview}
      />
    </div>
  )
}
