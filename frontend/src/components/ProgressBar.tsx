'use client'

interface ProgressBarProps {
  progress: {
    rounds_completed: number
    total_rounds: number
    percentage: number
    current_followup?: number
    max_followups?: number
  }
  questionNumber?: number  // Explicit question number (overrides calculated value)
}

export default function ProgressBar({ progress, questionNumber }: ProgressBarProps) {
  // Use explicit questionNumber if provided, otherwise calculate from rounds_completed
  const displayQuestion = questionNumber || Math.min(
    Math.max(1, progress.rounds_completed + 1),
    progress.total_rounds
  )
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-white">
            Question {displayQuestion} of {progress.total_rounds}
          </span>
          {progress.current_followup !== undefined && progress.current_followup > 0 && (
            <span className="text-sm text-primary-orange">
              Follow-up {progress.current_followup} of {progress.max_followups || 2}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">{progress.percentage.toFixed(0)}% Complete</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-primary-orange h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  )
}

