'use client'

import React, { useCallback, useMemo } from 'react'

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
  isLoading?: boolean
}

const AccountCard: React.FC<AccountCardProps> = React.memo(({
  id,
  name,
  description,
  positionCounts,
  recentPosition,
  isSelected,
  onSelect,
  isLoading = false
}) => {
  const handleClick = useCallback(() => {
    onSelect(id)
  }, [id, onSelect])
  const initials = useMemo(() => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [name])

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
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Logo/Avatar */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${isSelected
              ? 'bg-[#00E5FF] text-black'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1A1A1A] dark:to-[#2A2A2A] text-gray-700 dark:text-gray-300'
              }`}>
              {initials}
            </div>

            {/* Name & Description */}
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-base mb-1 truncate transition-colors ${isSelected ? 'text-[#00E5FF]' : 'text-gray-900 dark:text-white'
                }`}>
                {name}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* Open Positions */}
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {isLoading ? (
                  <div className="h-7 w-8 mx-auto bg-green-200 dark:bg-green-900/30 animate-pulse rounded"></div>
                ) : (
                  positionCounts.open
                )}
              </div>
              <div className="text-[9px] text-green-600/70 dark:text-green-400/70 uppercase tracking-wider">
                Open
              </div>
            </div>

            {/* Closed Positions */}
            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2A2A2A]">
              <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {isLoading ? (
                  <div className="h-7 w-8 mx-auto bg-gray-200 dark:bg-[#2A2A2A] animate-pulse rounded"></div>
                ) : (
                  positionCounts.closed
                )}
              </div>
              <div className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                Closed
              </div>
            </div>

            {/* Total Positions */}
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {isLoading ? (
                  <div className="h-7 w-8 mx-auto bg-blue-200 dark:bg-blue-900/30 animate-pulse rounded"></div>
                ) : (
                  positionCounts.total
                )}
              </div>
              <div className="text-[9px] text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">
                Total
              </div>
            </div>
          </div>

          {/* Recent Position */}
          {recentPosition && (
            <div className="pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    Recent
                  </p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {recentPosition.title}
                  </p>
                </div>
                <span className="ml-2 text-[9px] text-gray-400">
                  {recentPosition.daysAgo === 0 ? 'today' : `${recentPosition.daysAgo}d ago`}
                </span>
              </div>
            </div>
          )}
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

AccountCard.displayName = 'AccountCard'

export default AccountCard
