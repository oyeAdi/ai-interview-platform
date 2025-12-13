'use client'

import { useState, useMemo, useEffect } from 'react'
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

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'name', label: 'Name A-Z' },
  { id: 'positions', label: 'Most Positions' }
]

export default function AccountGrid({
  accounts,
  positions,
  selectedAccount,
  onSelectAccount,
  onAddAccount,
  loading = false
}: AccountGridProps) {
  const [search, setSearch] = useState('')
  const [hasOpenOnly, setHasOpenOnly] = useState(false)
  const [sortBy, setSortBy] = useState('recent')

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

  // Filter and sort accounts
  const filteredAccounts = useMemo(() => {
    let result = accountsWithCounts
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(account =>
        account.name.toLowerCase().includes(searchLower) ||
        account.description?.toLowerCase().includes(searchLower)
      )
    }
    
    // Filter by has open positions
    if (hasOpenOnly) {
      result = result.filter(account => account.positionCounts.open > 0)
    }
    
    // Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'positions') {
      result = [...result].sort((a, b) => b.positionCounts.total - a.positionCounts.total)
    } else {
      // 'recent' - sort by most recent position
      result = [...result].sort((a, b) => {
        const aDays = a.recentPosition?.daysAgo ?? 9999
        const bDays = b.recentPosition?.daysAgo ?? 9999
        return aDays - bDays
      })
    }
    
    return result
  }, [accountsWithCounts, search, hasOpenOnly, sortBy])

  // Limit display - start with 4, load 4 more each time
  const INITIAL_DISPLAY = 4
  const LOAD_MORE_COUNT = 4
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY)
  
  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(INITIAL_DISPLAY)
  }, [search])
  
  const displayedAccounts = filteredAccounts.slice(0, visibleCount)
  const hasMore = filteredAccounts.length > visibleCount
  const remainingCount = filteredAccounts.length - visibleCount

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

  const hasActiveFilters = hasOpenOnly || sortBy !== 'recent'

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
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Has Open Positions Toggle */}
        <button
          type="button"
          onClick={() => { setHasOpenOnly(!hasOpenOnly); setVisibleCount(INITIAL_DISPLAY) }}
          className={`px-3 py-1.5 text-xs transition-colors flex items-center gap-1.5 ${
            hasOpenOnly
              ? 'bg-[#00E5FF] text-black'
              : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
          }`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Has Open
        </button>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(INITIAL_DISPLAY) }}
            className={`appearance-none px-3 py-1.5 pr-7 text-xs cursor-pointer transition-colors ${
              sortBy !== 'recent'
                ? 'bg-[#00E5FF] text-black'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
            }`}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setHasOpenOnly(false); setSortBy('recent'); setVisibleCount(INITIAL_DISPLAY) }}
            className="px-2 py-1.5 text-xs text-gray-500 hover:text-[#00E5FF] transition-colors"
          >
            Clear all
          </button>
        )}
        
        {/* Results count */}
        <span className="ml-auto text-xs text-gray-500">
          {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}
        </span>
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
          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                className="text-sm text-[#00E5FF] hover:underline transition-colors"
              >
                Show {Math.min(LOAD_MORE_COUNT, remainingCount)} more ↓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

