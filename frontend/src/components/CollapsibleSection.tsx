'use client'

import { useState, useCallback } from 'react'
import React from 'react'

interface CollapsibleSectionProps {
    title: string
    icon: string
    defaultExpanded?: boolean
    children: React.ReactNode
    headerActions?: React.ReactNode
    description?: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = React.memo(({
    title,
    icon,
    defaultExpanded = true,
    children,
    headerActions,
    description
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev)
    }, [])

    const stopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
    }, [])

    return (
        <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden mb-4">
            {/* Header */}
            <button
                onClick={toggleExpanded}
                className="w-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1A1A1A] dark:to-[#0A0A0A] px-5 py-4 flex items-center justify-between hover:from-gray-100 hover:to-gray-200 dark:hover:from-[#1A1A1A] dark:hover:to-[#1A1A1A] transition-colors border-b border-gray-200 dark:border-[#2A2A2A]"
            >
                <div className="flex flex-col items-start gap-1 flex-1">
                    <div className="flex items-center gap-3">
                        {/* Expand/Collapse Icon */}
                        <svg
                            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''
                                }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>

                        {/* Icon & Title */}
                        <span className="text-xl">{icon}</span>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                    </div>

                    {/* Description */}
                    {description && (
                        <div className="ml-11">
                            {description}
                        </div>
                    )}
                </div>

                {/* Header Actions (don't trigger collapse) */}
                {headerActions && (
                    <div onClick={stopPropagation}>
                        {headerActions}
                    </div>
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-5 bg-white dark:bg-[#0A0A0A]">
                    {children}
                </div>
            )}
        </div>
    )
})

CollapsibleSection.displayName = 'CollapsibleSection'

export default CollapsibleSection
