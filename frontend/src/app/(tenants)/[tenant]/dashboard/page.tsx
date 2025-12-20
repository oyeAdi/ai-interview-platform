'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
            let candidateName = 'Custom Resume'

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
        <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors duration-200">
            <Header showQuickStart={true} title={`${tenant?.toUpperCase() || 'GLOBAL'} Dashboard`} />

            <main className="flex-1">
                <section className="border-b border-gray-200 dark:border-[#2A2A2A]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light text-black dark:text-white leading-tight mb-3 capitalize">
                                    {tenant}
                                    <span className="font-normal"> Recruiter Hub</span>
                                </h1>
                                <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl font-light">
                                    Isolated hiring environment for {tenant}. Data restricted to your workspace.
                                </p>
                            </div>
                            {hasResults && (
                                <button onClick={() => router.push(resultUrl)} className="btn-primary flex items-center gap-2 px-6 py-3">
                                    View Results
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-12">
                        <AccountGrid
                            accounts={accounts}
                            positions={allPositions}
                            selectedAccount={selectedAccount}
                            onSelectAccount={handleAccountSelect}
                            onAddAccount={() => setShowAddAccount(true)}
                            loading={loading}
                        />

                        {selectedAccount && (
                            <PositionGrid
                                positions={accountPositions}
                                selectedPosition={selectedPosition}
                                onSelectPosition={handlePositionSelect}
                                onAddPosition={() => setShowAddPosition(true)}
                                accountName={selectedAccountData?.name}
                                loading={positionsLoading}
                            />
                        )}

                        {selectedPosition && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8">
                                    {dataModel && (
                                        <DataModelPanel
                                            dataModel={dataModel}
                                            onUpdate={handleDataModelUpdate}
                                            isEditable={true}
                                            jdText={selectedPositionData?.jd_text || ''}
                                        />
                                    )}
                                </div>
                                <div className="lg:col-span-4 space-y-6">
                                    <CandidateSelector
                                        positionId={selectedPosition || null}
                                        selectedCandidate={selectedCandidate}
                                        onSelectCandidate={handleCandidateSelect}
                                    />
                                    <FileUpload
                                        label="Resume"
                                        text={selectedCandidate ? '' : resumeText}
                                        onTextChange={(text) => { setResumeText(text); setSelectedCandidate(''); }}
                                        file={resumeFile}
                                        onFileChange={(file) => { setResumeFile(file); setSelectedCandidate(''); }}
                                        disabled={!!selectedCandidate}
                                    />

                                    <button
                                        onClick={() => handleStartInterview(true)}
                                        disabled={startingInterview || !selectedPosition}
                                        className="btn-primary w-full h-12"
                                    >
                                        {startingInterview ? 'Starting...' : 'Start as Expert'}
                                    </button>
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
