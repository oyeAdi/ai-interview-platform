'use client'

import { useState, useMemo } from 'react'
import SearchBar from './SearchBar'
import AccountCard from './AccountCard'

interface Account {
  id: string
  name: string
  description?: string
  positions?: string[]
}

interface Position {
  id: string
  title: string
  status: string
  created_at: string
  account_id: string
}

interface AccountGridProps {
  accounts: Account[]
  positions: Position[]
  selectedAccount: string
  onSelectAccount: (id: string) => void
  onAddAccount: () => void
  loading?: boolean
}

export default function AccountGrid({
  accounts,
  positions,
  selectedAccount,
  onSelectAccount,
  onAddAccount,
  loading = false
}: AccountGridProps) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  // Calculate position counts for each account
  const accountsWithCounts = useMemo(() => {
    return accounts.map(account => {
      const accountPositions = positions.filter(p => p.account_id === account.id)
      const openCount = accountPositions.filter(p => p.status === 'open').length
      const closedCount = accountPositions.filter(p => p.status === 'closed').length
      
      // Find most recent position
      const sortedPositions = [...accountPositions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const recentPosition = sortedPositions[0]
      let daysAgo = 0
      if (recentPosition) {
        const created = new Date(recentPosition.created_at)
        const now = new Date()
        daysAgo = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        ...account,
        positionCounts: {
          open: openCount,
          closed: closedCount,
          total: accountPositions.length
        },
        recentPosition: recentPosition ? {
          title: recentPosition.title,
          daysAgo
        } : undefined
      }
    })
  }, [accounts, positions])

  // Filter accounts by search
  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accountsWithCounts
    const searchLower = search.toLowerCase()
    return accountsWithCounts.filter(account =>
      account.name.toLowerCase().includes(searchLower) ||
      account.description?.toLowerCase().includes(searchLower)
    )
  }, [accountsWithCounts, search])

  // Limit display for initial view
  const INITIAL_DISPLAY = 10
  const displayedAccounts = showAll ? filteredAccounts : filteredAccounts.slice(0, INITIAL_DISPLAY)
  const hasMore = filteredAccounts.length > INITIAL_DISPLAY

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Add */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchBar
            placeholder="Search accounts..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <button
          type="button"
          onClick={onAddAccount}
          className="flex items-center gap-2 px-4 py-3 text-sm text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add
        </button>
      </div>

      {/* Account Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-[#2A2A2A]">
          {search ? (
            <>
              <p>No accounts match "{search}"</p>
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm text-[#00E5FF] hover:underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <p>No accounts yet. Add your first account to get started.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {displayedAccounts.map(account => (
              <AccountCard
                key={account.id}
                id={account.id}
                name={account.name}
                description={account.description}
                positionCounts={account.positionCounts}
                recentPosition={account.recentPosition}
                isSelected={selectedAccount === account.id}
                onSelect={onSelectAccount}
              />
            ))}
          </div>

          {/* Show More Button */}
          {hasMore && !showAll && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-sm text-gray-500 hover:text-[#00E5FF] transition-colors"
              >
                Show {filteredAccounts.length - INITIAL_DISPLAY} more accounts ↓
              </button>
            </div>
          )}
          {showAll && hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="text-sm text-gray-500 hover:text-[#00E5FF] transition-colors"
              >
                Show less ↑
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

