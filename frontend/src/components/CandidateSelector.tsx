'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'

interface Candidate {
  id: string
  name: string
  experience_level: string
  skills: string[]
  language: string
  match_score: number
}

interface CandidateSelectorProps {
  positionId: string | null
  selectedCandidate: string
  onSelectCandidate: (candidateId: string, resumeText?: string) => void
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
  selectedCandidate,
  onSelectCandidate
}: CandidateSelectorProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [positionTitle, setPositionTitle] = useState('')

  useEffect(() => {
    if (!positionId) {
      setCandidates([])
      return
    }

    setLoading(true)
    fetch(apiUrl(`api/positions/${positionId}/candidates`))
      .then(res => res.json())
      .then(data => {
        setCandidates(data.candidates || [])
        setPositionTitle(data.position_title || '')
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading candidates:', err)
        setLoading(false)
      })
  }, [positionId])

  const handleSelectCandidate = async (candidateId: string) => {
    // Fetch full resume text when selected
    try {
      const res = await fetch(apiUrl(`api/resumes/${candidateId}`))
      const resume = await res.json()
      onSelectCandidate(candidateId, resume.text)
    } catch (err) {
      console.error('Error fetching resume:', err)
      onSelectCandidate(candidateId)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin"></div>
      </div>
    )
  }

  // Filter candidates with match score >= 50%
  const filteredCandidates = candidates.filter(c => c.match_score >= 50)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-500 uppercase tracking-wide">
          Matching Candidates
        </label>
        <span className="text-xs text-gray-600">
          {filteredCandidates.length} found (≥50% match)
        </span>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No candidates with ≥50% match</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredCandidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => handleSelectCandidate(candidate.id)}
              className={`w-full text-left p-3 border transition-all duration-200 ${selectedCandidate === candidate.id
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                  : 'border-[#2A2A2A] bg-black hover:border-[#00E5FF]/50'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Candidate Name */}
                  <div className="flex items-center gap-2">
                    <span className={`font-medium truncate ${selectedCandidate === candidate.id ? 'text-[#00E5FF]' : 'text-white'
                      }`}>
                      {candidate.name.split(' - ')[0]}
                    </span>
                  </div>

                  {/* Role/Title */}
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {candidate.name.split(' - ')[1] || candidate.language}
                  </p>

                  {/* Skills & Experience */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium uppercase ${experienceLevelColors[candidate.experience_level] || 'bg-gray-500/20 text-gray-400'
                      }`}>
                      {candidate.experience_level}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-[#1A1A1A] text-gray-400">
                      {candidate.language}
                    </span>
                  </div>

                  {/* Top Skills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {candidate.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 text-[10px] bg-[#1A1A1A] text-gray-500"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="text-[10px] text-gray-600">
                        +{candidate.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-2 py-1 text-xs font-bold ${getMatchScoreColor(candidate.match_score)}`}>
                    {candidate.match_score}%
                  </div>
                  <span className="text-[10px] text-gray-600">match</span>
                </div>
              </div>

              {/* Selection indicator */}
              {selectedCandidate === candidate.id && (
                <div className="mt-2 pt-2 border-t border-[#00E5FF]/20 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#00E5FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-[#00E5FF]">Selected</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


