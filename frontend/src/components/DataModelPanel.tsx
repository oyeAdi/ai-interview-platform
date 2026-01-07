'use client'

import { useState, useEffect, useCallback } from 'react'
import InterviewParameters from './InterviewParameters'
import InterviewFlowPlanner from './InterviewFlowPlanner'
import SampleQuestionsViewer from './SampleQuestionsViewer'
import CollapsibleSection from './CollapsibleSection'
import HierarchicalSkillsDisplay from './HierarchicalSkillsDisplay'
import { apiUrl, getHeaders } from '@/config/api'

interface Skill {
  skill: string
  proficiency: string
  weight: number
}

interface CategoryConfig {
  enabled: boolean
  difficulty_level: 'easy' | 'medium' | 'hard'
}

interface QuestionCategories {
  [key: string]: CategoryConfig
}

interface DataModel {
  duration_minutes: number
  experience_level: string
  expectations: string
  required_skills: Skill[]
  interview_flow?: string[]
  question_categories?: QuestionCategories
}

interface DataModelPanelProps {
  dataModel: DataModel
  onUpdate: (dataModel: DataModel) => void
  isEditable?: boolean
  userId?: string | null
}

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
const EXPECTATION_LEVELS = ['basic', 'medium', 'high']
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

// User-friendly labels for proficiency levels
const PROFICIENCY_LABELS: Record<string, string> = {
  beginner: 'Basic working knowledge',
  intermediate: 'Comfortable with',
  advanced: 'Strong in',
  expert: 'Expert in'
}
const INTERVIEW_PHASES = ['system_design', 'coding', 'conceptual', 'problem_solving']
const DURATION_OPTIONS = [30, 45, 60, 90]

const AVAILABLE_SKILLS = [
  'python', 'java', 'javascript', 'react', 'nodejs', 'spring',
  'system_design', 'microservices', 'databases', 'coding',
  'algorithms', 'data_structures', 'aws', 'kubernetes', 'docker'
]

const QUESTION_CATEGORY_INFO: Record<string, { label: string, description: string, icon: string }> = {
  coding: { label: 'Coding', description: 'Monaco editor, algorithms, DS', icon: '💻' },
  conceptual: { label: 'Conceptual', description: 'Theory, language features', icon: '📚' },
  system_design: { label: 'System Design', description: 'Architecture, scalability', icon: '🏗️' },
  problem_solving: { label: 'Problem Solving', description: 'Real-world scenarios', icon: '🧩' },
  // Domain specific mappings will use generic fallback if not listed here
}

const formatLabel = (key: string) => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const DEFAULT_CATEGORIES: QuestionCategories = {
  coding: { enabled: false, difficulty_level: 'medium' },
  conceptual: { enabled: false, difficulty_level: 'medium' },
  system_design: { enabled: false, difficulty_level: 'hard' },
  problem_solving: { enabled: false, difficulty_level: 'medium' }
}

export default function DataModelPanel({ dataModel, onUpdate, isEditable = true, jdText = '', userId }: DataModelPanelProps & { jdText?: string }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [localModel, setLocalModel] = useState<DataModel>(dataModel)
  interface SkillData {
    name: string
    proficiency: 'basic_knowledge' | 'comfortable' | 'strong' | 'expert'
    type: 'must_have' | 'nice_to_have'
  }

  const [extractedSkills, setExtractedSkills] = useState<SkillData[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [categoryMap, setCategoryMap] = useState<Record<string, SkillData[]>>({})

  // Comprehensive AI configuration state
  const [aiMetadata, setAiMetadata] = useState<any>(null)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [configProgress, setConfigProgress] = useState(0)

  useEffect(() => {
    setLocalModel(dataModel)
  }, [dataModel])

  const handleChange = useCallback((field: keyof DataModel, value: any) => {
    const updated = { ...localModel, [field]: value }
    setLocalModel(updated)
    onUpdate(updated)
  }, [localModel, onUpdate])

  const handleSkillChange = useCallback((index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...localModel.required_skills]
    updatedSkills[index] = { ...updatedSkills[index], [field]: value }
    handleChange('required_skills', updatedSkills)
  }, [localModel.required_skills, handleChange])

  const addSkill = () => {
    const newSkill: Skill = { skill: '', proficiency: 'intermediate', weight: 0.1 }
    handleChange('required_skills', [...localModel.required_skills, newSkill])
  }

  const removeSkill = (index: number) => {
    const updatedSkills = localModel.required_skills.filter((_, i) => i !== index)
    handleChange('required_skills', updatedSkills)
  }

  const handleAutoPopulateSkills = async () => {
    if (!jdText) {
      console.log('❌ No JD text available')
      return
    }

    console.log('🚀 Starting auto-populate...')
    setIsExtracting(true)
    try {
      // Step 1: Extract skills with proficiency
      console.log('📤 Calling /api/extract-skills...')
      const extractRes = await fetch(apiUrl('api/extract-skills'), {
        method: 'POST',
        headers: getHeaders(userId || undefined),
        body: JSON.stringify({ jd_text: jdText })
      })
      const extractData = await extractRes.json()
      const skills = extractData.skills || []
      console.log('✅ Extracted skills:', skills)
      setExtractedSkills(skills)

      // Step 2: Map to categories (preserving proficiency)
      console.log('📤 Calling /api/map-skills...')
      const mapRes = await fetch(apiUrl('api/map-skills'), {
        method: 'POST',
        headers: getHeaders(userId || undefined),
        body: JSON.stringify({ skills })
      })
      const mapData = await mapRes.json()
      console.log('✅ Category map:', mapData.category_map)
      setCategoryMap(mapData.category_map || {})

      // Automatically add to localModel if it's currently empty or user wants auto-fill
      if (skills.length > 0) {
        const newSkills = skills.map((s: any) => ({
          skill: s.name.toLowerCase().replace(/ /g, '_'),
          proficiency: s.proficiency === 'basic_knowledge' ? 'basic' : (s.proficiency || 'comfortable'),
          weight: 0.1
        }))

        // Merge and deduplicate
        setLocalModel(prev => {
          const existingNames = new Set(prev.required_skills.map(rs => rs.skill))
          const uniqueNew = newSkills.filter((ns: any) => !existingNames.has(ns.skill))
          const updated = {
            ...prev,
            required_skills: [...prev.required_skills, ...uniqueNew]
          }
          onUpdate?.(updated)
          return updated
        })
      }
    } catch (error) {
      console.error('❌ Error auto-populating skills:', error)
    } finally {
      setIsExtracting(false)
      console.log('🏁 Auto-populate complete')
    }
  }

  const handleConfigureInterview = async () => {
    if (!jdText) {
      console.log('❌ No JD text available')
      return
    }

    console.log('🚀 Starting comprehensive AI configuration...')
    setIsConfiguring(true)
    setConfigProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setConfigProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% until real completion
        return prev + Math.random() * 15 // Increment by 5-15%
      })
    }, 1000) // Update every second

    try {
      const response = await fetch(apiUrl('api/configure-interview'), {
        method: 'POST',
        headers: getHeaders(userId || undefined),
        body: JSON.stringify({ jd_text: jdText })
      })
      const data = await response.json()
      console.log('✅ AI Configuration:', data.ai_metadata)

      // Complete progress
      clearInterval(progressInterval)
      setConfigProgress(100)

      setAiMetadata(data.ai_metadata)

      if (data.ai_metadata) {
        setLocalModel(prev => {
          const updated = {
            ...prev,
            duration_minutes: data.ai_metadata.duration || prev.duration_minutes,
            experience_level: data.ai_metadata.level || prev.experience_level,
            expectations: data.ai_metadata.expectations || prev.expectations,
            interview_flow: data.ai_metadata.flow || prev.interview_flow
          }
          onUpdate?.(updated)
          return updated
        })
      }
    } catch (error) {
      console.error('❌ Error configuring interview:', error)
      clearInterval(progressInterval)
    } finally {
      setTimeout(() => {
        setIsConfiguring(false)
        setConfigProgress(0)
      }, 1000)
      console.log('🏁 Configuration complete')
    }
  }

  const removeExtractedSkill = useCallback((skillToRemove: SkillData) => {
    setExtractedSkills(prev => prev.filter(s => s.name !== skillToRemove.name))
    // Also update category map
    const newCategoryMap = { ...categoryMap }
    Object.keys(newCategoryMap).forEach(category => {
      newCategoryMap[category] = newCategoryMap[category].filter(s => s.name !== skillToRemove.name)
      if (newCategoryMap[category].length === 0) {
        delete newCategoryMap[category]
      }
    })
    setCategoryMap(newCategoryMap)
  }, [categoryMap])

  const handleFlowChange = (phase: string, checked: boolean) => {
    let updatedFlow = [...(localModel.interview_flow || [])]
    if (checked && !updatedFlow.includes(phase)) {
      updatedFlow.push(phase)
    } else if (!checked) {
      updatedFlow = updatedFlow.filter(p => p !== phase)
    }
    handleChange('interview_flow', updatedFlow)
  }

  const handleCategoryChange = (category: string, field: 'enabled' | 'difficulty_level', value: boolean | 'easy' | 'medium' | 'hard') => {
    const currentCategories = localModel.question_categories || DEFAULT_CATEGORIES
    const updatedCategories = {
      ...currentCategories,
      [category]: {
        ...currentCategories[category],
        [field]: value
      }
    }
    handleChange('question_categories', updatedCategories)
  }

  // Removed getTotalQuestions - we no longer track fixed question counts
  // AI decides dynamically based on performance

  const moveFlowItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= (localModel.interview_flow?.length || 0)) return

    const updatedFlow = [...(localModel.interview_flow || [])]
    const [item] = updatedFlow.splice(index, 1)
    updatedFlow.splice(newIndex, 0, item)
    handleChange('interview_flow', updatedFlow)
  }

  // Helper to ensure we render all relevant categories
  const getDisplayCategories = () => {
    const categories = localModel.question_categories || DEFAULT_CATEGORIES
    return Object.keys(categories)
  }

  const selectStyles = `w-full appearance-none bg-white dark:bg-black 
                        border border-gray-200 dark:border-[#2A2A2A] 
                        px-4 py-3 text-black dark:text-white 
                        focus:outline-none focus:border-brand-primary 
                        transition-colors duration-200`

  if (!isEditable) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* AI Blueprint Content Directly */}
        <div className="space-y-6">
          {/* Header for Blueprint */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#111] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold">Interview Blueprint</h3>
                <p className="text-xs text-gray-500">Verified AI strategy map & parameters</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/5 border border-orange-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">AI Validated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* 1. Parameters Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Duration</span>
                <span className="text-sm font-black">{localModel.duration_minutes} Minutes</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Experience</span>
                <span className="text-sm font-black capitalize">{localModel.experience_level}</span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Expectations</span>
                <span className="text-sm font-black capitalize">{localModel.expectations}</span>
              </div>
            </div>

            {/* 2. Skills Map */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Required Competencies</h4>
              </div>
              <HierarchicalSkillsDisplay
                categoryMap={categoryMap}
                isEditable={false}
              />
              {localModel.required_skills.length > 0 && categoryMap && Object.keys(categoryMap).length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {localModel.required_skills.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#111] text-xs font-medium">
                      {s.skill.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Planned Flow */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Interview Trajectory</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {localModel.interview_flow?.map((phase, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-black">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold capitalize flex-1">{phase.replace(/_/g, ' ')}</span>
                    <div className="px-2 py-1 rounded-md bg-white dark:bg-black border border-gray-100 dark:border-[#111] text-[10px] font-bold text-gray-400">
                      Phase Segment
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-[#2A2A2A] transition-all duration-300 bg-white dark:bg-[#050505] shadow-2xl shadow-orange-500/5`}>
      <div className="p-8 space-y-10">
        <div>
          <h3 className="text-xl font-black tracking-tight mb-2">Manual Override</h3>
          <p className="text-xs text-gray-500 font-medium">Customize every aspect of the interview trajectory agent.</p>
        </div>

        {/* Settings Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Basic Parameters</h4>
          </div>

          {/* Basic Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Duration */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Duration
              </label>
              <div className="relative">
                <select
                  value={localModel.duration_minutes}
                  onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
                  disabled={!isEditable}
                  className={selectStyles}
                >
                  {DURATION_OPTIONS.map(duration => (
                    <option key={duration} value={duration}>{duration} minutes</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Experience Level
              </label>
              <div className="relative">
                <select
                  value={localModel.experience_level}
                  onChange={(e) => handleChange('experience_level', e.target.value)}
                  disabled={!isEditable}
                  className={`${selectStyles} capitalize`}
                >
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level} value={level} className="capitalize">{level}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expectations */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Expectations
              </label>
              <div className="relative">
                <select
                  value={localModel.expectations}
                  onChange={(e) => handleChange('expectations', e.target.value)}
                  disabled={!isEditable}
                  className={`${selectStyles} capitalize`}
                >
                  {EXPECTATION_LEVELS.map(level => (
                    <option key={level} value={level} className="capitalize">{level}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Question Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Question Categories
              </label>
              <span className="text-xs text-gray-400">
                AI decides count dynamically
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(QUESTION_CATEGORY_INFO) as (keyof QuestionCategories)[]).map((category) => {
                const info = QUESTION_CATEGORY_INFO[category]
                const categories = localModel.question_categories || DEFAULT_CATEGORIES
                const config = categories[category] || { enabled: false, difficulty_level: 'medium' }

                return (
                  <div
                    key={category}
                    className={`p-4 border-2 rounded-lg transition-all ${config.enabled
                      ? 'border-[#00E5FF] bg-[#00E5FF]/5 dark:bg-[#00E5FF]/10'
                      : 'border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-[#0A0A0A]'
                      }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      {/* Checkbox */}
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => handleCategoryChange(String(category), 'enabled', e.target.checked)}
                          disabled={!isEditable}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${config.enabled
                          ? 'bg-[#00E5FF] border-[#00E5FF]'
                          : 'bg-white dark:bg-[#0A0A0A] border-gray-300 dark:border-[#3A3A3A]'
                          }`}>
                          {config.enabled && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{info.icon}</span>
                          <span className={`font-medium text-sm ${config.enabled ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                            {info.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                      </div>

                      {/* Difficulty Level Dropdown */}
                      <select
                        value={config.difficulty_level}
                        onChange={(e) => handleCategoryChange(String(category), 'difficulty_level', e.target.value as 'easy' | 'medium' | 'hard')}
                        disabled={!isEditable || !config.enabled}
                        className={`px-3 py-1 border rounded text-sm transition-colors ${config.enabled
                          ? 'border-gray-300 dark:border-[#3A3A3A] bg-white dark:bg-[#0A0A0A] text-black dark:text-white'
                          : 'border-gray-200 dark:border-[#2A2A2A] bg-gray-100 dark:bg-[#1A1A1A] text-gray-400'
                          }`}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Required Skills */}
          <div>
            {/* Skills Section */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <br />Skills
              </label>
            </div>


            {/* Hierarchical Category-Based Skills Display */}
            <HierarchicalSkillsDisplay
              categoryMap={categoryMap}
              isEditable={isEditable}
              onRemoveSkill={removeExtractedSkill}
            />
            {/* Skills Display */}
            <div className="space-y-3">
              <HierarchicalSkillsDisplay
                categoryMap={categoryMap}
                isEditable={isEditable}
                onRemoveSkill={removeExtractedSkill}
              />

              {/* Manual Add/Edit Skills */}
              <div className="grid grid-cols-1 gap-3">
                {localModel.required_skills.map((skill, index) => (
                  <div key={index} className="group relative flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111] rounded-xl transition-all hover:border-orange-500/30">
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value={skill.skill}
                          onChange={(e) => handleSkillChange(index, 'skill', e.target.value)}
                          disabled={!isEditable}
                          className="w-full bg-transparent text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select skill</option>
                          {AVAILABLE_SKILLS.map(s => (
                            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proficiency:</span>
                        <select
                          value={skill.proficiency}
                          onChange={(e) => handleSkillChange(index, 'proficiency', e.target.value)}
                          disabled={!isEditable}
                          className="bg-transparent text-[10px] font-black text-orange-500 uppercase tracking-widest focus:outline-none cursor-pointer"
                        >
                          {PROFICIENCY_LEVELS.map(p => (
                            <option key={p} value={p}>{PROFICIENCY_LABELS[p] || p}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all hover:scale-110"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-[#111]">
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Interview Flow
              </label>
              {isEditable && (
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                  Manage Sequence
                </span>
              )}
            </div>

            <div className="space-y-3">
              {(localModel.interview_flow || []).map((phase, index) => (
                <div key={phase} className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111] transition-all hover:border-brand-primary/30">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-orange-500/20">
                    {index + 1}
                  </div>
                  <span className="flex-1 text-sm font-bold text-black dark:text-white capitalize tracking-tight">
                    {phase.replace('_', ' ')}
                  </span>

                  {isEditable && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        type="button"
                        onClick={() => moveFlowItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFlowItem(index, 'down')}
                        disabled={index === (localModel.interview_flow?.length || 0) - 1}
                        className="p-1.5 text-gray-400 hover:text-orange-500 disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFlowChange(phase, false)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Phase Buttons */}
              {isEditable && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {INTERVIEW_PHASES.filter(p => !(localModel.interview_flow || []).includes(p)).map(phase => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => handleFlowChange(phase, true)}
                      className="px-3 py-2 text-xs font-medium
                               border border-dashed border-gray-300 dark:border-[#3A3A3A]
                               text-gray-500 hover:text-brand-primary hover:border-brand-primary
                               transition-colors duration-200 capitalize"
                    >
                      + {phase.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* AI Assistance Section */}
        <section className="space-y-6 pt-10 border-t border-gray-100 dark:border-[#111]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">AI Intelligence Assistance</h4>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            {/* Auto-populate from JD Button */}
            {isEditable && jdText && (
              <button
                type="button"
                onClick={handleAutoPopulateSkills}
                disabled={isExtracting}
                className="flex-1 text-sm text-white bg-[#00E5FF] hover:bg-[#00D5EF] px-4 py-2.5 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing JD...
                  </>
                ) : (
                  <>
                    🤖 Auto-populate from JD
                  </>
                )}
              </button>
            )}

            {/* Configure Interview Button */}
            {isEditable && jdText && (
              <button
                type="button"
                onClick={handleConfigureInterview}
                disabled={isConfiguring}
                className="flex-1 text-sm text-white bg-gradient-to-r from-[#00E5FF] to-[#00B8D4] hover:from-[#00D5EF] hover:to-[#00A8C4] px-4 py-2.5 rounded flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00E5FF]/20 relative overflow-hidden"
              >
                {isConfiguring ? (
                  <>
                    {/* Progress Bar Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/20 to-[#00B8D4]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#00E5FF]/40 to-[#00B8D4]/40 transition-all duration-300"
                        style={{ width: `${configProgress}%` }}
                      ></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Configuring AI...</span>
                    </div>
                    <span className="relative z-10 text-xs font-semibold">{Math.round(configProgress)}% Ready</span>
                  </>
                ) : (
                  <>
                    ⚙️ Configure Interview
                  </>
                )}
              </button>
            )}
          </div>

          {/* Auto-populated Skills Display */}
          <HierarchicalSkillsDisplay
            categoryMap={categoryMap}
            title="🤖 AI-Extracted Skills"
          />

          {/* AI-Generated Content Display */}
          {aiMetadata && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2A2A2A]">
              {/* Interview Parameters */}
              {aiMetadata.interview_parameters && (
                <div>
                  <InterviewParameters
                    parameters={aiMetadata.interview_parameters}
                    isEditable={isEditable}
                  />
                </div>
              )}

              {/* Interview Flow */}
              {aiMetadata.interview_flow && (
                <div>
                  <InterviewFlowPlanner
                    flow={aiMetadata.interview_flow}
                    isEditable={isEditable}
                  />
                </div>
              )}

            </div>
          )}
        </section>

        {/* Dynamic Categories from AI Mapping */}
        {categoryMap && Object.keys(categoryMap).length > 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-3">
              🤖 AI-Suggested Categories
            </h4>
            <div className="space-y-2">
              {Object.entries(categoryMap).map(([category, skills]) => (
                <div key={category} className="flex items-center justify-between p-2 bg-white dark:bg-black/20 rounded">
                  <div className="flex-1">
                    <span className="font-medium text-sm capitalize">{category.replace('_', ' ')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Based on: {skills.map((s: SkillData) => s.name).join(', ')}
                    </p>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-400">✓ Suggested</span>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
