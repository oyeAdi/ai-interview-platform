'use client'

import React, { useCallback, useMemo } from 'react'

interface Skill {
  skill: string
  proficiency: string
  weight: number
}

interface DataModel {
  duration_minutes: number
  experience_level: string
  expectations: string
  required_skills: Skill[]
  interview_flow?: string[]
}

interface Position {
  id: string
  title: string
  account_id: string
  status: string
  created_at: string
  data_model: DataModel
  jd_text?: string
}

interface PositionCardProps {
  position: Position
  isSelected: boolean
  onSelect: (positionId: string) => void
  candidateCount?: number
  compact?: boolean
}

const experienceLevelColors: Record<string, string> = {
  junior: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  mid: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  senior: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  lead: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const PositionCard: React.FC<PositionCardProps> = React.memo(({
  position,
  isSelected,
  onSelect,
  candidateCount = 0,
  compact = false
}) => {
  const { data_model } = position

  const handleClick = useCallback(() => {
    onSelect(position.id)
  }, [position.id, onSelect])

  const formattedDate = useMemo(() => formatDate(position.created_at), [position.created_at])
  const topSkills = useMemo(() => data_model.required_skills.slice(0, 3), [data_model.required_skills])
  const remainingSkills = data_model.required_skills.length - 3

  return (
    <button
      onClick={handleClick}
      className={`group relative w-full text-left transition-all duration-300 ${isSelected
        ? 'scale-[1.02]'
        : 'hover:scale-[1.01]'
        }`}
    >
      {/* Card Container */}
      <div
        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${isSelected
          ? 'border-[#00E5FF] bg-[#00E5FF]/5 shadow-lg shadow-[#00E5FF]/20'
          : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#0A0A0A] hover:border-[#00E5FF]/50 hover:shadow-md'
          }`}
      >
        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-2 right-2 w-5 h-5 bg-[#00E5FF] rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="p-5 space-y-4">
          {/* Header - Title & Badges */}
          <div className="space-y-2">
            <h3 className={`font-semibold text-base line-clamp-2 min-h-[3rem] transition-colors ${isSelected ? 'text-[#00E5FF]' : 'text-gray-900 dark:text-white'
              }`}>
              {position.title}
            </h3>

            {/* Status & Level Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[9px] font-medium uppercase rounded-full ${statusColors[position.status]}`}>
                {position.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-medium uppercase rounded-full ${experienceLevelColors[data_model.experience_level]}`}>
                {data_model.experience_level}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Duration */}
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data_model.duration_minutes}
              </div>
              <div className="text-[9px] text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">
                Min
              </div>
            </div>

            {/* Candidates */}
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {candidateCount}
              </div>
              <div className="text-[9px] text-green-600/70 dark:text-green-400/70 uppercase tracking-wider">
                Matched
              </div>
            </div>

            {/* Skills */}
            <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {data_model.required_skills.length}
              </div>
              <div className="text-[9px] text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider">
                Skills
              </div>
            </div>
          </div>

          {/* Skills Tags */}
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 rounded"
              >
                {skill.skill.replace('_', ' ')}
              </span>
            ))}
            {remainingSkills > 0 && (
              <span className="px-2 py-0.5 text-[10px] text-gray-400">
                +{remainingSkills}
              </span>
            )}
          </div>

          {/* Footer - Date & Expectations */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#2A2A2A] flex items-center justify-between text-[10px]">
            <span className="text-gray-400">
              📅 {formattedDate}
            </span>
            <span className="text-gray-500 dark:text-gray-400 capitalize">
              {data_model.expectations} exp.
            </span>
          </div>
        </div>

        {/* Hover Effect Border */}
        <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${isSelected
          ? 'opacity-0'
          : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#00E5FF]/10 to-transparent'
          }`} />
      </div>
    </button>
  )
})

PositionCard.displayName = 'PositionCard'

export default PositionCard
