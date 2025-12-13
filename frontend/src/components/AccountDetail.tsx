'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'

interface Account {
  id: string
  name: string
  description?: string
  org_id: string
  positions?: string[]
}

interface Position {
  id: string
  title: string
  status: string
  created_at: string
}

interface AccountDetailProps {
  accountId: string
  onUpdate: () => void
  onDelete: () => void
  onClose: () => void
  onAddPosition?: () => void
}

export default function AccountDetail({
  accountId,
  onUpdate,
  onDelete,
  onClose,
  onAddPosition
}: AccountDetailProps) {
  const [account, setAccount] = useState<Account | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (!accountId) return

    setLoading(true)
    Promise.all([
      fetch(apiUrl(`api/accounts/${accountId}`)).then(res => res.json()),
      fetch(apiUrl(`api/accounts/${accountId}/positions`)).then(res => res.json())
    ])
      .then(([accountData, positionsData]) => {
        setAccount(accountData)
        setPositions(positionsData.positions || [])
        setEditName(accountData.name || '')
        setEditDescription(accountData.description || '')
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading account:', err)
        setLoading(false)
      })
  }, [accountId])

  const handleSave = async () => {
    if (!editName.trim()) return

    setSaving(true)
    try {
      const response = await fetch(apiUrl(`api/accounts/${accountId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAccount(data.account)
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Error saving account:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(apiUrl(`api/accounts/${accountId}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        onDelete()
        onClose()
      }
    } catch (err) {
      console.error('Error deleting account:', err)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    setEditName(account?.name || '')
    setEditDescription(account?.description || '')
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="p-5 text-center text-gray-500 text-sm">
        Account not found
      </div>
    )
  }

  const openPositions = positions.filter(p => p.status === 'open').length
  const closedPositions = positions.filter(p => p.status === 'closed').length
  const recentPositions = [...positions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center text-lg font-medium text-gray-600 dark:text-gray-300">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full text-lg font-medium bg-transparent border-b border-[#00E5FF] text-black dark:text-white focus:outline-none pb-1"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-medium text-black dark:text-white truncate">
                {account.name}
              </h3>
            )}
            <p className="text-xs text-gray-500 mt-0.5">ID: {account.id}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF] resize-none"
              placeholder="Description..."
            />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {account.description || <span className="italic text-gray-400">No description</span>}
            </p>
          )}
        </div>

        {/* Stats */}
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Statistics
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-green-500/10 text-center">
              <div className="text-xl font-bold text-green-500">{openPositions}</div>
              <div className="text-[10px] text-green-500/70">Open</div>
            </div>
            <div className="p-2.5 bg-gray-100 dark:bg-[#1A1A1A] text-center">
              <div className="text-xl font-bold text-gray-500">{closedPositions}</div>
              <div className="text-[10px] text-gray-400">Closed</div>
            </div>
            <div className="p-2.5 bg-gray-100 dark:bg-[#1A1A1A] text-center">
              <div className="text-xl font-bold text-gray-500">{positions.length}</div>
              <div className="text-[10px] text-gray-400">Total</div>
            </div>
          </div>
        </div>

        {/* Recent Positions */}
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Recent Positions
          </label>
          {recentPositions.length > 0 ? (
            <div className="space-y-1.5">
              {recentPositions.map(pos => (
                <div
                  key={pos.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#1A1A1A]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {pos.title}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(pos.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 uppercase font-medium ml-2 ${
                    pos.status === 'open' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-500'
                  }`}>
                    {pos.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic py-2">No positions yet</p>
          )}
        </div>

        {/* Add Position Button */}
        {onAddPosition && (
          <button
            onClick={onAddPosition}
            className="w-full py-3 text-sm text-[#00E5FF] border border-dashed border-[#00E5FF]/50 hover:border-[#00E5FF] hover:bg-[#00E5FF]/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Position
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111]">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-[#2A2A2A]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="flex-1 py-2 text-xs bg-[#00E5FF] text-black font-medium hover:bg-[#00E5FF]/90 disabled:opacity-40 flex items-center justify-center gap-1"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        ) : showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">
              Delete account + {positions.length} positions?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 dark:border-[#2A2A2A]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-xs bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-1"
              >
                {deleting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 text-xs text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/10 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2 text-xs text-red-500 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
