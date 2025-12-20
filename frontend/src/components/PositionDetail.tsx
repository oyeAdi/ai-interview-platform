'use client'

import { useState, useEffect } from 'react'
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
  // Metadata fields
  posted_by?: string
  project_code?: string
  work_location?: 'remote' | 'office' | 'hybrid'
  billable?: boolean
  published_date?: string
  timeline?: string
  employment_type?: 'contract' | 'fulltime'
}

interface PositionDetailProps {
  positionId: string
  onUpdate: () => void
  onDelete: () => void
  onClose: () => void
}

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
const EXPECTATION_LEVELS = ['basic', 'medium', 'high']
const STATUS_OPTIONS = ['open', 'closed', 'on_hold']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

const experienceLevelColors: Record<string, string> = {
  junior: 'bg-blue-500/10 text-blue-400',
  mid: 'bg-purple-500/10 text-purple-400',
  senior: 'bg-amber-500/10 text-amber-400',
  lead: 'bg-red-500/10 text-red-400',
}

const statusColors: Record<string, string> = {
  open: 'bg-green-500/10 text-green-500',
  closed: 'bg-gray-500/10 text-gray-500',
  on_hold: 'bg-amber-500/10 text-amber-500',
}

export default function PositionDetail({
  positionId,
  onUpdate,
  onDelete,
  onClose
}: PositionDetailProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [candidateCount, setCandidateCount] = useState(0)

  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState('open')
  const [editJdText, setEditJdText] = useState('')
  const [editDataModel, setEditDataModel] = useState<DataModel | null>(null)

  useEffect(() => {
    if (!positionId) return

    setLoading(true)
    Promise.all([
      fetch(apiUrl(`api/positions/${positionId}`)).then(res => res.json()),
      fetch(apiUrl(`api/positions/${positionId}/candidates`)).then(res => res.json()).catch(() => ({ candidates: [] }))
    ])
      .then(([positionData, candidatesData]) => {
        setPosition(positionData)
        setCandidateCount(candidatesData.candidates?.length || 0)
        setEditTitle(positionData.title || '')
        setEditStatus(positionData.status || 'open')
        setEditJdText(positionData.jd_text || '')
        setEditDataModel(positionData.data_model)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading position:', err)
        setLoading(false)
      })
  }, [positionId])

  const handleSave = async () => {
    if (!editTitle.trim() || !editDataModel) return

    setSaving(true)
    try {
      const response = await fetch(apiUrl(`api/positions/${positionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          status: editStatus,
          jd_text: editJdText.trim(),
          data_model: editDataModel
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPosition(data.position)
        setIsEditing(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Error saving position:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(apiUrl(`api/positions/${positionId}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        onDelete()
        onClose()
      }
    } catch (err) {
      console.error('Error deleting position:', err)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    if (position) {
      setEditTitle(position.title)
      setEditStatus(position.status)
      setEditJdText(position.jd_text || '')
      setEditDataModel(position.data_model)
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!position || !editDataModel) {
    return (
      <div className="p-5 text-center text-gray-500 text-sm">
        Position not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
        {/* Title & Status */}
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-b border-[#00E5FF] text-black dark:text-white focus:outline-none pb-1 mb-2"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-medium text-black dark:text-white mb-1.5">
              {position.title}
            </h3>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-2 py-1 text-xs text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            ) : (
              <span className={`text-[10px] px-1.5 py-0.5 uppercase font-medium ${statusColors[position.status] || 'bg-gray-100 text-gray-500'}`}>
                {position.status.replace('_', ' ')}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 uppercase font-medium ${experienceLevelColors[position.data_model.experience_level] || 'bg-gray-100 text-gray-500'}`}>
              {position.data_model.experience_level}
            </span>
          </div>

          <p className="text-[10px] text-gray-500 mt-1.5">
            Created: {new Date(position.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Metadata Section */}
        {!isEditing && (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {position.project_code && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Project:</span>
                  <span className="text-[#00E5FF]">{position.project_code}</span>
                </div>
              )}
              {position.work_location && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Location:</span>
                  <span className="capitalize">{position.work_location}</span>
                </div>
              )}
              {position.billable !== undefined && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Billable:</span>
                  <span className={position.billable ? 'text-green-500' : 'text-gray-500'}>
                    {position.billable ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {position.posted_by && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Posted by:</span>
                  <span>{position.posted_by}</span>
                </div>
              )}
              {position.published_date && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Published:</span>
                  <span>{position.published_date}</span>
                </div>
              )}
              {position.timeline && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Timeline:</span>
                  <span>{position.timeline}</span>
                </div>
              )}
              {position.employment_type && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Type:</span>
                  <span className="capitalize">{position.employment_type}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium hover:bg-[#00E5FF]/20 transition-colors"
              >
                🔗 Share
              </button>
              <button
                className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                ✉️ Invite
              </button>
            </div>
          </>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-gray-100 dark:bg-[#1A1A1A] text-center">
            {isEditing ? (
              <select
                value={editDataModel.duration_minutes}
                onChange={(e) => setEditDataModel({ ...editDataModel, duration_minutes: parseInt(e.target.value) })}
                className="w-full text-center appearance-none bg-transparent text-lg font-bold text-gray-600 dark:text-gray-400 focus:outline-none"
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{position.data_model.duration_minutes}</div>
            )}
            <div className="text-[9px] text-gray-400">Min</div>
          </div>
          <div className="p-2 bg-[#00E5FF]/10 text-center">
            <div className="text-lg font-bold text-[#00E5FF]">{candidateCount}</div>
            <div className="text-[9px] text-[#00E5FF]/70">Matches</div>
          </div>
          <div className="p-2 bg-gray-100 dark:bg-[#1A1A1A] text-center">
            <div className="text-lg font-bold text-gray-600 dark:text-gray-400">{position.data_model.required_skills.length}</div>
            <div className="text-[9px] text-gray-400">Skills</div>
          </div>
        </div>

        {/* Edit Settings */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Level</label>
              <select
                value={editDataModel.experience_level}
                onChange={(e) => setEditDataModel({ ...editDataModel, experience_level: e.target.value })}
                className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-2 py-1.5 text-xs text-black dark:text-white capitalize"
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Expectations</label>
              <select
                value={editDataModel.expectations}
                onChange={(e) => setEditDataModel({ ...editDataModel, expectations: e.target.value })}
                className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-2 py-1.5 text-xs text-black dark:text-white capitalize"
              >
                {EXPECTATION_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Skills - Parse from JD text */}
        <div className="space-y-3">
          {/* Must-Have Skills */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">
              Must-Have Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const jdText = position.jd_text || ''
                const mustHaveMatch = jdText.match(/\*\*MUST-HAVE SKILLS\*\*:?\n([\s\S]*?)(?:\n\*\*|$)/i)
                if (mustHaveMatch) {
                  const skills = mustHaveMatch[1]
                    .split('\n')
                    .filter(line => line.trim().startsWith('•'))
                    .map(line => line.replace('•', '').trim())

                  return skills.length > 0 ? skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium"
                    >
                      {skill}
                    </span>
                  )) : <span className="text-xs text-gray-400">-</span>
                }
                // Fallback to old required_skills array
                return position.data_model.required_skills?.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-medium"
                  >
                    {skill.skill.replace('_', ' ')}
                  </span>
                )) || <span className="text-xs text-gray-400">-</span>
              })()}
            </div>
          </div>

          {/* Nice-to-Have Skills */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">
              Nice-to-Have Skills
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const jdText = position.jd_text || ''
                const niceToHaveMatch = jdText.match(/\*\*NICE-TO-HAVE SKILLS\*\*:?\n([\s\S]*?)(?:\n\*\*|$)/i)
                if (niceToHaveMatch) {
                  const skills = niceToHaveMatch[1]
                    .split('\n')
                    .filter(line => line.trim().startsWith('•'))
                    .map(line => line.replace('•', '').trim())

                  return skills.length > 0 ? skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 dark:bg-[#1A1A1A] text-xs text-gray-600 dark:text-gray-400"
                    >
                      {skill}
                    </span>
                  )) : <span className="text-xs text-gray-400">-</span>
                }
                return <span className="text-xs text-gray-400">-</span>
              })()}
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Job Description
          </label>
          {isEditing ? (
            <textarea
              value={editJdText}
              onChange={(e) => setEditJdText(e.target.value)}
              rows={4}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-[#00E5FF] resize-none"
              placeholder="Job description..."
            />
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
              {position.jd_text || <span className="italic text-gray-400">No description</span>}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111]">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 dark:border-[#2A2A2A]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
              className="flex-1 py-2 text-xs bg-[#00E5FF] text-black font-medium disabled:opacity-40 flex items-center justify-center gap-1"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        ) : showDeleteConfirm ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 text-center">Delete this position?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-xs text-gray-500 border border-gray-200 dark:border-[#2A2A2A]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-xs bg-red-500 text-white font-medium disabled:opacity-40 flex items-center justify-center gap-1"
              >
                {deleting ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 text-xs text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/10 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2 text-xs text-red-500 border border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
