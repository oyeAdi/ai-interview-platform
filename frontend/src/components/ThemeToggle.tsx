'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center w-14 h-7 rounded-full bg-gray-200 dark:bg-[#2A2A2A] transition-colors duration-200"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Toggle Indicator */}
      <div
        className={`
          absolute w-5 h-5 rounded-full bg-brand-primary shadow-sm
          transition-all duration-200 ease-out
          ${isDark ? 'left-1.5' : 'left-[calc(100%-1.625rem)]'}
        `}
      />
      
      {/* Sun Icon (Light Mode) */}
      <div className={`absolute right-1.5 transition-opacity duration-200 ${isDark ? 'opacity-30' : 'opacity-0'}`}>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      </div>
      
      {/* Moon Icon (Dark Mode) */}
      <div className={`absolute left-1.5 transition-opacity duration-200 ${isDark ? 'opacity-0' : 'opacity-30'}`}>
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      </div>
    </button>
  )
}
