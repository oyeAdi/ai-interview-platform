'use client'

interface InterviewCompleteModalProps {
    isOpen: boolean
}

export default function InterviewCompleteModal({ isOpen }: InterviewCompleteModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-surface-primary dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-md mx-4 p-8 text-center shadow-2xl rounded-lg">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-[#39FF14]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-black dark:text-white">Thank You!</h2>

                    <p className="text-gray-600 dark:text-gray-400">
                        We truly appreciate you taking the time to interview with us today. Your responses have been successfully submitted. We wish you the very best!
                    </p>

                    <div className="mt-6 w-full p-4 bg-gray-50 dark:bg-[#111111] rounded-md border border-gray-100 dark:border-[#222]">
                        <p className="text-sm text-gray-500 font-mono">
                            You may now close this window.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
