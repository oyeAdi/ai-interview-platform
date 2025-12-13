'use client'

import { useState, useEffect, useRef } from 'react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  className?: string
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = ''
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl + K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocused])

  const handleClear = () => {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg 
          className={`w-4 h-4 transition-colors ${isFocused ? 'text-[#00E5FF]' : 'text-gray-400'}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full pl-11 pr-20 py-3
          bg-white dark:bg-black
          border transition-colors duration-200
          ${isFocused 
            ? 'border-[#00E5FF]' 
            : 'border-gray-200 dark:border-[#2A2A2A]'
          }
          text-black dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none
        `}
      />

      {/* Right side: Clear button or keyboard shortcut */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A]">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  )
}


