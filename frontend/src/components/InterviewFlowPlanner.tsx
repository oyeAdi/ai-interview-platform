'use client'

import React from 'react'

interface InterviewFlowProps {
    flow: Array<{
        category: string
        duration: number
        difficulty: string
    }>
    onUpdate?: (flow: any[]) => void
    isEditable?: boolean
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    expert: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
}

const InterviewFlowPlanner: React.FC<InterviewFlowProps> = React.memo(({ flow, onUpdate, isEditable = true }) => {
    const totalDuration = flow.reduce((sum, phase) => sum + phase.duration, 0)

    return (
        <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1A1A1A] dark:to-[#0A0A0A] px-5 py-3 border-b border-gray-200 dark:border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                            Interview Flow
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            AI-planned based on role requirements
                        </p>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total: {totalDuration} min
                    </div>
                </div>
            </div>

            {/* Flow Phases */}
            <div className="p-5 space-y-3">
                {flow.map((phase, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded hover:border-[#00E5FF]/50 transition-colors"
                    >
                        {/* Phase Number */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00E5FF]/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#00E5FF]">{index + 1}</span>
                        </div>

                        {/* Category Name */}
                        <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                                {phase.category.replace(/_/g, ' ')}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {phase.duration} min
                        </div>

                        {/* Difficulty Badge */}
                        <div className={`px-2 py-1 text-xs font-medium rounded capitalize ${DIFFICULTY_COLORS[phase.difficulty]}`}>
                            {phase.difficulty}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
})

InterviewFlowPlanner.displayName = 'InterviewFlowPlanner'

export default InterviewFlowPlanner
