'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AccountSelector from '@/components/AccountSelector'
import PositionCard from '@/components/PositionCard'
import DataModelPanel from '@/components/DataModelPanel'
import ResumeSelector from '@/components/ResumeSelector'
import FileUpload from '@/components/FileUpload'

interface Account {
  id: string
  name: string
  org_id: string
  logo?: string
  description?: string
  positions?: string[]
}

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

export default function DashboardPage() {
  const router = useRouter()
  
  // State
  const [accounts, setAccounts] = useState<Account[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedResume, setSelectedResume] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingInterview, setStartingInterview] = useState(false)
  const [dataModel, setDataModel] = useState<DataModel | null>(null)

  // Load accounts on mount
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/accounts').then(res => res.json()),
      fetch('http://localhost:8000/api/resumes').then(res => res.json())
    ])
      .then(([accountsData, resumesData]) => {
        setAccounts(accountsData.accounts || [])
        setResumes(resumesData.resumes || [])
        if (accountsData.accounts?.length > 0) {
          setSelectedAccount(accountsData.accounts[0].id)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  // Load positions when account changes
  useEffect(() => {
    if (selectedAccount) {
      setLoading(true)
      fetch(`http://localhost:8000/api/accounts/${selectedAccount}/positions?status=open`)
        .then(res => res.json())
        .then(data => {
          setPositions(data.positions || [])
          setSelectedPosition('')
          setDataModel(null)
          setLoading(false)
        })
        .catch(err => {
          console.error('Error loading positions:', err)
          setLoading(false)
        })
    }
  }, [selectedAccount])

  // Update data model when position changes
  useEffect(() => {
    if (selectedPosition) {
      const position = positions.find(p => p.id === selectedPosition)
      if (position?.data_model) {
        setDataModel(position.data_model)
      }
    } else {
      setDataModel(null)
    }
  }, [selectedPosition, positions])

  // Update resume text when resume is selected
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
    if (!selectedPosition) {
      alert('Please select a position')
      return
    }
    if (!resumeText && !resumeFile && !selectedResume) {
      alert('Please provide a resume')
      return
    }

    setStartingInterview(true)

    try {
      const formData = new FormData()
      formData.append('position_id', selectedPosition)
      
      if (resumeText) formData.append('resume_text', resumeText)
      if (resumeFile) formData.append('resume_file', resumeFile)
      if (selectedResume) formData.append('resume_id', selectedResume)
      if (expertMode) formData.append('expert_mode', 'true')

      const response = await fetch('http://localhost:8000/api/interview/start', {
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
      setStartingInterview(false)
    }
  }

  const handleDataModelUpdate = async (updatedModel: DataModel) => {
    setDataModel(updatedModel)
    
    if (selectedPosition) {
      try {
        await fetch(`http://localhost:8000/api/positions/${selectedPosition}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedModel)
        })
      } catch (err) {
        console.error('Error saving data model:', err)
      }
    }
  }

  const selectedPositionData = positions.find(p => p.id === selectedPosition)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
      <Header showQuickStart={true} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <h1 className="text-5xl md:text-6xl font-light text-black dark:text-white leading-tight mb-6">
              Interview
              <br />
              <span className="font-normal">Dashboard</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-light">
              Configure and launch AI-powered interviews for your candidates with intelligent, adaptive assessments.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column - Account & Position Selection */}
            <div className="lg:col-span-8 space-y-12">
              {/* Account Selector */}
              <div>
                <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
                  Select Account
                </h2>
                <AccountSelector
                  accounts={accounts}
                  selectedAccount={selectedAccount}
                  onSelectAccount={setSelectedAccount}
                  loading={loading}
                />
              </div>

              {/* Positions Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em]">
                    Open Positions ({positions.length})
                  </h2>
                  <button
                    type="button"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-epam-cyan transition-colors flex items-center gap-1"
                    onClick={() => alert('Add position feature coming soon')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-[#2A2A2A]">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-epam-cyan rounded-full animate-spin"></div>
                    </div>
                  ) : positions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                      No open positions for this account
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-[#2A2A2A]">
                      {positions.map(position => (
                        <PositionCard
                          key={position.id}
                          position={position}
                          isSelected={selectedPosition === position.id}
                          onSelect={setSelectedPosition}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Model Configuration */}
              {selectedPosition && dataModel && (
                <div>
                  <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
                    Interview Configuration
                  </h2>
                  <DataModelPanel
                    dataModel={dataModel}
                    onUpdate={handleDataModelUpdate}
                    isEditable={true}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Resume & Start */}
            <div className="lg:col-span-4 space-y-8">
              {/* Selected Position Summary */}
              {selectedPositionData && (
                <div className="border-l-2 border-epam-cyan pl-6">
                  <h3 className="font-medium text-black dark:text-white mb-1">
                    {selectedPositionData.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPositionData.data_model.duration_minutes} min • {selectedPositionData.data_model.experience_level}
                  </p>
                </div>
              )}

              {/* Resume Upload */}
              <div>
                <h2 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
                  Candidate Resume
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

              {/* Start Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => handleStartInterview(false)}
                  disabled={startingInterview || !selectedPosition || (!resumeText && !resumeFile && !selectedResume)}
                  className="btn-primary w-full flex items-center justify-center gap-2 h-12 disabled:opacity-40"
                >
                  {startingInterview ? (
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
                  disabled={startingInterview || !selectedPosition || (!resumeText && !resumeFile && !selectedResume)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 h-12 disabled:opacity-40"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                  </svg>
                  Start as Expert
                </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2">
                  Expert mode: Review and approve AI questions
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
