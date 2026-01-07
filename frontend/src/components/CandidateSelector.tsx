'use client'

import { useState, useEffect, useMemo } from 'react'
import { Info, User, FileText, CheckCircle2, Award, Zap, BookOpen, Search, Eye, AlertTriangle } from 'lucide-react'
import { apiUrl, getHeaders } from '@/config/api'
import DetailModal from './DetailModal'

interface Candidate {
  id: string
  name: string
  experience_level: string
  skills: string[]
  language: string
  match_score: number | null
  match_reasoning?: string
  status?: 'ready' | 'pending' | 'loading'
}

interface CandidateSelectorProps {
  positionId: string | null
  userId: string | null
  selectedCandidate: string
  onSelectCandidate: (candidateId: string, resumeText?: string, candidateName?: string, matchScore?: number, matchReasoning?: string) => void
  onShowDetails?: (candidateId: string) => void
}

const experienceLevelColors: Record<string, string> = {
  junior: 'bg-blue-500/20 text-blue-400',
  mid: 'bg-purple-500/20 text-purple-400',
  senior: 'bg-amber-500/20 text-amber-400',
  lead: 'bg-red-500/20 text-red-400',
}

const getMatchScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400 bg-green-500/20'
  if (score >= 60) return 'text-amber-400 bg-amber-500/20'
  if (score >= 40) return 'text-orange-400 bg-orange-500/20'
  return 'text-red-400 bg-red-500/20'
}

export default function CandidateSelector({
  positionId,
  userId,
  selectedCandidate,
  onSelectCandidate,
  onShowDetails
}: CandidateSelectorProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [positionTitle, setPositionTitle] = useState('')
  const [detailCandidateId, setDetailCandidateId] = useState<string | null>(null)

  // Extract tenant from URL for RBAC header
  const params = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
  const tenantSlug = params[2] // /app/tenant-slug/dashboard...

  const detailCandidate = useMemo(() =>
    candidates.find(c => c.id === detailCandidateId),
    [candidates, detailCandidateId]
  )

  useEffect(() => {
    if (!positionId) {
      setCandidates([])
      return
    }

    setLoading(true)
    fetch(apiUrl(`api/positions/${positionId}/candidates`), {
      headers: getHeaders(userId || undefined)
    })
      .then(res => res.json())
      .then(data => {
        const fetchedCandidates = data.candidates || []
        setCandidates(fetchedCandidates)
        setPositionTitle(data.position_title || '')
        setLoading(false)

        // Find the JD text for the selected position to pass to the scoring API
        // This is a bit of a hack, but we need the JD text for the AI to score
        // In a real scenario, the backend would handle this better
        // For now, let's fetch the position details if we have any pending candidates
        if (fetchedCandidates.some((c: Candidate) => c.status === 'pending')) {
          requestAsyncScoring(fetchedCandidates, positionId)
        }
      })
      .catch(err => {
        console.error('Error loading candidates:', err)
        setLoading(false)
      })
  }, [positionId])

  const requestAsyncScoring = async (candList: Candidate[], posId: string) => {
    try {
      // Get JD text first
      const posRes = await fetch(apiUrl(`api/positions`), {
        headers: getHeaders(userId || undefined)
      })
      const posData = await posRes.json()
      const currentPos = (posData.positions || []).find((p: any) => p.id === posId)
      const jdText = currentPos?.jd_text || ""

      if (!jdText) return

      // Process pending candidates one-by-one to avoid overwhelming the LLM
      for (const candidate of candList) {
        if (candidate.status === 'pending') {
          updateCandidateStatus(candidate.id, 'loading')

          fetch(apiUrl(`api/candidates/${candidate.id}/score`), {
            method: 'POST',
            headers: getHeaders(userId || undefined),
            body: JSON.stringify({ jd_text: jdText })
          })
            .then(res => res.json())
            .then(scoreData => {
              updateCandidateScore(candidate.id, scoreData.match_score)
            })
            .catch(err => {
              console.error(`Error scoring candidate ${candidate.id}:`, err)
              updateCandidateStatus(candidate.id, 'ready') // Reset on error
            })
        }
      }
    } catch (err) {
      console.error('Scoring workflow failed:', err)
    }
  }

  const updateCandidateStatus = (id: string, status: 'ready' | 'pending' | 'loading') => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const updateCandidateScore = (id: string, score: number) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, match_score: score, status: 'ready' } : c))
  }

  const handleSelectCandidate = async (candidateId: string) => {
    // Fetch full resume text and analysis when selected
    try {
      const res = await fetch(apiUrl(`api/resumes/${candidateId}`), {
        headers: getHeaders(userId || undefined)
      })
      const resume = await res.json()
      // Find candidate details from local state
      const candidate = candidates.find(c => c.id === candidateId)

      onSelectCandidate(
        candidateId,
        resume.text || "",
        candidate?.name,
        candidate?.match_score || 0,
        resume.match_reasoning || resume.analysis?.explanation || ""
      )
    } catch (err) {
      console.error('Error fetching resume:', err)
      const candidate = candidates.find(c => c.id === candidateId)
      onSelectCandidate(candidateId, undefined, candidate?.name, candidate?.match_score || 0)
    }
  }

  if (!positionId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm">Select a position to see matching candidates</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DetailModal
        isOpen={!!detailCandidateId}
        onClose={() => setDetailCandidateId(null)}
        title={detailCandidate?.name.split(' - ')[0] || 'Candidate Details'}
        subtitle={detailCandidate?.name.split(' - ')[1] || 'Subject Profile'}
        icon={<User className="w-5 h-5 text-[#FF6B35]" />}
      >
        <CandidateDetailContent candidate={detailCandidate} userId={userId} />
      </DetailModal>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
          <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em]">
            Available Talent Pool
          </label>
        </div>
        <div className="flex items-center gap-4">
          {selectedCandidate && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectCandidate('', undefined, undefined); }}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 group"
            >
              <span className="group-hover:translate-x-[-2px] transition-transform">✕</span> Clear Selection
            </button>
          )}
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 uppercase">
            {candidates.length} Match{candidates.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 italic">No domain-relevant candidates found in your pool</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {candidates.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleSelectCandidate(candidate.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group
                ${selectedCandidate === candidate.id
                  ? 'border-[#FF6B35] bg-orange-50/30'
                  : 'border-zinc-100 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${candidate.match_score !== null && candidate.match_score < 40 ? 'opacity-60 saturate-[0.8]' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Candidate Name */}
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold truncate text-sm ${selectedCandidate === candidate.id ? 'text-[#FF6B35]' : 'text-zinc-900'
                      }`}>
                      {candidate.name.split(' - ')[0]}
                    </span>
                  </div>

                  {/* Role/Title */}
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                    {candidate.name.split(' - ')[1] || candidate.language}
                  </p>

                  {/* Skills & Experience */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${experienceLevelColors[candidate.experience_level] || 'bg-gray-100 text-gray-500'
                      }`}>
                      {candidate.experience_level}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 font-bold">
                      {candidate.language}
                    </span>
                  </div>
                </div>

                {/* Match Score & Status */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailCandidateId(candidate.id)
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#FF6B35] transition-colors"
                      title="Candidate details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5 ${candidate.status === 'loading' ? 'bg-zinc-100 text-zinc-400 animate-pulse' : getMatchScoreColor(candidate.match_score || 0)}`}>
                      {candidate.status === 'loading' ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-ping" />
                      ) : null}
                      {candidate.status === 'loading' ? '--%' : (candidate.match_score !== null ? `${candidate.match_score}%` : '--%')}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${candidate.status === 'loading' ? 'text-[#FF6B35] animate-pulse italic' : 'text-zinc-400'}`}>
                    {candidate.status === 'loading' ? 'AI Analyzing...' : 'Match Score'}
                  </span>
                </div>
              </div>

              {/* Selection indicator */}
              {selectedCandidate === candidate.id && (
                <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span className="text-[11px] font-bold text-[#FF6B35] uppercase tracking-wide">Selected for Interview</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-[#FF6B35] animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CandidateDetailContent({ candidate, userId }: { candidate: Candidate | undefined, userId: string | null }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_review'>('overview')
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (candidate?.id) {
      // Helper to get tenant slug again for detail modal
      const params = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
      const tenantSlug = params[2]

      setLoading(true)
      fetch(apiUrl(`api/resumes/${candidate.id}`), {
        headers: getHeaders(userId || undefined)
      })
        .then(res => res.json())
        .then(data => {
          setDetails(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [candidate?.id])

  if (!candidate) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'ai_review', label: 'AI Review', icon: <Search className="w-3.5 h-3.5" /> },
  ]

  const analysis = details?.analysis || {}

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-900/50 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 animate-spin rounded-full" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      <p className="text-sm font-bold text-gray-900 capitalize">{candidate.experience_level}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Core Tech</p>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-bold text-gray-700 font-mono">{candidate.language}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                    Verified Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills?.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs bg-white text-zinc-600 rounded-lg border border-zinc-200 font-medium shadow-sm hover:border-[#FF6B35] transition-colors">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Match Score Indicator */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold text-sm">
                      {candidate.match_score}%
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest leading-none mb-1">Recruitment Match</p>
                      <p className="text-xs font-medium text-gray-500">Based on JD semantic analysis</p>
                    </div>
                  </div>
                  <FileText className="w-5 h-5 text-gray-300" />
                </div>
              </div>
            )}

            {/* AI REVIEW TAB */}
            {activeTab === 'ai_review' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {(analysis.strengths || ['Strong technical foundation', 'Relevant experience']).map((s: string, i: number) => (
                      <li key={i} className="text-sm p-3 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/10 flex gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Gaps / Missing
                  </h4>
                  <ul className="space-y-2">
                    {(analysis.gaps || ['None identified']).map((g: string, i: number) => (
                      <li key={i} className="text-sm p-3 bg-red-500/5 text-red-600 dark:text-red-400 rounded-lg border border-red-500/10 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


