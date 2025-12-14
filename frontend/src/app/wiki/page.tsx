'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { apiUrl } from '@/config/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Dynamic import for Mermaid (no SSR)
const DiagramViewer = dynamic(() => import('@/components/DiagramViewer'), { ssr: false })

interface WikiEntry {
  id: string
  question: string
  answer: string
  category: string
  code_refs: string[]
  keywords: string[]
  created_at: string
  auto_generated: boolean
}

interface Category {
  name: string
  entry_count: number
}

interface WikiStats {
  total_entries: number
  total_queries: number
  cache_hits: number
  llm_calls: number
  cache_hit_rate: number
  last_indexed: string | null
}

interface SemanticIndex {
  synonym_mappings: Record<string, string[]>
  shortform_mappings: Record<string, string>
  topic_aliases: Record<string, string[]>
  version: string
  last_indexed: string
}

export default function WikiPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [entries, setEntries] = useState<WikiEntry[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WikiEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<WikiStats | null>(null)
  const [askQuestion, setAskQuestion] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [askAnswer, setAskAnswer] = useState<any>(null)

  // New states for pagination, sort, and semantic index
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'alpha' | 'category'>('date')
  const [semanticIndex, setSemanticIndex] = useState<SemanticIndex | null>(null)
  const [showSemanticIndex, setShowSemanticIndex] = useState(false)
  const ITEMS_PER_PAGE = 20

  // Diagrams state
  const [diagrams, setDiagrams] = useState<any[]>([])
  const [diagramCategories, setDiagramCategories] = useState<string[]>([])

  // Load persisted askAnswer from localStorage on mount
  useEffect(() => {
    const savedAnswer = localStorage.getItem('wiki_last_answer')
    const savedQuestion = localStorage.getItem('wiki_last_question')
    if (savedAnswer) {
      try {
        setAskAnswer(JSON.parse(savedAnswer))
      } catch (e) { }
    }
    if (savedQuestion) {
      setAskQuestion(savedQuestion)
    }
  }, [])

  // Persist askAnswer to localStorage when it changes
  useEffect(() => {
    if (askAnswer) {
      localStorage.setItem('wiki_last_answer', JSON.stringify(askAnswer))
    }
  }, [askAnswer])

  // Persist askQuestion to localStorage when user types
  useEffect(() => {
    if (askQuestion) {
      localStorage.setItem('wiki_last_question', askQuestion)
    }
  }, [askQuestion])

  useEffect(() => {
    fetchCategories()
    fetchStats()
    fetchSemanticIndex()
    fetchDiagrams()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchEntries(selectedCategory)
    } else {
      fetchEntries()
    }
    setCurrentPage(1) // Reset page when category changes
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/categories'))
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchEntries = async (category?: string) => {
    setLoading(true)
    try {
      const url = category
        ? apiUrl(`api/wiki/entries?category=${encodeURIComponent(category)}&limit=200`)
        : apiUrl('api/wiki/entries?limit=200')
      const res = await fetch(url)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/stats'))
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchSemanticIndex = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/semantic-index'))
      const data = await res.json()
      setSemanticIndex(data)
    } catch (err) {
      console.error('Failed to fetch semantic index:', err)
    }
  }

  const fetchDiagrams = async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/diagrams'))
      const data = await res.json()
      setDiagrams(data.diagrams || [])
      setDiagramCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch diagrams:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(apiUrl(`api/wiki/search?q=${encodeURIComponent(searchQuery)}`))
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!askQuestion.trim()) return

    setAskLoading(true)
    setAskAnswer(null)

    try {
      const res = await fetch(apiUrl('api/wiki/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: askQuestion, category: selectedCategory })
      })
      const data = await res.json()
      setAskAnswer(data)
      setAskQuestion('')
      fetchEntries(selectedCategory || undefined)
      fetchStats()
    } catch (err) {
      console.error('Ask failed:', err)
    } finally {
      setAskLoading(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this wiki entry?')) return

    try {
      await fetch(apiUrl(`api/wiki/entry/${entryId}`), { method: 'DELETE' })
      fetchEntries(selectedCategory || undefined)
      fetchCategories()
      fetchStats()
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  // Sorting and pagination logic
  const baseEntries = searchQuery && searchResults.length > 0 ? searchResults : entries

  const sortedEntries = [...baseEntries].sort((a, b) => {
    switch (sortBy) {
      case 'alpha':
        return a.question.localeCompare(b.question)
      case 'category':
        return a.category.localeCompare(b.category)
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = sortedEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const displayEntries = paginatedEntries

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black dark:text-white mb-2">Codebase Wiki</h1>
          <p className="text-gray-500">AI-powered documentation assistant for understanding the codebase</p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Entries</p>
              <p className="text-2xl font-light text-black dark:text-white">{stats.total_entries}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Categories</p>
              <p className="text-2xl font-light text-black dark:text-white">{categories.length}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Queries</p>
              <p className="text-2xl font-light text-black dark:text-white">{stats.total_queries}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cache Hits</p>
              <p className="text-2xl font-light text-black dark:text-white">{stats.cache_hits}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Hit Rate</p>
              <p className="text-2xl font-light text-[#00E5FF]">{stats.cache_hit_rate}%</p>
            </div>
          </div>
        )}

        {/* Ask Question */}
        <div className="mb-8 p-6 bg-[#00E5FF]/5 border border-[#00E5FF]/20">
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Ask a Question</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="How does candidate matching work? What is the evaluation flow?"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
            />
            <button
              onClick={handleAsk}
              disabled={askLoading || !askQuestion.trim()}
              className="px-6 py-3 bg-[#00E5FF] text-black font-medium hover:bg-[#00E5FF]/90 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {askLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Ask
                </>
              )}
            </button>
          </div>

          {/* Answer Display */}
          {askAnswer && (
            <div className="mt-4 p-4 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 ${askAnswer.source === 'cache' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {askAnswer.source === 'cache' ? 'CACHED' : 'LLM GENERATED'}
                  </span>
                  <span className="text-[10px] text-gray-500">{askAnswer.category}</span>
                </div>
                <button
                  onClick={() => {
                    setAskAnswer(null)
                    setAskQuestion('')
                    localStorage.removeItem('wiki_last_answer')
                    localStorage.removeItem('wiki_last_question')
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear answer"
                >
                  ✕ Clear
                </button>
              </div>
              {askAnswer.question && (
                <p className="text-xs text-gray-500 mb-2 italic">Q: {askAnswer.question}</p>
              )}
              <p className="text-sm text-black dark:text-white leading-relaxed">{askAnswer.answer}</p>
              {askAnswer.followup_suggestion && (
                <button
                  onClick={() => setAskQuestion(askAnswer.followup_suggestion)}
                  className="mt-3 text-xs text-[#00E5FF] hover:underline"
                >
                  💡 {askAnswer.followup_suggestion}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCategory(null); setSearchQuery(''); setSearchResults([]); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${!selectedCategory
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-l-2 border-[#00E5FF]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                    }`}
                >
                  All Entries
                  <span className="float-right text-xs text-gray-400">{stats?.total_entries || 0}</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => { setSelectedCategory(cat.name); setSearchQuery(''); setSearchResults([]); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedCategory === cat.name
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-l-2 border-[#00E5FF]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                      }`}
                  >
                    {cat.name}
                    <span className="float-right text-xs text-gray-400">{cat.entry_count}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="mt-6">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search entries..."
                    className="w-full pl-3 pr-8 py-2 text-sm bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00E5FF]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h2 className="text-lg font-medium text-black dark:text-white">
                {searchQuery ? `Search: "${searchQuery}"` : selectedCategory || 'All Entries'}
              </h2>
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as 'date' | 'alpha' | 'category'); setCurrentPage(1); }}
                  className="text-xs px-2 py-1.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="date">Sort: Newest First</option>
                  <option value="alpha">Sort: A-Z</option>
                  <option value="category">Sort: Category</option>
                </select>
                <span className="text-sm text-gray-500">
                  {sortedEntries.length} entries | Page {currentPage} of {totalPages || 1}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin rounded-full"></div>
              </div>
            ) : displayEntries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-[#2A2A2A]">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <p className="text-gray-500">No entries found</p>
                <p className="text-sm text-gray-400 mt-1">Ask a question above to create wiki entries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 border transition-colors cursor-pointer ${selectedEntry?.id === entry.id
                      ? 'border-[#00E5FF] bg-[#00E5FF]/5'
                      : 'border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-[#3A3A3A]'
                      }`}
                    onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-black dark:text-white mb-1 truncate">
                          {entry.question}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-[#1A1A1A] px-1.5 py-0.5">
                            {entry.category}
                          </span>
                          {entry.auto_generated && (
                            <span className="text-[10px] text-[#00E5FF] bg-[#00E5FF]/10 px-1.5 py-0.5">
                              AI
                            </span>
                          )}
                          {entry.keywords?.slice(0, 3).map((kw) => (
                            <span key={kw} className="text-[10px] text-gray-400">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded Answer */}
                    {selectedEntry?.id === entry.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                        {entry.code_refs && entry.code_refs.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Code References</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.code_refs.map((ref, i) => (
                                <span key={i} className="text-xs text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 font-mono">
                                  {ref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-3">
                          Created: {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white disabled:opacity-40 hover:border-[#00E5FF] transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] text-black dark:text-white disabled:opacity-40 hover:border-[#00E5FF] transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Semantic Index Panel */}
        <div className="mt-8 border border-gray-200 dark:border-[#2A2A2A]">
          <button
            onClick={() => setShowSemanticIndex(!showSemanticIndex)}
            className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-[#0A0A0A] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🧠</span>
              <div className="text-left">
                <p className="text-sm font-medium text-black dark:text-white">Semantic Index v{semanticIndex?.version || '...'}</p>
                <p className="text-xs text-gray-500">Synonym mappings, shortforms, and patterns for smart search</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showSemanticIndex ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSemanticIndex && semanticIndex && (
            <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] space-y-4">
              {/* Synonym Mappings */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Synonym Mappings ({Object.keys(semanticIndex.synonym_mappings).length})</h4>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {Object.entries(semanticIndex.synonym_mappings).map(([key, values]) => (
                    <div key={key} className="text-xs bg-gray-100 dark:bg-[#1A1A1A] px-2 py-1 rounded">
                      <span className="font-medium text-[#00E5FF]">{key}</span>
                      <span className="text-gray-500"> → </span>
                      <span className="text-gray-600 dark:text-gray-400">{values.slice(0, 4).join(', ')}{values.length > 4 ? '...' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortform Mappings */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shortform Mappings ({Object.keys(semanticIndex.shortform_mappings).length})</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(semanticIndex.shortform_mappings).map(([short, full]) => (
                    <div key={short} className="text-xs bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-1 rounded">
                      <span className="font-mono font-medium">{short}</span>
                      <span className="text-gray-500"> = </span>
                      <span>{full}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic Aliases */}
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Topic Aliases ({Object.keys(semanticIndex.topic_aliases).length})</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(semanticIndex.topic_aliases).map(([topic, aliases]) => (
                    <div key={topic} className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">
                      <span className="font-medium">"{topic}"</span>
                      <span className="text-gray-500"> → </span>
                      <span>{aliases.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Indexed */}
              <p className="text-[10px] text-gray-400">
                Last indexed: {semanticIndex.last_indexed ? new Date(semanticIndex.last_indexed).toLocaleString() : 'Never'}
              </p>
            </div>
          )}
        </div>

        {/* Architecture Diagrams */}
        {diagrams.length > 0 && (
          <DiagramViewer diagrams={diagrams} categories={diagramCategories} />
        )}
      </main>

      <Footer />
    </div>
  )
}


