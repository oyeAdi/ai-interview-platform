'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FileUpload from '@/components/FileUpload'
import JDSelector from '@/components/JDSelector'
import ResumeSelector from '@/components/ResumeSelector'
import {
  Database,
  Cpu,
  Rocket,
  CheckCircle2,
  Loader2,
  ChevronRight,
  FileText,
  Brain,
  Sparkles,
  Shield,
  Search,
  Zap,
  MessageSquare,
  Activity,
  History,
  AlertCircle
} from 'lucide-react'
import { apiUrl } from '@/config/api'

// --- Agent Definitions ---
interface Agent {
  id: string
  name: string
  role: string
  icon: any
  group: 'Strategy' | 'Execution' | 'Learning' | 'Monitoring'
}

const SWARM_AGENTS: Agent[] = [
  { id: 'analyst', name: 'Analyst', role: 'JD/Resume Synthesis', icon: Search, group: 'Learning' },
  { id: 'critic', name: 'Critic', role: 'Quality Control', icon: AlertCircle, group: 'Learning' },
  { id: 'observer', name: 'Observer', role: 'Behavioral Tracking', icon: Eye, group: 'Learning' },
  { id: 'planner', name: 'Planner', role: 'Trajectory Strategy', icon: Zap, group: 'Strategy' },
  { id: 'architect', name: 'Architect', role: 'System Design', icon: Database, group: 'Strategy' },
  { id: 'executioner', name: 'Executioner', role: 'Interview Delivery', icon: Zap, group: 'Execution' },
  { id: 'evaluator', name: 'Evaluator', role: 'Response Scoring', icon: CheckCircle2, group: 'Execution' },
  { id: 'interpreter', name: 'Interpreter', role: 'Context Analysis', icon: MessageSquare, group: 'Execution' },
  { id: 'guardian', name: 'Guardian', role: 'Safety & Bias', icon: Shield, group: 'Monitoring' },
  { id: 'watcher', name: 'Watcher', role: 'System Health', icon: Activity, group: 'Monitoring' },
  { id: 'logger', name: 'Logger', role: 'Session Audit', icon: History, group: 'Monitoring' },
]

function Eye(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function QuickStartPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<'ingest' | 'swarm' | 'ready'>('ingest')

  // Ingest State
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const [jds, setJds] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedJd, setSelectedJd] = useState('')
  const [selectedResume, setSelectedResume] = useState('')

  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [adminLink, setAdminLink] = useState('')
  const [candidateLink, setCandidateLink] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true)
        console.log('Fetching JDs and Resumes...')
        const [jdsRes, resumesRes] = await Promise.all([
          fetch(apiUrl('api/jds')),
          fetch(apiUrl('api/resumes'))
        ])

        if (jdsRes.ok) {
          const jdsData = await jdsRes.json()
          console.log('JDs fetched:', jdsData)
          setJds(jdsData)
        } else {
          console.error('Failed to fetch JDs:', jdsRes.status, jdsRes.statusText)
        }

        if (resumesRes.ok) {
          const resumesData = await resumesRes.json()
          console.log('Resumes fetched:', resumesData)
          setResumes(resumesData)
        } else {
          console.error('Failed to fetch Resumes:', resumesRes.status, resumesRes.statusText)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedJd) {
      const jd = jds.find(j => j.id === selectedJd)
      if (jd) {
        setJdText(jd.text)
        setJdFile(null)
      }
    }
  }, [selectedJd, jds])

  useEffect(() => {
    if (selectedResume) {
      const resume = resumes.find(r => r.id === selectedResume)
      if (resume) {
        setResumeText(resume.text)
        setResumeFile(null)
      }
    }
  }, [selectedResume, resumes])

  const handleStartInterview = async () => {
    if (!jdText && !selectedJd) {
      alert('Please provide a job description')
      return
    }
    if (!resumeText && !selectedResume) {
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
      if (finalResumeText) formData.append('resume_text', finalResumeText)

      const metadata = {
        candidate_account: 'Quick-Start-User',
        candidate_role: 'Quick-Start',
        is_quick_start: true,
        max_duration: 15
      }
      formData.append('metadata', JSON.stringify(metadata))

      const response = await fetch(apiUrl('api/swarm/init'), {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.session_id) {
        localStorage.setItem('current_session_id', data.session_id)
        const language = 'python' // Default
        const cLink = `/interview?view=candidate&session_id=${data.session_id}&lang=${language}&mode=quick`

        setCandidateLink(cLink)
        if (data.admin_link) {
          setAdminLink(data.admin_link)
        }
        // setActiveStep('launched') - REMOVED
        router.push(cLink)
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-orange-50 to-purple-50 text-gray-900 selection:bg-brand-primary/30">
      <Header showQuickStart={false} showBackToDashboard={true} />

      <main className="flex-1 overflow-hidden">
        {/* Progress Stepper */}
        <div className="max-w-5xl mx-auto px-4 pt-12">
          <div className="flex items-center gap-4 mb-12">
            {[
              { id: 'ingest', label: 'Data Ingestion', icon: Database },
              { id: 'swarm', label: 'Swarm Initialization', icon: Cpu },
              { id: 'ready', label: 'Ready to Launch', icon: RocketIcon }
            ].map((step, idx) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${activeStep === step.id
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm'
                  : idx < ['ingest', 'swarm', 'ready'].indexOf(activeStep)
                    ? 'border-green-500/50 bg-green-500/5 text-green-500'
                    : 'border-gray-200 bg-white text-gray-400'
                  }`}>
                  <step.icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">{step.label}</span>
                </div>
                {idx < 2 && <div className="w-8 h-[1px] bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {activeStep === 'ingest' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-black mb-6
                                border border-brand-primary/30 bg-brand-primary/10 text-brand-primary tracking-widest uppercase rounded-full">
                  <Sparkles className="w-3 h-3" />
                  SwarmHire Intelligence
                </div>
                <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6 tracking-tighter">
                  Initialize <span className="text-brand-primary">Swarm</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl font-light leading-relaxed">
                  Feed the 11-agent swarm with your requirements. The swarm will operate autonomously for this 15-minute session.
                </p>
              </div>
            </section>

            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="group p-8 rounded-[2.5rem] bg-white border border-gray-200 hover:border-brand-primary/30 transition-all duration-500 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-black text-brand-primary uppercase tracking-[0.3em]">Requirement Ingest</h2>
                    <div className="p-2 bg-brand-primary/10 rounded-xl"><FileText className="w-5 h-5 text-brand-primary" /></div>
                  </div>
                  <div className="space-y-6">
                    <JDSelector jds={jds} selectedJd={selectedJd} onSelectJd={setSelectedJd} loading={dataLoading} />
                    <FileUpload
                      label="Job Description"
                      text={jdText}
                      onTextChange={(text) => { setJdText(text); if (text && selectedJd) setSelectedJd(''); }}
                      file={jdFile}
                      onFileChange={(file) => { setJdFile(file); if (file && selectedJd) setSelectedJd(''); }}
                      disabled={!!selectedJd}
                    />
                  </div>
                </div>

                <div className="group p-8 rounded-[2.5rem] bg-white border border-gray-200 hover:border-brand-primary/30 transition-all duration-500 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-black text-brand-primary uppercase tracking-[0.3em]">Candidate Profile</h2>
                    <div className="p-2 bg-brand-primary/10 rounded-xl"><Brain className="w-5 h-5 text-brand-primary" /></div>
                  </div>
                  <div className="space-y-6">
                    <ResumeSelector resumes={resumes} selectedResume={selectedResume} onSelectResume={setSelectedResume} loading={dataLoading} />
                    <FileUpload
                      label="Resume"
                      text={resumeText}
                      onTextChange={(text) => { setResumeText(text); if (text && selectedResume) setSelectedResume(''); }}
                      file={resumeFile}
                      onFileChange={(file) => { setResumeFile(file); if (file && selectedResume) setSelectedResume(''); }}
                      disabled={!!selectedResume}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setActiveStep('swarm')}
                  disabled={(!jdText && !selectedJd) || (!resumeText && !selectedResume)}
                  className="group relative px-12 py-5 bg-brand-primary text-white font-black rounded-2xl hover:scale-105 transition-all duration-500 disabled:opacity-20 shadow-lg shadow-brand-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="uppercase tracking-[0.2em] text-sm">Initialize Swarm</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}

        {activeStep === 'swarm' && (
          <SwarmInitializationView onComplete={() => setActiveStep('ready')} />
        )}

        {activeStep === 'ready' && (
          <ReadyToLaunchView onStart={handleStartInterview} loading={loading} />
        )}

      </main>

      <Footer />
    </div>
  )
}

function RocketIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.96 14.96 0 01-10.58 4.39L3 21l.88-5.55a14.98 14.98 0 014.53-10.58C9.19 4.12 11.24 3 13.5 3c3.35 0 6.06 2.71 6.06 6.06 0 2.26-1.12 4.31-2.84 5.59z" />
    </svg>
  )
}

function SwarmInitializationView({ onComplete }: { onComplete: () => void }) {
  const [initializedCount, setInitializedCount] = useState(0)
  const [currentGroup, setCurrentGroup] = useState<string>('Learning')
  const groups = ['Learning', 'Strategy', 'Execution', 'Monitoring']

  useEffect(() => {
    const timer = setInterval(() => {
      setInitializedCount(prev => {
        if (prev >= SWARM_AGENTS.length) {
          clearInterval(timer)
          return prev
        }
        const next = prev + 1
        const nextAgent = SWARM_AGENTS[prev]
        if (nextAgent) setCurrentGroup(nextAgent.group)
        return next
      })
    }, 150)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-1000">
      <div className="text-center mb-16">
        <h2 className="text-xs font-black text-brand-primary uppercase tracking-[0.5em] mb-4">Swarm Synchronization</h2>
        <h3 className="text-4xl font-black text-gray-900 mb-4">Initializing <span className="text-brand-primary">11 Agents</span></h3>
        <p className="text-gray-500 max-w-xl mx-auto text-sm font-medium">The swarm is aligning its specialized agents for autonomous operation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {groups.map(group => (
          <div key={group} className={`p-6 rounded-[2rem] border transition-all duration-500 ${currentGroup === group ? 'border-brand-primary/50 bg-brand-primary/5 shadow-sm' : 'border-gray-100 bg-white'}`}>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${currentGroup === group ? 'text-brand-primary' : 'text-gray-400'}`}>{group} Cluster</h4>
            <div className="space-y-4">
              {SWARM_AGENTS.filter(a => a.group === group).map((agent) => {
                const isInitialized = SWARM_AGENTS.indexOf(agent) < initializedCount
                const isInitializing = SWARM_AGENTS.indexOf(agent) === initializedCount
                return (
                  <div key={agent.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${isInitialized ? 'border-green-500/30 bg-green-500/5' : isInitializing ? 'border-brand-primary/30 bg-brand-primary/5 animate-pulse' : 'border-gray-50 bg-gray-50/50 opacity-30'}`}>
                    <div className={`p-2 rounded-lg ${isInitialized ? 'text-green-500' : isInitializing ? 'text-brand-primary' : 'text-gray-400'}`}><agent.icon className="w-4 h-4" /></div>
                    <div>
                      <div className="text-[11px] font-bold text-gray-900">{agent.name}</div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{agent.role}</div>
                    </div>
                    {isInitialized && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-2xl mx-auto text-center">
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${(initializedCount / SWARM_AGENTS.length) * 100}%` }} />
        </div>
        {initializedCount >= SWARM_AGENTS.length && (
          <button onClick={onComplete} className="animate-in fade-in zoom-in duration-500 group relative px-8 py-4 bg-black text-white font-black rounded-xl hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-[0.2em] text-xs">Proceed to Launch</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

function ReadyToLaunchView({ onStart, loading }: { onStart: () => void, loading: boolean }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in zoom-in-95 duration-700">
      <div className="p-12 rounded-[3rem] bg-white border border-gray-200 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-primary opacity-50" />
        <div className="relative z-10">
          <div className="inline-flex p-4 bg-brand-primary/10 rounded-2xl mb-8"><RocketIcon className="w-12 h-12 text-brand-primary" /></div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Swarm is <span className="text-brand-primary">Ready</span></h2>
          <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto font-medium leading-relaxed">The 11-agent swarm has been initialized for your 15-minute autonomous session.</p>
          <button onClick={onStart} disabled={loading} className="group relative w-full max-w-md py-6 bg-black text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 shadow-2xl">
            {loading ? <div className="flex items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /><span className="uppercase tracking-[0.3em] text-lg">Launching...</span></div> : <div className="flex items-center justify-center gap-3"><span className="uppercase tracking-[0.3em] text-lg">Launch Interview</span><ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></div>}
          </button>
        </div>
      </div>
    </div>
  )
}


