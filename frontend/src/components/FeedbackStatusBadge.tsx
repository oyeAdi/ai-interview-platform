'use client';

import { FeedbackStatus } from '@/types/feedback';

interface Props {
    status: FeedbackStatus;
}

export default function FeedbackStatusBadge({ status }: Props) {
    const config = {
        [FeedbackStatus.NOT_GENERATED]: {
            label: 'Not Generated',
            color: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
            icon: '○'
        },
        [FeedbackStatus.GENERATING]: {
            label: 'Generating...',
            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse',
            icon: '⟳'
        },
        [FeedbackStatus.GENERATED]: {
            label: 'Ready for Review',
            color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
            icon: '⚠'
        },
        [FeedbackStatus.REJECTED]: {
            label: 'Rejected',
            color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            icon: '✗'
        },
        [FeedbackStatus.APPROVED]: {
            label: 'Approved',
            color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
            icon: '✓'
        },
        [FeedbackStatus.PUBLISHED]: {
            label: 'Published',
            color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
            icon: '✓✓'
        }
    };

    const { label, color, icon } = config[status];

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
            <span>{icon}</span>
            <span>{label}</span>
        </span>
    );
}
