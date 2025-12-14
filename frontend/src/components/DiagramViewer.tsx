'use client'

import { useEffect, useState } from 'react'
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

export default function DiagramViewer({ diagrams, categories }: DiagramViewerProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null)
    const [svgContent, setSvgContent] = useState<string>('')
    const [isRendering, setIsRendering] = useState(false)
    const [renderKey, setRenderKey] = useState(0)

    // Initialize mermaid
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            flowchart: {
                useMaxWidth: false, // Allow full width
                htmlLabels: true,
                curve: 'basis'
            }
        })
    }, [])

    // Filter diagrams by category
    const filteredDiagrams = selectedCategory === 'all'
        ? diagrams
        : diagrams.filter(d => d.category === selectedCategory)

    // Select first diagram if none selected
    useEffect(() => {
        if (filteredDiagrams.length > 0 && !selectedDiagram) {
            setSelectedDiagram(filteredDiagrams[0])
        }
    }, [filteredDiagrams, selectedDiagram])

    // Render mermaid diagram to SVG string
    useEffect(() => {
        const renderDiagram = async () => {
            if (selectedDiagram) {
                setIsRendering(true)
                setSvgContent('')
                try {
                    // Use unique ID with timestamp to avoid conflicts
                    const uniqueId = `mermaid-${selectedDiagram.id}-${Date.now()}`
                    const { svg } = await mermaid.render(uniqueId, selectedDiagram.mermaid)
                    setSvgContent(svg)
                    setRenderKey(prev => prev + 1)
                } catch (error) {
                    console.error('Mermaid render error:', error)
                    setSvgContent(`<pre style="color: #ff6b6b; font-size: 12px;">${selectedDiagram.mermaid}</pre>`)
                }
                setIsRendering(false)
            }
        }
        renderDiagram()
    }, [selectedDiagram])

    return (
        <div className="border border-gray-200 dark:border-[#2A2A2A] mt-8">
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#2A2A2A]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📊</span>
                        <div>
                            <h3 className="text-sm font-medium text-black dark:text-white">Architecture Diagrams</h3>
                            <p className="text-xs text-gray-500">{diagrams.length} diagrams • Interactive Mermaid visualizations</p>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 text-xs transition-colors ${selectedCategory === 'all'
                                ? 'bg-[#00E5FF] text-black'
                                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                                }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setSelectedCategory(cat); setSelectedDiagram(null); }}
                                className={`px-3 py-1 text-xs transition-colors ${selectedCategory === cat
                                    ? 'bg-[#00E5FF] text-black'
                                    : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 min-h-[600px]">
                {/* Diagram List Sidebar */}
                <div className="w-64 border-r border-gray-200 dark:border-[#2A2A2A] overflow-y-auto bg-gray-50/50 dark:bg-[#0A0A0A]/50">
                    {filteredDiagrams.map(diagram => (
                        <button
                            key={diagram.id}
                            onClick={() => setSelectedDiagram(diagram)}
                            className={`w-full text-left p-4 border-b border-gray-100 dark:border-[#1A1A1A] transition-colors ${selectedDiagram?.id === diagram.id
                                ? 'bg-[#00E5FF]/10 border-l-4 border-l-[#00E5FF]'
                                : 'hover:bg-gray-100 dark:hover:bg-[#1A1A1A] border-l-4 border-l-transparent'
                                }`}
                        >
                            <p className="text-sm font-medium text-black dark:text-white truncate">{diagram.title}</p>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{diagram.category}</p>
                        </button>
                    ))}
                </div>

                {/* Diagram Viewer */}
                <div className="flex-1 p-6 flex flex-col bg-[#050505]">
                    {selectedDiagram ? (
                        <>
                            {/* Diagram Header */}
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <h4 className="text-2xl font-light text-white mb-2">{selectedDiagram.title}</h4>
                                    <p className="text-gray-400 font-light">{selectedDiagram.description}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-xs border border-gray-700">
                                    {selectedDiagram.category}
                                </span>
                            </div>

                            {/* Mermaid Diagram */}
                            <div
                                key={renderKey}
                                className="flex-1 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A] p-8 overflow-auto flex items-center justify-center min-h-[500px]"
                            >
                                {isRendering ? (
                                    <div className="flex flex-col items-center gap-4 text-gray-400">
                                        <div className="w-8 h-8 border-4 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin rounded-full"></div>
                                        <span className="text-sm font-light tracking-wide">RENDERING DIAGRAM...</span>
                                    </div>
                                ) : svgContent ? (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        dangerouslySetInnerHTML={{ __html: svgContent }}
                                        style={{ transform: 'scale(1)', transformOrigin: 'center' }}
                                    />
                                ) : null}
                            </div>

                            {/* Related Wiki Entries */}
                            {selectedDiagram.related_entries && selectedDiagram.related_entries.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-[#2A2A2A]">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Related Documentation</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDiagram.related_entries.map(entry => (
                                            <span key={entry} className="text-xs bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10 text-[#00E5FF] px-3 py-1.5 rounded transition-colors cursor-default border border-[#00E5FF]/20">
                                                {entry}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <span className="text-4xl mb-4">📊</span>
                            <p className="font-light">Select a diagram from the sidebar to begin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
