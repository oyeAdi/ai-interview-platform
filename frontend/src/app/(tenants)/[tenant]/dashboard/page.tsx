'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Building2,
    FileText,
    User,
    Search,
    Target,
    CheckCircle2,
    Rocket,
    ChevronLeft,
    Mail,
    Upload,
    Users
} from 'lucide-react'
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
import EmailPreviewModal from '@/components/EmailPreviewModal'
import ATSScoreModal from '@/components/ATSScoreModal'
import { apiUrl, getHeaders } from '@/config/api'
import { createClient } from '@/utils/supabase/client'

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

export default function TenantDashboardPage() {
    const router = useRouter()
    const params = useParams()
    const tenant = (params?.tenant as string) || 'global'

    // State
    const [accounts, setAccounts] = useState<Account[]>([])
    const [allPositions, setAllPositions] = useState<Position[]>([]) // All positions for account stats
    const [accountPositions, setAccountPositions] = useState<Position[]>([]) // Positions for selected account
    const [selectedAccount, setSelectedAccount] = useState('')
    const [selectedPosition, setSelectedPosition] = useState('')
    const [selectedCandidate, setSelectedCandidate] = useState('')
    const [selectedCandidateName, setSelectedCandidateName] = useState('')
    const [resumeText, setResumeText] = useState('')
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [candidateMode, setCandidateMode] = useState<'new' | 'pool'>('new') // New: upload/paste, Pool: from database
    const [loading, setLoading] = useState(true)
    const [positionsLoading, setPositionsLoading] = useState(false)
    const [startingInterview, setStartingInterview] = useState(false)
    const [dataModel, setDataModel] = useState<DataModel | null>(null)
    const [showAddPosition, setShowAddPosition] = useState(false)
    const [showAddAccount, setShowAddAccount] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Workflow State (7-Step Journey) - Universal Terminology
    const [currentStep, setCurrentStep] = useState(1)
    const steps = [
        { id: 1, label: 'Accounts', icon: <Building2 className="w-4 h-4" />, desc: 'Workspace Context' },
        { id: 2, label: 'Positions', icon: <FileText className="w-4 h-4" />, desc: 'Requirements' },
        { id: 3, label: 'Candidates', icon: <User className="w-4 h-4" />, desc: 'Profile Entity' },
        { id: 4, label: 'Analysis', icon: <Search className="w-4 h-4" />, desc: 'AI Analysis' },
        { id: 5, label: 'Strategy', icon: <Target className="w-4 h-4" />, desc: 'Strategy Map' },
        { id: 6, label: 'Review', icon: <CheckCircle2 className="w-4 h-4" />, desc: 'Expert Vetting' },
        { id: 7, label: 'Launch', icon: <Rocket className="w-4 h-4" />, desc: 'Launch' },
    ]

    // Sidebar state
    const [sidebarType, setSidebarType] = useState<'account' | 'position' | null>(null)
    const [sidebarId, setSidebarId] = useState<string | null>(null)

    // Interview Links Modal state
    const [showInterviewLinks, setShowInterviewLinks] = useState(false)
    const [interviewSessionData, setInterviewSessionData] = useState<any>(null)

    // TTL for interview links
    const [linkTTL, setLinkTTL] = useState(60)

    // Check for available results
    const [hasResults, setHasResults] = useState(false)
    const [resultUrl, setResultUrl] = useState('')

    // Email invite state
    const [sendEmailInvite, setSendEmailInvite] = useState(false)
    const [candidateEmail, setCandidateEmail] = useState('brut.aditya@gmail.com')
    const [showEmailSent, setShowEmailSent] = useState(false)
    const [emailSentData, setEmailSentData] = useState<any>(null)

    // AI States for Steps 4 & 5
    const [isAuditing, setIsAuditing] = useState(false)
    const [isStrategizing, setIsStrategizing] = useState(false)
    const [auditResults, setAuditResults] = useState<any>(null)
    const [strategyPlan, setStrategyPlan] = useState<any>(null)
    const [analysisPhase, setAnalysisPhase] = useState<'p0' | 'p1' | 'critique' | 'observer' | 'complete'>('p0')
    const [isConfigManual, setIsConfigManual] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)

    // ATS Modal State
    const [isATSModalOpen, setIsATSModalOpen] = useState(false)
    const [atsScore, setAtsScore] = useState(0)
    const [atsExplanation, setAtsExplanation] = useState('')
    const [isAnalyzingATS, setIsAnalyzingATS] = useState(false)

    // Load accounts and all positions on mount
    useEffect(() => {
        const supabase = createClient()

        async function loadData() {
            setLoading(true)
            try {
                const storedResultUrl = sessionStorage.getItem('last_result_url')
                if (storedResultUrl) {
                    setHasResults(true)
                    setResultUrl(storedResultUrl)
                }

                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }
                setUserId(user.id)

                const headers = getHeaders(user.id);

                const [accountsData, positionsData] = await Promise.all([
                    fetch(apiUrl('api/accounts'), { headers }).then(res => res.json()),
                    fetch(apiUrl('api/positions'), { headers }).then(res => res.json())
                ])

                setAccounts(accountsData.accounts || [])
                setAllPositions(positionsData.positions || [])
            } catch (err) {
                console.error('Error loading data:', err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Advance Step Logic
    const nextStep = () => {
        if (currentStep < 7) {
            setCurrentStep(prev => prev + 1)
            // Trigger AI actions based on step
            if (currentStep + 1 === 4) handleAIAudit()
            if (currentStep + 1 === 5) handleAIStrategy()
            if (currentStep + 1 === 6) handleGenerateEmail()
        }
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1)
    }

    const [generatedEmail, setGeneratedEmail] = useState<string>('')
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)

    const handleGenerateEmail = async () => {
        setIsGeneratingEmail(true)
        try {
            const response = await fetch(apiUrl('api/intelligence/generate-email'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    candidate_name: selectedCandidate || 'Candidate',
                    position_title: selectedPositionData?.title || 'Technical Role'
                })
            })
            const data = await response.json()
            setGeneratedEmail(data.email_body || "Failed to generate email content.")
        } catch (err) {
            console.error('Error generating email:', err)
            setGeneratedEmail("Error connecting to Executioner Agent.")
        } finally {
            setIsGeneratingEmail(false)
        }
    }

    const handleAIAudit = async (forceSkip: boolean = false) => {
        setIsAuditing(true)
        setAnalysisPhase('p0')
        try {
            const hasCandidateData = !forceSkip && (resumeText.trim() !== '' || !!resumeFile);

            // Simulate phase transitions for visual effect
            setTimeout(() => setAnalysisPhase('p1'), 1500)
            setTimeout(() => setAnalysisPhase('critique'), 3000)
            setTimeout(() => setAnalysisPhase('observer'), 4500)

            const response = await fetch(apiUrl('api/intelligence/audit'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    resume_text: hasCandidateData ? resumeText : '',
                    jd_text: selectedPositionData?.jd_text || '',
                    skip_candidate: !hasCandidateData
                })
            })
            const data = await response.json()
            setAuditResults({
                score: hasCandidateData ? (data.overall_match || 0) : 0,
                observations: [
                    data.explanation || (hasCandidateData ? "Analysis complete." : "Position requirements analysis complete. Proceeding with strategy map generation.")
                ],
                p0: data.p0_jd_summary,
                p1: data.p1_resume_summary,
                p3: data.p3_strengths,
                p4: data.p4_gaps,
                metadata: data.metadata,
                critique: data.critique,
                observer_notes: data.observer_notes
            })
            setAnalysisPhase('complete')
        } catch (err) {
            console.error('Error during AI Audit:', err)
            setAuditResults({ score: 0, observations: ["Failed to connect to AI Analyst."] })
        } finally {
            setIsAuditing(false)
        }
    }

    const handleAIStrategy = async () => {
        setIsStrategizing(true)
        try {
            const response = await fetch(apiUrl('api/intelligence/strategize'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    jd_text: selectedPositionData?.jd_text || '',
                    resume_text: resumeText
                })
            })
            const data = await response.json()
            setStrategyPlan(data)

            // Sync with DataModel if not in manual mode
            if (!isConfigManual && data.milestones) {
                const autoSkills = [
                    ...(auditResults?.p3 || []),
                    ...(auditResults?.p4 || [])
                ].map((s: string) => ({ skill: s, proficiency: 'Intermediate', weight: 5 }))

                setDataModel({
                    duration_minutes: data.estimated_duration || 60,
                    experience_level: auditResults?.metadata?.interview_level || 'Mid-Level',
                    expectations: data.strategy_narrative || '',
                    required_skills: autoSkills.length > 0 ? autoSkills : (dataModel?.required_skills || []),
                    interview_flow: data.milestones.map((m: any) => m.title)
                })
            }
            handleGenerateEmail() // Generate email once strategy is done
        } catch (err) {
            console.error('Error during AI Strategy:', err)
            setStrategyPlan({ milestones: ["Manual Strategy Required"] })
        } finally {
            setIsStrategizing(false)
        }
    }

    // Load positions when account changes
    useEffect(() => {
        if (selectedAccount) {
            setPositionsLoading(true)
            fetch(apiUrl(`api/accounts/${selectedAccount}/positions`), {
                headers: getHeaders(userId || undefined)
            })
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
    }, [selectedAccount, userId])

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

    const handleCandidateSelect = (
        candidateId: string,
        resumeTextFromCandidate?: string,
        candidateName?: string,
        matchScore?: number,
        matchReasoning?: string
    ) => {
        setSelectedCandidate(candidateId)
        if (candidateName) setSelectedCandidateName(candidateName)
        else setSelectedCandidateName('')

        if (resumeTextFromCandidate) {
            setResumeText(resumeTextFromCandidate)
            setResumeFile(null)
        }

        // Update ATS Modal state for the intermediate review step
        if (matchScore !== undefined) setAtsScore(matchScore)
        if (matchReasoning) setAtsExplanation(matchReasoning)

        // Show the review modal (ATSScoreModal) only if a candidate is actually selected
        if (candidateId) {
            setIsATSModalOpen(true)
        }
    }

    const handleCalculateATS = async () => {
        setIsATSModalOpen(true)
        setIsAnalyzingATS(true)

        try {
            let finalText = resumeText

            // 1. Parse File if exists
            if (resumeFile) {
                const formData = new FormData()
                formData.append('file', resumeFile)

                const headers = getHeaders(userId || undefined)
                // Remove Content-Type for FormData - browser sets it automatically with boundary
                delete headers['Content-Type']

                const parseRes = await fetch(apiUrl('api/utils/parse_resume'), {
                    method: 'POST',
                    headers,
                    body: formData
                })

                if (!parseRes.ok) {
                    const errorData = await parseRes.json().catch(() => ({ detail: 'Failed to parse resume file' }))
                    throw new Error(errorData.detail || 'Failed to parse resume file')
                }

                const parseData = await parseRes.json()
                finalText = parseData.text
                setResumeText(finalText) // Update state for subsequent steps
            }

            // 2. Audit (Get Score)
            const response = await fetch(apiUrl('api/intelligence/audit'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    resume_text: finalText,
                    jd_text: selectedPositionData?.jd_text || '',
                    skip_candidate: !finalText
                })
            })

            const data = await response.json()

            setAtsScore(data.overall_match || 0)
            setAtsExplanation(data.explanation || data.summary || "Analysis complete.")

            // Prepare results for Step 4 (Process Analysis)
            setAuditResults({
                score: data.overall_match || 0,
                observations: (data.explanation || "No detailed observations.").split('\n').filter(Boolean)
            })

        } catch (error: any) {
            console.error("ATS Calculation Failed:", error)
            setAtsScore(0)
            setAtsExplanation(error.message || String(error) || "Error calculating score. Please try again.")
        } finally {
            setIsAnalyzingATS(false)
        }
    }

    const handleSaveToPool = async () => {
        try {
            // Get org_id from selected account
            const orgId = selectedAccountData?.id || selectedAccount

            if (!orgId) {
                alert('Please select an account first')
                return
            }

            const response = await fetch(apiUrl('api/candidates'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    name: selectedCandidateName || resumeFile?.name?.replace(/\.(pdf|docx|txt)$/i, '') || 'Unnamed Candidate',
                    resume_text: resumeText,
                    skills: [], // TODO: Extract skills from ATS analysis if available
                    experience_years: null, // TODO: Extract from resume parsing
                    file_name: resumeFile?.name,
                    org_id: orgId
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to save candidate' }))
                throw new Error(errorData.detail || 'Failed to save candidate')
            }

            const data = await response.json()
            alert(`✅ Candidate saved to talent pool! ID: ${data.id}`)

        } catch (error: any) {
            console.error('Error saving to talent pool:', error)
            alert(`❌ Failed to save: ${error.message}`)
        }
    }

    const handleSkipCandidate = () => {
        setIsATSModalOpen(false)
        setSelectedCandidate('')
        setResumeText('')
        setResumeFile(null)
        handleAIAudit(true)
        setCurrentStep(4)
    }

    const handleStartInterview = async (expertMode: boolean = false) => {
        if (!selectedAccount || !selectedPosition) {
            alert('Please select both an account and a position to proceed.')
            return
        }

        setStartingInterview(true)

        try {
            const sessionResponse = await fetch(apiUrl('api/interview/create-session'), {
                method: 'POST',
                headers: getHeaders(userId || undefined),
                body: JSON.stringify({
                    position_id: selectedPosition,
                    candidate_id: selectedCandidate || 'custom',
                    ttl_minutes: linkTTL,
                    resume_text: resumeText || undefined,
                    send_email: sendEmailInvite,
                    candidate_email: sendEmailInvite ? candidateEmail : undefined
                })
            })

            const sessionData = await sessionResponse.json()

            if (!sessionResponse.ok && !sessionData.session_id) {
                throw new Error(sessionData.detail || 'Failed to create session')
            }

            // Store session info
            localStorage.setItem('current_session_id', sessionData.session_id)
            localStorage.setItem('expert_mode', expertMode ? 'true' : 'false')
            localStorage.setItem('position_id', selectedPosition)

            const position = accountPositions.find(p => p.id === selectedPosition)
            let candidateName = 'Custom Profile'

            if (sessionData.email_sent) {
                setEmailSentData({
                    candidateEmail: sessionData.candidate_email,
                    expertLink: sessionData.expert_link,
                    positionTitle: position?.title || 'Unknown Position',
                    emailProvider: sessionData.email_provider
                })
                setShowEmailSent(true)
            } else {
                setInterviewSessionData({
                    session_id: sessionData.session_id,
                    position: { id: selectedPosition, title: position?.title || 'Unknown Position' },
                    candidate: { id: selectedCandidate || 'custom', name: candidateName },
                    links: sessionData.links,
                    expires_at: sessionData.expires_at,
                    ttl_minutes: sessionData.ttl_minutes
                })
                setShowInterviewLinks(true)
            }
        } catch (error) {
            console.error('Error creating interview session:', error)
            alert('Failed to create interview session.')
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
                    headers: getHeaders(userId || undefined),
                    body: JSON.stringify(updatedModel)
                })
            } catch (err) {
                console.error('Error saving data model:', err)
            }
        }
    }

    const refreshPositions = () => {
        if (selectedAccount) {
            fetch(apiUrl(`api/accounts/${selectedAccount}/positions`), { headers: getHeaders(userId || undefined) })
                .then(res => res.json())
                .then(data => setAccountPositions(data.positions || []))
        }
        fetch(apiUrl('api/positions'), { headers: getHeaders(userId || undefined) })
            .then(res => res.json())
            .then(data => setAllPositions(data.positions || []))
    }

    const refreshAccounts = () => {
        fetch(apiUrl('api/accounts'), { headers: getHeaders(userId || undefined) })
            .then(res => res.json())
            .then(data => setAccounts(data.accounts || []))
    }

    const selectedAccountData = accounts.find(a => a.id === selectedAccount)
    const selectedPositionData = accountPositions.find(p => p.id === selectedPosition)

    const handleAccountSelect = (accountId: string) => {
        if (selectedAccount === accountId) {
            setSelectedAccount('')
            setSelectedPosition('')
            setSidebarType(null)
            return
        }
        setSelectedAccount(accountId)
        setSelectedPosition('')
        setSidebarType('account')
        setSidebarId(accountId)
    }

    const handlePositionSelect = (positionId: string) => {
        if (selectedPosition === positionId && sidebarType === 'position') {
            setSelectedPosition('')
            setSidebarType(null)
            return
        }
        setSelectedPosition(positionId)
        setSidebarType('position')
        setSidebarId(positionId)
    }

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200 font-inter relative overflow-hidden">
            {/* Premium Background Blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob pointer-events-none" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000 pointer-events-none" />

            <Header showQuickStart={true} title={`${tenant?.toUpperCase() || 'GLOBAL'} Dashboard`} />

            <main className="flex-1 flex flex-col relative z-10">
                {/* Slim, Minimal Stepper */}
                <section className="border-b border-gray-100 dark:border-white/[0.05] bg-white/50 dark:bg-black/50 backdrop-blur-xl sticky top-[64px] z-30">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            {steps.map((step, idx) => (
                                <div key={step.id} className="flex items-center gap-4 group">
                                    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => (currentStep > step.id) && setCurrentStep(step.id)}>
                                        <div className={`
                                            flex items-center justify-center transition-all duration-300
                                            ${currentStep === step.id ? 'text-orange-500 scale-110' :
                                                currentStep > step.id ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-700'}
                                        `}>
                                            {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                                        </div>
                                        <span className={`text-[10px] font-semibold tracking-[0.1em] uppercase ${currentStep === step.id ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className="w-8 h-[1px] bg-gray-100 dark:bg-[#111]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
                    <div className="h-full flex flex-col">
                        {/* Step 1: Accounts */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-10 text-center max-w-2xl mx-auto">
                                    <h2 className="text-3xl font-semibold tracking-tight mb-2">Select Account</h2>
                                    <p className="text-gray-500 text-sm">Select the organizational context where this intelligence session will operate.</p>
                                </div>
                                <AccountGrid
                                    accounts={accounts}
                                    positions={allPositions}
                                    selectedAccount={selectedAccount}
                                    onSelectAccount={(id) => { handleAccountSelect(id); nextStep(); }}
                                    onAddAccount={() => setShowAddAccount(true)}
                                    loading={loading}
                                />
                            </div>
                        )}

                        {/* Step 2: Positions */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-10 flex items-end justify-between border-b border-gray-100 dark:border-[#111] pb-6">
                                    <div>
                                        <button onClick={prevStep} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black dark:hover:text-white mb-2 transition-colors uppercase tracking-widest">
                                            <ChevronLeft className="w-3 h-3" /> Back
                                        </button>
                                        <h2 className="text-3xl font-semibold tracking-tight">Select Position</h2>
                                        <p className="text-gray-500 text-sm mt-1">Define the evaluation criteria for the <span className="text-black dark:text-white font-medium">{selectedAccountData?.name}</span> scope.</p>
                                    </div>
                                </div>
                                <PositionGrid
                                    positions={accountPositions}
                                    selectedPosition={selectedPosition}
                                    onSelectPosition={(id) => { handlePositionSelect(id); nextStep(); }}
                                    onAddPosition={() => setShowAddPosition(true)}
                                    accountName={selectedAccountData?.name}
                                    loading={positionsLoading}
                                />
                            </div>
                        )}

                        {/* Step 3: Candidates */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto w-full">
                                <div className="mb-10">
                                    <button onClick={prevStep} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black dark:hover:text-white mb-2 transition-colors uppercase tracking-widest">
                                        <ChevronLeft className="w-3 h-3" /> Back
                                    </button>
                                    <h2 className="text-3xl font-semibold tracking-tight">Select Candidate</h2>
                                    <p className="text-gray-500 text-sm mt-1">Select or import the profile to be evaluated against the established criteria.</p>
                                </div>

                                {/* Two-Mode Toggle */}
                                <div className="flex gap-3 mb-8 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl w-fit">
                                    <button
                                        onClick={() => setCandidateMode('new')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${candidateMode === 'new'
                                            ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        New Candidate
                                    </button>
                                    <button
                                        onClick={() => setCandidateMode('pool')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${candidateMode === 'pool'
                                            ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Users className="w-4 h-4" />
                                        From Talent Pool
                                    </button>
                                </div>

                                {candidateMode === 'new' ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="flex flex-col">
                                                <FileUpload
                                                    label="Technical Profile Import"
                                                    text={resumeText}
                                                    onTextChange={(text) => { setResumeText(text); setSelectedCandidate(''); }}
                                                    file={resumeFile}
                                                    onFileChange={(file) => { setResumeFile(file); setSelectedCandidate(''); }}
                                                />
                                            </div>
                                            <div className="flex flex-col justify-between">
                                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                                                    <h3 className="font-semibold mb-2">Upload Resume</h3>
                                                    <p className="text-sm text-gray-500 mb-4">Upload a PDF, DOCX, or TXT file, or paste the resume text directly.</p>
                                                    <div className="flex gap-2 text-xs text-gray-400">
                                                        <span className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 rounded">PDF</span>
                                                        <span className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 rounded">DOCX</span>
                                                        <span className="px-2 py-1 bg-gray-200 dark:bg-zinc-800 rounded">TXT</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleCalculateATS}
                                                    className="mt-8 flex items-center justify-center gap-3 bg-black dark:bg-white text-white dark:text-black h-14 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 shadow-xl shadow-orange-500/10"
                                                >
                                                    {(!resumeText && !resumeFile) ? 'Continue without Candidate' : 'Calculate ATS Score'} <Target className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CandidateSelector
                                            positionId={selectedPosition || null}
                                            userId={userId}
                                            selectedCandidate={selectedCandidate}
                                            onSelectCandidate={handleCandidateSelect}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 4: Audit */}
                        {currentStep === 4 && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center h-full max-w-4xl mx-auto py-12">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full">
                                    {/* Left Side: Score & Core metadata */}
                                    <div className="lg:col-span-5 flex flex-col items-center">
                                        <div className="relative mb-8">
                                            <div className={`w-40 h-40 rounded-full border-2 border-gray-100 dark:border-[#111] flex flex-col items-center justify-center bg-white dark:bg-black shadow-2xl ${isAuditing ? 'animate-pulse' : ''}`}>
                                                <div className="text-5xl font-black tracking-tighter text-black dark:text-white leading-none">
                                                    {auditResults?.score || '--'}
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mt-1">Match Index</div>
                                            </div>
                                            {isAuditing && (
                                                <div className="absolute -inset-2 border-t-2 border-orange-500 rounded-full animate-spin" />
                                            )}
                                        </div>

                                        <div className="text-center space-y-2 mb-10">
                                            <h2 className="text-2xl font-bold tracking-tight">Intelligence Audit</h2>
                                            <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">Multidimensional analysis of operational requirements vs agent profile.</p>
                                        </div>

                                        {/* Animation Phases */}
                                        <div className="w-full space-y-3 px-4">
                                            {[
                                                { id: 'p0', label: 'JD & Requirement Matrix (P0)', icon: <Target className="w-3.5 h-3.5" /> },
                                                { id: 'p1', label: 'Subject Profile Decryption (P1)', icon: <User className="w-3.5 h-3.5" /> },
                                                { id: 'critique', label: 'Critique Agent Peer-Review', icon: <Users className="w-3.5 h-3.5" /> },
                                                { id: 'observer', label: 'Observer Behavioral Patterning', icon: <Search className="w-3.5 h-3.5" /> }
                                            ].map((phase, i) => (
                                                <div key={phase.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${analysisPhase === phase.id ? 'bg-orange-500/5 border-orange-500/20 translate-x-1' : 'bg-gray-50/50 dark:bg-white/[0.02] border-transparent'}`}>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${analysisPhase === phase.id ? 'bg-orange-500 text-white animate-bounce' : 'bg-gray-100 dark:bg-[#111] text-gray-400'}`}>
                                                        {analysisPhase === 'complete' || (i < ['p0', 'p1', 'critique', 'observer'].indexOf(analysisPhase)) ? <CheckCircle2 className="w-3.5 h-3.5" /> : phase.icon}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${analysisPhase === phase.id ? 'text-orange-500' : 'text-gray-500'}`}>{phase.label}</span>
                                                    {analysisPhase === phase.id && <div className="ml-auto w-1 h-1 rounded-full bg-orange-500 animate-ping" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Side: Detailed Metadata Grid */}
                                    <div className="lg:col-span-7 space-y-6">
                                        {!isAuditing && auditResults && (
                                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Hiring Domain</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{auditResults.metadata?.domain || 'Technology'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Criticality</p>
                                                    <p className={`text-sm font-bold ${auditResults.metadata?.criticality === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {auditResults.metadata?.criticality || 'Medium'}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Interview Level</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{auditResults.metadata?.interview_level || 'Medium'}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Technical Focus</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{auditResults.metadata?.is_technical ? 'SDE / Engineering' : 'Non-Technical'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {!isAuditing && auditResults && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <div className="p-8 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111] shadow-xl overflow-hidden relative group">
                                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform text-gray-400">
                                                        <Rocket className="w-16 h-16" />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-6 text-gray-400">Strategic Blueprint Loaded</p>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Requirement</p>
                                                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{auditResults.p0 || "Core architecture and delivery standards identified."}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-[#111]">
                                                            <div>
                                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Strengths</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(auditResults.p3 || ['System Design', 'Scalability']).slice(0, 4).map((s: string, i: number) => (
                                                                        <span key={i} className="text-[9px] font-black uppercase tracking-tighter bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">{s}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Focus Gaps</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(auditResults.p4 || ['DevOps', 'E2E Testing']).slice(0, 4).map((g: string, i: number) => (
                                                                        <span key={i} className="text-[9px] font-black uppercase tracking-tighter bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-md">{g}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button onClick={nextStep} className="w-full h-14 rounded-xl bg-orange-500 text-white text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20">
                                                    Design Blueprint
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Strategy Map & Configuration */}
                        {currentStep === 5 && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 h-full max-w-6xl mx-auto py-12">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                                    {/* Left: Strategy Map */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <div className="space-y-4">
                                            <h2 className="text-2xl font-bold tracking-tight">Strategy Blueprint</h2>
                                            <p className="text-gray-500 text-xs leading-relaxed">AI-generated interview trajectory based on requirement audit.</p>
                                        </div>

                                        <div className="space-y-3 relative">
                                            <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100 dark:bg-[#111]" />
                                            {strategyPlan?.milestones?.map((milestone: any, i: number) => (
                                                <div key={i} className="relative pl-10">
                                                    <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white dark:border-black z-10" />
                                                    <div className="p-4 rounded-xl bg-white dark:bg-[#080808] border border-gray-100 dark:border-[#111] transition-all hover:border-orange-500/30 group">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{milestone.title}</span>
                                                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 uppercase">{milestone.difficulty}</span>
                                                        </div>
                                                        <ul className="space-y-1">
                                                            {milestone.focus?.map((f: string, fi: number) => (
                                                                <li key={fi} className="text-[10px] text-gray-500 flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                                    {f}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10">
                                            <p className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Rocket className="w-3 h-3" /> Narrative Approach
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                                "{strategyPlan?.strategy_narrative || "Evaluating core competencies through progressive technical challenges."}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Configuration Panel */}
                                    <div className="lg:col-span-8 flex flex-col">
                                        <div className="bg-white dark:bg-[#050505] border border-gray-200 dark:border-[#111] p-1.5 rounded-2xl mb-8 flex items-center shadow-xl shadow-orange-500/5">
                                            <button
                                                onClick={() => setIsConfigManual(false)}
                                                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${!isConfigManual ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${!isConfigManual ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                    <span className="text-xs">🤖</span>
                                                </div>
                                                AI Auto-Config
                                            </button>
                                            <button
                                                onClick={() => setIsConfigManual(true)}
                                                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isConfigManual ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${isConfigManual ? 'bg-white/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                                                    <span className="text-xs">⚙️</span>
                                                </div>
                                                Manual Override
                                            </button>
                                        </div>

                                        <div className={`flex-1 overflow-hidden transition-all duration-500`}>
                                            {dataModel && (
                                                <DataModelPanel
                                                    dataModel={dataModel}
                                                    onUpdate={setDataModel}
                                                    isEditable={isConfigManual}
                                                    jdText={selectedPositionData?.jd_text || ''}
                                                    userId={userId}
                                                />
                                            )}
                                        </div>

                                        <button onClick={nextStep} className="mt-8 w-full h-14 rounded-xl bg-orange-500 text-white text-xs font-black tracking-[0.3em] uppercase transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20">
                                            Proceed to Expert review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Final Review */}
                        {currentStep === 6 && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center h-full max-w-4xl mx-auto py-12">
                                <div className="text-center space-y-3 mb-12">
                                    <h2 className="text-3xl font-bold tracking-tight">Expert Review</h2>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">Confirm the interview parameters and invitation template before deployment.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                                    <div className="p-8 rounded-2xl bg-white dark:bg-[#080808] border border-gray-100 dark:border-[#111] shadow-xl">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                                <Target className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <h3 className="font-bold">Session Integrity</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between py-3 border-b border-gray-50 dark:border-[#111]">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Duration</span>
                                                <span className="text-xs font-black">{dataModel?.duration_minutes} Minutes</span>
                                            </div>
                                            <div className="flex justify-between py-3 border-b border-gray-50 dark:border-[#111]">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Level</span>
                                                <span className="text-xs font-black">{dataModel?.experience_level}</span>
                                            </div>
                                            <div className="flex justify-between py-3 border-b border-gray-50 dark:border-[#111]">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Skills Analyzed</span>
                                                <span className="text-xs font-black">{dataModel?.required_skills?.length} Entities</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-2xl bg-black dark:bg-white text-white dark:text-black shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                            <Mail className="w-16 h-16" />
                                        </div>
                                        <h3 className="font-bold mb-6 text-orange-500 uppercase tracking-widest text-[10px]">Communication Stack</h3>
                                        <p className="text-xs opacity-70 mb-8 leading-relaxed">
                                            AI has generated a custom invitation email tailored to the {auditResults?.metadata?.domain} role. Subject will include the position title and company header.
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] py-2 px-4 rounded-lg bg-white/10 dark:bg-black/10 hover:bg-orange-500 hover:text-white transition-all w-fit">
                                                Preview Invitation
                                            </button>
                                            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 dark:bg-black/5 border border-white/10 dark:border-black/10 mt-2">
                                                <input
                                                    type="checkbox"
                                                    checked={sendEmailInvite}
                                                    onChange={(e) => setSendEmailInvite(e.target.checked)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Send Invitation</label>
                                                    <p className="text-[9px] text-gray-400 leading-relaxed uppercase font-bold tracking-tighter">Dispatch link upon launch</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 w-full max-w-sm">
                                    <button onClick={nextStep}
                                        disabled={startingInterview}
                                        className="w-full h-16 rounded-2xl bg-orange-500 text-white text-sm font-black tracking-[0.4em] uppercase transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/40 disabled:opacity-50"
                                    >
                                        {startingInterview ? 'Initializing Swarm...' : 'Review Complete'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 7: Launch */}
                        {currentStep === 7 && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center justify-center h-full text-center space-y-16 py-20">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <h2 className="text-5xl font-semibold tracking-tight">Ready for Action.</h2>
                                    <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">All systems synchronized. Intelligence swarm operational. Ready to execute.</p>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-700" />
                                    <button
                                        onClick={() => handleStartInterview(true)}
                                        disabled={startingInterview}
                                        className="relative bg-black dark:bg-white text-white dark:text-black px-12 py-6 rounded-2xl text-xs font-black tracking-[0.4em] uppercase transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
                                    >
                                        {startingInterview ? 'Initializing...' : 'Launch Session'}
                                    </button>
                                </div>
                                <div className="flex gap-16 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                                    <div className="flex flex-col gap-3 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span>Swarm Operational</span>
                                    </div>
                                    <div className="flex flex-col gap-3 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                        <span>Expert HITL Locked</span>
                                    </div>
                                    <div className="flex flex-col gap-3 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span>Latency Optimal</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div >
                </section >
                <Footer />
            </main >

            <AddPositionModal isOpen={showAddPosition} onClose={() => setShowAddPosition(false)} accounts={accounts} selectedAccountId={selectedAccount} onPositionCreated={refreshPositions} />
            <AddAccountModal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} onAccountCreated={refreshAccounts} />
            <InterviewLinksModal isOpen={showInterviewLinks} onClose={() => setShowInterviewLinks(false)} sessionData={interviewSessionData} />
            <EmailSentModal isOpen={showEmailSent} onClose={() => setShowEmailSent(false)} {...emailSentData} />
            <EmailPreviewModal
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                candidateName={selectedCandidateName || 'Candidate'}
                positionTitle={selectedPositionData?.title || 'Position'}
                companyName="SwarmHire"
                userId={userId || undefined}
            />

            <ATSScoreModal
                isOpen={isATSModalOpen}
                onClose={() => setIsATSModalOpen(false)}
                onProceed={() => {
                    setIsATSModalOpen(false)
                    nextStep()
                }}
                candidateName={selectedCandidateName || resumeFile?.name || 'Custom Candidate'}
                score={atsScore}
                explanation={atsExplanation}
                resumeText={resumeText}
                jdText={selectedPositionData?.jd_text || ''}
                isAnalyzing={isAnalyzingATS}
                onSaveToPool={handleSaveToPool}
                candidateId={selectedCandidate}
                onSkipCandidate={handleSkipCandidate}
            />
        </div>
    )
}
