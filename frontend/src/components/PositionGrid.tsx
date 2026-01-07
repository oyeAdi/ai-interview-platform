'use client'

import { useState, useMemo, useEffect } from 'react'
import { Info, Briefcase, Calendar, FileText, CheckCircle2, Target, Clock, Trophy } from 'lucide-react'
import SearchBar from './SearchBar'
import FilterChips from './FilterChips'
import PositionCard from './PositionCard'
import DetailModal from './DetailModal'
import { apiUrl } from '@/config/api'

interface Skill {
  skill: string
  proficiency: string
  weight: number
}

interface DataModel {
  duration_minutes: number
  experience_level: string
  expectations: string
  required_skills: Skill[]
  interview_flow?: string[]
}

interface Position {
  id: string
  title: string
  account_id: string
  status: string
  created_at: string
  data_model: DataModel
  jd_text?: string
}

interface PositionGridProps {
  positions: Position[]
  selectedPosition: string
  onSelectPosition: (id: string) => void
  onAddPosition: () => void
  accountName?: string
  loading?: boolean
}

const FILTERS = [
  {
    id: 'status',
    label: 'Status',
    type: 'single' as const,
    options: [
      { id: 'open', label: 'Open' },
      { id: 'closed', label: 'Closed' },
      { id: 'on_hold', label: 'On Hold' }
    ]
  },
  {
    id: 'level',
    label: 'Level',
    type: 'multi' as const,
    options: [
      { id: 'junior', label: 'Junior' },
      { id: 'mid', label: 'Mid' },
      { id: 'senior', label: 'Senior' },
      { id: 'lead', label: 'Lead' }
    ]
  },
  {
    id: 'sort',
    label: 'Sort',
    type: 'single' as const,
    options: [
      { id: 'recent', label: 'Most Recent' },
      { id: 'oldest', label: 'Oldest First' },
      { id: 'title', label: 'A-Z' }
    ]
  }
]

const INITIAL_DISPLAY = 8
const LOAD_MORE_COUNT = 4

export default function PositionGrid({
  positions,
  selectedPosition,
  onSelectPosition,
  onAddPosition,
  accountName,
  loading = false
}: PositionGridProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [], // Show all positions by default
    level: [],
    sort: ['recent']
  })
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY)
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({})
  const [detailPositionId, setDetailPositionId] = useState<string | null>(null)

  const detailPosition = useMemo(() =>
    positions.find(p => p.id === detailPositionId),
    [positions, detailPositionId]
  )

  // Reset visible count when filters/search change
  useEffect(() => {
    setVisibleCount(INITIAL_DISPLAY)
  }, [search, filters])

  // Fetch candidate counts for positions (only count matched candidates)
  useEffect(() => {
    const fetchCandidateCounts = async () => {
      const counts: Record<string, number> = {}
      for (const position of positions) {
        try {
          const res = await fetch(apiUrl(`api/positions/${position.id}/candidates`))
          const data = await res.json()
          // Only count candidates with meaningful match (score >= 30%)
          const matchedCount = data.candidates?.filter((c: { match_score: number }) => c.match_score >= 30).length || 0
          counts[position.id] = matchedCount
        } catch {
          counts[position.id] = 0
        }
      }
      setCandidateCounts(counts)
    }

    if (positions.length > 0) {
      fetchCandidateCounts()
    }
  }, [positions])

  const handleFilterChange = (filterId: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [filterId]: values }))
  }

  const clearFilters = () => {
    setFilters({
      status: [],
      level: [],
      sort: ['recent']
    })
    setSearch('')
  }

  // Filter and sort positions
  const filteredPositions = useMemo(() => {
    let result = [...positions]

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        (p.data_model?.required_skills || []).some(s => s.skill.toLowerCase().includes(searchLower))
      )
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter(p => filters.status.includes(p.status))
    }

    // Level filter
    if (filters.level.length > 0) {
      result = result.filter(p => filters.level.includes(p.data_model?.experience_level || 'unknown'))
    }

    // Sort
    const sortBy = filters.sort[0] || 'recent'
    result.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title':
          return (a.title || '').localeCompare(b.title || '')
        default:
          return 0
      }
    })

    return result
  }, [positions, search, filters])

  // Limit display - start with 8, load 4 more each time
  const displayedPositions = filteredPositions.slice(0, visibleCount)
  const hasMore = filteredPositions.length > visibleCount
  const remainingCount = filteredPositions.length - visibleCount

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search, Filters, and Add */}
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search positions, skills..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <button
            type="button"
            onClick={onAddPosition}
            className="flex items-center gap-2 px-4 py-3 text-sm text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        </div>

        {/* Filter Chips */}
        <FilterChips
          filters={FILTERS}
          selectedFilters={filters}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {filteredPositions.length === positions.length
            ? `${positions.length} positions`
            : `Showing ${filteredPositions.length} of ${positions.length} positions`
          }
          {accountName && <span className="text-gray-400"> for {accountName}</span>}
        </span>
      </div>

      {/* Position Grid */}
      {filteredPositions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-[#2A2A2A]">
          {search || filters.status.length > 0 || filters.level.length > 0 ? (
            <>
              <p>No positions match your filters</p>
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-[#00E5FF] hover:underline"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <p>No positions yet. Add your first position to get started.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedPositions.map(position => (
              <PositionCard
                key={position.id}
                position={position}
                isSelected={selectedPosition === position.id}
                onSelect={onSelectPosition}
                onShowDetails={setDetailPositionId}
                candidateCount={candidateCounts[position.id]}
              />
            ))}
          </div>

          {/* Position Detail Modal */}
          <DetailModal
            isOpen={!!detailPositionId}
            onClose={() => setDetailPositionId(null)}
            title={detailPosition?.title || 'Position Details'}
            subtitle="Job Configuration"
            icon={<Target className="w-5 h-5" />}
          >
            <div className="space-y-8">
              {/* JD Section */}
              {detailPosition?.jd_text && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Job Description
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#080808] p-5 rounded-xl border border-gray-100 dark:border-[#1A1A1A] whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar font-medium">
                    {detailPosition.jd_text?.replace(/\\n/g, '\n')}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5" />
                  Required Expertise
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailPosition?.data_model?.required_skills?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#1A1A1A]">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.skill?.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 uppercase">{s.proficiency}</span>
                    </div>
                  ))}
                  {(!detailPosition?.data_model?.required_skills || detailPosition.data_model.required_skills.length === 0) && (
                    <p className="text-xs text-gray-500 italic py-2">No skills specified for this position.</p>
                  )}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-[#1A1A1A] pt-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {detailPosition?.data_model?.duration_minutes || 0}m
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 capitalize">
                    <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                    {detailPosition?.data_model?.experience_level || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {detailPosition && new Date(detailPosition.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </DetailModal>

          {/* Show More Button */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                className="text-sm text-[#00E5FF] hover:underline transition-colors"
              >
                Show {Math.min(LOAD_MORE_COUNT, remainingCount)} more ↓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

