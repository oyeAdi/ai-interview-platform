'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface InterviewLinksModalProps {
  isOpen: boolean
  onClose: () => void
  sessionData: {
    session_id: string
    position: { id: string; title: string }
    candidate: { id: string; name: string }
    links: {
      candidate: string
      admin: string
    }
  } | null
}

export default function InterviewLinksModal({ isOpen, onClose, sessionData }: InterviewLinksModalProps) {
  const [copiedCandidate, setCopiedCandidate] = useState(false)
  const [copiedAdmin, setCopiedAdmin] = useState(false)

  if (!isOpen || !sessionData) return null

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const candidateFullUrl = `${baseUrl}${sessionData.links.candidate}`
  const adminFullUrl = `${baseUrl}${sessionData.links.admin}`

  const copyToClipboard = async (text: string, type: 'candidate' | 'admin') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'candidate') {
        setCopiedCandidate(true)
        setTimeout(() => setCopiedCandidate(false), 2000)
      } else {
        setCopiedAdmin(true)
        setTimeout(() => setCopiedAdmin(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openAdminView = () => {
    window.open(adminFullUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#2A2A2A] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-black dark:text-white">Interview Session Created</h2>
            <p className="text-sm text-gray-500 mt-1">Share these links to start the interview</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Session Info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2A2A2A]">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Position:</span>
                <span className="ml-2 text-black dark:text-white font-medium">{sessionData.position.title}</span>
              </div>
              <div>
                <span className="text-gray-500">Candidate:</span>
                <span className="ml-2 text-black dark:text-white font-medium">{sessionData.candidate.name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Session ID:</span>
                <span className="ml-2 text-[#00E5FF] font-mono">{sessionData.session_id}</span>
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Candidate Link */}
            <div className="border border-gray-200 dark:border-[#2A2A2A] p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-medium text-black dark:text-white">Candidate Link</h3>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                Share this link with the candidate. They will see only the interview interface.
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4 p-4 bg-white rounded">
                <QRCodeSVG 
                  value={candidateFullUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>

              {/* URL Display */}
              <div className="mb-3 p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#2A2A2A] text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {candidateFullUrl}
              </div>

              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(candidateFullUrl, 'candidate')}
                className={`w-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  copiedCandidate
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                }`}
              >
                {copiedCandidate ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Candidate Link
                  </>
                )}
              </button>
            </div>

            {/* Admin Link */}
            <div className="border border-[#00E5FF]/30 dark:border-[#00E5FF]/30 p-5 bg-[#00E5FF]/5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-medium text-black dark:text-white">Admin Link</h3>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                Use this link to join as interviewer. Full access to controls and wiki.
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4 p-4 bg-white rounded">
                <QRCodeSVG 
                  value={adminFullUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#00E5FF"
                />
              </div>

              {/* URL Display */}
              <div className="mb-3 p-2 bg-white dark:bg-black border border-[#00E5FF]/30 text-xs font-mono text-[#00E5FF] break-all">
                {adminFullUrl}
              </div>

              {/* Copy Button */}
              <button
                onClick={() => copyToClipboard(adminFullUrl, 'admin')}
                className={`w-full py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  copiedAdmin
                    ? 'bg-green-500 text-white'
                    : 'bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30'
                }`}
              >
                {copiedAdmin ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Admin Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Instructions</h4>
            <ol className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
              <li>Share the <strong>Candidate Link</strong> with the interviewee (via email, chat, etc.)</li>
              <li>Click <strong>Open Admin View</strong> below to join as the interviewer</li>
              <li>Both parties can scan the QR codes on mobile devices</li>
              <li>The interview will begin when both parties are connected</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-[#2A2A2A] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={openAdminView}
            className="px-5 py-2.5 text-sm font-medium bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Admin View
          </button>
        </div>
      </div>
    </div>
  )
}

