import { useState, useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import type { Evaluation, Strategy, Progress, WebSocketMessage } from '@/types/interview'

export function useInterview(sessionId: string, view: string) {
  const { ws, connected, send } = useWebSocket('ws://localhost:8000/ws', view)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [progress, setProgress] = useState<Progress>({
    rounds_completed: 0,
    total_rounds: 3,
    percentage: 0
  })
  const [sessionEnded, setSessionEnded] = useState(false)

  useEffect(() => {
    if (!ws) return

    const handleMessage = (event: MessageEvent) => {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'question':
          setCurrentQuestion(message.data?.text || message.text || '')
          break
        case 'followup':
          setCurrentQuestion(message.data?.text || message.text || '')
          break
        case 'evaluation':
          setEvaluation(message.data)
          break
        case 'strategy_change':
          setStrategy(message.data)
          break
        case 'progress':
          setProgress(message.data || progress)
          break
        case 'session_end':
          setSessionEnded(true)
          break
      }
    }

    ws.addEventListener('message', handleMessage)

    // Start interview
    if (connected && sessionId) {
      send({
        type: 'start_interview',
        session_id: sessionId
      })
    }

    return () => {
      ws.removeEventListener('message', handleMessage)
    }
  }, [ws, connected, sessionId, send])

  const submitResponse = (text: string, responseType: string = 'initial') => {
    send({
      type: 'response',
      text,
      response_type: responseType,
      session_id: sessionId
    })
  }

  return {
    currentQuestion,
    evaluation,
    strategy,
    progress,
    sessionEnded,
    submitResponse,
    connected
  }
}


