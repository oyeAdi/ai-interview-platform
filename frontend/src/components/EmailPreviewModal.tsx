'use client'

import { useEffect, useState } from 'react'
import { apiUrl, getHeaders } from '@/config/api'

interface EmailPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    candidateName: string
    positionTitle: string
    companyName?: string // Optional, defaults to 'SwarmHire'
    userId?: string
}

export default function EmailPreviewModal({
    isOpen,
    onClose,
    candidateName,
    positionTitle,
    companyName = 'SwarmHire',
    userId
}: EmailPreviewModalProps) {
    const [loading, setLoading] = useState(false)
    const [emailContent, setEmailContent] = useState<{ subject: string; body: string } | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            generatePreview()
        }
    }, [isOpen, candidateName, positionTitle])

    const generatePreview = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(apiUrl('/api/intelligence/generate-email'), {
                method: 'POST',
                headers: getHeaders(), // Use authenticated headers
                body: JSON.stringify({
                    candidate_name: candidateName,
                    position_title: positionTitle,
                    company_name: companyName,
                    interview_link: '{{interview_link}}' // Placeholder for preview
                })
            })

            if (!response.ok) throw new Error('Failed to generate preview')

            const data = await response.json()
            setEmailContent({
                subject: `Interview Invitation: ${positionTitle} at ${companyName}`,
                body: data.email_body
            })
        } catch (err) {
            console.error(err)
            setError('Failed to generate email preview.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#0A0A0A] w-full max-w-4xl mx-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-300">

                {/* Mac-style Window Header */}
                <div className="h-10 bg-gray-100 dark:bg-[#111] border-b border-gray-200 dark:border-[#222] flex items-center px-4 justify-between shrink-0">
                    <div className="flex gap-2">
                        <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Mail Preview
                    </div>
                    <div className="w-14" /> {/* Spacer */}
                </div>

                {/* Email Client Header */}
                <div className="bg-white dark:bg-[#0A0A0A] px-6 py-4 border-b border-gray-100 dark:border-[#222] shrink-0 space-y-3">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest w-20 text-right">From</span>
                        <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#111] px-3 py-1 rounded-full border border-gray-100 dark:border-[#222]">
                            <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                                S
                            </div>
                            <span className="font-medium">SwarmHire Intelligence</span>
                            <span className="opacity-50 text-xs">&lt;recruiting@swarmhire.ai&gt;</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest w-20 text-right">To</span>
                        <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#111] px-3 py-1 rounded-full border border-gray-100 dark:border-[#222]">
                            <span className="font-medium">{candidateName}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest w-20 text-right shrink-0">Subject</span>
                        <div className="flex-1 min-w-0 text-sm font-medium text-black dark:text-white truncate">
                            {emailContent?.subject || <span className="text-gray-400 italic">Generating subject...</span>}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white dark:bg-white relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0A0A0A] z-10">
                            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Drafting Content...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500 bg-gray-50 dark:bg-[#0A0A0A]">
                            <svg className="w-8 h-8 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm font-medium mb-3">{error}</p>
                            <button onClick={generatePreview} className="text-xs font-bold uppercase tracking-wide underline hover:text-red-400">Retry Generation</button>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl mx-auto py-12 px-8 min-h-full">
                            <div className="prose prose-sm max-w-none prose-headings:font-bold prose-a:text-orange-500">
                                <div dangerouslySetInnerHTML={{ __html: emailContent?.body || '' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 dark:bg-[#080808] border-t border-gray-200 dark:border-[#222] flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                        Preview Mode • Links Disabled
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <span className="hidden sm:inline">Edit Template</span>
                            <span className="sm:hidden">Close</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Lock & Prepare
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
