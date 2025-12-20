'use client';

import { useState } from 'react';

interface Props {
    onReject: (reason: string) => void;
    onCancel: () => void;
}

export default function RejectFeedbackModal({ onReject, onCancel }: Props) {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onReject(reason);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reject Feedback</h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please provide a reason for rejecting this feedback. This will help improve future generations.
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Too generic, missing specific examples, incorrect tone..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[120px] mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    autoFocus
                />

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        Reject Feedback
                    </button>
                </div>
            </div>
        </div>
    );
}
