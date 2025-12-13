'use client'

import { useEffect } from 'react'
import AccountDetail from './AccountDetail'
import PositionDetail from './PositionDetail'

interface DetailSidebarProps {
  type: 'account' | 'position' | null
  selectedId: string | null
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}

export default function DetailSidebar({
  type,
  selectedId,
  onClose,
  onUpdate,
  onDelete
}: DetailSidebarProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!type || !selectedId) return null

  return (
    <>
      {/* Backdrop - only on mobile */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:bg-black/20 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar - narrower and doesn't cover header */}
      <div className="fixed right-4 top-20 bottom-4 w-[calc(100%-2rem)] sm:w-[360px] bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] z-50 shadow-2xl flex flex-col animate-slide-in-right rounded-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111]">
          <h2 className="text-xs font-medium text-[#00E5FF] uppercase tracking-wider">
            {type === 'account' ? 'Account Details' : 'Position Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#00E5FF]/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {type === 'account' && (
            <AccountDetail
              accountId={selectedId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={onClose}
            />
          )}
          {type === 'position' && (
            <PositionDetail
              positionId={selectedId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </>
  )
}
