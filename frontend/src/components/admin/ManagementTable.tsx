'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, MoreVertical } from 'lucide-react'

interface Column<T> {
    header: string
    accessor: keyof T | ((item: T) => React.ReactNode)
    className?: string
}

interface ManagementTableProps<T> {
    data: T[]
    columns: Column<T>[]
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onAction?: (item: T) => void
    actionLabel?: string
    loading?: boolean
}

export function ManagementTable<T extends { id: string | number }>({
    data,
    columns,
    onEdit,
    onDelete,
    onAction,
    actionLabel = 'Manage',
    loading = false
}: ManagementTableProps<T>) {
    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="border-b border-white/10">
                    <tr className="text-left text-sm text-gray-400">
                        {columns.map((col, idx) => (
                            <th key={idx} className={`pb-4 font-semibold ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete || onAction) && (
                            <th className="pb-4 font-semibold text-right">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="py-12 text-center text-gray-500 italic">
                                No records found.
                            </td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                {columns.map((col, idx) => (
                                    <td key={idx} className={`py-4 ${col.className || ''}`}>
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                                {(onEdit || onDelete || onAction) && (
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onAction && (
                                                <button
                                                    onClick={() => onAction(item)}
                                                    className="text-primary hover:text-primary/80 text-sm font-medium mr-2"
                                                >
                                                    {actionLabel}
                                                </button>
                                            )}
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(item)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
