'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AccountGrid from '@/components/AccountGrid'
import PositionGrid from '@/components/PositionGrid'
import DataModelPanel from '@/components/DataModelPanel'
import CandidateSelector from '@/components/CandidateSelector'
import FileUpload from '@/components/FileUpload'
import AddPositionModal from '@/components/AddPositionModal'
import AddAccountModal from '@/components/AddAccountModal'
import AccountDetail from '@/components/AccountDetail'
import PositionDetail from '@/components/PositionDetail'
import WikiWidget from '@/components/WikiWidget'
import InterviewLinksModal from '@/components/InterviewLinksModal'
import EmailSentModal from '@/components/EmailSentModal'
import { apiUrl } from '@/config/api'

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
}

export default function DashboardPage() {
  const router = useRouter()

  // State
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allPositions, setAllPositions] = useState<Position[]>([]) // All positions for account stats
  const [accountPositions, setAccountPositions] = useState<Position[]>([]) // Positions for selected account
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [startingInterview, setStartingInterview] = useState(false)
  const [dataModel, setDataModel] = useState<DataModel | null>(null)
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)

  // Sidebar state
  const [sidebarType, setSidebarType] = useState<'account' | 'position' | null>(null)
  const [sidebarId, setSidebarId] = useState<string | null>(null)

  // Interview Links Modal state
  const [showInterviewLinks, setShowInterviewLinks] = useState(false)
  const [interviewSessionData, setInterviewSessionData] = useState<{
    session_id: string
    position: { id: string; title: string }
    candidate: { id: string; name: string }
    links: { candidate: string; expert: string }  // Changed from admin to expert
    expires_at?: string
    ttl_minutes?: number
  } | null>(null)

  // TTL for interview links
  const [linkTTL, setLinkTTL] = useState(60) // Default 1 hour for easier debugging

  // Check for available results
  const [hasResults, setHasResults] = useState(false)
  const [resultUrl, setResultUrl] = useState('')

  // Email invite state
  const [sendEmailInvite, setSendEmailInvite] = useState(false)
  const [candidateEmail, setCandidateEmail] = useState('brut.aditya@gmail.com')
  const [showEmailSent, setShowEmailSent] = useState(false)
  const [emailSentData, setEmailSentData] = useState<any>(null)

  // Step 2/2 Configuration state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [aiSuggestedConfig, setAiSuggestedConfig] = useState<any>(null)
  const [editableConfig, setEditableConfig] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Load accounts and all positions on mount
  useEffect(() => {
    // Check for stored result URL
    const storedResultUrl = sessionStorage.getItem('last_result_url')
    if (storedResultUrl) {
      setHasResults(true)
      setResultUrl(storedResultUrl)
    }

    Promise.all([
      fetch(apiUrl('api/accounts')).then(res => res.json()),
      fetch(apiUrl('api/positions')).then(res => res.json())
    ])
      .then(([accountsData, positionsData]) => {
        setAccounts(accountsData.accounts || [])
        setAllPositions(positionsData.positions || [])
        // Don't auto-select - user must choose
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
      setPositionsLoading(true)
      fetch(apiUrl(`api/accounts/${selectedAccount}/positions`))
        .then(res => res.json())
        .then(data => {
          setAccountPositions(data.positions || [])
          setSelectedPosition('')
          setSelectedCandidate('')
          setResumeText('')
          setDataModel(null)
          setPositionsLoading(false)
        })
        .catch(err => {
          console.error('Error loading positions:', err)
          setPositionsLoading(false)
        })
    }
  }, [selectedAccount])

  // Update data model when position changes
  useEffect(() => {
    if (selectedPosition) {
      const position = accountPositions.find(p => p.id === selectedPosition)
      if (position?.data_model) {
        setDataModel(position.data_model)
      }
      setSelectedCandidate('')
      setResumeText('')
    } else {
      setDataModel(null)
    }
  }, [selectedPosition, accountPositions])

  const handleCandidateSelect = (candidateId: string, resumeTextFromCandidate?: string) => {
    setSelectedCandidate(candidateId)
    if (resumeTextFromCandidate) {
      setResumeText(resumeTextFromCandidate)
      setResumeFile(null)
    }
  }

  const handleStartInterview = async (expertMode: boolean = false) => {
    // Step-by-step validation
    if (!selectedAccount) {
      alert('Please select an account first')
      return
    }
    if (!selectedPosition) {
      alert('Please select a position')
      return
    }
    if (!resumeText && !resumeFile && !selectedCandidate) {
      alert('Please select a candidate or provide a resume')
      return
    }

    setStartingInterview(true)

    try {
      // First create the interview session to get unique links
      const sessionResponse = await fetch(apiUrl('api/interview/create-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: selectedPosition,
          candidate_id: selectedCandidate || 'custom',
          ttl_minutes: linkTTL,
          resume_text: resumeText || undefined,
          send_email: sendEmailInvite,  // NEW: Email flag
          candidate_email: sendEmailInvite ? candidateEmail : undefined  // NEW: Email address
        })
      })

      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok) {
        // Check if it's just an email error but session was created
        if (sessionData.session_id && sessionData.detail?.includes('email')) {
          console.warn('Session created but email failed:', sessionData.detail)
          // Continue to show QR modal - email failure is non-critical
        } else {
          throw new Error(sessionData.detail || 'Failed to create session')
        }
      }

      // Store session info for the interview
      localStorage.setItem('current_session_id', sessionData.session_id)
      localStorage.setItem('expert_mode', expertMode ? 'true' : 'false')
      localStorage.setItem('position_id', selectedPosition)
      if (selectedCandidate) {
        localStorage.setItem('candidate_id', selectedCandidate)
      }
      if (resumeText) {
        localStorage.setItem('resume_text', resumeText)
      }

      // Get position title for display
      const position = accountPositions.find(p => p.id === selectedPosition)

      // Get candidate name
      let candidateName = 'Custom Resume'
      if (selectedCandidate) {
        try {
          const candidateRes = await fetch(apiUrl(`api/resumes/${selectedCandidate}`))
          const candidateData = await candidateRes.json()
          candidateName = candidateData.name || candidateName
        } catch (e) {
          console.error('Failed to fetch candidate name:', e)
        }
      }

      // NEW: Check if email was sent
      if (sessionData.email_sent) {
        // Show email sent modal instead of QR modal
        setEmailSentData({
          candidateEmail: sessionData.candidate_email,
          expertLink: sessionData.expert_link,
          positionTitle: position?.title || 'Unknown Position',
          emailProvider: sessionData.email_provider
        })
        setShowEmailSent(true)
      } else {
        // Show the interview links modal (QR codes)
        setInterviewSessionData({
          session_id: sessionData.session_id,
          position: {
            id: selectedPosition,
            title: position?.title || 'Unknown Position'
          },
          candidate: {
            id: selectedCandidate || 'custom',
            name: candidateName
          },
          links: sessionData.links,
          expires_at: sessionData.expires_at,
          ttl_minutes: sessionData.ttl_minutes
        })
        setShowInterviewLinks(true)
      }


    } catch (error) {
      console.error('Error creating interview session:', error)
      alert('Failed to create interview session. Please try again.')
    } finally {
      setStartingInterview(false)
    }
  }

  const handleDataModelUpdate = async (updatedModel: DataModel) => {
    setDataModel(updatedModel)

    if (selectedPosition) {
      try {
        await fetch(apiUrl(`api/positions/${selectedPosition}/config`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedModel)
        })
      } catch (err) {
        console.error('Error saving data model:', err)
      }
    }
  }

  const refreshPositions = () => {
    if (selectedAccount) {
      fetch(apiUrl(`api/accounts/${selectedAccount}/positions`))
        .then(res => res.json())
        .then(data => {
          setAccountPositions(data.positions || [])
        })
    }
    // Also refresh all positions for account stats
    fetch(apiUrl('api/positions'))
      .then(res => res.json())
      .then(data => {
        setAllPositions(data.positions || [])
      })
  }

  const refreshAccounts = () => {
    fetch(apiUrl('api/accounts'))
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || [])
        if (data.accounts && data.accounts.length > 0 && !selectedAccount) {
          setSelectedAccount(data.accounts[0].id)
        }
      })
  }

  const selectedAccountData = accounts.find(a => a.id === selectedAccount)
  const selectedPositionData = accountPositions.find(p => p.id === selectedPosition)

  // Sidebar handlers - with toggle support
  const handleAccountSelect = (accountId: string) => {
    // Toggle: if clicking same account, deselect it completely
    if (selectedAccount === accountId) {
      setSelectedAccount('')
      setSelectedPosition('')
      setSidebarType(null)
      setSidebarId(null)
      return
    }
    setSelectedAccount(accountId)
    setSelectedPosition('') // Clear position when switching accounts
    setSidebarType('account')
    setSidebarId(accountId)
  }

  const handlePositionSelect = (positionId: string) => {
    // Toggle: if clicking same position, deselect it
    if (selectedPosition === positionId && sidebarType === 'position') {
      setSelectedPosition('')
      setSidebarType(null)
      setSidebarId(null)
      return
    }
    setSelectedPosition(positionId)
    setSidebarType('position')
    setSidebarId(positionId)
  }

  const handleSidebarClose = () => {
    setSidebarType(null)
    setSidebarId(null)
  }

  // Step 2/2 Handlers
  const handleNextToConfig = async () => {
    if (!selectedPosition) return

    const position = accountPositions.find(p => p.id === selectedPosition)
    if (!position) return

    setIsAnalyzing(true)
    setCurrentStep(2)

    try {
      // Call AI analysis endpoint
      const response = await fetch(apiUrl('api/analyze-jd'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: position.jd_text || '',
          position_title: position.title
        })
      })

      if (!response.ok) throw new Error('Failed to analyze JD')

      const data = await response.json()

      // Convert response to our format
      const config: any = {}
      for (const [category, settings] of Object.entries(data.question_categories)) {
        config[category] = settings
      }

      setAiSuggestedConfig(config)
      setEditableConfig(config)
    } catch (error) {
      console.error('JD analysis failed:', error)
      // Fallback to default config
      const defaultConfig = {
        coding: { enabled: true, difficulty_level: 'medium' },
        behavioral: { enabled: true, difficulty_level: 'medium' },
        system_design: { enabled: false, difficulty_level: 'hard' },
        problem_solving: { enabled: true, difficulty_level: 'medium' },
        conceptual: { enabled: false, difficulty_level: 'easy' },
        technical_knowledge: { enabled: false, difficulty_level: 'medium' },
        safety: { enabled: false, difficulty_level: 'easy' }
      }
      setAiSuggestedConfig(null)
      setEditableConfig(defaultConfig)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
    setAiSuggestedConfig(null)
    setEditableConfig(null)
  }

  const handleHideSidebar = () => {
    setSidebarType(null)
    setSidebarId(null)
  }

  const handleSidebarUpdate = () => {
    refreshAccounts()
    refreshPositions()
  }

  const handleSidebarDelete = () => {
    if (sidebarType === 'account') {
      setSelectedAccount('')
      refreshAccounts()
    } else if (sidebarType === 'position') {
      setSelectedPosition('')
      refreshPositions()
    }
  }

  const showAccountPanel = sidebarType === 'account' && sidebarId
  const showPositionPanel = sidebarType === 'position' && sidebarId

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
      <Header showQuickStart={true} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white leading-tight mb-3">
                  Interview
                  <span className="font-normal"> Dashboard</span>
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-light">
                  Configure and launch AI-powered interviews for your candidates.
                </p>
              </div>

              {/* View Results Button */}
              {hasResults && (
                <button
                  onClick={() => router.push(resultUrl)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#39FF14] text-black font-semibold rounded-xl hover:bg-[#39FF14]/90 transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Results
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-12">
            {/* Accounts Section with Inline Panel */}
            <div>
              <h2 className="text-xs font-medium text-[#00E5FF] uppercase tracking-[0.2em] mb-6">
                Accounts ({accounts.length})
              </h2>
              <div className="flex gap-4">
                {/* Account Grid */}
                <div className={`transition-all duration-300 ${showAccountPanel ? 'flex-1' : 'w-full'}`}>
                  <AccountGrid
                    accounts={accounts}
                    positions={allPositions}
                    selectedAccount={selectedAccount}
                    onSelectAccount={handleAccountSelect}
                    onAddAccount={() => setShowAddAccount(true)}
                    loading={loading}
                  />
                </div>

                {/* Inline Account Detail Panel */}
                {showAccountPanel && (
                  <div className="w-[340px] flex-shrink-0 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] animate-slide-in-right">
                    <AccountDetail
                      accountId={sidebarId}
                      onUpdate={handleSidebarUpdate}
                      onDelete={handleSidebarDelete}
                      onClose={handleSidebarClose}
                      onAddPosition={() => setShowAddPosition(true)}
                    />
                    {/* Hide Button */}
                    <div className="p-3 border-t border-gray-200 dark:border-[#2A2A2A]">
                      <button
                        onClick={handleHideSidebar}
                        className="w-full py-2 text-xs text-gray-500 hover:text-[#00E5FF] flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                        Hide Panel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Positions Section with Inline Panel */}
            {selectedAccount && (
              <div>
                <h2 className="text-xs font-medium text-[#00E5FF] uppercase tracking-[0.2em] mb-6">
                  Positions {selectedAccountData && `for ${selectedAccountData.name}`}
                </h2>
                <div className="flex gap-4">
                  {/* Position Grid */}
                  <div className={`transition-all duration-300 ${showPositionPanel ? 'flex-1' : 'w-full'}`}>
                    <PositionGrid
                      positions={accountPositions}
                      selectedPosition={selectedPosition}
                      onSelectPosition={handlePositionSelect}
                      onAddPosition={() => setShowAddPosition(true)}
                      accountName={selectedAccountData?.name}
                      loading={positionsLoading}
                    />
                  </div>

                  {/* Inline Position Detail Panel */}
                  {showPositionPanel && (
                    <div className="w-[340px] flex-shrink-0 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] animate-slide-in-right">
                      <PositionDetail
                        positionId={sidebarId}
                        onUpdate={handleSidebarUpdate}
                        onDelete={handleSidebarDelete}
                        onClose={handleSidebarClose}
                      />
                      {/* Hide Button */}
                      <div className="p-3 border-t border-gray-200 dark:border-[#2A2A2A]">
                        <button
                          onClick={handleHideSidebar}
                          className="w-full py-2 text-xs text-gray-500 hover:text-[#00E5FF] flex items-center justify-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                          Hide Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configuration & Launch Section */}
            {selectedPosition && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Configuration */}
                <div className="lg:col-span-8">
                  <h2 className="text-xs font-medium text-[#00E5FF] uppercase tracking-[0.2em] mb-6">
                    Interview Configuration
                  </h2>
                  {dataModel && (
                    <DataModelPanel
                      dataModel={dataModel}
                      onUpdate={handleDataModelUpdate}
                      isEditable={true}
                      jdText={accountPositions.find(p => p.id === selectedPosition)?.jd_text || ''}
                    />
                  )}
                </div>

                {/* Right: Candidate & Start */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Selected Position Summary */}
                  {selectedPositionData && (
                    <div className="border-l-2 border-[#00E5FF] pl-4 py-1">
                      <h3 className="font-medium text-black dark:text-white">
                        {selectedPositionData.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedPositionData.data_model.duration_minutes} min • {selectedPositionData.data_model.experience_level}
                      </p>
                    </div>
                  )}

                  {/* Candidate Selection */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-[0.15em] mb-4">
                      Select Candidate
                    </h3>
                    <div className="border border-gray-200 dark:border-[#2A2A2A] p-4">
                      <CandidateSelector
                        positionId={selectedPosition || null}
                        selectedCandidate={selectedCandidate}
                        onSelectCandidate={handleCandidateSelect}
                      />
                    </div>
                  </div>

                  {/* Upload Resume */}
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-[0.15em] mb-4">
                      Or Upload Resume
                    </h3>
                    <FileUpload
                      label="Resume"
                      text={selectedCandidate ? '' : resumeText}
                      onTextChange={(text) => {
                        setResumeText(text)
                        if (text) setSelectedCandidate('')
                      }}
                      file={resumeFile}
                      onFileChange={(file) => {
                        setResumeFile(file)
                        if (file) setSelectedCandidate('')
                      }}
                      disabled={!!selectedCandidate}
                    />
                  </div>

                  {/* Link Expiry Selector */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#2A2A2A]">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                      Link Expiry (max 24hrs)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '2 min', value: 2 },
                        { label: '5 min', value: 5 },
                        { label: '10 min', value: 10 },
                        { label: '30 min', value: 30 },
                        { label: '1 hr', value: 60 },
                        { label: '2 hrs', value: 120 },
                        { label: '6 hrs', value: 360 },
                        { label: '24 hrs', value: 1440 },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setLinkTTL(option.value)}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${linkTTL === option.value
                            ? 'bg-[#00E5FF] text-black'
                            : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2A2A2A] hover:border-[#00E5FF]'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Invite Checkbox */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmailInvite}
                        onChange={(e) => setSendEmailInvite(e.target.checked)}
                        className="mt-1 w-4 h-4 text-[#00E5FF] border-gray-300 rounded focus:ring-[#00E5FF]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-black dark:text-white">
                            Send Email Invite
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-[#00E5FF]/20 text-[#00E5FF] rounded">
                            AI-Generated
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Send a professional, personalized interview invitation email to the candidate
                        </p>
                      </div>
                    </label>

                    {sendEmailInvite && (
                      <div className="mt-3 pl-7">
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                          Candidate Email
                        </label>
                        <input
                          type="email"
                          value={candidateEmail}
                          onChange={(e) => setCandidateEmail(e.target.value)}
                          placeholder="candidate@example.com"
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2A2A2A] bg-white dark:bg-black text-black dark:text-white rounded"
                          required={sendEmailInvite}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                          💡 Currently defaults to: brut.aditya@gmail.com
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Start Button - Expert Mode Only */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => handleStartInterview(true)}
                      disabled={startingInterview || !selectedPosition || (!resumeText && !resumeFile && !selectedCandidate)}
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                          </svg>
                          Start as Expert
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center pt-1">
                      Review and approve AI questions before sending to candidate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>

      {/* Add Position Modal */}
      <AddPositionModal
        isOpen={showAddPosition}
        onClose={() => setShowAddPosition(false)}
        accounts={accounts}
        selectedAccountId={selectedAccount}
        onPositionCreated={refreshPositions}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAccountCreated={() => {
          refreshAccounts()
          // Select the newly created account
          fetch(apiUrl('api/accounts'))
            .then(res => res.json())
            .then(data => {
              if (data.accounts && data.accounts.length > 0) {
                setSelectedAccount(data.accounts[data.accounts.length - 1].id)
              }
            })
        }}
      />

      {/* Interview Links Modal */}
      <InterviewLinksModal
        isOpen={showInterviewLinks}
        onClose={() => setShowInterviewLinks(false)}
        sessionData={interviewSessionData}
      />

      {/* Email Sent Modal */}
      {emailSentData && (
        <EmailSentModal
          isOpen={showEmailSent}
          onClose={() => setShowEmailSent(false)}
          candidateEmail={emailSentData.candidateEmail}
          expertLink={emailSentData.expertLink}
          positionTitle={emailSentData.positionTitle}
          emailProvider={emailSentData.emailProvider}
        />
      )}

      {/* Wiki Widget - Admin Only (Dashboard is admin-only by design) */}
      <WikiWidget />

    </div>
  )
}
