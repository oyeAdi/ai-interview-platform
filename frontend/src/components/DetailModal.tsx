'use client'

import React from 'react'
import { X } from 'lucide-react'

interface DetailModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle?: string
    icon?: React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
}

export default function DetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    children,
    footer
}: DetailModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#1A1A1A] flex items-center justify-between bg-gray-50/50 dark:bg-[#080808]/50">
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/5 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none mb-1.5">{title}</h3>
                            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-tight uppercase tracking-[0.05em]">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-xl transition-all group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-[#080808]/50 border-t border-gray-100 dark:border-[#1A1A1A] flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
