'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { apiUrl } from '@/config/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Dynamic import for Mermaid (no SSR)
const DiagramViewer = dynamic(() => import('@/components/DiagramViewer'), { ssr: false })

export default function DocsPage() {
    const [diagrams, setDiagrams] = useState<any[]>([])
    const [diagramCategories, setDiagramCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDiagrams()
    }, [])

    const fetchDiagrams = async () => {
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
    }

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black font-sans selection:bg-[#00E5FF]/20">
            <Header />

            <main className="flex-grow container mx-auto px-6 py-6 max-w-[95%] flex flex-col">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1 text-black dark:text-white">Documentation</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        System architecture diagrams and technical documentation.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin rounded-full"></div>
                    </div>
                ) : (
                    <DiagramViewer diagrams={diagrams} categories={diagramCategories} />
                )}
            </main>

            <Footer />
        </div>
    )
}
