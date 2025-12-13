'use client'

import { useState } from 'react'
import CodeEditor from './CodeEditor'

interface TestCase {
  input: string
  expected: string
  note?: string
}

interface CodingQuestion {
  id: string
  text: string
  language: string
  starter_code?: string
  test_cases?: TestCase[]
  time_limit_minutes?: number
  hints?: string[]
  difficulty?: string
}

interface CodingQuestionCardProps {
  question: CodingQuestion
  onSubmit: (code: string) => void
  isSubmitting?: boolean
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function CodingQuestionCard({
  question,
  onSubmit,
  isSubmitting = false
}: CodingQuestionCardProps) {
  const [code, setCode] = useState(question.starter_code || '')
  const [showHints, setShowHints] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'tests'>('code')

  const handleSubmit = () => {
    onSubmit(code)
  }

  return (
    <div className="card overflow-hidden">
      {/* Question Header */}
      <div className="p-6 border-b border-border-light dark:border-border-medium">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {/* Coding Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                           bg-category-coding/10 text-category-coding text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Coding
              </span>
              
              {/* Difficulty Badge */}
              {question.difficulty && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                  ${difficultyColors[question.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                  {question.difficulty}
                </span>
              )}
              
              {/* Time Limit */}
              {question.time_limit_minutes && (
                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary dark:text-text-dark-tertiary">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {question.time_limit_minutes} min
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-dark-primary mb-2">
              {question.text}
            </h3>
          </div>
        </div>

        {/* Hints Section */}
        {question.hints && question.hints.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="flex items-center gap-2 text-sm text-epam-blue hover:text-epam-blue-dark transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showHints ? 'rotate-180' : ''}`} 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            
            {showHints && (
              <ul className="mt-3 space-y-2">
                {question.hints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary dark:text-text-dark-secondary">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full 
                                   bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 
                                   text-xs font-medium flex-shrink-0">
                      {idx + 1}
                    </span>
                    {hint}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-light dark:border-border-medium">
        <button
          type="button"
          onClick={() => setActiveTab('code')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'code'
              ? 'text-epam-blue border-b-2 border-epam-blue bg-epam-blue-50/50 dark:bg-epam-blue/10'
              : 'text-text-tertiary hover:text-text-primary dark:hover:text-text-dark-primary'
            }`}
        >
          Code Editor
        </button>
        {question.test_cases && question.test_cases.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === 'tests'
                ? 'text-epam-blue border-b-2 border-epam-blue bg-epam-blue-50/50 dark:bg-epam-blue/10'
                : 'text-text-tertiary hover:text-text-primary dark:hover:text-text-dark-primary'
              }`}
          >
            Test Cases ({question.test_cases.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'code' ? (
          <CodeEditor
            language={question.language}
            initialCode={question.starter_code || ''}
            onChange={(value) => setCode(value || '')}
            height="350px"
          />
        ) : (
          <div className="space-y-3">
            {question.test_cases?.map((testCase, idx) => (
              <div key={idx} className="p-4 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-text-tertiary dark:text-text-dark-tertiary">
                    Test Case {idx + 1}
                  </span>
                  {testCase.note && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      ({testCase.note})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                      Input
                    </div>
                    <code className="block p-2 bg-white dark:bg-surface-dark rounded-lg text-sm font-mono
                                   text-text-primary dark:text-text-dark-primary">
                      {JSON.stringify(testCase.input)}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-text-secondary dark:text-text-dark-secondary mb-1">
                      Expected Output
                    </div>
                    <code className="block p-2 bg-white dark:bg-surface-dark rounded-lg text-sm font-mono
                                   text-text-primary dark:text-text-dark-primary">
                      {JSON.stringify(testCase.expected)}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-border-light dark:border-border-medium bg-surface-secondary dark:bg-surface-dark-tertiary">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !code.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Answer
            </>
          )}
        </button>
      </div>
    </div>
  )
}


