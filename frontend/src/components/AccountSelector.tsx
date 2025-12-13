'use client'

import { useState, useRef, useEffect } from 'react'

interface Account {
  id: string
  name: string
  org_id: string
  logo?: string
  description?: string
  positions?: string[]
}

interface AccountSelectorProps {
  accounts: Account[]
  selectedAccount: string
  onSelectAccount: (accountId: string) => void
  loading?: boolean
}

export default function AccountSelector({
  accounts,
  selectedAccount,
  onSelectAccount,
  loading = false
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAccountData = accounts.find(acc => acc.id === selectedAccount)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`
          w-full flex items-center justify-between px-4 py-4
          bg-white dark:bg-black
          border transition-all duration-200
          ${isOpen 
            ? 'border-epam-cyan' 
            : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-gray-600'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center gap-4">
          {selectedAccountData ? (
            <>
              <div className="w-10 h-10 bg-gray-100 dark:bg-[#1A1A1A] 
                            flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                {selectedAccountData.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-medium text-black dark:text-white">
                  {selectedAccountData.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAccountData.positions?.length || 0} open positions
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {loading ? 'Loading accounts...' : 'Select an account'}
            </span>
          )}
        </div>
        
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-black
                      border border-gray-200 dark:border-[#2A2A2A] shadow-lg">
          {accounts.length === 0 ? (
            <div className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
              No accounts available
            </div>
          ) : (
            accounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => {
                  onSelectAccount(account.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-4 text-left
                  transition-colors duration-150
                  ${selectedAccount === account.id
                    ? 'bg-gray-100 dark:bg-[#1A1A1A]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#0A0A0A]'
                  }
                `}
              >
                <div className={`
                  w-10 h-10 flex items-center justify-center font-medium
                  ${selectedAccount === account.id
                    ? 'bg-epam-cyan text-black'
                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300'
                  }
                `}>
                  {account.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    selectedAccount === account.id
                      ? 'text-epam-cyan'
                      : 'text-black dark:text-white'
                  }`}>
                    {account.name}
                  </div>
                  {account.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {account.description}
                    </div>
                  )}
                </div>
                {selectedAccount === account.id && (
                  <svg className="w-5 h-5 text-epam-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
