'use client'

import React from 'react'

const SkeletonCategories: React.FC = React.memo(() => {
    return (
        <div className="w-64 flex-shrink-0">
            <div className="sticky top-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A1A] rounded w-24 mb-3"></div>
                <div className="space-y-1">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded"></div>
                    ))}
                </div>
                <div className="mt-6">
                    <div className="h-4 bg-gray-200 dark:bg-[#1A1A1A] rounded w-16 mb-3"></div>
                    <div className="h-10 bg-gray-100 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded"></div>
                </div>
            </div>
        </div>
    )
})

SkeletonCategories.displayName = 'SkeletonCategories'

export default SkeletonCategories
