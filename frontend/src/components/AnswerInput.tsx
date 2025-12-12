'use client'

import { useState, useEffect, useRef } from 'react'

interface AnswerInputProps {
  onSubmit: (answer: string) => void
  onTyping?: (text: string) => void
}

export default function AnswerInput({ onSubmit, onTyping }: AnswerInputProps) {
  const [answer, setAnswer] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced typing notification
  useEffect(() => {
    if (!onTyping) return

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to send typing update after 300ms of no typing
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(answer)
    }, 300)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [answer, onTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (answer.trim()) {
      onSubmit(answer)
      setAnswer('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full bg-dark-black border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-orange min-h-[200px] resize-none"
      />
      <button
        type="submit"
        disabled={!answer.trim()}
        className="w-full bg-primary-orange hover:bg-orange-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-dark-black font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Submit Answer
      </button>
    </form>
  )
}
