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
  onAddPosition?: () => void
}

export default function DetailSidebar({
  type,
  selectedId,
  onClose,
  onUpdate,
  onDelete,
  onAddPosition
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
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white dark:bg-[#0A0A0A] border-l border-gray-200 dark:border-[#2A2A2A] z-40 flex flex-col shadow-xl transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111]">
        <h2 className="text-xs font-medium text-[#00E5FF] uppercase tracking-wider">
          {type === 'account' ? 'Account Details' : 'Position Details'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-white hover:bg-[#00E5FF]/20 border border-transparent hover:border-[#00E5FF]/50 transition-all"
          title="Close panel (Esc)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            onAddPosition={onAddPosition}
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
  )
}
