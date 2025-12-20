'use client'

import { useState } from 'react'

interface CategoryConfig {
    enabled: boolean
    difficulty_level: 'easy' | 'medium' | 'hard'
}

interface QuestionCategories {
    [key: string]: CategoryConfig
}

interface ConfigurationPanelProps {
    config: QuestionCategories
    onChange: (config: QuestionCategories) => void
    aiGenerated: boolean
}

const CATEGORY_INFO: Record<string, { label: string; icon: string; description: string }> = {
    coding: {
        label: 'Coding',
        icon: '💻',
        description: 'Programming, algorithms, data structures'
    },
    behavioral: {
        label: 'Behavioral',
        icon: '🗣️',
        description: 'Soft skills, past experiences, situational'
    },
    system_design: {
        label: 'System Design',
        icon: '🏗️',
        description: 'Architecture, scalability, design patterns'
    },
    problem_solving: {
        label: 'Problem Solving',
        icon: '🧩',
        description: 'Analytical thinking, case studies'
    },
    conceptual: {
        label: 'Conceptual',
        icon: '💡',
        description: 'Theoretical knowledge, fundamentals'
    },
    technical_knowledge: {
        label: 'Technical Knowledge',
        icon: '🔧',
        description: 'Domain-specific technical expertise'
    },
    safety: {
        label: 'Safety',
        icon: '⚠️',
        description: 'Safety protocols, compliance'
    },
    recruitment: {
        label: 'Recruitment',
        icon: '👥',
        description: 'Hiring, talent acquisition'
    },
    stakeholder_management: {
        label: 'Stakeholder Management',
        icon: '🤝',
        description: 'Managing relationships, communication'
    },
    leadership: {
        label: 'Leadership',
        icon: '👔',
        description: 'Team management, decision making'
    },
    hr_policies: {
        label: 'HR Policies',
        icon: '📋',
        description: 'HR regulations, compliance'
    },
    product_sense: {
        label: 'Product Sense',
        icon: '🎯',
        description: 'Product thinking, user empathy'
    },
    metrics_analytics: {
        label: 'Metrics & Analytics',
        icon: '📊',
        description: 'Data analysis, KPIs'
    }
}

// Helper function to get category info (supports dynamic categories)
const getCategoryInfo = (category: string) => {
    if (CATEGORY_INFO[category]) {
        return CATEGORY_INFO[category]
    }
    // Auto-generate info for unknown categories
    return {
        label: category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        icon: '📋',
        description: 'Custom category'
    }
}

export default function ConfigurationPanel({ config, onChange, aiGenerated }: ConfigurationPanelProps) {
    const updateCategory = (category: string, field: 'enabled' | 'difficulty_level', value: boolean | string) => {
        const updatedConfig = {
            ...config,
            [category]: {
                ...config[category],
                [field]: value
            }
        }
        onChange(updatedConfig)
    }

    const enabledCount = Object.values(config).filter(c => c.enabled).length

    return (
        <div className="space-y-4">
            {/* AI Generated Badge */}
            {aiGenerated && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            AI-Generated Configuration
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Based on job description analysis. You can edit any settings below.
                        </p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                    {enabledCount} {enabledCount === 1 ? 'category' : 'categories'} enabled
                </span>
                <span className="text-xs text-gray-500">
                    💡 AI decides question count dynamically
                </span>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(config).map(([category, settings]) => {
                    const info = getCategoryInfo(category)

                    return (
                        <div
                            key={category}
                            className={`p-4 border rounded transition-all duration-200 ${settings.enabled
                                ? 'border-[#00E5FF] bg-[#00E5FF]/5'
                                : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-black'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={(e) => updateCategory(category, 'enabled', e.target.checked)}
                                    className="mt-1 w-4 h-4 text-[#00E5FF] border-gray-300 rounded focus:ring-[#00E5FF]"
                                />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base">{info.icon}</span>
                                        <span className={`font-medium text-sm ${settings.enabled ? 'text-black dark:text-white' : 'text-gray-400'
                                            }`}>
                                            {info.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                        {info.description}
                                    </p>

                                    {/* Difficulty Dropdown */}
                                    <select
                                        value={settings.difficulty_level}
                                        onChange={(e) => updateCategory(category, 'difficulty_level', e.target.value)}
                                        disabled={!settings.enabled}
                                        className={`w-full px-3 py-1.5 border rounded text-sm transition-colors ${settings.enabled
                                            ? 'border-gray-300 dark:border-[#3A3A3A] bg-white dark:bg-[#0A0A0A] text-black dark:text-white'
                                            : 'border-gray-200 dark:border-[#2A2A2A] bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-0.5">
                    <li>Enable categories relevant to this role</li>
                    <li>Set difficulty based on seniority (Easy = Junior, Medium = Mid, Hard = Senior)</li>
                    <li>AI will ask questions from enabled categories only</li>
                    <li>Question count varies based on candidate performance (dynamic followups)</li>
                </ul>
            </div>
        </div>
    )
}
