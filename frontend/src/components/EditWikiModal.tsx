'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'
import { X, Check, Save, Info, AlertTriangle, FileCode } from 'lucide-react'

interface EditWikiModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function EditWikiModal({ isOpen, onClose }: EditWikiModalProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [configContent, setConfigContent] = useState('')
    const [isMaintainer, setIsMaintainer] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchConfig()
        }
    }, [isOpen])

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const res = await fetch(apiUrl('api/wiki/config'))
            if (!res.ok) throw new Error('Failed to load config')
            const data = await res.json()
            setConfigContent(JSON.stringify(data, null, 2))
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!isMaintainer) return

        try {
            // Validate JSON
            const parsed = JSON.parse(configContent)

            setSaving(true)
            const res = await fetch(apiUrl('api/wiki/config'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: parsed })
            })

            if (!res.ok) throw new Error('Failed to save config')

            onClose()
        } catch (err: any) {
            setError(err.message || "Invalid JSON")
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-[#222] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Wiki</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#222]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Sidebar Info */}
                    <div className="w-full md:w-72 bg-gray-50 dark:bg-[#0A0A0A] p-6 border-r border-gray-200 dark:border-[#2A2A2A] flex-shrink-0">
                        <div className="space-y-6">
                            <div>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-2">
                                    <FileCode className="w-3 h-3" />
                                    swarm_wiki.json
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Editing this JSON file will provide instructions and steer wiki generation.
                                </p>
                            </div>

                            <div className="text-xs space-y-3 text-gray-500 dark:text-gray-500">
                                <p><strong className="text-gray-700 dark:text-gray-300">repo_notes:</strong> Context applied globally.</p>
                                <p><strong className="text-gray-700 dark:text-gray-300">pages:</strong> Define the structure of your documentation.</p>
                            </div>

                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                                <p className="text-xs text-yellow-800 dark:text-yellow-500 flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    Config changes take effect on the next scan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-[#151515] p-6 overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400">Loading config...</div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                <textarea
                                    value={configContent}
                                    onChange={(e) => setConfigContent(e.target.value)}
                                    className="flex-1 w-full font-mono text-sm bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#333] rounded-lg p-4 focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none resize-none text-gray-800 dark:text-gray-200"
                                    spellCheck={false}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between bg-white dark:bg-[#111]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isMaintainer}
                            onChange={(e) => setIsMaintainer(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#00E5FF] focus:ring-[#00E5FF]"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">I am a maintainer of this repository</span>
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={!isMaintainer || saving || loading}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${!isMaintainer || saving
                                ? 'bg-gray-100 dark:bg-[#222] text-gray-400 cursor-not-allowed'
                                : 'bg-[#00E5FF] hover:bg-[#00D1E8] text-black shadow-lg shadow-[#00E5FF]/20'
                            }`}
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                Continue to Edit <Check className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
