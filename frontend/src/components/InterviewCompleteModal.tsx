'use client'

interface InterviewCompleteModalProps {
    isOpen: boolean
    report?: any
}

export default function InterviewCompleteModal({ isOpen, report }: InterviewCompleteModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative bg-surface-primary dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-2xl text-center shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="p-8 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-[#39FF14]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-black text-black dark:text-white">Interview Complete</h2>

                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Thank you for completing the session. Your responses have been analyzed by the swarm.
                    </p>

                    {report ? (
                        <div className="w-full text-left space-y-6 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#222]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Final Score</h4>
                                    <div className="text-3xl font-black text-brand-primary">{report.final_score ?? 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#222]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Decision</h4>
                                    <div className={`text-xl font-bold ${report.decision?.includes('Hire') ? 'text-green-500' : 'text-gray-500'}`}>
                                        {report.decision ?? 'Pending'}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#222]">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Executive Summary</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {report.executive_summary ?? 'No summary available.'}
                                </p>
                            </div>

                            {report.key_strengths && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Key Strengths</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {report.key_strengths.map((s: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded-lg border border-green-500/20">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-xl border border-yellow-500/20">
                            <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                                Feedback generation is pending or failed. Please check your dashboard later.
                            </p>
                        </div>
                    )}

                    <div className="w-full pt-6 border-t border-gray-100 dark:border-[#222]">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] transition-transform"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
