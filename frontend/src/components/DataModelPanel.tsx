'use client'

import { useState, useEffect } from 'react'

interface Skill {
  skill: string
  proficiency: string
  weight: number
}

interface CategoryConfig {
  enabled: boolean
  count: number
}

interface QuestionCategories {
  coding: CategoryConfig
  conceptual: CategoryConfig
  system_design: CategoryConfig
  problem_solving: CategoryConfig
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
  question_categories?: QuestionCategories
}

interface DataModelPanelProps {
  dataModel: DataModel
  onUpdate: (dataModel: DataModel) => void
  isEditable?: boolean
}

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead']
const EXPECTATION_LEVELS = ['basic', 'medium', 'high']
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
const INTERVIEW_PHASES = ['system_design', 'coding', 'conceptual', 'problem_solving']
const DURATION_OPTIONS = [30, 45, 60, 90]

const AVAILABLE_SKILLS = [
  'python', 'java', 'javascript', 'react', 'nodejs', 'spring',
  'system_design', 'microservices', 'databases', 'coding',
  'algorithms', 'data_structures', 'aws', 'kubernetes', 'docker'
]

const QUESTION_CATEGORY_INFO = {
  coding: { label: 'Coding', description: 'Monaco editor, algorithms, DS', icon: '💻' },
  conceptual: { label: 'Conceptual', description: 'Theory, language features', icon: '📚' },
  system_design: { label: 'System Design', description: 'Architecture, scalability', icon: '🏗️' },
  problem_solving: { label: 'Problem Solving', description: 'Real-world scenarios', icon: '🧩' }
}

const DEFAULT_CATEGORIES: QuestionCategories = {
  coding: { enabled: true, count: 2 },
  conceptual: { enabled: true, count: 2 },
  system_design: { enabled: true, count: 1 },
  problem_solving: { enabled: true, count: 1 }
}

export default function DataModelPanel({ dataModel, onUpdate, isEditable = true }: DataModelPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [localModel, setLocalModel] = useState<DataModel>(dataModel)

  useEffect(() => {
    setLocalModel(dataModel)
  }, [dataModel])

  const handleChange = (field: keyof DataModel, value: any) => {
    const updated = { ...localModel, [field]: value }
    setLocalModel(updated)
    onUpdate(updated)
  }

  const handleSkillChange = (index: number, field: keyof Skill, value: any) => {
    const updatedSkills = [...localModel.required_skills]
    updatedSkills[index] = { ...updatedSkills[index], [field]: value }
    handleChange('required_skills', updatedSkills)
  }

  const addSkill = () => {
    const newSkill: Skill = { skill: '', proficiency: 'intermediate', weight: 0.1 }
    handleChange('required_skills', [...localModel.required_skills, newSkill])
  }

  const removeSkill = (index: number) => {
    const updatedSkills = localModel.required_skills.filter((_, i) => i !== index)
    handleChange('required_skills', updatedSkills)
  }

  const handleFlowChange = (phase: string, checked: boolean) => {
    let updatedFlow = [...localModel.interview_flow]
    if (checked && !updatedFlow.includes(phase)) {
      updatedFlow.push(phase)
    } else if (!checked) {
      updatedFlow = updatedFlow.filter(p => p !== phase)
    }
    handleChange('interview_flow', updatedFlow)
  }

  const handleCategoryChange = (category: keyof QuestionCategories, field: 'enabled' | 'count', value: boolean | number) => {
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

  const getTotalQuestions = () => {
    const categories = localModel.question_categories || DEFAULT_CATEGORIES
    return Object.values(categories).reduce((sum, cat) => sum + (cat.enabled ? cat.count : 0), 0)
  }

  const moveFlowItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= localModel.interview_flow.length) return
    
    const updatedFlow = [...localModel.interview_flow]
    const [item] = updatedFlow.splice(index, 1)
    updatedFlow.splice(newIndex, 0, item)
    handleChange('interview_flow', updatedFlow)
  }

  const selectStyles = `w-full appearance-none bg-white dark:bg-black 
                        border border-gray-200 dark:border-[#2A2A2A] 
                        px-4 py-3 text-black dark:text-white 
                        focus:outline-none focus:border-epam-cyan 
                        transition-colors duration-200`

  return (
    <div className="border border-gray-200 dark:border-[#2A2A2A] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 
                   bg-gray-50 dark:bg-[#0A0A0A]
                   hover:bg-gray-100 dark:hover:bg-[#1A1A1A]
                   transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-epam-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-black dark:text-white">
            Configuration
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-8">
          {/* Basic Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  {DURATION_OPTIONS.map(dur => (
                    <option key={dur} value={dur}>{dur} minutes</option>
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
              <span className="text-xs text-epam-cyan">
                Total: {getTotalQuestions()} questions
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(QUESTION_CATEGORY_INFO) as (keyof QuestionCategories)[]).map((category) => {
                const info = QUESTION_CATEGORY_INFO[category]
                const categories = localModel.question_categories || DEFAULT_CATEGORIES
                const config = categories[category]
                
                return (
                  <div 
                    key={category}
                    className={`p-4 border transition-colors duration-200 ${
                      config.enabled 
                        ? 'border-epam-cyan bg-epam-cyan/5' 
                        : 'border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <label className="relative flex items-center cursor-pointer mt-0.5">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(e) => handleCategoryChange(category, 'enabled', e.target.checked)}
                          disabled={!isEditable}
                          className="sr-only peer"
                        />
                        <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors
                                        ${config.enabled 
                                          ? 'bg-epam-cyan border-epam-cyan' 
                                          : 'bg-transparent border-gray-300 dark:border-[#3A3A3A]'
                                        }`}>
                          {config.enabled && (
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                      
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
                      
                      {/* Question Count */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(category, 'count', Math.max(0, config.count - 1))}
                          disabled={!isEditable || !config.enabled || config.count <= 0}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 dark:border-[#3A3A3A]
                                   text-gray-500 hover:border-epam-cyan hover:text-epam-cyan disabled:opacity-30
                                   transition-colors"
                        >
                          -
                        </button>
                        <span className={`w-6 text-center text-sm font-medium ${config.enabled ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                          {config.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCategoryChange(category, 'count', config.count + 1)}
                          disabled={!isEditable || !config.enabled}
                          className="w-6 h-6 flex items-center justify-center border border-gray-300 dark:border-[#3A3A3A]
                                   text-gray-500 hover:border-epam-cyan hover:text-epam-cyan disabled:opacity-30
                                   transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Question Distribution */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Difficulty Distribution
            </label>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-500">Easy</span>
                  <span className="text-sm text-gray-400">{Math.round(localModel.question_distribution.easy * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localModel.question_distribution.easy * 100}
                  onChange={(e) => handleChange('question_distribution', {
                    ...localModel.question_distribution,
                    easy: parseInt(e.target.value) / 100
                  })}
                  disabled={!isEditable}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-[#2A2A2A] accent-green-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-amber-500">Medium</span>
                  <span className="text-sm text-gray-400">{Math.round(localModel.question_distribution.medium * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localModel.question_distribution.medium * 100}
                  onChange={(e) => handleChange('question_distribution', {
                    ...localModel.question_distribution,
                    medium: parseInt(e.target.value) / 100
                  })}
                  disabled={!isEditable}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-[#2A2A2A] accent-amber-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-red-500">Hard</span>
                  <span className="text-sm text-gray-400">{Math.round(localModel.question_distribution.hard * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localModel.question_distribution.hard * 100}
                  onChange={(e) => handleChange('question_distribution', {
                    ...localModel.question_distribution,
                    hard: parseInt(e.target.value) / 100
                  })}
                  disabled={!isEditable}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-[#2A2A2A] accent-red-500"
                />
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Required Skills
              </label>
              {isEditable && (
                <button
                  type="button"
                  onClick={addSkill}
                  className="text-sm text-epam-cyan hover:text-epam-cyan-light flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {localModel.required_skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                  <div className="relative flex-1">
                    <select
                      value={skill.skill}
                      onChange={(e) => handleSkillChange(index, 'skill', e.target.value)}
                      disabled={!isEditable}
                      className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] 
                               px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:border-epam-cyan"
                    >
                      <option value="">Select skill</option>
                      {AVAILABLE_SKILLS.map(s => (
                        <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-32">
                    <select
                      value={skill.proficiency}
                      onChange={(e) => handleSkillChange(index, 'proficiency', e.target.value)}
                      disabled={!isEditable}
                      className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] 
                               px-3 py-2 text-sm text-black dark:text-white capitalize focus:outline-none focus:border-epam-cyan"
                    >
                      {PROFICIENCY_LEVELS.map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={skill.weight}
                      onChange={(e) => handleSkillChange(index, 'weight', parseFloat(e.target.value))}
                      disabled={!isEditable}
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] 
                               px-3 py-2 text-sm text-black dark:text-white text-center focus:outline-none focus:border-epam-cyan"
                    />
                  </div>
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interview Flow */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              Interview Flow
            </label>
            <div className="space-y-2">
              {localModel.interview_flow.map((phase, index) => (
                <div key={phase} className="flex items-center gap-4 p-4 border-l-2 border-epam-cyan bg-epam-cyan/5">
                  <span className="w-6 h-6 flex items-center justify-center bg-epam-cyan text-black text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-black dark:text-white capitalize">
                    {phase.replace('_', ' ')}
                  </span>
                  {isEditable && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFlowItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-epam-cyan disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFlowItem(index, 'down')}
                        disabled={index === localModel.interview_flow.length - 1}
                        className="p-1 text-gray-400 hover:text-epam-cyan disabled:opacity-30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFlowChange(phase, false)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                  {INTERVIEW_PHASES.filter(p => !localModel.interview_flow.includes(p)).map(phase => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => handleFlowChange(phase, true)}
                      className="px-3 py-2 text-xs font-medium
                               border border-dashed border-gray-300 dark:border-[#3A3A3A]
                               text-gray-500 hover:text-epam-cyan hover:border-epam-cyan
                               transition-colors duration-200 capitalize"
                    >
                      + {phase.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
