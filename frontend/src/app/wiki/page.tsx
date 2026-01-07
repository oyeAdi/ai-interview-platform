'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import mermaid from 'mermaid'
import { Search, Book, ChevronRight, ChevronDown, RefreshCw, Hash, Menu, X, Send, Sparkles, FileText, Share, Moon, Edit, Terminal } from 'lucide-react'
import { apiUrl } from '@/config/api'
import Link from 'next/link'
import EditWikiModal from '@/components/EditWikiModal'

// --- Configuration ---
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
})

// --- Types ---
interface WikiEntry {
  id: string
  pattern: string
  decision_context: string
  category: string
  updated_at: string
  code_refs?: string[]
}

interface GroupedEntries {
  [category: string]: WikiEntry[]
}

// --- Helper Components ---

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(false)
  const id = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, [])

  useEffect(() => {
    mermaid.render(id, chart).then(({ svg }) => {
      setSvg(svg)
      setError(false)
    }).catch((e) => {
      console.warn("Mermaid diagram failed to render:", e.message)
      setError(true)
    })
  }, [chart, id])

  if (error) {
    return (
      <div className="my-6 p-4 bg-gray-100 dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Diagram Syntax Error</span>
        </div>
        <details className="text-xs text-gray-500 dark:text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">View diagram source</summary>
          <pre className="mt-2 p-2 bg-white dark:bg-[#0A0A0A] rounded border border-gray-200 dark:border-[#222] overflow-x-auto">{chart}</pre>
        </details>
      </div>
    )
  }

  return <div className="mermaid-wrapper my-6 flex justify-center bg-[#0A0A0A] p-4 rounded-xl border border-[#222]" dangerouslySetInnerHTML={{ __html: svg }} />
}

export default function WikiPage() {
  // --- State ---
  const [entries, setEntries] = useState<WikiEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({})
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Scroll ref for auto-scroll
  const contentEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    if (selectedEntryId) setMobileMenuOpen(false)
  }, [selectedEntryId])

  // --- Data Fetching ---
  const fetchContent = async () => {
    try {
      setLoading(true)
      const res = await fetch(apiUrl('api/wiki/entries?limit=50'))
      const data = await res.json()
      const allEntries: WikiEntry[] = data.entries || []
      setEntries(allEntries)

      const grouped: GroupedEntries = {}
      allEntries.forEach(entry => {
        const cat = entry.category || 'Uncategorized'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(entry)
      })
      setGroupedEntries(grouped)
      setExpandedCategories(new Set(Object.keys(grouped)))

      if (allEntries.length > 0 && !selectedEntryId) {
        const overview = allEntries.find(e => e.pattern.toLowerCase().includes('overview') || e.pattern.toLowerCase().includes('readme'))
        setSelectedEntryId(overview ? overview.id : allEntries[0].id)
      }
    } catch (err) {
      console.error("Failed to load wiki:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAskAI = async () => {
    if (!searchQuery.trim()) return
    setIsAsking(true)
    setAiResponse(null)

    try {
      const res = await fetch(apiUrl('api/wiki/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: searchQuery })
      })
      const data = await res.json()
      setAiResponse(data.answer)
      setTimeout(() => contentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      setAiResponse("Sorry, I couldn't reach the knowledge base.")
    } finally {
      setIsAsking(false)
    }
  }

  const handleScan = async () => {
    setToast({ msg: "Initiating SwarmWiki Scan...", type: 'success' })
    try {
      await fetch(apiUrl('api/wiki/scan'), { method: 'POST' })
      setToast({ msg: "Scan running. Analyzing codebase...", type: 'success' })
      setTimeout(fetchContent, 5000)
    } catch (e) {
      setToast({ msg: "Scan failed to trigger.", type: 'error' })
    }
  }

  const activeEntry = useMemo(() => entries.find(e => e.id === selectedEntryId), [entries, selectedEntryId])

  const activeTOC = useMemo(() => {
    if (!activeEntry) return []
    const lines = (activeEntry.decision_context || '').split('\n')
    const toc = []
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        toc.push({
          level: match[1].length,
          text: match[2].trim(),
          slug: match[2].trim().toLowerCase().replace(/[^\w]+/g, '-')
        })
      }
    }
    return toc
  }, [activeEntry])


  // --- Components ---

  const TOC = () => (
    <div className="hidden xl:block w-72 flex-shrink-0 h-[calc(100vh-64px)] sticky top-20 pl-8 pr-6 pt-4 overflow-y-auto custom-scrollbar">

      {/* Refresh Logic from Screenshot */}
      <div className="mb-6 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg p-3 relative">
        <button onClick={() => setToast({ msg: 'Wiki refreshed.', type: 'success' })} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-3 h-3 text-gray-500" />
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-200">Refresh this wiki</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">This wiki was recently refreshed. Please wait 5 days to refresh again.</p>
      </div>

      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-4">On this page</h4>
      <div className="space-y-3 relative border-l border-gray-200 dark:border-gray-800 ml-1.5">
        {activeTOC.map((item, i) => (
          <a
            key={i}
            href={`#${item.slug}`}
            className={`block text-[13px] hover:text-[#00E5FF] transition-colors line-clamp-1 border-l-2 -ml-[1px] pl-4 py-0.5 ${item.level === 3 ? 'ml-4 border-transparent text-gray-500' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
          >
            {item.text}
          </a>
        ))}
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#FAFAFA] dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-[#2A2A2A]">
      {/* Last Indexed Metadata */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-4">Last indexed: {new Date().toLocaleDateString()} (1cd324)</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
        {Object.entries(groupedEntries).sort().map(([category, items]) => (
          <div key={category} className="mb-4">
            {/* Category Header */}
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {category}
            </div>

            <div className="space-y-[1px]">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedEntryId(item.id)}
                  className={`w-full text-left py-1.5 px-3 text-[13px] rounded-md transition-all flex items-center justify-between group ${selectedEntryId === item.id
                    ? 'bg-gray-200 dark:bg-[#222] text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#151515] hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="truncate">{item.pattern.replace('Docs: ', '')}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] flex flex-col font-sans overflow-hidden text-gray-900 dark:text-gray-100">

      {/* --- SwarmHire-Themed Header --- */}
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-black sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-black dark:text-white">
              Swarm<span className="text-brand-primary">Hire</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-[#2A2A2A] pl-3 ml-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">/ SwarmWiki</span>
          </div>
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={handleScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#111] text-xs font-medium transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Codebase
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-[#2A2A2A] hover:bg-gray-50 dark:hover:bg-[#111] text-xs font-medium transition-colors text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Wiki
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              setToast({ msg: 'Link copied to clipboard', type: 'success' })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-medium transition-colors shadow-sm"
          >
            <Share className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </header>

      {/* Edit Wiki Modal Connection */}
      <EditWikiModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      {toast && (
        <div className={`fixed top-20 right-8 z-50 px-4 py-3 rounded-lg shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
          {toast.type === 'success' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <div className="flex-1 flex max-w-full overflow-hidden h-[calc(100vh-56px)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 border-r border-gray-200 dark:border-[#2A2A2A]">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-white dark:bg-[#050505] overflow-y-auto relative custom-scrollbar">
          {activeEntry ? (
            <div className="max-w-[900px] mx-auto px-8 py-10 pb-40">
              {/* Title */}
              <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white tracking-tight">
                {activeEntry.pattern.replace('Docs: ', '')}
              </h1>

              {/* Relevant Source Files (Mock for Visual Parity) */}
              <div className="mb-10 rounded-lg border border-gray-200 dark:border-[#222] bg-gray-50/50 dark:bg-[#111]/50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-[#222] flex items-center gap-2 text-xs font-medium text-gray-500">
                  <ChevronRight className="w-3.5 h-3.5" />
                  Relevant source files
                </div>
                {/* Only show if we have code refs */}
                {activeEntry.code_refs && activeEntry.code_refs.length > 0 && (
                  <div className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                    {activeEntry.code_refs.map(ref => (
                      <div key={ref} className="flex items-center gap-2 py-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>{ref}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none prose-h1:text-2xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-p:text-[15px] prose-p:leading-7 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-code:text-[#00E5FF] prose-code:bg-transparent prose-pre:bg-[#0A0A0A] prose-pre:border prose-pre:border-[#222]">
                <ReactMarkdown
                  components={{
                    h1: ({ children, ...props }) => <h2 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')} {...props}>{children}</h2>,
                    h2: ({ children, ...props }) => <h3 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')} {...props}>{children}</h3>,
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const codeString = String(children).replace(/\n$/, '')

                      if (match && match[1] === 'mermaid') {
                        return <MermaidDiagram chart={codeString} />
                      }

                      return match ? (
                        <div className="relative group rounded-xl overflow-hidden my-6 border border-[#222]">
                          <div className="absolute top-0 right-0 px-3 py-1 bg-[#111] text-[10px] text-gray-500 uppercase tracking-widest font-mono border-bl border-l border-b border-[#222] rounded-bl-lg">
                            {match[1]}
                          </div>
                          <div className="bg-[#0A0A0A] p-4 overflow-x-auto text-sm font-mono text-gray-300">
                            {children}
                          </div>
                        </div>
                      ) : (
                        <code className="bg-gray-100 dark:bg-[#151515] px-1.5 py-0.5 rounded text-[13px] font-mono text-[#00E5FF]" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {activeEntry.decision_context}
                </ReactMarkdown>
              </div>

              {/* AI Response Block (In-Context) */}
              {aiResponse && (
                <div ref={contentEndRef} className="mt-12 p-6 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                    Answer from SwarmAI
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty State (Search Focused)
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-3xl flex items-center justify-center mb-8">
                <Book className="w-10 h-10 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Wiki Overview</h1>
              <p className="text-gray-500 mb-8">Select a document from the sidebar to view details.</p>
            </div>
          )}

          {/* Persistent Floating Ask Bar (Exact Match Style) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[800px] px-6 z-20">
            <div className="bg-[#F9F9F9]/80 dark:bg-[#1A1A1A]/80 backdrop-blur-xl border border-gray-200 dark:border-[#333] p-1.5 pl-4 rounded-xl shadow-2xl flex items-center gap-2 transition-all group focus-within:ring-2 focus-within:ring-gray-200 dark:focus-within:ring-[#444]">
              <input
                id="ask-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask SwarmAI about swarmhire/platform..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 text-gray-900 dark:text-white h-10"
                autoComplete="off"
              />

              {/* Fast Dropdown Imitation */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs font-medium text-gray-500">
                <Sparkles className="w-3 h-3" />
                <span>Fast</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </div>

              <button
                onClick={handleAskAI}
                disabled={!searchQuery || isAsking}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 text-gray-400"
              >
                {isAsking ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent animate-spin rounded-full" /> : <div className="w-6 h-6 flex items-center justify-center bg-transparent"><ChevronRight className="w-4 h-4" /></div>}
              </button>
            </div>
          </div>
        </main>

        {/* Right TOC Sidebar */}
        {activeEntry && <TOC />}
      </div>
    </div>
  )
}
