'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface Props {
    shareUrl: string;
    candidateName: string;
    onClose: () => void;
}

export default function ShareFeedbackModal({ shareUrl, candidateName, onClose }: Props) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${shareUrl}`;

    useEffect(() => {
        // Generate QR code on mount
        QRCode.toDataURL(fullUrl, { width: 300, margin: 2 })
            .then(setQrDataUrl)
            .catch(console.error);
    }, [fullUrl]);

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Feedback</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Share this feedback with <strong>{candidateName}</strong>
                </p>

                {/* QR Code */}
                {qrDataUrl && (
                    <div className="flex justify-center mb-4">
                        <img
                            src={qrDataUrl}
                            alt="QR Code"
                            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white"
                        />
                    </div>
                )}

                {/* Share URL */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Share Link:</p>
                    <p className="text-sm font-mono break-all text-gray-900 dark:text-white">{fullUrl}</p>
                </div>

                {/* Copy Button */}
                <button
                    onClick={handleCopy}
                    className="w-full bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 transition font-medium"
                >
                    {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
            </div>
        </div>
    );
}
