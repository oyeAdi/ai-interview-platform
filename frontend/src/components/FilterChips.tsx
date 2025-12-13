'use client'

import { useState, useRef, useEffect } from 'react'

interface FilterOption {
  id: string
  label: string
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  type: 'single' | 'multi'
}

interface FilterChipsProps {
  filters: FilterGroup[]
  selectedFilters: Record<string, string[]>
  onChange: (filterId: string, values: string[]) => void
  onClear?: () => void
}

export default function FilterChips({
  filters,
  selectedFilters,
  onChange,
  onClear
}: FilterChipsProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0)

  const handleOptionToggle = (filterId: string, optionId: string, type: 'single' | 'multi') => {
    const current = selectedFilters[filterId] || []
    
    if (type === 'single') {
      // Single select: toggle or clear
      if (current.includes(optionId)) {
        onChange(filterId, [])
      } else {
        onChange(filterId, [optionId])
      }
      setOpenDropdown(null)
    } else {
      // Multi select: add or remove
      if (current.includes(optionId)) {
        onChange(filterId, current.filter(id => id !== optionId))
      } else {
        onChange(filterId, [...current, optionId])
      }
    }
  }

  const getChipLabel = (filter: FilterGroup) => {
    const selected = selectedFilters[filter.id] || []
    if (selected.length === 0) {
      return filter.label
    }
    if (selected.length === 1) {
      const option = filter.options.find(o => o.id === selected[0])
      return option?.label || filter.label
    }
    return `${filter.label} (${selected.length})`
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
      {filters.map(filter => {
        const isOpen = openDropdown === filter.id
        const selected = selectedFilters[filter.id] || []
        const hasSelection = selected.length > 0

        return (
          <div key={filter.id} className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(isOpen ? null : filter.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 text-sm
                border transition-colors duration-200
                ${hasSelection
                  ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]'
                  : 'bg-transparent border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <span>{getChipLabel(filter)}</span>
              <svg 
                className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] shadow-lg z-30">
                {filter.options.map(option => {
                  const isSelected = selected.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionToggle(filter.id, option.id, filter.type)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-sm text-left
                        transition-colors
                        ${isSelected
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Clear all button */}
      {hasActiveFilters && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-[#00E5FF] transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

