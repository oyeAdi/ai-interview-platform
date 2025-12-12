'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QuestionCard from './QuestionCard'
import AnswerInput from './AnswerInput'
import ProgressBar from './ProgressBar'

interface CandidateViewProps {
  sessionId: string
  language: string
}

export default function CandidateView({ sessionId, language }: CandidateViewProps) {
  const router = useRouter()
  const [ws, setWs] = useState<WebSocket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [questionType, setQuestionType] = useState<string>('')
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

  useEffect(() => {
    if (!sessionId) return

    const connect = () => {
      const websocket = new WebSocket(`ws://localhost:8000/ws?view=candidate`)
      wsRef.current = websocket
      
      websocket.onopen = () => {
        setWs(websocket)
        websocket.send(JSON.stringify({
          type: 'start_interview',
          session_id: sessionId
        }))
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      websocket.onclose = () => {
        console.log('WebSocket closed, reconnecting...')
        setTimeout(() => {
          if (sessionId && !sessionEnded) {
            connect()
          }
        }, 2000)
      }

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === 'error') {
          console.error('WebSocket error:', message.message)
          alert(`Error: ${message.message}\n\nPlease start a new interview from the landing page.`)
          router.push('/')
          return
        } else if (message.type === 'greeting') {
          // Greeting received
        } else if (message.type === 'question') {
          // NEW main question - update questionNumber
          setCurrentQuestion(message.data?.text || message.text || '')
          setQuestionType(message.data?.question_type || '')
          setIsFollowup(false)
          setFollowupNumber(0)
          // Use round_number from backend, or calculate from current state
          const roundNum = message.data?.round_number || questionNumber
          setQuestionNumber(roundNum)
          // Reset current_followup when new question starts
          setProgress(prev => ({ ...prev, current_followup: 0 }))
        } else if (message.type === 'followup') {
          // Follow-up to CURRENT question - DO NOT change questionNumber
          setCurrentQuestion(message.data?.text || message.text || '')
          setIsFollowup(true)
          const fNum = message.data?.followup_number || 1
          setFollowupNumber(fNum)
          setProgress(prev => ({ ...prev, current_followup: fNum }))
          // questionNumber stays the same - this is still part of the same question
        } else if (message.type === 'progress') {
          // Update progress but NEVER update questionNumber here
          // questionNumber is ONLY updated when a new main 'question' is received
          setProgress(prev => ({ ...prev, ...message.data }))
        } else if (message.type === 'session_end') {
          setSessionEnded(true)
          setTimeout(() => {
            router.push('/thanks')
          }, 2000)
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !answer.trim()) return

    const responseType = isFollowup ? 'followup' : 'initial'
    wsRef.current.send(JSON.stringify({
      type: 'response',
      text: answer,
      response_type: responseType,
      session_id: sessionId
    }))
  }

  const handleTyping = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    // Send typing update to admin
    wsRef.current.send(JSON.stringify({
      type: 'typing',
      text: text,
      session_id: sessionId
    }))
  }

  if (sessionEnded) {
    return (
      <div className="min-h-screen bg-dark-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-primary-orange mb-4">
            Interview Complete
          </h2>
          <p className="text-gray-300">Thank you for your time.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-black p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-primary-orange mb-2">Candidate Dashboard</h1>
          <p className="text-gray-400 text-sm">Session ID: {sessionId || 'Not connected'}</p>
        </div>
        <ProgressBar progress={progress} questionNumber={questionNumber} />

        <QuestionCard
          question={currentQuestion}
          questionType={questionType}
          isFollowup={isFollowup}
          followupNumber={followupNumber}
          questionNumber={questionNumber}
        />

        <AnswerInput onSubmit={handleSubmitAnswer} onTyping={handleTyping} />
      </div>
    </div>
  )
}
