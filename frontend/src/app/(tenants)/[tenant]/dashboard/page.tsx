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
    Mail
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
import { apiUrl, getHeaders } from '@/config/api'

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
    const [resumeText, setResumeText] = useState('')
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(true)
    const [positionsLoading, setPositionsLoading] = useState(false)
    const [startingInterview, setStartingInterview] = useState(false)
    const [dataModel, setDataModel] = useState<DataModel | null>(null)
    const [showAddPosition, setShowAddPosition] = useState(false)
    const [showAddAccount, setShowAddAccount] = useState(false)

    // Workflow State (7-Step Journey) - Universal Terminology
    const [currentStep, setCurrentStep] = useState(1)
    const steps = [
        { id: 1, label: 'Scope', icon: <Building2 className="w-4 h-4" />, desc: 'Workspace Context' },
        { id: 2, label: 'Criteria', icon: <FileText className="w-4 h-4" />, desc: 'Requirements' },
        { id: 3, label: 'Subject', icon: <User className="w-4 h-4" />, desc: 'Profile Entity' },
        { id: 4, label: 'Insight', icon: <Search className="w-4 h-4" />, desc: 'AI Analysis' },
        { id: 5, label: 'Blueprint', icon: <Target className="w-4 h-4" />, desc: 'Strategy Map' },
        { id: 6, label: 'Handshake', icon: <CheckCircle2 className="w-4 h-4" />, desc: 'Expert Vetting' },
        { id: 7, label: 'Action', icon: <Rocket className="w-4 h-4" />, desc: 'Launch' },
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

    // Load accounts and all positions on mount
    useEffect(() => {
        const storedResultUrl = sessionStorage.getItem('last_result_url')
        if (storedResultUrl) {
            setHasResults(true)
            setResultUrl(storedResultUrl)
        }

        const headers = getHeaders();

        Promise.all([
            fetch(apiUrl('api/accounts'), { headers }).then(res => res.json()),
            fetch(apiUrl('api/positions'), { headers }).then(res => res.json())
        ])
            .then(([accountsData, positionsData]) => {
                setAccounts(accountsData.accounts || [])
                setAllPositions(positionsData.positions || [])
                setLoading(false)
            })
            .catch(err => {
                console.error('Error loading data:', err)
                setLoading(false)
            })
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
                headers: getHeaders(),
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

    const handleAIAudit = async () => {
        setIsAuditing(true)
        try {
            const response = await fetch(apiUrl('api/intelligence/audit'), {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    resume_text: resumeText,
                    jd_text: selectedPositionData?.jd_text || ''
                })
            })
            const data = await response.json()
            setAuditResults({
                score: data.score || 0,
                observations: [data.reasoning || "Analysis complete."]
            })
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
                headers: getHeaders(),
                body: JSON.stringify({
                    milestones: dataModel?.interview_flow || [],
                    jd_text: selectedPositionData?.jd_text || '',
                    resume_text: resumeText
                })
            })
            const data = await response.json()
            setStrategyPlan({
                milestones: [data.next_milestone || "Technical Deep Dive"]
            })
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
            fetch(apiUrl(`api/accounts/${selectedAccount}/positions`), { headers: getHeaders() })
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
        if (!selectedAccount || !selectedPosition || (!resumeText && !resumeFile && !selectedCandidate)) {
            alert('Please complete all selection steps')
            return
        }

        setStartingInterview(true)

        try {
            const sessionResponse = await fetch(apiUrl('api/interview/create-session'), {
                method: 'POST',
                headers: getHeaders(),
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
                    headers: getHeaders(),
                    body: JSON.stringify(updatedModel)
                })
            } catch (err) {
                console.error('Error saving data model:', err)
            }
        }
    }

    const refreshPositions = () => {
        if (selectedAccount) {
            fetch(apiUrl(`api/accounts/${selectedAccount}/positions`), { headers: getHeaders() })
                .then(res => res.json())
                .then(data => setAccountPositions(data.positions || []))
        }
        fetch(apiUrl('api/positions'), { headers: getHeaders() })
            .then(res => res.json())
            .then(data => setAllPositions(data.positions || []))
    }

    const refreshAccounts = () => {
        fetch(apiUrl('api/accounts'), { headers: getHeaders() })
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
                        {/* Step 1: Scope */}
                        {currentStep === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-10 text-center max-w-2xl mx-auto">
                                    <h2 className="text-3xl font-semibold tracking-tight mb-2">Define Scope</h2>
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

                        {/* Step 2: Criteria */}
                        {currentStep === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="mb-10 flex items-end justify-between border-b border-gray-100 dark:border-[#111] pb-6">
                                    <div>
                                        <button onClick={prevStep} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black dark:hover:text-white mb-2 transition-colors uppercase tracking-widest">
                                            <ChevronLeft className="w-3 h-3" /> Back
                                        </button>
                                        <h2 className="text-3xl font-semibold tracking-tight">Establish Criteria</h2>
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

                        {/* Step 3: Subject */}
                        {currentStep === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto w-full">
                                <div className="mb-10">
                                    <button onClick={prevStep} className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-black dark:hover:text-white mb-2 transition-colors uppercase tracking-widest">
                                        <ChevronLeft className="w-3 h-3" /> Back
                                    </button>
                                    <h2 className="text-3xl font-semibold tracking-tight">Identify Subject</h2>
                                    <p className="text-gray-500 text-sm mt-1">Select or import the profile to be evaluated against the established criteria.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <CandidateSelector
                                        positionId={selectedPosition || null}
                                        selectedCandidate={selectedCandidate}
                                        onSelectCandidate={handleCandidateSelect}
                                    />
                                    <div className="flex flex-col">
                                        <div className="flex-1">
                                            <FileUpload
                                                label="Technical Profile Import"
                                                text={selectedCandidate ? '' : resumeText}
                                                onTextChange={(text) => { setResumeText(text); setSelectedCandidate(''); }}
                                                file={resumeFile}
                                                onFileChange={(file) => { setResumeFile(file); setSelectedCandidate(''); }}
                                                disabled={!!selectedCandidate}
                                            />
                                        </div>
                                        <button
                                            onClick={nextStep}
                                            disabled={!selectedCandidate && !resumeText && !resumeFile}
                                            className="mt-8 flex items-center justify-center gap-3 bg-black dark:bg-white text-white dark:text-black h-14 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100"
                                        >
                                            Process Analysis <Target className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Audit */}
                        {currentStep === 4 && (
                            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-12">
                                <div className="relative mb-12">
                                    <div className={`w-32 h-32 rounded-full border border-gray-100 dark:border-[#111] flex items-center justify-center bg-gray-50/50 dark:bg-[#080808] ${isAuditing ? 'animate-pulse' : ''}`}>
                                        <div className="text-4xl font-semibold tracking-tight text-black dark:text-white">{auditResults?.score || '--'}<span className="text-xs text-gray-400 ml-0.5">%</span></div>
                                    </div>
                                    {isAuditing && <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin" />}
                                </div>
                                <div className="text-center space-y-3 mb-12">
                                    <h2 className="text-3xl font-semibold tracking-tight">Generate Insight</h2>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">AI Analyst is calculating compatibility between criteria and subject profile.</p>
                                </div>
                                {!isAuditing && auditResults && (
                                    <div className="w-full space-y-8">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Key Observations</p>
                                            <div className="space-y-2">
                                                {auditResults.observations.map((obs: string, i: number) => (
                                                    <div key={i} className="text-sm p-4 rounded-xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                                        {obs}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={nextStep} className="w-full h-14 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02]">
                                            Design Blueprint
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 5: Blueprint */}
                        {currentStep === 5 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center justify-center h-full max-w-2xl mx-auto py-12">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111] flex items-center justify-center mb-10">
                                    <Target className={`w-8 h-8 ${isStrategizing ? 'text-orange-500 animate-bounce' : 'text-gray-400'}`} />
                                </div>
                                <div className="text-center space-y-3 mb-10">
                                    <h2 className="text-3xl font-semibold tracking-tight">Design Blueprint</h2>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">Generating strategic execution plan for the intelligence session.</p>
                                </div>
                                {!isStrategizing && strategyPlan && (
                                    <div className="w-full space-y-8">
                                        <div className="grid grid-cols-1 gap-3">
                                            {strategyPlan.milestones.map((m: string, i: number) => (
                                                <div key={i} className="flex items-center gap-4 bg-gray-50 dark:bg-[#080808] p-5 rounded-xl border border-gray-100 dark:border-[#111]">
                                                    <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-bold">
                                                        0{i + 1}
                                                    </div>
                                                    <span className="text-sm font-medium tracking-tight text-gray-700 dark:text-gray-300">{m}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={nextStep} className="w-full h-14 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold tracking-[0.2em] uppercase transition-all hover:scale-[1.02]">
                                            Handshake Review
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 6: Handshake */}
                        {currentStep === 6 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
                                <div className="flex items-center justify-between mb-10 border-b border-gray-100 dark:border-[#111] pb-8">
                                    <div>
                                        <h2 className="text-3xl font-semibold tracking-tight">Handshake Review</h2>
                                        <p className="text-gray-500 text-sm mt-1">Expert validation of AI-proposed configuration before execution.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={prevStep} className="h-10 px-6 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black dark:hover:text-white transition-colors">Edit Blueprint</button>
                                        <button onClick={nextStep} className="h-10 px-8 rounded-lg bg-emerald-500 text-white text-xs font-bold tracking-widest uppercase transition-all hover:bg-emerald-600">Approve & Proceed</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {dataModel && (
                                        <DataModelPanel
                                            dataModel={dataModel}
                                            onUpdate={handleDataModelUpdate}
                                            isEditable={true}
                                            jdText={selectedPositionData?.jd_text || ''}
                                        />
                                    )}
                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inbound Communication</p>
                                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-[#111]">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Mail className="w-4 h-4 text-orange-500" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Personalized Invitation</span>
                                                </div>
                                                <div className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400 h-48 overflow-y-auto pr-4 scrollbar-thin">
                                                    {isGeneratingEmail ? (
                                                        <div className="flex flex-col gap-2 animate-pulse">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                                                        </div>
                                                    ) : (
                                                        <div className="whitespace-pre-wrap">
                                                            {generatedEmail || "Drafting secure invitation..."}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                            <input
                                                type="checkbox"
                                                checked={sendEmailInvite}
                                                onChange={(e) => setSendEmailInvite(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                            />
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-orange-600 uppercase tracking-wider">Automaton Alert</label>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Dispatch encrypted session link and QR invitation upon approval.</p>
                                            </div>
                                        </div>
                                    </div>
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
                    </div>
                </section>
                <Footer />
            </main>

            <AddPositionModal isOpen={showAddPosition} onClose={() => setShowAddPosition(false)} accounts={accounts} selectedAccountId={selectedAccount} onPositionCreated={refreshPositions} />
            <AddAccountModal isOpen={showAddAccount} onClose={() => setShowAddAccount(false)} onAccountCreated={refreshAccounts} />
            <InterviewLinksModal isOpen={showInterviewLinks} onClose={() => setShowInterviewLinks(false)} sessionData={interviewSessionData} />
            <EmailSentModal isOpen={showEmailSent} onClose={() => setShowEmailSent(false)} {...emailSentData} />
        </div>
    )
}
