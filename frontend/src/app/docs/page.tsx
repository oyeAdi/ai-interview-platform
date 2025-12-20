'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { apiUrl } from '@/config/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Lazy load DiagramViewer with skeleton
const DiagramViewer = dynamic(() => import('@/components/DiagramViewer'), {
    ssr: false,
    loading: () => (
        <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-100 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl"></div>
            ))}
        </div>
    )
})

export default function DocsPage() {
    const [diagrams, setDiagrams] = useState<any[]>([])
    const [diagramCategories, setDiagramCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    useEffect(() => {
        fetchDiagrams()
    }, [])

    const fetchDiagrams = useCallback(async () => {
        try {
            const res = await fetch(apiUrl('api/wiki/diagrams'))
            const data = await res.json()
            setDiagrams(data.diagrams || [])
            setDiagramCategories(data.categories || [])
        } catch (err) {
            console.error('Failed to fetch diagrams:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const filteredDiagrams = selectedCategory
        ? diagrams.filter(d => d.category === selectedCategory)
        : diagrams

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-[#0A0A0A] flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-6 py-8 max-w-7xl">
                {/* Modern Hero Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                        <span className="text-2xl">📊</span>
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">System Architecture</span>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-3">
                        Technical Documentation
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Interactive architecture diagrams and technical documentation for the entire system
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="group relative overflow-hidden p-6 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                        <div className="absolute top-0 right-0 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">
                            📐
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Diagrams</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white relative z-10">{diagrams.length}</p>
                    </div>
                    <div className="group relative overflow-hidden p-6 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                        <div className="absolute top-0 right-0 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">
                            🏷️
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Categories</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white relative z-10">{diagramCategories.length}</p>
                    </div>
                    <div className="group relative overflow-hidden p-6 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                        <div className="absolute top-0 right-0 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">
                            ⚡
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Interactive</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 relative z-10">100%</p>
                    </div>
                </div>

                {/* Category Filter */}
                {diagramCategories.length > 0 && (
                    <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${!selectedCategory
                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-purple-500/50'
                                }`}
                        >
                            All Diagrams
                        </button>
                        {diagramCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                    : 'bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:border-purple-500/50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Diagrams */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 animate-spin rounded-full"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>
                ) : filteredDiagrams.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No diagrams found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Try selecting a different category</p>
                    </div>
                ) : (
                    <DiagramViewer diagrams={filteredDiagrams} categories={diagramCategories} />
                )}
            </main>

            <Footer />
        </div>
    )
}
