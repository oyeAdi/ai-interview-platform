'use client'

import { useState } from 'react'

interface EmailSentModalProps {
    isOpen: boolean
    onClose: () => void
    candidateEmail: string
    expertLink: string
    positionTitle: string
    emailProvider: 'sendgrid' | 'gmail'
}

export default function EmailSentModal({
    isOpen,
    onClose,
    candidateEmail,
    expertLink,
    positionTitle,
    emailProvider
}: EmailSentModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-md mx-4 p-8 rounded-lg">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-medium text-black dark:text-white text-center mb-2">
                    Email Sent Successfully!
                </h2>

                {/* Provider Badge */}
                <div className="flex justify-center mb-4">
                    <span className="text-xs px-3 py-1 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full">
                        via {emailProvider === 'sendgrid' ? 'SendGrid' : 'Gmail SMTP'}
                    </span>
                </div>

                {/* Message */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                    Interview invitation has been sent to:
                </p>

                {/* Email Display */}
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2A2A2A] p-4 mb-6 text-center rounded">
                    <p className="text-[#00E5FF] font-medium break-all">{candidateEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">for {positionTitle}</p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-4 mb-6 rounded">
                    <h4 className="text-sm font-medium text-black dark:text-white mb-2">
                        📧 What happens next?
                    </h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
                        <li>✓ Candidate receives personalized email</li>
                        <li>✓ Candidate clicks link to join interview</li>
                        <li>✓ You join as expert to conduct interview</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-[#2A2A2A] transition-colors rounded"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => window.open(expertLink, '_blank')}
                        className="flex-1 px-4 py-3 text-sm font-medium bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 transition-colors flex items-center justify-center gap-2 rounded"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                        Continue as Expert
                    </button>
                </div>
            </div>
        </div>
    )
}
