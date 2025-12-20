'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FileUpload from '@/components/FileUpload'
import JDSelector from '@/components/JDSelector'
import ResumeSelector from '@/components/ResumeSelector'

interface CategoryConfig {
  enabled: boolean
  count: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface QuestionCategories {
  coding: CategoryConfig
  conceptual: CategoryConfig
  system_design: CategoryConfig
  problem_solving: CategoryConfig
}

interface InterviewPreset {
  id: string
  name: string
  description: string
  icon: string
  categories: QuestionCategories
}

const INTERVIEW_PRESETS: InterviewPreset[] = [
  {
    id: 'coding_challenge',
    name: 'Coding Challenge',
    description: 'Focus on coding skills',
    icon: '💻',
    categories: {
      coding: { enabled: true, count: 1, difficulty: 'medium' },
      conceptual: { enabled: true, count: 1, difficulty: 'medium' },
      system_design: { enabled: true, count: 1, difficulty: 'medium' },
      problem_solving: { enabled: true, count: 1, difficulty: 'medium' }
    }
  },
  {
    id: 'full_technical',
    name: 'Full Technical',
    description: 'Balanced assessment',
    icon: '📋',
    categories: {
      coding: { enabled: true, count: 1, difficulty: 'medium' },
      conceptual: { enabled: true, count: 1, difficulty: 'medium' },
      system_design: { enabled: true, count: 1, difficulty: 'medium' },
      problem_solving: { enabled: true, count: 1, difficulty: 'medium' }
    }
  },
  {
    id: 'system_design',
    name: 'System Design',
    description: 'Architecture focus',
    icon: '🏗️',
    categories: {
      coding: { enabled: true, count: 1, difficulty: 'medium' },
      conceptual: { enabled: true, count: 1, difficulty: 'medium' },
      system_design: { enabled: true, count: 1, difficulty: 'medium' },
      problem_solving: { enabled: true, count: 1, difficulty: 'medium' }
    }
  },
  {
    id: 'conceptual_deep',
    name: 'Conceptual Deep Dive',
    description: 'Theory and fundamentals',
    icon: '📚',
    categories: {
      coding: { enabled: true, count: 1, difficulty: 'medium' },
      conceptual: { enabled: true, count: 1, difficulty: 'medium' },
      system_design: { enabled: true, count: 1, difficulty: 'medium' },
      problem_solving: { enabled: true, count: 1, difficulty: 'medium' }
    }
  }
]

export default function QuickStartPage() {
  const router = useRouter()
  const [jdText, setJdText] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [selectedJd, setSelectedJd] = useState<string>('')
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [jds, setJds] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    coding: false,  // Unchecked by default - will be auto-selected for technical roles
    conceptual: false,  // Unchecked by default
    system_design: false,  // Unchecked by default
    problem_solving: false,  // Unchecked by default
    behavioral: true,  // Checked by default - useful for most roles
    communication: true  // Checked by default - useful for most roles
  })
  const [categoryDifficulties, setCategoryDifficulties] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({
    coding: 'medium',
    conceptual: 'medium',
    system_design: 'medium',
    problem_solving: 'medium',
    behavioral: 'medium',
    communication: 'medium'
  })
  const [jobType, setJobType] = useState<string>('')
  const [categoryReasoning, setCategoryReasoning] = useState<string>('')
  const [analyzingJD, setAnalyzingJD] = useState(false)

  // Calculate total duration based on selected categories and difficulties
  const calculateDuration = () => {
    const difficultyMinutes = { easy: 10, medium: 15, hard: 20 }
    let total = 0

    Object.entries(selectedCategories).forEach(([category, isSelected]) => {
      if (isSelected) {
        const difficulty = categoryDifficulties[category] || 'medium'
        total += difficultyMinutes[difficulty]
      }
    })
    return total
  }

  // Load JDs and Resumes on mount
  useEffect(() => {
    fetch(apiUrl('api/jds'))
      .then(res => res.json())
      .then(data => setJds(data.jds || []))
      .catch(err => console.error('Error loading JDs:', err))

    fetch(apiUrl('api/resumes'))
      .then(res => res.json())
      .then(data => setResumes(data.resumes || []))
      .catch(err => console.error('Error loading Resumes:', err))
  }, [])

  // Update JD textarea when JD is selected
  useEffect(() => {
    if (selectedJd) {
      const jd = jds.find(j => j.id === selectedJd)
      if (jd) {
        setJdText(jd.text)
        setJdFile(null)
      }
    } else {
      if (!jdFile) {
        setJdText('')
      }
    }
  }, [selectedJd, jds])

  // Update Resume textarea when Resume is selected
  useEffect(() => {
    if (selectedResume) {
      const resume = resumes.find(r => r.id === selectedResume)
      if (resume) {
        setResumeText(resume.text)
        setResumeFile(null)
      }
    } else {
      if (!resumeFile) {
        setResumeText('')
      }
    }
  }, [selectedResume, resumes])

  // Auto-analyze JD and suggest categories
  useEffect(() => {
    const analyzeJD = async () => {
      if (!jdText && !selectedJd) return

      setAnalyzingJD(true)
      try {
        const formData = new FormData()

        let finalJdText = jdText
        if (selectedJd) {
          const jd = jds.find(j => j.id === selectedJd)
          if (jd) finalJdText = jd.text
        }

        if (!finalJdText) return

        formData.append('jd_text', finalJdText)

        const response = await fetch(apiUrl('api/analyze-jd-categories'), {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setSelectedCategories(data.suggested_categories)
          setJobType(data.job_type)
          setCategoryReasoning(data.reasoning)
        }
      } catch (error) {
        console.error('Error analyzing JD:', error)
      } finally {
        setAnalyzingJD(false)
      }
    }

    // Debounce the analysis
    const timer = setTimeout(() => {
      analyzeJD()
    }, 1000)

    return () => clearTimeout(timer)
  }, [jdText, selectedJd, jds])

  const handleStartInterview = async () => {
    if (!jdText && !jdFile && !selectedJd) {
      alert('Please provide a job description')
      return
    }
    if (!resumeText && !resumeFile && !selectedResume) {
      alert('Please provide a resume')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()

      let finalJdText = jdText
      if (selectedJd) {
        const jd = jds.find(j => j.id === selectedJd)
        if (jd) finalJdText = jd.text
      }

      let finalResumeText = resumeText
      if (selectedResume) {
        const resume = resumes.find(r => r.id === selectedResume)
        if (resume) finalResumeText = resume.text
      }

      if (finalJdText) formData.append('jd_text', finalJdText)
      if (jdFile) formData.append('jd_file', jdFile)
      if (finalResumeText) formData.append('resume_text', finalResumeText)
      if (resumeFile) formData.append('resume_file', resumeFile)
      if (selectedJd) formData.append('jd_id', selectedJd)
      if (selectedResume) formData.append('resume_id', selectedResume)
      formData.append('expert_mode', 'true')  // Quick Start always uses expert mode

      // Send selected categories with difficulties
      const categoriesWithDifficulty: any = {}
      Object.entries(selectedCategories).forEach(([category, isSelected]) => {
        categoriesWithDifficulty[category] = {
          enabled: isSelected,
          count: 1,
          difficulty: categoryDifficulties[category] || 'medium'
        }
      })
      formData.append('question_categories', JSON.stringify(categoriesWithDifficulty))

      // Default Metadata for Quick Start
      formData.append('candidate_account', 'INRT-Bench')
      formData.append('candidate_role', 'Bench-Pool')

      const response = await fetch(apiUrl('api/analyze-language'), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.session_id) {
        localStorage.setItem('current_session_id', data.session_id)
        localStorage.setItem('current_language', data.language)
        localStorage.setItem('expert_mode', 'true')  // Quick Start always uses expert mode

        const candidateUrl = `/interview?view=candidate&session_id=${data.session_id}&lang=${data.language}`
        router.push(candidateUrl)

        // Open expert view for the interviewer
        setTimeout(() => {
          const expertUrl = `${window.location.origin}/interview?view=expert&session_id=${data.session_id}&lang=${data.language}`
          window.open(expertUrl, '_blank', 'noopener,noreferrer')
        }, 1000)
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
      <Header showQuickStart={false} showBackToDashboard={true} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium mb-6
                            border border-brand-primary text-brand-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              QUICK START
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-black dark:text-white leading-tight mb-6">
              Quick Start
              <br />
              <span className="font-normal">Interview</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-light">
              Upload a job description and resume to quickly start an interview without pre-configured position settings.
            </p>
          </div>
        </section>

        {/* Category Selection */}
        <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-medium text-brand-primary uppercase tracking-[0.2em]">
                Select Question Categories
              </h2>
              {analyzingJD && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  Analyzing JD...
                </div>
              )}
              {jobType && !analyzingJD && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${jobType === 'technical' ? 'bg-blue-500/10 text-blue-400' :
                    jobType === 'non-technical' ? 'bg-green-500/10 text-green-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                    {jobType === 'technical' ? '💻 Technical Role' :
                      jobType === 'non-technical' ? '👥 Non-Technical Role' :
                        '🔀 Hybrid Role'}
                  </span>
                </div>
              )}
            </div>

            {categoryReasoning && !analyzingJD && (
              <div className="mb-6 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded text-xs text-gray-600 dark:text-gray-400">
                <span className="text-brand-primary font-medium">✨ Auto-selected: </span>
                {categoryReasoning}
              </div>
            )}

            {/* Category Checkboxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { key: 'coding', icon: '💻', label: 'Coding', description: 'Algorithms & DS' },
                { key: 'conceptual', icon: '📚', label: 'Conceptual', description: 'Theory & concepts' },
                { key: 'system_design', icon: '🏗️', label: 'System Design', description: 'Architecture' },
                { key: 'problem_solving', icon: '🧩', label: 'Problem Solving', description: 'Real scenarios' },
                { key: 'behavioral', icon: '🤝', label: 'Behavioral', description: 'Soft skills' },
                { key: 'communication', icon: '💬', label: 'Communication', description: 'Clarity & articulation' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategories(prev => ({
                    ...prev,
                    [cat.key]: !prev[cat.key]
                  }))}
                  className={`p-4 border text-left transition-all duration-200
                             ${selectedCategories[cat.key]
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 dark:border-[#2A2A2A] hover:border-brand-primary/50'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">{cat.icon}</div>
                    {selectedCategories[cat.key] && (
                      <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className={`font-medium text-sm mb-1 ${selectedCategories[cat.key] ? 'text-brand-primary' : 'text-black dark:text-white'}`}>
                    {cat.label}
                  </div>
                  <div className="text-xs text-gray-500">{cat.description}</div>
                </button>
              ))}
            </div>

            {/* Duration and Difficulty Selectors */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-brand-primary/5 border border-brand-primary/20">
                <span className="text-sm font-medium text-brand-primary">Total Duration</span>
                <span className="text-lg font-bold text-brand-primary">{calculateDuration()} minutes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(selectedCategories)
                  .filter(([_, isSelected]) => isSelected)
                  .map(([category]) => (
                    <div key={category} className="p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-black dark:text-white capitalize">
                          {category.replace('_', ' ')}
                        </span>
                      </div>
                      <select
                        value={categoryDifficulties[category] || 'medium'}
                        onChange={(e) => setCategoryDifficulties(prev => ({
                          ...prev,
                          [category]: e.target.value as 'easy' | 'medium' | 'hard'
                        }))}
                        className="w-full appearance-none bg-white dark:bg-black border border-gray-200 dark:border-[#2A2A2A] 
                                 px-3 py-2 text-sm text-black dark:text-white capitalize
                                 focus:outline-none focus:border-brand-primary"
                      >
                        <option value="easy">Easy (10 min)</option>
                        <option value="medium">Medium (15 min)</option>
                        <option value="hard">Hard (20 min)</option>
                      </select>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Job Description Section */}
            <div>
              <h2 className="text-xs font-medium text-brand-primary uppercase tracking-[0.2em] mb-6">
                Job Description
              </h2>

              <div className="space-y-4">
                <JDSelector
                  jds={jds}
                  selectedJd={selectedJd}
                  onSelectJd={setSelectedJd}
                />

                <FileUpload
                  label="Job Description"
                  text={jdText}
                  onTextChange={(text) => {
                    setJdText(text)
                    if (text && selectedJd) setSelectedJd('')
                  }}
                  file={jdFile}
                  onFileChange={(file) => {
                    setJdFile(file)
                    if (file && selectedJd) setSelectedJd('')
                  }}
                  disabled={!!selectedJd}
                />
              </div>
            </div>

            {/* Resume Section */}
            <div>
              <h2 className="text-xs font-medium text-brand-primary uppercase tracking-[0.2em] mb-6">
                Resume
              </h2>

              <div className="space-y-4">
                <ResumeSelector
                  resumes={resumes}
                  selectedResume={selectedResume}
                  onSelectResume={setSelectedResume}
                />

                <FileUpload
                  label="Resume"
                  text={resumeText}
                  onTextChange={(text) => {
                    setResumeText(text)
                    if (text && selectedResume) setSelectedResume('')
                  }}
                  file={resumeFile}
                  onFileChange={(file) => {
                    setResumeFile(file)
                    if (file && selectedResume) setSelectedResume('')
                  }}
                  disabled={!!selectedResume}
                />
              </div>
            </div>
          </div>

          {/* Start Interview Button */}
          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-[#2A2A2A]">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => handleStartInterview()}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 h-12 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    </svg>
                    Start Interview
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-500 text-center pt-3">
                Opens candidate view here and expert view in new tab
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
