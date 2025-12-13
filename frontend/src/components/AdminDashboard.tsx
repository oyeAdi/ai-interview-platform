'use client'

import { useEffect, useState, useRef } from 'react'
import LiveScores from './LiveScores'
import StrategyVisualization from './StrategyVisualization'
import LogViewer from './LogViewer'
import TimeMetrics from './TimeMetrics'

interface AdminDashboardProps {
  sessionId: string
  language: string
}

interface ResponseTiming {
  questionId: string
  questionNumber: number
  isFollowup: boolean
  followupNumber?: number
  startTime: number
  endTime?: number
  score?: number
}

export default function AdminDashboard({ sessionId, language }: AdminDashboardProps) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [logData, setLogData] = useState<any>(null)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [candidateTyping, setCandidateTyping] = useState<string>('')
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<string>('')
  const [progress, setProgress] = useState({ 
    rounds_completed: 0, 
    total_rounds: 3, 
    percentage: 0, 
    current_followup: 0,
    max_followups: 10,  // Updated from 2 to 10
    followup_stop_reason: null as string | null,
    followup_confidence: 0
  })
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [responseHistory, setResponseHistory] = useState<any[]>([])
  const [responseTimings, setResponseTimings] = useState<ResponseTiming[]>([])
  const [currentQuestionStart, setCurrentQuestionStart] = useState<number | null>(null)
  const [isAnswering, setIsAnswering] = useState(false)
  const [activeTab, setActiveTab] = useState<'evaluation' | 'timing'>('evaluation')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!sessionId) {
      console.warn('AdminDashboard: No sessionId provided')
      return
    }

    const connect = () => {
      const websocket = new WebSocket(`ws://localhost:8000/ws?view=admin`)
      wsRef.current = websocket
      
      websocket.onopen = () => {
        console.log('Admin WebSocket connected')
        setWs(websocket)
        setConnectionStatus('connected')
        websocket.send(JSON.stringify({
          type: 'start_interview',
          session_id: sessionId
        }))
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('Admin received:', message.type, message.data)
          
          if (message.type === 'evaluation') {
            setEvaluation(message.data)
            // Add to response history with proper score
            const score = message.data?.overall_score || 0
            setResponseHistory(prev => [...prev.slice(-8), {
              time: new Date().toLocaleTimeString(),
              score: score,
              type: currentQuestion?.isFollowup ? 'followup' : 'initial'
            }])
            
            // Update timing data
            if (currentQuestionStart) {
              setResponseTimings(prev => {
                const updated = [...prev]
                const lastTiming = updated[updated.length - 1]
                if (lastTiming && !lastTiming.endTime) {
                  lastTiming.endTime = Date.now()
                  lastTiming.score = score
                }
                return updated
              })
              setIsAnswering(false)
            }
            
            // Clear typing when evaluation received (answer was submitted)
            setLastSubmittedAnswer(candidateTyping)
            setCandidateTyping('')
          } else if (message.type === 'strategy_change') {
            setStrategy(message.data)
          } else if (message.type === 'log_update') {
            setLogData(message.data)
          } else if (message.type === 'progress') {
            setProgress(prev => ({ ...prev, ...message.data }))
          } else if (message.type === 'question') {
            // NEW main question - use round_number from backend
            const qNum = message.data?.round_number || (progress.rounds_completed + 1)
            const questionId = message.data?.question_id || `q${qNum}`
            setCurrentQuestion({ 
              text: message.data?.text || message.text, 
              isFollowup: false,
              questionNumber: qNum,
              questionId
            })
            setCandidateTyping('')
            setLastSubmittedAnswer('')
            
            // Start timing for new question
            const startTime = Date.now()
            setCurrentQuestionStart(startTime)
            setIsAnswering(true)
            setResponseTimings(prev => [...prev, {
              questionId,
              questionNumber: qNum,
              isFollowup: false,
              startTime
            }])
          } else if (message.type === 'followup') {
            // Follow-up - keep the SAME questionNumber as current question
            const qNum = currentQuestion?.questionNumber || progress.rounds_completed
            const followupNum = message.data?.followup_number || 1
            const questionId = `${currentQuestion?.questionId || 'q'}-f${followupNum}`
            setCurrentQuestion(prev => ({ 
              text: message.data?.text || message.text, 
              isFollowup: true,
              followupNumber: followupNum,
              questionNumber: prev?.questionNumber || progress.rounds_completed,
              questionId
            }))
            setCandidateTyping('')
            setLastSubmittedAnswer('')
            
            // Start timing for follow-up
            const startTime = Date.now()
            setCurrentQuestionStart(startTime)
            setIsAnswering(true)
            setResponseTimings(prev => [...prev, {
              questionId,
              questionNumber: qNum,
              isFollowup: true,
              followupNumber: followupNum,
              startTime
            }])
          } else if (message.type === 'typing') {
            // Real-time typing from candidate
            setCandidateTyping(message.data?.text || '')
          } else if (message.type === 'response') {
            setLastSubmittedAnswer(message.data?.text || '')
            setCandidateTyping('')
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      websocket.onerror = (error) => {
        console.error('Admin WebSocket error:', error)
        setConnectionStatus('disconnected')
      }
      
      websocket.onclose = () => {
        console.log('Admin WebSocket closed')
        setConnectionStatus('disconnected')
        // Reconnect after delay
        setTimeout(() => {
          if (sessionId) {
            setConnectionStatus('connecting')
            connect()
          }
        }, 2000)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [sessionId])

  // Calculate stats - use currentQuestion.questionNumber if available, otherwise calculate
  const currentQuestionNum = currentQuestion?.questionNumber || Math.min(
    Math.max(1, progress.rounds_completed + 1),
    progress.total_rounds
  )
  const avgScore = responseHistory.length > 0 
    ? Math.round(responseHistory.reduce((a, b) => a + b.score, 0) / responseHistory.length)
    : 0
  const totalResponses = responseHistory.length

  // Get question label (e.g., "Q1", "Q1-a", "Q1-b")
  const getQuestionLabel = () => {
    if (!currentQuestion) return 'Q?'
    const qNum = currentQuestion.questionNumber || currentQuestionNum
    if (currentQuestion.isFollowup) {
      const letter = String.fromCharCode(96 + (currentQuestion.followupNumber || 1))
      return `Q${qNum}-${letter}`
    }
    return `Q${qNum}`
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="bg-[#0D0D0D] border-b border-gray-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Session */}
            <div className="flex items-center gap-4">
              {/* EPAM Logo */}
              <svg className="h-8" viewBox="0 0 100 32" fill="none">
                <text x="0" y="24" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">EPAM</text>
              </svg>
              <div className="h-6 w-px bg-gray-700"></div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 font-mono">{sessionId?.slice(0, 12)}...</p>
              </div>
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-[#39FF14]/10 text-[#39FF14]' :
                connectionStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-[#39FF14] animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`}></span>
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </div>
            </div>

            {/* Right: Stats & Button */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {currentQuestionNum}<span className="text-gray-600">/{progress.total_rounds}</span>
                  </p>
                  <p className="text-xs text-gray-500">Question</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#39FF14]">{avgScore || '--'}</p>
                  <p className="text-xs text-gray-500">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{totalResponses}</p>
                  <p className="text-xs text-gray-500">Responses</p>
                </div>
              </div>
              <a
                href={`/interview?view=candidate&session_id=${sessionId}&lang=${language}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#39FF14] hover:bg-[#7FFF5C] text-black font-semibold rounded-lg transition-colors"
              >
                Open Candidate View
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Progress Bar */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Interview Progress</span>
            <span className="text-sm font-mono text-[#39FF14]">{progress.percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-[#39FF14] to-[#7FFF5C] transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          {/* Question Circles */}
          <div className="flex justify-between">
            {Array.from({ length: progress.total_rounds }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < progress.rounds_completed 
                    ? 'bg-[#39FF14] text-black' 
                    : i === progress.rounds_completed 
                      ? 'bg-[#39FF14]/20 text-[#39FF14] ring-2 ring-[#39FF14]' 
                      : 'bg-gray-800 text-gray-500'
                }`}>
                  {i < progress.rounds_completed ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {/* Follow-up progress bar (shows count out of max 10) */}
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        i < progress.rounds_completed 
                          ? 'bg-[#39FF14]' 
                          : i === progress.rounds_completed 
                            ? 'bg-[#00E5FF]' 
                            : 'bg-gray-600'
                      }`}
                      style={{ 
                        width: i < progress.rounds_completed 
                          ? '100%' 
                          : i === progress.rounds_completed 
                            ? `${(progress.current_followup / (progress.max_followups || 10)) * 100}%`
                            : '0%'
                      }}
                    />
                  </div>
                  {i === progress.rounds_completed && progress.current_followup > 0 && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Follow-up {progress.current_followup}/{progress.max_followups || 10}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Q&A Panel - Full Width */}
        <div className="bg-[#141414] rounded-2xl border border-gray-800/50 overflow-hidden">
          <div className="bg-[#39FF14]/5 px-5 py-3 border-b border-gray-800/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#39FF14]">Candidate View</h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-xs font-mono rounded-full font-bold">
                {getQuestionLabel()}
              </span>
              {/* Follow-up counter (Admin only) */}
              {currentQuestion?.isFollowup && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-mono rounded-full">
                  F{progress.current_followup}/{progress.max_followups}
                </span>
              )}
            </div>
          </div>
          
          {/* Follow-up Decision Metrics (Admin only) */}
          {progress.followup_stop_reason && (
            <div className="mx-5 mt-3 px-3 py-2 bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">AI Decision:</span>
                <span className={`font-medium ${
                  progress.followup_stop_reason === 'sufficient_skill' ? 'text-green-400' :
                  progress.followup_stop_reason === 'no_knowledge' ? 'text-red-400' :
                  progress.followup_stop_reason === 'partial_continue' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {progress.followup_stop_reason?.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-500">
                  ({Math.round((progress.followup_confidence || 0) * 100)}% conf)
                </span>
              </div>
            </div>
          )}
          
          <div className="p-5 space-y-4">
            {/* Question */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Question</p>
              <p className="text-white text-lg">
                {currentQuestion?.text || <span className="text-gray-500 italic">Waiting for question...</span>}
              </p>
            </div>
            {/* Candidate Answer */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Candidate Answer</p>
                {candidateTyping && (
                  <span className="flex items-center gap-1 text-xs text-[#39FF14]">
                    <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
                    Typing...
                  </span>
                )}
              </div>
              <div className="bg-[#0D0D0D] rounded-xl p-4 min-h-[60px] border border-gray-800/50">
                {candidateTyping ? (
                  <p className="text-gray-300">{candidateTyping}<span className="text-[#39FF14] animate-pulse">|</span></p>
                ) : lastSubmittedAnswer ? (
                  <p className="text-white">{lastSubmittedAnswer}</p>
                ) : (
                  <p className="text-gray-600 italic">Waiting for candidate response...</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - 45% */}
          <div className="lg:col-span-5 space-y-6">
            {/* Strategy Card */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800/50 overflow-hidden">
              <div className="bg-[#39FF14]/5 px-5 py-3 border-b border-gray-800/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#39FF14]">Active Strategy</h3>
                {strategy && (
                  <span className="px-2 py-1 bg-[#39FF14]/20 text-[#39FF14] text-xs font-mono rounded-full font-bold uppercase">
                    {strategy.id}
                  </span>
                )}
              </div>
              <div className="p-5">
                {strategy ? (
                  <StrategyVisualization strategy={strategy} />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">Strategy will be selected after first response</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-[#141414] rounded-2xl border border-gray-800/50 overflow-hidden">
              <div className="bg-[#39FF14]/5 px-5 py-3 border-b border-gray-800/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#39FF14]">Interview Timeline</h3>
                {logData && (
                  <span className="flex items-center gap-1 text-xs text-[#39FF14]">
                    <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
                    Recording
                  </span>
                )}
              </div>
              <div className="p-5">
                {logData ? (
                  <LogViewer logData={logData} />
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">Timeline will populate as interview progresses</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 55% */}
          <div className="lg:col-span-7">
            <div className="bg-[#141414] rounded-2xl border border-gray-800/50 overflow-hidden h-full">
              {/* Tab Header */}
              <div className="flex border-b border-gray-800/50">
                <button
                  onClick={() => setActiveTab('evaluation')}
                  className={`flex-1 px-5 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'evaluation'
                      ? 'bg-[#39FF14]/5 text-[#39FF14] border-b-2 border-[#39FF14]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Live Evaluation
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('timing')}
                  className={`flex-1 px-5 py-3 text-sm font-semibold transition-colors ${
                    activeTab === 'timing'
                      ? 'bg-[#39FF14]/5 text-[#39FF14] border-b-2 border-[#39FF14]'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Efficiency
                    {isAnswering && (
                      <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse"></span>
                    )}
                  </div>
                </button>
              </div>
              
              <div className="p-5">
                {activeTab === 'evaluation' ? (
                  <>
                    {evaluation ? (
                      <LiveScores evaluation={evaluation} />
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-white font-medium mb-2">Waiting for Response</h4>
                        <p className="text-gray-500 text-sm">Scores will appear after candidate submits an answer</p>
                        <div className="mt-6 flex justify-center gap-6 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span className="text-gray-400">Deterministic</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <span className="text-gray-400">LLM Assessment</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <TimeMetrics
                    timings={responseTimings}
                    currentQuestionStart={currentQuestionStart || undefined}
                    isAnswering={isAnswering}
                  />
                )}
              </div>

              {/* Score History Chart (only show in evaluation tab) */}
              {activeTab === 'evaluation' && responseHistory.length > 0 && (
                <div className="border-t border-gray-800/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Score Trend</span>
                    <span className="text-xs text-gray-400">{responseHistory.length} responses</span>
                  </div>
                  <div className="flex items-end gap-2 h-12">
                    {responseHistory.map((r, i) => (
                      <div 
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#39FF14] to-[#7FFF5C] rounded-t transition-all duration-300 relative group"
                        style={{ height: `${Math.max(8, r.score)}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 px-1.5 py-0.5 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {r.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
