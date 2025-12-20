'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { apiUrl } from '@/config/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SkeletonStats from '@/components/SkeletonStats'
import SkeletonCategories from '@/components/SkeletonCategories'
import SkeletonEntries from '@/components/SkeletonEntries'

// Lazy load heavy components
const DiagramViewer = dynamic(() => import('@/components/DiagramViewer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 dark:bg-[#0A0A0A] animate-pulse rounded-lg"></div>
})

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

export default function WikiPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [entries, setEntries] = useState<WikiEntry[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<WikiStats | null>(null)
  const [askQuestion, setAskQuestion] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  const [askAnswer, setAskAnswer] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'date' | 'alpha' | 'category'>('date')
  const [showDiagrams, setShowDiagrams] = useState(false)
  const [diagrams, setDiagrams] = useState<any[]>([])
  const ITEMS_PER_PAGE = 10 // Reduced from 20

  // Load only essential data on mount
  useEffect(() => {
    fetchCategories()
    // Load stats in background
    setTimeout(() => fetchStats(), 100)
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchEntries(selectedCategory)
    } else {
      fetchEntries()
    }
    setCurrentPage(1)
  }, [selectedCategory])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/categories'))
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  const fetchEntries = useCallback(async (category?: string) => {
    setLoading(true)
    try {
      const url = category
        ? apiUrl(`api/wiki/entries?category=${encodeURIComponent(category)}&limit=50`)
        : apiUrl('api/wiki/entries?limit=50')
      const res = await fetch(url)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('api/wiki/stats'))
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [])

  const fetchDiagrams = useCallback(async () => {
    if (diagrams.length > 0) return // Already loaded
    try {
      const res = await fetch(apiUrl('api/wiki/diagrams'))
      const data = await res.json()
      setDiagrams(data.diagrams || [])
    } catch (err) {
      console.error('Failed to fetch diagrams:', err)
    }
  }, [diagrams.length])

  const handleAsk = useCallback(async () => {
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
  }, [askQuestion, selectedCategory, fetchEntries, fetchStats])

  const handleDeleteEntry = useCallback(async (entryId: string) => {
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
  }, [selectedCategory, selectedEntry, fetchEntries, fetchCategories, fetchStats])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
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
  }, [entries, sortBy])

  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE)
  const paginatedEntries = useMemo(() => {
    return sortedEntries.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  }, [sortedEntries, currentPage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-[#0A0A0A] flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Modern Hero Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-full mb-4">
            <span className="text-2xl">🧠</span>
            <span className="text-sm font-medium text-[#00E5FF]">AI-Powered Knowledge Base</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-3">
            Codebase Wiki
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Intelligent documentation assistant that learns from your codebase and provides instant answers
          </p>
        </div>

        {/* Stats Bar */}
        {!stats ? (
          <SkeletonStats />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Entries', value: stats.total_entries, icon: '📚', color: 'blue' },
              { label: 'Categories', value: categories.length, icon: '🏷️', color: 'purple' },
              { label: 'Queries', value: stats.total_queries, icon: '🔍', color: 'green' },
              { label: 'Cache Hits', value: stats.cache_hits, icon: '⚡', color: 'yellow' },
              { label: 'Hit Rate', value: `${stats.cache_hit_rate}%`, icon: '🎯', color: 'cyan' }
            ].map((stat, i) => (
              <div key={i} className="group relative overflow-hidden p-5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:border-[#00E5FF]/50 transition-all hover:shadow-lg hover:shadow-[#00E5FF]/10">
                <div className="absolute top-0 right-0 text-6xl opacity-5 group-hover:opacity-10 transition-opacity">
                  {stat.icon}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white relative z-10">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Ask Question - Modern Card */}
        <div className="mb-8 p-6 bg-gradient-to-br from-[#00E5FF]/5 to-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#00E5FF] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ask a Question</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get instant answers from the AI knowledge base</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="How does candidate matching work? What is the evaluation flow?"
              className="flex-1 px-4 py-3 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent transition-all"
            />
            <button
              onClick={handleAsk}
              disabled={askLoading || !askQuestion.trim()}
              className="px-6 py-3 bg-[#00E5FF] text-black font-semibold rounded-xl hover:bg-[#00D5EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-[#00E5FF]/20"
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
            <div className="mt-4 p-5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${askAnswer.source === 'cache' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
                    {askAnswer.source === 'cache' ? '⚡ CACHED' : '🤖 AI GENERATED'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{askAnswer.category}</span>
                </div>
                <button
                  onClick={() => setAskAnswer(null)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
              <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{askAnswer.answer}</p>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          {loading && !categories.length ? (
            <SkeletonCategories />
          ) : (
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-4 space-y-6">
                {/* Categories */}
                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all ${!selectedCategory
                        ? 'bg-[#00E5FF] text-black font-medium shadow-lg shadow-[#00E5FF]/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>All Entries</span>
                        <span className="text-xs opacity-60">{stats?.total_entries || 0}</span>
                      </div>
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all ${selectedCategory === cat.name
                          ? 'bg-[#00E5FF] text-black font-medium shadow-lg shadow-[#00E5FF]/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize">{cat.name.replace('_', ' ')}</span>
                          <span className="text-xs opacity-60">{cat.entry_count}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
                  <button
                    onClick={() => {
                      setShowDiagrams(!showDiagrams)
                      if (!showDiagrams) fetchDiagrams()
                    }}
                    className="w-full px-3 py-2.5 text-sm text-left bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span className="text-gray-900 dark:text-white font-medium">View Diagrams</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-200 dark:border-[#2A2A2A] flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedCategory ? selectedCategory.replace('_', ' ') : 'All Entries'}
                </h2>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
                  >
                    <option value="date">Newest First</option>
                    <option value="alpha">A-Z</option>
                    <option value="category">By Category</option>
                  </select>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {sortedEntries.length} entries
                  </span>
                </div>
              </div>

              {/* Entries */}
              <div className="p-5">
                {loading ? (
                  <SkeletonEntries />
                ) : paginatedEntries.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No entries found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Ask a question above to create wiki entries</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`group p-4 border rounded-xl transition-all cursor-pointer ${selectedEntry?.id === entry.id
                          ? 'border-[#00E5FF] bg-[#00E5FF]/5 shadow-lg shadow-[#00E5FF]/10'
                          : 'border-gray-200 dark:border-[#2A2A2A] hover:border-[#00E5FF]/50 hover:shadow-md'
                          }`}
                        onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                              {entry.question}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 rounded-md">
                                {entry.category}
                              </span>
                              {entry.auto_generated && (
                                <span className="text-xs px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] rounded-md font-medium">
                                  AI
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {selectedEntry?.id === entry.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2A]">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {entry.answer}
                            </p>
                            {entry.code_refs && entry.code_refs.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {entry.code_refs.map((ref, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] rounded font-mono">
                                    {ref}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-[#2A2A2A]">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white disabled:opacity-40 hover:border-[#00E5FF] transition-all"
                    >
                      ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white disabled:opacity-40 hover:border-[#00E5FF] transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diagrams Section */}
        {showDiagrams && diagrams.length > 0 && (
          <div className="mt-8">
            <DiagramViewer diagrams={diagrams} categories={[]} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
