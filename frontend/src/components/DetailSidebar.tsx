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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white dark:bg-[#0A0A0A] border-l border-gray-200 dark:border-[#2A2A2A] z-50 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {type === 'account' ? 'Account Details' : 'Position Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

