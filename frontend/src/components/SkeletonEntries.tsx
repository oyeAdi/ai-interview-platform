'use client'

import React from 'react'

const SkeletonEntries: React.FC = React.memo(() => {
    return (
        <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 border border-gray-200 dark:border-[#2A2A2A]">
                    <div className="h-5 bg-gray-200 dark:bg-[#1A1A1A] rounded w-3/4 mb-2"></div>
                    <div className="flex gap-2">
                        <div className="h-4 bg-gray-100 dark:bg-[#0A0A0A] rounded w-20"></div>
                        <div className="h-4 bg-gray-100 dark:bg-[#0A0A0A] rounded w-16"></div>
                    </div>
                </div>
            ))}
        </div>
    )
})

SkeletonEntries.displayName = 'SkeletonEntries'

export default SkeletonEntries
