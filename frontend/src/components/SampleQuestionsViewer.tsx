'use client'

import { useState, useCallback, useMemo } from 'react'
import React from 'react'

interface SampleQuestionsProps {
    questions: Record<string, Record<string, Array<{ q: string; a: string }>>>
}

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'text-green-600 dark:text-green-400',
    medium: 'text-blue-600 dark:text-blue-400',
    hard: 'text-orange-600 dark:text-orange-400',
    expert: 'text-red-600 dark:text-red-400'
}

const SampleQuestionsViewer: React.FC<SampleQuestionsProps> = React.memo(({ questions }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [expandedDifficulty, setExpandedDifficulty] = useState<string | null>(null)

    const categories = useMemo(() => Object.keys(questions), [questions])

    const toggleCategory = useCallback((category: string) => {
        setExpandedCategory(prev => prev === category ? null : category)
    }, [])

    const toggleDifficulty = useCallback((key: string) => {
        setExpandedDifficulty(prev => prev === key ? null : key)
    }, [])

    return (
        <div className="border border-gray-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1A1A1A] dark:to-[#0A0A0A] px-5 py-3 border-b border-gray-200 dark:border-[#2A2A2A]">
                <div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                        Sample Questions & Answers
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        AI's guidance (adapts in real-time during interview)
                    </p>
                </div>
            </div>

            {/* Categories */}
            <div className="divide-y divide-gray-200 dark:divide-[#1A1A1A]">
                {categories.map((category) => {
                    const isExpanded = expandedCategory === category
                    const categoryQuestions = questions[category]
                    const totalQuestions = Object.values(categoryQuestions).reduce((sum, qs) => sum + qs.length, 0)

                    return (
                        <div key={category}>
                            {/* Category Header */}
                            <button
                                onClick={() => toggleCategory(category)}
                                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="font-medium text-sm text-gray-900 dark:text-white capitalize">
                                        {category.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {totalQuestions} questions
                                </span>
                            </button>

                            {/* Difficulty Levels */}
                            {isExpanded && (
                                <div className="px-5 pb-3 space-y-2">
                                    {['easy', 'medium', 'hard', 'expert'].map((difficulty) => {
                                        const difficultyQuestions = categoryQuestions[difficulty] || []
                                        if (difficultyQuestions.length === 0) return null

                                        const isDiffExpanded = expandedDifficulty === `${category}-${difficulty}`

                                        return (
                                            <div key={difficulty} className="border border-gray-200 dark:border-[#1A1A1A] rounded">
                                                {/* Difficulty Header */}
                                                <button
                                                    onClick={() => toggleDifficulty(`${category}-${difficulty}`)}
                                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors"
                                                >
                                                    <span className={`text-xs font-medium uppercase ${DIFFICULTY_COLORS[difficulty]}`}>
                                                        {difficulty}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {difficultyQuestions.length} questions
                                                    </span>
                                                </button>

                                                {/* Questions */}
                                                {isDiffExpanded && (
                                                    <div className="px-3 pb-3 space-y-3">
                                                        {difficultyQuestions.map((qa, idx) => (
                                                            <div key={idx} className="text-sm">
                                                                <div className="font-medium text-gray-900 dark:text-white mb-1">
                                                                    Q{idx + 1}: {qa.q}
                                                                </div>
                                                                <div className="text-gray-600 dark:text-gray-400 pl-4">
                                                                    A: {qa.a}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

SampleQuestionsViewer.displayName = 'SampleQuestionsViewer'

export default SampleQuestionsViewer
