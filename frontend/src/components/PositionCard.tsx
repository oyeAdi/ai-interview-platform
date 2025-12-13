'use client'

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
  interview_flow: string[]
  question_distribution: {
    easy: number
    medium: number
    hard: number
  }
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
  junior: 'bg-blue-500/10 text-blue-400',
  mid: 'bg-purple-500/10 text-purple-400',
  senior: 'bg-amber-500/10 text-amber-400',
  lead: 'bg-red-500/10 text-red-400',
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/10 text-green-500',
  closed: 'bg-gray-500/10 text-gray-500',
  on_hold: 'bg-amber-500/10 text-amber-500',
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

export default function PositionCard({ 
  position, 
  isSelected, 
  onSelect, 
  candidateCount,
  compact = false 
}: PositionCardProps) {
  const { data_model } = position

  if (compact) {
    // Compact mode for list view (backwards compatibility)
    return (
      <button
        type="button"
        onClick={() => onSelect(position.id)}
        className={`
          w-full text-left px-6 py-5 transition-all duration-200
          ${isSelected
            ? 'bg-gray-50 dark:bg-[#0A0A0A]'
            : 'hover:bg-gray-50 dark:hover:bg-[#0A0A0A]'
          }
        `}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`font-medium ${isSelected ? 'text-epam-cyan' : 'text-black dark:text-white'}`}>
                {position.title}
              </h3>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 uppercase">
                {data_model.experience_level}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {data_model.duration_minutes} min
              </span>
              <span>{data_model.expectations} expectations</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {data_model.required_skills.slice(0, 4).map((skill, idx) => (
                <span key={idx} className="text-xs text-gray-400 dark:text-gray-500">
                  {skill.skill}{idx < Math.min(data_model.required_skills.length, 4) - 1 ? ' •' : ''}
                </span>
              ))}
              {data_model.required_skills.length > 4 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  +{data_model.required_skills.length - 4} more
                </span>
              )}
            </div>
          </div>
          <div className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-200 ${
            isSelected ? 'border-epam-cyan bg-epam-cyan' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      </button>
    )
  }

  // Card mode for grid view
  return (
    <button
      type="button"
      onClick={() => onSelect(position.id)}
      className={`
        w-full text-left p-4 border transition-all duration-200
        ${isSelected
          ? 'border-[#00E5FF] bg-[#00E5FF]/5'
          : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A] bg-white dark:bg-black'
        }
      `}
    >
      {/* Header: Title + Experience Badge + Selection */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium truncate ${
            isSelected ? 'text-[#00E5FF]' : 'text-black dark:text-white'
          }`}>
            {position.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 uppercase font-medium ${
            experienceLevelColors[data_model.experience_level] || 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-500'
          }`}>
            {data_model.experience_level}
          </span>
          
          {/* Selection Indicator */}
          <div className={`w-4 h-4 border flex items-center justify-center transition-all ${
            isSelected ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-gray-300 dark:border-[#3A3A3A]'
          }`}>
            {isSelected && (
              <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Meta: Duration + Expectations */}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {data_model.duration_minutes} min
        </span>
        <span>•</span>
        <span>{data_model.expectations} exp.</span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mt-3">
        {data_model.required_skills.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 dark:text-gray-400"
          >
            {skill.skill}
          </span>
        ))}
        {data_model.required_skills.length > 3 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 self-center">
            +{data_model.required_skills.length - 3}
          </span>
        )}
      </div>

      {/* Footer: Date + Candidate Count */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#1A1A1A]">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {formatDate(position.created_at)}
        </div>
        
        {candidateCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            {candidateCount} matched
          </div>
        )}
      </div>
    </button>
  )
}
