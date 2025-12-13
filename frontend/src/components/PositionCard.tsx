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
}

export default function PositionCard({ position, isSelected, onSelect }: PositionCardProps) {
  const { data_model } = position
  
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
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`font-medium ${
              isSelected ? 'text-epam-cyan' : 'text-black dark:text-white'
            }`}>
              {position.title}
            </h3>
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 uppercase">
              {data_model.experience_level}
            </span>
          </div>
          
          {/* Meta Row */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {data_model.duration_minutes} min
            </span>
            <span>{data_model.expectations} expectations</span>
          </div>
          
          {/* Skills Row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {data_model.required_skills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="text-xs text-gray-400 dark:text-gray-500"
              >
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
        
        {/* Selection Indicator */}
        <div className={`
          w-5 h-5 border flex items-center justify-center flex-shrink-0 mt-1
          transition-all duration-200
          ${isSelected
            ? 'border-epam-cyan bg-epam-cyan'
            : 'border-gray-300 dark:border-gray-600'
          }
        `}>
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
