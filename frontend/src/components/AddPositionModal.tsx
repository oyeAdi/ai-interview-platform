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

interface Template {
  id: string
  name: string
  category: string
  experience_levels: string[]
  default_config: DataModel
  is_custom?: boolean
}

interface Account {
  id: string
  name: string
}

interface AddPositionModalProps {
  isOpen: boolean
  onClose: () => void
  accounts: Account[]
  selectedAccountId: string
  onPositionCreated: () => void
}

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
const EXPECTATION_LEVELS = ['basic', 'medium', 'high']
const DURATION_OPTIONS = [30, 45, 60, 90]
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export default function AddPositionModal({
  isOpen,
  onClose,
  accounts,
  selectedAccountId,
  onPositionCreated
}: AddPositionModalProps) {
  const [step, setStep] = useState(1)
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [accountId, setAccountId] = useState(selectedAccountId)
  const [jdText, setJdText] = useState('')
  const [dataModel, setDataModel] = useState<DataModel>({
    duration_minutes: 45,
    experience_level: 'mid',
    expectations: 'medium',
    required_skills: [],
    interview_flow: ['coding', 'conceptual'],
    question_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
  })

  // Load templates
  useEffect(() => {
    if (!isOpen) return
    
    setLoading(true)
    setLoadError(null)
    fetch('http://localhost:8000/api/templates')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load templates: ${res.status}`)
        return res.json()
      })
      .then(data => {
        console.log('Templates loaded:', data)
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
        setAvailableSkills(data.available_skills || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading templates:', err)
        setLoadError(err.message || 'Failed to load templates')
        setLoading(false)
      })
  }, [isOpen])

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedTemplate(null)
      setTitle('')
      setAccountId(selectedAccountId)
      setJdText('')
      setSaveAsTemplate(false)
      setTemplateName('')
    }
  }, [isOpen, selectedAccountId])

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setDataModel(template.default_config)
    setTitle(`${template.name}`)
    setStep(2)
  }

  const handleSkipTemplate = () => {
    setSelectedTemplate(null)
    setDataModel({
      duration_minutes: 45,
      experience_level: 'mid',
      expectations: 'medium',
      required_skills: [],
      interview_flow: ['coding', 'conceptual'],
      question_distribution: { easy: 0.3, medium: 0.5, hard: 0.2 }
    })
    setStep(2)
  }

  const handleAddSkill = () => {
    setDataModel(prev => ({
      ...prev,
      required_skills: [...prev.required_skills, { skill: '', proficiency: 'intermediate', weight: 0.1 }]
    }))
  }

  const handleRemoveSkill = (index: number) => {
    setDataModel(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }))
  }

  const handleSkillChange = (index: number, field: keyof Skill, value: string | number) => {
    setDataModel(prev => ({
      ...prev,
      required_skills: prev.required_skills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      )
    }))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !accountId) {
      alert('Please fill in required fields')
      return
    }

    setSaving(true)

    try {
      // Create position
      const response = await fetch(`http://localhost:8000/api/accounts/${accountId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          data_model: dataModel,
          jd_text: jdText,
          status: 'open'
        })
      })

      if (!response.ok) throw new Error('Failed to create position')

      // Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        await fetch('http://localhost:8000/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: templateName,
            category: 'Custom',
            experience_levels: [dataModel.experience_level],
            default_config: dataModel
          })
        })
      }

      onPositionCreated()
      onClose()
    } catch (error) {
      console.error('Error creating position:', error)
      alert('Failed to create position. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white">Add New Position</h2>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-[#1A1A1A]">
          <div 
            className="h-full bg-epam-cyan transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white mb-4">Choose a Template</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] animate-spin"></div>
                </div>
              ) : loadError ? (
                <div className="py-8 text-center">
                  <p className="text-red-500 text-sm mb-4">{loadError}</p>
                  <button
                    onClick={handleSkipTemplate}
                    className="text-sm text-[#00E5FF] hover:underline"
                  >
                    Create from scratch instead →
                  </button>
                </div>
              ) : templates.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-500 text-sm mb-4">No templates available yet.</p>
                  <button
                    onClick={handleSkipTemplate}
                    className="text-sm text-[#00E5FF] hover:underline"
                  >
                    Create from scratch →
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={`text-left p-4 border transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                            : 'border-gray-200 dark:border-[#2A2A2A] hover:border-[#00E5FF]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-black dark:text-white text-sm">{template.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                          </div>
                          {template.is_custom && (
                            <span className="text-[10px] text-[#00E5FF] uppercase">Custom</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.experience_levels.map(level => (
                            <span key={level} className="px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 capitalize">
                              {level}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSkipTemplate}
                    className="text-sm text-gray-500 hover:text-[#00E5FF] transition-colors"
                  >
                    Skip and create from scratch →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 2: Configure Position */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Position Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Senior Python Developer"
                    className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Account *</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interview Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Duration</label>
                  <select
                    value={dataModel.duration_minutes}
                    onChange={(e) => setDataModel(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    {DURATION_OPTIONS.map(dur => (
                      <option key={dur} value={dur}>{dur} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Experience Level</label>
                  <select
                    value={dataModel.experience_level}
                    onChange={(e) => setDataModel(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white capitalize focus:outline-none focus:border-[#00E5FF]"
                  >
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level} value={level} className="capitalize">{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Expectations</label>
                  <select
                    value={dataModel.expectations}
                    onChange={(e) => setDataModel(prev => ({ ...prev, expectations: e.target.value }))}
                    className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white capitalize focus:outline-none focus:border-[#00E5FF]"
                  >
                    {EXPECTATION_LEVELS.map(level => (
                      <option key={level} value={level} className="capitalize">{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Required Skills</label>
                  <button onClick={handleAddSkill} className="text-sm text-[#00E5FF] hover:text-[#66F2FF]">+ Add Skill</button>
                </div>
                <div className="space-y-2">
                  {dataModel.required_skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                      <select
                        value={skill.skill}
                        onChange={(e) => handleSkillChange(index, 'skill', e.target.value)}
                        className="flex-1 appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-sm text-black dark:text-white"
                      >
                        <option value="">Select skill</option>
                        {availableSkills.map(s => (
                          <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                      <select
                        value={skill.proficiency}
                        onChange={(e) => handleSkillChange(index, 'proficiency', e.target.value)}
                        className="w-28 appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-3 py-2 text-sm text-black dark:text-white capitalize"
                      >
                        {PROFICIENCY_LEVELS.map(p => (
                          <option key={p} value={p} className="capitalize">{p}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={skill.weight}
                        onChange={(e) => handleSkillChange(index, 'weight', parseFloat(e.target.value))}
                        className="w-16 bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-2 py-2 text-sm text-center text-black dark:text-white"
                      />
                      <button onClick={() => handleRemoveSkill(index)} className="text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {dataModel.required_skills.length === 0 && (
                    <p className="text-sm text-gray-500 py-4 text-center">No skills added yet</p>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">Job Description (optional)</label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-3 text-black dark:text-white focus:outline-none focus:border-[#00E5FF] min-h-[100px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Save */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-black dark:text-white mb-4">Review Position</h3>
              
              {/* Summary */}
              <div className="border border-gray-200 dark:border-[#2A2A2A] p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Title</span>
                  <span className="text-sm text-black dark:text-white font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Account</span>
                  <span className="text-sm text-black dark:text-white">{accounts.find(a => a.id === accountId)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration</span>
                  <span className="text-sm text-black dark:text-white">{dataModel.duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Experience Level</span>
                  <span className="text-sm text-black dark:text-white capitalize">{dataModel.experience_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Skills</span>
                  <span className="text-sm text-black dark:text-white">{dataModel.required_skills.length} configured</span>
                </div>
              </div>

              {/* Save as Template Option */}
              <div className="border border-gray-200 dark:border-[#2A2A2A] p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 accent-[#00E5FF]"
                  />
                  <span className="text-sm text-black dark:text-white">Save as template for future use</span>
                </label>
                
                {saveAsTemplate && (
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="mt-3 w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-[#00E5FF]"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A]">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && !title.trim()}
              className="btn-primary px-6 py-2 disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Position'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

