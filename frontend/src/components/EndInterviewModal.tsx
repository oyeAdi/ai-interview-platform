'use client'

import { useState } from 'react'

interface EndInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isEnding: boolean
}

export default function EndInterviewModal({ isOpen, onClose, onConfirm, isEnding }: EndInterviewModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isEnding ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-medium text-black dark:text-white">End Interview?</h2>
              <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              ⚠️ Warning: Irreversible Action
            </h3>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
              <li>Your interview will be submitted immediately</li>
              <li>You will not be able to continue or retry</li>
              <li>All your responses will be evaluated as-is</li>
              <li>The interviewer will be notified</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to end this interview now? Your responses so far will be submitted for evaluation.
          </p>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={isEnding}
              className="mt-1 w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
            />
            <span className="text-sm text-black dark:text-white">
              I understand that this action is <strong>irreversible</strong> and my interview will be submitted for evaluation.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-[#2A2A2A] flex gap-3">
          <button
            onClick={onClose}
            disabled={isEnding}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
          >
            Continue Interview
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || isEnding}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isEnding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Ending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                End Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

