'use client'

import React from 'react'

interface SkillData {
    name: string
    proficiency: 'basic_knowledge' | 'comfortable' | 'strong' | 'expert'
    type: 'must_have' | 'nice_to_have'
}

interface HierarchicalSkillsDisplayProps {
    categoryMap: Record<string, SkillData[]>
    title?: string
    isEditable?: boolean
    onRemoveSkill?: (skill: SkillData) => void
}

// Constants - memoized outside component
const CATEGORY_ICONS: Record<string, string> = {
    'technical': '💻',
    'system_design': '🏗️',
    'behavioral': '🤝',
    'hr_management': '👥',
    'product_management': '📊',
    'problem_solving': '🧩',
    'sales': '💼',
    'customer_service': '🎧'
}

const PROFICIENCY_COLORS: Record<string, string> = {
    'expert': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    'strong': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    'comfortable': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'basic_knowledge': 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
}

const PROFICIENCY_LABELS: Record<string, string> = {
    'expert': 'Expert',
    'strong': 'Strong',
    'comfortable': 'Comfortable',
    'basic_knowledge': 'Basic'
}

const HierarchicalSkillsDisplay: React.FC<HierarchicalSkillsDisplayProps> = React.memo(({
    categoryMap,
    title,
    isEditable = false,
    onRemoveSkill
}) => {
    if (!categoryMap || Object.keys(categoryMap).length === 0) {
        return null
    }

    return (
        <div className="space-y-3 mb-4">
            {title && (
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {title}
                </h4>
            )}

            {Object.entries(categoryMap).map(([category, skills]) => (
                <div key={category} className="border border-gray-200 dark:border-[#2A2A2A] rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1A1A1A] dark:to-[#0A0A0A] px-4 py-3 border-b border-gray-200 dark:border-[#2A2A2A]">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{CATEGORY_ICONS[category] || '📁'}</span>
                            <h4 className="font-semibold text-sm capitalize text-gray-900 dark:text-white">
                                {category.replace('_', ' ')}
                            </h4>
                            <span className="ml-auto text-xs text-gray-500">
                                {skills.length} skill{skills.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Skills List */}
                    <div className="divide-y divide-gray-100 dark:divide-[#1A1A1A]">
                        {skills.map((skill, idx) => (
                            <div key={idx} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#0A0A0A] transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 flex items-center gap-3">
                                        {/* Skill Name */}
                                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                            {skill.name.replace('_', ' ')}
                                        </span>

                                        {/* Proficiency Badge */}
                                        <span className={`px-2 py-0.5 text-[10px] font-medium uppercase rounded-full ${PROFICIENCY_COLORS[skill.proficiency]}`}>
                                            {PROFICIENCY_LABELS[skill.proficiency]}
                                        </span>

                                        {/* Must-have / Nice-to-have Tag */}
                                        <span className={`px-2 py-0.5 text-[10px] font-medium uppercase rounded ${skill.type === 'must_have'
                                            ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                                            : 'bg-gray-100 text-gray-600 dark:bg-[#1A1A1A] dark:text-gray-400'
                                            }`}>
                                            {skill.type === 'must_have' ? 'Must-have' : 'Nice-to-have'}
                                        </span>
                                    </div>

                                    {/* Remove Button */}
                                    {isEditable && onRemoveSkill && (
                                        <button
                                            type="button"
                                            onClick={() => onRemoveSkill(skill)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove skill"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
})

HierarchicalSkillsDisplay.displayName = 'HierarchicalSkillsDisplay'

export default HierarchicalSkillsDisplay
