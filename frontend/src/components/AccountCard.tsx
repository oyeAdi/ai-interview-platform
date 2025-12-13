'use client'

interface AccountCardProps {
  id: string
  name: string
  description?: string
  positionCounts: {
    open: number
    closed: number
    total: number
  }
  recentPosition?: {
    title: string
    daysAgo: number
  }
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function AccountCard({
  id,
  name,
  description,
  positionCounts,
  recentPosition,
  isSelected,
  onSelect
}: AccountCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`
        w-full text-left p-4 border transition-all duration-200 overflow-hidden
        ${isSelected
          ? 'border-[#00E5FF] bg-[#00E5FF]/5'
          : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A] bg-white dark:bg-black'
        }
      `}
    >
      {/* Header: Logo + Name + Selection */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Logo/Initial */}
          <div className={`
            w-10 h-10 flex-shrink-0 flex items-center justify-center font-medium text-lg
            ${isSelected
              ? 'bg-[#00E5FF] text-black'
              : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300'
            }
          `}>
            {name.charAt(0).toUpperCase()}
          </div>
          
          {/* Name & Description */}
          <div className="min-w-0 flex-1">
            <h3 className={`font-medium truncate ${
              isSelected ? 'text-[#00E5FF]' : 'text-black dark:text-white'
            }`}>
              {name}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <div className={`
          w-5 h-5 flex-shrink-0 flex items-center justify-center
          border transition-all
          ${isSelected
            ? 'bg-[#00E5FF] border-[#00E5FF]'
            : 'border-gray-300 dark:border-[#3A3A3A]'
          }
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>

      {/* Position Counts */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium whitespace-nowrap">
          <span>{positionCounts.open}</span>
          <span className="text-green-500/70">Open</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 text-xs whitespace-nowrap">
          <span>{positionCounts.closed}</span>
          <span className="opacity-70">Closed</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-[#1A1A1A] text-gray-500 text-xs whitespace-nowrap">
          <span>{positionCounts.total}</span>
          <span className="opacity-70">Total</span>
        </div>
      </div>

      {/* Recent Position */}
      {recentPosition && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1A1A1A]">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            <span className="text-gray-400 dark:text-gray-500">Recent:</span>{' '}
            <span className="text-gray-600 dark:text-gray-300">{recentPosition.title}</span>
            <span className="text-gray-400 dark:text-gray-500">
              {' '}({recentPosition.daysAgo === 0 ? 'today' : `${recentPosition.daysAgo}d ago`})
            </span>
          </p>
        </div>
      )}
    </button>
  )
}

