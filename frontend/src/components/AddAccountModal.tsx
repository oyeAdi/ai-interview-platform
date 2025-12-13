'use client'

import { useState, useEffect } from 'react'

interface AddAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountCreated: () => void
}

export default function AddAccountModal({
  isOpen,
  onClose,
  onAccountCreated
}: AddAccountModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setError('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Account name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(apiUrl('api/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          org_id: 'epam'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create account')
      }

      onAccountCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
          <h2 className="text-lg font-medium text-black dark:text-white">Add New Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Google, Microsoft, Spotify"
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the client/account..."
              rows={3}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF] resize-none"
            />
          </div>

          <div className="text-xs text-gray-500">
            <p>The account will be created under EPAM organization.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


