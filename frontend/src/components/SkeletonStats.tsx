'use client'

import React from 'react'

const SkeletonStats: React.FC = React.memo(() => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
                    <div className="h-3 bg-gray-200 dark:bg-[#1A1A1A] rounded w-16 mb-2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-[#1A1A1A] rounded w-12"></div>
                </div>
            ))}
        </div>
    )
})

SkeletonStats.displayName = 'SkeletonStats'

export default SkeletonStats
