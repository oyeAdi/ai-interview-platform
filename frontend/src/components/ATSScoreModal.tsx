import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, X, Loader2, ArrowRight, Save } from 'lucide-react'

interface ATSScoreModalProps {
    isOpen: boolean
    onClose: () => void
    onProceed: () => void
    candidateName?: string
    score?: number
    explanation?: string
    resumeText?: string
    jdText?: string
    onSkipCandidate?: () => void
    isAnalyzing?: boolean
    onSaveToPool?: () => void
    candidateId?: string  // If set, candidate is from pool (don't show save button)
}

export default function ATSScoreModal({
    isOpen,
    onClose,
    onProceed,
    candidateName = 'Candidate',
    score = 0,
    explanation = '',
    resumeText = '',
    jdText = '',
    onSkipCandidate,
    isAnalyzing = false,
    onSaveToPool,
    candidateId,
}: ATSScoreModalProps) {
    const [stage, setStage] = useState<'parsing' | 'calculating' | 'done'>('parsing')
    const [activeTab, setActiveTab] = useState<'result' | 'jd' | 'resume'>('result')

    // Simulation of analysis steps if isAnalyzing is true
    useEffect(() => {
        if (isOpen && isAnalyzing) {
            setStage('parsing')
            const t1 = setTimeout(() => setStage('calculating'), 1500)
            const t2 = setTimeout(() => setStage('done'), 3500)
            return () => {
                clearTimeout(t1)
                clearTimeout(t2)
            }
        } else if (isOpen && !isAnalyzing) {
            setStage('done')
        }
    }, [isOpen, isAnalyzing])

    const isPassing = score >= 50

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-zinc-800 p-10 text-left align-middle shadow-2xl transition-all">

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Content */}
                                <div className="space-y-8">

                                    {/* Header State */}
                                    <div className="text-center space-y-2">
                                        {stage !== 'done' ? (
                                            <div className="flex flex-col items-center gap-4 py-8">
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-full border-4 border-gray-100 dark:border-zinc-800 animate-spin border-t-brand-primary" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {stage === 'parsing' ? 'Parsing Resume Profile...' : 'Calculating ATS Score...'}
                                                    </Dialog.Title>
                                                    <p className="text-sm text-gray-500 mt-1">Analyzing keywords, skills, and experience match.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="animate-in zoom-in duration-500">
                                                <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center mb-6 relative">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                                                        {/* Background circle */}
                                                        <circle
                                                            cx="80" cy="80" r="70"
                                                            className="stroke-gray-200 dark:stroke-zinc-800 fill-none"
                                                            strokeWidth="12"
                                                        />
                                                        {/* Progress circle */}
                                                        <circle
                                                            cx="80" cy="80" r="70"
                                                            className={`${isPassing ? 'stroke-emerald-500' : 'stroke-red-500'} fill-none transition-all duration-1000 ease-out`}
                                                            strokeWidth="12"
                                                            strokeDasharray={440}
                                                            strokeDashoffset={440 - (440 * score) / 100}
                                                            strokeLinecap="round"
                                                        />
                                                    </svg>
                                                    {/* Score text */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className={`text-5xl font-bold ${isPassing ? 'text-emerald-500' : 'text-red-500'}`}>{score}%</span>
                                                    </div>
                                                </div>
                                                <Dialog.Title as="h3" className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                                    {candidateName}
                                                </Dialog.Title>
                                                <p className={`text-sm font-medium mt-1 ${isPassing ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {isPassing ? 'High Match - Recommended for Interview' : 'Low Match - Does not meet threshold'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Results Section (only when done) */}
                                    {stage === 'done' && (
                                        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col h-[450px]">
                                            {/* Tabs */}
                                            <div className="flex gap-1 border-b-2 border-gray-100 dark:border-zinc-800 mb-6">
                                                <button
                                                    onClick={() => setActiveTab('result')}
                                                    className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg border-b-3 ${activeTab === 'result'
                                                        ? 'border-b-brand-primary text-brand-primary bg-brand-primary/5'
                                                        : 'border-b-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-900'
                                                        }`}
                                                >
                                                    Match Result
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('resume')}
                                                    className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg border-b-3 ${activeTab === 'resume'
                                                        ? 'border-b-brand-primary text-brand-primary bg-brand-primary/5'
                                                        : 'border-b-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-900'
                                                        }`}
                                                >
                                                    Resume
                                                </button>
                                                <button
                                                    onClick={() => setActiveTab('jd')}
                                                    className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg border-b-3 ${activeTab === 'jd'
                                                        ? 'border-b-brand-primary text-brand-primary bg-brand-primary/5'
                                                        : 'border-b-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-900'
                                                        }`}
                                                >
                                                    Job Description
                                                </button>
                                            </div>

                                            {/* Tab Content */}
                                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                                {activeTab === 'result' && (
                                                    <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/50 border border-gray-200 dark:border-zinc-800 shadow-sm">
                                                        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                            <span className="w-1 h-5 bg-brand-primary rounded-full"></span>
                                                            Match Explanation
                                                        </h4>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                            {(explanation || "No explanation provided.").replace(/\\n/g, '\n')}
                                                        </p>
                                                    </div>
                                                )}
                                                {activeTab === 'resume' && (
                                                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-left">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                            {(resumeText || "No resume text available.").replace(/\\n/g, '\n')}
                                                        </div>
                                                    </div>
                                                )}
                                                {activeTab === 'jd' && (
                                                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-left">
                                                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                            {(jdText || "No job description text available.").replace(/\\n/g, '\n')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {stage === 'done' && (
                                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
                                            <button
                                                onClick={onClose}
                                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                                            >
                                                Cancel
                                            </button>

                                            {onSkipCandidate && (
                                                <button
                                                    onClick={onSkipCandidate}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    Skip Selection & Proceed
                                                </button>
                                            )}

                                            {/* Save to Talent Pool - only show if not already from pool */}
                                            {!candidateId && onSaveToPool && (
                                                <button
                                                    onClick={onSaveToPool}
                                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-brand-primary hover:bg-brand-primary/10 transition-colors flex items-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save to Talent Pool
                                                </button>
                                            )}

                                            {isPassing ? (
                                                <button
                                                    onClick={onProceed}
                                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                                                >
                                                    Proceed to Analysis <ArrowRight className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-gray-100 dark:bg-zinc-800 cursor-not-allowed flex items-center gap-2"
                                                >
                                                    Score Too Low <AlertTriangle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
