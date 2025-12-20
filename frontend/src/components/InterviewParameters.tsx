'use client'

import { useState, useCallback } from 'react'
import React from 'react'

interface InterviewParametersProps {
    parameters: {
        duration_minutes: number
        experience_level: string
        expectations: string
        urgency: string
        urgency_source?: string
    }
    onUpdate?: (parameters: any) => void
    isEditable?: boolean
}

const DURATION_OPTIONS = [30, 45, 60, 90]
const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
const EXPECTATIONS = ['low', 'medium', 'high']
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical']

const InterviewParameters: React.FC<InterviewParametersProps> = React.memo(({
    parameters,
    onUpdate,
    isEditable = true
}) => {
    const [localParams, setLocalParams] = useState(parameters)

    const handleChange = useCallback((field: string, value: any) => {
        const updated = { ...localParams, [field]: value }
        setLocalParams(updated)
        onUpdate?.(updated)
    }, [localParams, onUpdate])

    const isAISuggested = parameters.urgency_source === 'ai_suggested'

    return (
        <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1A1A1A] dark:to-[#0A0A0A] px-5 py-3 border-b border-gray-200 dark:border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                            Interview Parameters
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Auto-extracted from job description
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#00E5FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-[#00E5FF] font-medium">AI-Configured</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                    {/* Duration */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duration
                        </label>
                        <select
                            value={localParams.duration_minutes}
                            onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#2A2A2A] rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent disabled:opacity-50"
                        >
                            {DURATION_OPTIONS.map(duration => (
                                <option key={duration} value={duration}>
                                    {duration} minutes
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Experience Level
                        </label>
                        <select
                            value={localParams.experience_level}
                            onChange={(e) => handleChange('experience_level', e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#2A2A2A] rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent disabled:opacity-50 capitalize"
                        >
                            {EXPERIENCE_LEVELS.map(level => (
                                <option key={level} value={level} className="capitalize">
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Expectations */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expectations
                        </label>
                        <select
                            value={localParams.expectations}
                            onChange={(e) => handleChange('expectations', e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#2A2A2A] rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent disabled:opacity-50 capitalize"
                        >
                            {EXPECTATIONS.map(exp => (
                                <option key={exp} value={exp} className="capitalize">
                                    {exp}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Urgency */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            Urgency
                            {isAISuggested && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded">
                                    AI-Suggested
                                </span>
                            )}
                        </label>
                        <select
                            value={localParams.urgency}
                            onChange={(e) => handleChange('urgency', e.target.value)}
                            disabled={!isEditable}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0A0A0A] border border-gray-300 dark:border-[#2A2A2A] rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent disabled:opacity-50 capitalize"
                        >
                            {URGENCY_LEVELS.map(urgency => (
                                <option key={urgency} value={urgency} className="capitalize">
                                    {urgency}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
})

InterviewParameters.displayName = 'InterviewParameters'

export default InterviewParameters
