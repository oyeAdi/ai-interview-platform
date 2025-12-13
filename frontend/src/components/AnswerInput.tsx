'use client'

import { useState, useEffect, useRef } from 'react'

interface AnswerInputProps {
  onSubmit: (answer: string) => void
  onTyping?: (text: string) => void
  isCodingQuestion?: boolean
  language?: string
}

export default function AnswerInput({ onSubmit, onTyping, isCodingQuestion = false, language = 'python' }: AnswerInputProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 400) + 'px'
    }
  }, [answer])

  // Debounced typing notification
  useEffect(() => {
    if (!onTyping) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

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
    if (answer.trim() && !isSubmitting) {
      setIsSubmitting(true)
      onSubmit(answer)
      setAnswer('')
      setTimeout(() => setIsSubmitting(false), 500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        ref={textareaRef}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isCodingQuestion ? "Write your code solution here..." : "Type your answer here..."}
        className={`w-full bg-black border border-[#2A2A2A] p-4 
                   text-white placeholder-gray-600
                   focus:outline-none focus:border-[#00E5FF] 
                   min-h-[180px] resize-none transition-colors duration-200
                   ${isCodingQuestion ? 'font-mono text-sm' : ''}`}
        spellCheck={!isCodingQuestion}
      />
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Press <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 text-[10px]">Enter</kbd> to submit
        </span>
        
        <button
          type="submit"
          disabled={!answer.trim() || isSubmitting}
          className="px-6 py-2.5 bg-[#00E5FF] hover:bg-[#66F2FF] 
                     disabled:bg-[#1A1A1A] disabled:text-gray-600 disabled:cursor-not-allowed 
                     text-black font-medium transition-colors duration-200
                     flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              Submit
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
