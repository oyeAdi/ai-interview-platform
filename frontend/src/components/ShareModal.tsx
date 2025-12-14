
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    shareUrl: string
    candidateName: string
}

export default function ShareModal({ isOpen, onClose, shareUrl, candidateName }: ShareModalProps) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setCopied(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="p-5 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
                    <h3 className="text-lg font-bold text-white">Share Result</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col items-center gap-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">Scan to view results for</p>
                        <p className="text-lg font-bold text-[#39FF14]">{candidateName}</p>
                    </div>

                    <div className="p-4 bg-white rounded-xl">
                        <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={true} />
                    </div>

                    <div className="w-full space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold">Public Link</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 bg-[#0A0A0A] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#00E5FF] font-mono"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${copied
                                        ? 'bg-[#39FF14] text-black'
                                        : 'bg-[#2A2A2A] text-white hover:bg-[#333]'
                                    }`}
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
