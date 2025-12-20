'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import React from 'react'
import mermaid from 'mermaid'

interface Diagram {
    id: string
    title: string
    category: string
    description: string
    mermaid: string
    related_entries?: string[]
}

interface DiagramViewerProps {
    diagrams: Diagram[]
    categories: string[]
}

const DiagramViewer: React.FC<DiagramViewerProps> = React.memo(({ diagrams, categories }) => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [expandedDiagram, setExpandedDiagram] = useState<string | null>(null)
    const [fullscreenDiagram, setFullscreenDiagram] = useState<string | null>(null)
    const [zoomLevel, setZoomLevel] = useState<Record<string, number>>({})

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, sans-serif',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            }
        })
    }, [])

    const renderDiagram = useCallback(async (diagram: Diagram, suffix: string = '') => {
        try {
            const elementId = `mermaid-${diagram.id}${suffix}`
            const element = document.getElementById(elementId)
            if (!element) return

            const { svg } = await mermaid.render(`diagram-${diagram.id}${suffix}-${Date.now()}`, diagram.mermaid)
            element.innerHTML = svg
        } catch (error) {
            console.error('Failed to render diagram:', error)
        }
    }, [])

    useEffect(() => {
        if (expandedDiagram) {
            const diagram = diagrams.find(d => d.id === expandedDiagram)
            if (diagram) {
                setTimeout(() => renderDiagram(diagram), 100)
            }
        }
    }, [expandedDiagram, diagrams, renderDiagram])

    useEffect(() => {
        if (fullscreenDiagram) {
            const diagram = diagrams.find(d => d.id === fullscreenDiagram)
            if (diagram) {
                setTimeout(() => renderDiagram(diagram, '-fullscreen'), 100)
            }
        }
    }, [fullscreenDiagram, diagrams, renderDiagram])

    const filteredDiagrams = useMemo(() => {
        return selectedCategory
            ? diagrams.filter(d => d.category === selectedCategory)
            : diagrams
    }, [diagrams, selectedCategory])

    const handleZoom = useCallback((diagramId: string, delta: number) => {
        setZoomLevel(prev => ({
            ...prev,
            [diagramId]: Math.max(0.5, Math.min(2, (prev[diagramId] || 1) + delta))
        }))
    }, [])

    const toggleExpand = useCallback((diagramId: string) => {
        setExpandedDiagram(prev => prev === diagramId ? null : diagramId)
    }, [])

    if (diagrams.length === 0) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Architecture Diagrams</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Interactive Mermaid visualizations</p>
                </div>
                {categories.length > 0 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${!selectedCategory
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                                }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selectedCategory === cat
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Diagrams Grid/List */}
            <div className="space-y-4">
                {filteredDiagrams.map((diagram) => {
                    const isExpanded = expandedDiagram === diagram.id
                    const currentZoom = zoomLevel[diagram.id] || 1

                    return (
                        <div
                            key={diagram.id}
                            className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden transition-all hover:border-purple-500/50"
                        >
                            {/* Diagram Header */}
                            <button
                                onClick={() => toggleExpand(diagram.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{diagram.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{diagram.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md">
                                        {diagram.category}
                                    </span>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Diagram Content */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-[#2A2A2A]">
                                    {/* Controls */}
                                    <div className="p-3 bg-gray-50 dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleZoom(diagram.id, -0.1)}
                                                className="p-2 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded-lg hover:border-purple-500/50 transition-all"
                                                title="Zoom Out"
                                            >
                                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                </svg>
                                            </button>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono min-w-[3rem] text-center">
                                                {Math.round(currentZoom * 100)}%
                                            </span>
                                            <button
                                                onClick={() => handleZoom(diagram.id, 0.1)}
                                                className="p-2 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded-lg hover:border-purple-500/50 transition-all"
                                                title="Zoom In"
                                            >
                                                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleZoom(diagram.id, 1 - currentZoom)}
                                                className="px-3 py-2 text-xs bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded-lg hover:border-purple-500/50 transition-all text-gray-600 dark:text-gray-400"
                                                title="Reset Zoom"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setFullscreenDiagram(diagram.id)}
                                            className="px-3 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                            </svg>
                                            Fullscreen
                                        </button>
                                    </div>

                                    {/* Diagram */}
                                    <div className="p-6 bg-white dark:bg-black overflow-auto max-h-[600px]">
                                        <div
                                            id={`mermaid-${diagram.id}`}
                                            className="flex items-center justify-center transition-transform"
                                            style={{ transform: `scale(${currentZoom})`, transformOrigin: 'center top' }}
                                        />
                                    </div>

                                    {/* Related Entries */}
                                    {diagram.related_entries && diagram.related_entries.length > 0 && (
                                        <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[#2A2A2A]">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Related Documentation</p>
                                            <div className="flex flex-wrap gap-2">
                                                {diagram.related_entries.map((entry, i) => (
                                                    <span key={i} className="text-xs px-2 py-1 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded text-gray-600 dark:text-gray-400">
                                                        {entry}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Fullscreen Modal */}
            {fullscreenDiagram && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white dark:bg-[#0A0A0A] rounded-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between bg-gray-50 dark:bg-[#1A1A1A]">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {diagrams.find(d => d.id === fullscreenDiagram)?.title}
                            </h3>
                            <button
                                onClick={() => setFullscreenDiagram(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-8 bg-white dark:bg-black">
                            <div id={`mermaid-${fullscreenDiagram}-fullscreen`} className="flex items-center justify-center" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
})

DiagramViewer.displayName = 'DiagramViewer'

export default DiagramViewer
