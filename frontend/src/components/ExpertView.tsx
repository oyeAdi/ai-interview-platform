'use client'

import { useState, useEffect, useRef } from 'react'
import LogViewer from './LogViewer'
import LiveScores from './LiveScores'

interface ExpertViewProps {
  sessionId: string
  language: string
}

export default function ExpertView({ sessionId, language }: ExpertViewProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [candidateAnswer, setCandidateAnswer] = useState<string>('')
  const [evaluation, setEvaluation] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)
  const [logData, setLogData] = useState<any>(null)
  const [progress, setProgress] = useState({ rounds_completed: 0, total_rounds: 3, percentage: 0, current_followup: 0, max_followups: 2 })
  
  // Expert mode states
  const [pendingFollowup, setPendingFollowup] = useState<any>(null)
  const [editedText, setEditedText] = useState<string>('')
  const [customText, setCustomText] = useState<string>('')
  const [rating, setRating] = useState<'good' | 'bad' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<'review' | 'edit' | 'override'>('review')
  
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const connect = () => {
      const websocket = new WebSocket(`ws://localhost:8000/ws?view=expert&session_id=${sessionId}`)
      wsRef.current = websocket

      websocket.onopen = () => {
        setConnectionStatus('connected')
        // Send start_interview message to initialize the session
        websocket.send(JSON.stringify({
          type: 'start_interview',
          session_id: sessionId
        }))
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('Expert received:', message.type, message.data)
          
          if (message.type === 'evaluation') {
            setEvaluation(message.data)
          } else if (message.type === 'strategy_change') {
            setStrategy(message.data)
          } else if (message.type === 'log_update') {
            setLogData(message.data)
          } else if (message.type === 'progress') {
            setProgress(prev => ({ ...prev, ...message.data }))
          } else if (message.type === 'question') {
            setCurrentQuestion({ 
              text: message.data?.text || message.text, 
              isFollowup: false,
              questionNumber: message.data?.round_number || 1
            })
            setCandidateAnswer('')
            setPendingFollowup(null)
          } else if (message.type === 'followup') {
            // In expert mode, followups come after approval
            setCurrentQuestion(prev => ({ 
              text: message.data?.text || message.text, 
              isFollowup: true,
              followupNumber: message.data?.followup_number || 1,
              questionNumber: prev?.questionNumber || 1
            }))
            setCandidateAnswer('')
            setPendingFollowup(null)
          } else if (message.type === 'pending_followup') {
            // AI generated followup awaiting expert approval
            setPendingFollowup(message.data)
            setEditedText(message.data?.followup?.text || '')
            setRating(null)
            setMode('review')
          } else if (message.type === 'typing') {
            setCandidateAnswer(message.data?.text || '')
          } else if (message.type === 'response') {
            setCandidateAnswer(message.data?.text || '')
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      websocket.onclose = () => {
        setConnectionStatus('disconnected')
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

  const handleApprove = async () => {
    if (!pendingFollowup) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/expert/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          rating: rating
        })
      })
      
      if (response.ok) {
        setPendingFollowup(null)
        setRating(null)
      }
    } catch (error) {
      console.error('Error approving followup:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!pendingFollowup || !editedText.trim()) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/expert/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          edited_text: editedText,
          rating: rating
        })
      })
      
      if (response.ok) {
        setPendingFollowup(null)
        setEditedText('')
        setRating(null)
        setMode('review')
      }
    } catch (error) {
      console.error('Error editing followup:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverride = async () => {
    if (!customText.trim()) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/expert/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          custom_text: customText,
          rating: rating
        })
      })
      
      if (response.ok) {
        setPendingFollowup(null)
        setCustomText('')
        setRating(null)
        setMode('review')
      }
    } catch (error) {
      console.error('Error overriding followup:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentQuestionNum = currentQuestion?.questionNumber || Math.min(progress.rounds_completed + 1, progress.total_rounds)

  return (
    <div className="min-h-screen bg-dark-black">
      {/* Header */}
      <header className="bg-dark-black-light border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary-orange">Expert Dashboard</h1>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                Human-in-the-Loop
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {connectionStatus}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Session</p>
                <p className="text-sm font-mono text-gray-300">{sessionId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Language</p>
                <p className="text-sm font-semibold text-primary-orange">{language.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Progress Bar */}
        <div className="bg-dark-black-light rounded-xl p-5 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">
              Question {currentQuestionNum} of {progress.total_rounds}
              {progress.current_followup > 0 && (
                <span className="ml-2 text-primary-orange">
                  Follow-up {progress.current_followup} of {progress.max_followups}
                </span>
              )}
            </span>
            <span className="text-sm font-mono text-primary-orange">{progress.percentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-orange transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Q&A and Expert Controls */}
          <div className="space-y-6">
            {/* Current Question */}
            <div className="bg-dark-black-light rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-primary-orange/10 px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-primary-orange">Current Question</h3>
              </div>
              <div className="p-5">
                <p className="text-white">
                  {currentQuestion?.text || <span className="text-gray-500 italic">Waiting for question...</span>}
                </p>
              </div>
            </div>

            {/* Candidate Answer */}
            <div className="bg-dark-black-light rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-primary-orange/10 px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary-orange">Candidate Answer</h3>
                {candidateAnswer && (
                  <span className="flex items-center gap-1 text-xs text-primary-orange">
                    <span className="w-1.5 h-1.5 bg-primary-orange rounded-full animate-pulse"></span>
                    Live
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="bg-gray-900/50 rounded-lg p-3 min-h-[80px] border border-gray-700">
                  {candidateAnswer ? (
                    <p className="text-gray-300">{candidateAnswer}</p>
                  ) : (
                    <p className="text-gray-600 italic">Waiting for candidate response...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Expert Control Panel */}
            {pendingFollowup && (
              <div className="bg-dark-black-light rounded-xl border-2 border-purple-500/50 overflow-hidden">
                <div className="bg-purple-500/10 px-5 py-3 border-b border-purple-500/30 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-purple-400">AI-Generated Follow-up (Pending Approval)</h3>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded animate-pulse">
                    Awaiting Review
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  {/* Mode Tabs */}
                  <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
                    {(['review', 'edit', 'override'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                          mode === m 
                            ? 'bg-primary-orange text-dark-black font-medium' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {m === 'review' ? 'Review & Approve' : m === 'edit' ? 'Edit' : 'Override'}
                      </button>
                    ))}
                  </div>

                  {/* Content based on mode */}
                  {mode === 'review' && (
                    <div className="space-y-3">
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <p className="text-white">{pendingFollowup.followup?.text}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        Strategy: {pendingFollowup.strategy?.name} - {pendingFollowup.followup?.generation_reason}
                      </div>
                    </div>
                  )}

                  {mode === 'edit' && (
                    <div className="space-y-3">
                      <label className="block text-sm text-gray-400">Edit the AI-generated question:</label>
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:border-primary-orange focus:outline-none"
                        placeholder="Edit the follow-up question..."
                      />
                    </div>
                  )}

                  {mode === 'override' && (
                    <div className="space-y-3">
                      <label className="block text-sm text-gray-400">Write your own follow-up question:</label>
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:border-primary-orange focus:outline-none"
                        placeholder="Type your custom follow-up question..."
                      />
                      <p className="text-xs text-gray-500">
                        Original AI suggestion: "{pendingFollowup.followup?.text}"
                      </p>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Rate AI suggestion:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRating('good')}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${
                          rating === 'good' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        Good
                      </button>
                      <button
                        onClick={() => setRating('bad')}
                        className={`px-3 py-1.5 rounded text-sm transition-colors ${
                          rating === 'bad' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        Bad
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {mode === 'review' && (
                      <button
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Approve & Send'}
                      </button>
                    )}
                    {mode === 'edit' && (
                      <button
                        onClick={handleEdit}
                        disabled={isSubmitting || !editedText.trim()}
                        className="flex-1 bg-primary-orange hover:bg-orange-500 text-dark-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Edited Version'}
                      </button>
                    )}
                    {mode === 'override' && (
                      <button
                        onClick={handleOverride}
                        disabled={isSubmitting || !customText.trim()}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Custom Question'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No pending followup message */}
            {!pendingFollowup && evaluation && (
              <div className="bg-dark-black-light rounded-xl border border-gray-800 p-5 text-center">
                <p className="text-gray-400">Waiting for AI to generate follow-up question...</p>
              </div>
            )}
          </div>

          {/* Right Column - Evaluation and Logs */}
          <div className="space-y-6">
            {/* Live Evaluation */}
            <div className="bg-dark-black-light rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-primary-orange/10 px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-primary-orange">Live Evaluation</h3>
              </div>
              <div className="p-5">
                {evaluation ? (
                  <LiveScores evaluation={evaluation} />
                ) : (
                  <p className="text-gray-500 text-center py-8">Waiting for candidate response...</p>
                )}
              </div>
            </div>

            {/* Strategy Info */}
            {strategy && (
              <div className="bg-dark-black-light rounded-xl border border-gray-800 overflow-hidden">
                <div className="bg-primary-orange/10 px-5 py-3 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-primary-orange">Active Strategy</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-primary-orange text-dark-black text-xs font-bold rounded">
                      {strategy.id?.toUpperCase()}
                    </span>
                    <span className="text-white font-medium">{strategy.name}</span>
                  </div>
                  {strategy.reason && (
                    <p className="text-sm text-gray-400">{strategy.reason}</p>
                  )}
                </div>
              </div>
            )}

            {/* Interview Log */}
            <div className="bg-dark-black-light rounded-xl border border-gray-800 overflow-hidden">
              <div className="bg-primary-orange/10 px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-primary-orange">Interview Log</h3>
              </div>
              <div className="p-5">
                {logData ? (
                  <LogViewer logData={logData} />
                ) : (
                  <p className="text-gray-500 text-center py-4">Log will appear as interview progresses</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Link to Candidate View */}
        <div className="bg-dark-black-light rounded-xl border border-gray-800 p-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Open candidate view in a new tab to see their perspective
          </p>
          <a
            href={`/interview?view=candidate&session_id=${sessionId}&lang=${language}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary-orange hover:bg-orange-500 text-dark-black font-semibold rounded-lg transition-colors"
          >
            Open Candidate View
          </a>
        </div>
      </main>
    </div>
  )
}

