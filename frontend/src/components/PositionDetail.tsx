'use client'

import { useState, useEffect } from 'react'

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
  interview_flow: string[]
  question_distribution: {
    easy: number
    medium: number
    hard: number
  }
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

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editStatus, setEditStatus] = useState('open')
  const [editJdText, setEditJdText] = useState('')
  const [editDataModel, setEditDataModel] = useState<DataModel | null>(null)

  // Load position data
  useEffect(() => {
    if (!positionId) return

    setLoading(true)
    Promise.all([
      fetch(`http://localhost:8000/api/positions/${positionId}`).then(res => res.json()),
      fetch(`http://localhost:8000/api/positions/${positionId}/candidates`).then(res => res.json()).catch(() => ({ candidates: [] }))
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
      const response = await fetch(`http://localhost:8000/api/positions/${positionId}`, {
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
      const response = await fetch(`http://localhost:8000/api/positions/${positionId}`, {
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!position || !editDataModel) {
    return (
      <div className="p-6 text-center text-gray-500">
        Position not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Title & Status */}
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl font-medium bg-transparent border-b-2 border-[#00E5FF] text-black dark:text-white focus:outline-none pb-1 mb-3"
              autoFocus
            />
          ) : (
            <h3 className="text-xl font-medium text-black dark:text-white mb-2">
              {position.title}
            </h3>
          )}
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-1.5 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                ))}
              </select>
            ) : (
              <span className={`text-xs px-2 py-1 uppercase font-medium ${statusColors[position.status] || 'bg-gray-100 text-gray-500'}`}>
                {position.status.replace('_', ' ')}
              </span>
            )}
            <span className={`text-xs px-2 py-1 uppercase font-medium ${experienceLevelColors[position.data_model.experience_level] || 'bg-gray-100 text-gray-500'}`}>
              {position.data_model.experience_level}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Created: {new Date(position.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-100 dark:bg-[#1A1A1A] text-center">
            {isEditing ? (
              <select
                value={editDataModel.duration_minutes}
                onChange={(e) => setEditDataModel({ ...editDataModel, duration_minutes: parseInt(e.target.value) })}
                className="w-full text-center appearance-none bg-transparent text-xl font-bold text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                {DURATION_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{position.data_model.duration_minutes}</div>
            )}
            <div className="text-xs text-gray-500">Minutes</div>
          </div>
          <div className="p-3 bg-[#00E5FF]/10 text-center">
            <div className="text-xl font-bold text-[#00E5FF]">{candidateCount}</div>
            <div className="text-xs text-[#00E5FF]/70">Candidates</div>
          </div>
          <div className="p-3 bg-gray-100 dark:bg-[#1A1A1A] text-center">
            <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{position.data_model.required_skills.length}</div>
            <div className="text-xs text-gray-500">Skills</div>
          </div>
        </div>

        {/* Interview Settings */}
        {isEditing && (
          <div className="space-y-4">
            <label className="block text-xs text-gray-500 uppercase tracking-wide">
              Interview Settings
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Experience Level</label>
                <select
                  value={editDataModel.experience_level}
                  onChange={(e) => setEditDataModel({ ...editDataModel, experience_level: e.target.value })}
                  className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF] capitalize"
                >
                  {EXPERIENCE_LEVELS.map(l => (
                    <option key={l} value={l} className="capitalize">{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Expectations</label>
                <select
                  value={editDataModel.expectations}
                  onChange={(e) => setEditDataModel({ ...editDataModel, expectations: e.target.value })}
                  className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF] capitalize"
                >
                  {EXPECTATION_LEVELS.map(l => (
                    <option key={l} value={l} className="capitalize">{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-3">
            Required Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {position.data_model.required_skills.map((skill, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-gray-100 dark:bg-[#1A1A1A] text-sm"
              >
                <span className="text-gray-700 dark:text-gray-300 capitalize">{skill.skill.replace('_', ' ')}</span>
                <span className="text-gray-400 ml-1 text-xs">({skill.proficiency})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Flow */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-3">
            Interview Flow
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {position.data_model.interview_flow.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] text-sm capitalize">
                  {step.replace('_', ' ')}
                </span>
                {i < position.data_model.interview_flow.length - 1 && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question Distribution */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-3">
            Question Distribution
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">Easy</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-[#1A1A1A]">
                <div className="h-full bg-green-500" style={{ width: `${position.data_model.question_distribution.easy * 100}%` }} />
              </div>
              <span className="w-10 text-xs text-gray-500 text-right">{Math.round(position.data_model.question_distribution.easy * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">Medium</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-[#1A1A1A]">
                <div className="h-full bg-amber-500" style={{ width: `${position.data_model.question_distribution.medium * 100}%` }} />
              </div>
              <span className="w-10 text-xs text-gray-500 text-right">{Math.round(position.data_model.question_distribution.medium * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">Hard</span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-[#1A1A1A]">
                <div className="h-full bg-red-500" style={{ width: `${position.data_model.question_distribution.hard * 100}%` }} />
              </div>
              <span className="w-10 text-xs text-gray-500 text-right">{Math.round(position.data_model.question_distribution.hard * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
            Job Description
          </label>
          {isEditing ? (
            <textarea
              value={editJdText}
              onChange={(e) => setEditJdText(e.target.value)}
              rows={5}
              className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF] resize-none"
              placeholder="Job description..."
            />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {position.jd_text || <span className="text-gray-400 italic">No job description</span>}
            </p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A]">
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim()}
              className="flex-1 py-3 text-sm bg-[#00E5FF] text-black font-medium hover:bg-[#00E5FF]/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        ) : showDeleteConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Are you sure you want to delete this position?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-[#2A2A2A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 text-sm bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-3 text-sm text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-3 text-sm text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

