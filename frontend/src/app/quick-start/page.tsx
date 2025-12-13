'use client'

import { useState, useEffect } from 'react'
import { apiUrl } from '@/config/api'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FileUpload from '@/components/FileUpload'
import JDSelector from '@/components/JDSelector'
import ResumeSelector from '@/components/ResumeSelector'

interface QuestionCategories {
  coding: { enabled: boolean; count: number }
  conceptual: { enabled: boolean; count: number }
  system_design: { enabled: boolean; count: number }
  problem_solving: { enabled: boolean; count: number }
}

interface InterviewPreset {
  id: string
  name: string
  description: string
  icon: string
  duration: number
  categories: QuestionCategories
}

const INTERVIEW_PRESETS: InterviewPreset[] = [
  {
    id: 'coding_challenge',
    name: 'Coding Challenge',
    description: 'Coding questions only (algorithms, DS)',
    icon: '💻',
    duration: 30,
    categories: {
      coding: { enabled: true, count: 3 },
      conceptual: { enabled: false, count: 0 },
      system_design: { enabled: false, count: 0 },
      problem_solving: { enabled: false, count: 0 }
    }
  },
  {
    id: 'full_technical',
    name: 'Full Technical',
    description: 'All question types balanced',
    icon: '📋',
    duration: 60,
    categories: {
      coding: { enabled: true, count: 2 },
      conceptual: { enabled: true, count: 2 },
      system_design: { enabled: true, count: 1 },
      problem_solving: { enabled: true, count: 1 }
    }
  },
  {
    id: 'system_design',
    name: 'System Design',
    description: 'Architecture & design focus',
    icon: '🏗️',
    duration: 45,
    categories: {
      coding: { enabled: false, count: 0 },
      conceptual: { enabled: true, count: 1 },
      system_design: { enabled: true, count: 3 },
      problem_solving: { enabled: true, count: 1 }
    }
  },
  {
    id: 'conceptual_deep',
    name: 'Conceptual Deep Dive',
    description: 'Theory and fundamentals',
    icon: '📚',
    duration: 45,
    categories: {
      coding: { enabled: false, count: 0 },
      conceptual: { enabled: true, count: 4 },
      system_design: { enabled: false, count: 0 },
      problem_solving: { enabled: true, count: 2 }
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
  const [selectedPreset, setSelectedPreset] = useState<string>('full_technical')

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

  const handleStartInterview = async (expertMode: boolean = false) => {
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
      if (expertMode) formData.append('expert_mode', 'true')

      const response = await fetch(apiUrl('api/analyze-language'), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.session_id) {
        localStorage.setItem('current_session_id', data.session_id)
        localStorage.setItem('current_language', data.language)
        localStorage.setItem('expert_mode', expertMode ? 'true' : 'false')
        
        const candidateUrl = `/interview?view=candidate&session_id=${data.session_id}&lang=${data.language}`
        router.push(candidateUrl)
        
        setTimeout(() => {
          const viewType = expertMode ? 'expert' : 'admin'
          const adminUrl = `${window.location.origin}/interview?view=${viewType}&session_id=${data.session_id}&lang=${data.language}`
          window.open(adminUrl, '_blank', 'noopener,noreferrer')
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
                            border border-epam-cyan text-epam-cyan">
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

        {/* Interview Type Presets */}
        <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
              Select Interview Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INTERVIEW_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-4 border text-left transition-all duration-200 group
                             ${selectedPreset === preset.id
                               ? 'border-epam-cyan bg-epam-cyan/5'
                               : 'border-gray-200 dark:border-[#2A2A2A] hover:border-epam-cyan/50'
                             }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <div className={`font-medium text-sm mb-1 ${
                    selectedPreset === preset.id ? 'text-epam-cyan' : 'text-black dark:text-white'
                  }`}>
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{preset.description}</div>
                  <div className="text-xs text-gray-400">{preset.duration} min</div>
                </button>
              ))}
            </div>
            
            {/* Show selected categories */}
            {selectedPreset && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#1A1A1A]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Questions:</span>
                  {Object.entries(INTERVIEW_PRESETS.find(p => p.id === selectedPreset)?.categories || {})
                    .filter(([_, config]) => config.enabled && config.count > 0)
                    .map(([category, config]) => (
                      <span key={category} className="px-2 py-1 text-xs bg-epam-cyan/10 text-epam-cyan border border-epam-cyan/20">
                        {category.replace('_', ' ')} × {config.count}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Job Description Section */}
            <div>
              <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
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
              <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
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

          {/* Start Interview Buttons */}
          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-[#2A2A2A]">
            <div className="max-w-md mx-auto space-y-3">
              <button
                onClick={() => handleStartInterview(false)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Start Interview
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleStartInterview(true)}
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2 h-12 disabled:opacity-40"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Start as Expert
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2">
                Expert mode: Review and approve AI questions before sending
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
