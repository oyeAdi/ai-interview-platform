'use client'

import React, { useMemo } from 'react'

interface QuestionCardProps {
  question: string
  questionType: string
  isFollowup: boolean
  followupNumber: number
  questionNumber?: number  // Current question number (1-based)
}

// Convert follow-up number to letter (1 -> a, 2 -> b, 3 -> c)
function getFollowupLabel(questionNum: number, followupNum: number): string {
  const letter = String.fromCharCode(96 + followupNum) // 97 is 'a'
  return `${questionNum}-${letter}`
}

const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
  question,
  questionType,
  isFollowup,
  followupNumber,
  questionNumber = 1,
}) => {
  const displayLabel = useMemo(() =>
    isFollowup
      ? getFollowupLabel(questionNumber, followupNumber)
      : `Question ${questionNumber}`,
    [isFollowup, questionNumber, followupNumber]
  )
  if (!question) {
    return (
      <div className="bg-dark-black-light rounded-lg p-8 border border-gray-800">
        <div className="text-center text-gray-500">
          Waiting for question...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-black-light rounded-lg p-8 border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isFollowup
            ? 'bg-primary-orange/20 text-primary-orange border border-primary-orange/30'
            : 'bg-primary-orange text-dark-black'
          }`}>
          {displayLabel}
        </span>
        {isFollowup && (
          <span className="text-xs text-gray-500">Follow-up</span>
        )}
        {questionType && (
          <span className="text-xs text-gray-600 ml-auto">
            {questionType.replace(/_/g, ' ')}
          </span>
        )}
      </div>
      <div className="text-lg text-white whitespace-pre-wrap">
        {question}
      </div>
    </div>
  )
})

QuestionCard.displayName = 'QuestionCard'

export default QuestionCard

