'use client'

import { useState, useEffect, useRef } from 'react'
import SessionInspector from './SessionInspector'
import LiveScores from './LiveScores'
import EndInterviewModal from './EndInterviewModal'
import AgentProofCard from './AgentProofCard'
import { apiUrl, wsUrl } from '@/config/api'

interface ExpertViewProps {
  sessionId: string
  language: string
}

const AGENTS = [
  { name: 'Analyst', cluster: 'Learning' },
  { name: 'Critic', cluster: 'Learning' },
  { name: 'Observer', cluster: 'Learning' },
  { name: 'Planner', cluster: 'Strategy' },
  { name: 'Architect', cluster: 'Strategy' },
  { name: 'Executioner', cluster: 'Execution' },
  { name: 'Evaluator', cluster: 'Execution' },
  { name: 'Interpreter', cluster: 'Execution' },
  { name: 'Guardian', cluster: 'Monitoring' },
  { name: 'Watcher', cluster: 'Monitoring' },
  { name: 'Logger', cluster: 'Monitoring' }
]

export default function ExpertView({ sessionId, language }: ExpertViewProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [candidateAnswer, setCandidateAnswer] = useState<string>('')
  const [evaluation, setEvaluation] = useState<any>(null)
  const [guardian, setGuardian] = useState<any>(null)
  const [plannerInsight, setPlannerInsight] = useState<any>(null)
  const [logData, setLogData] = useState<any[]>([])
  const [progress, setProgress] = useState({ rounds_completed: 0, total_rounds: 5, percentage: 0 })
  const [activeAgents, setActiveAgents] = useState<string[]>([])
  const [showEndModal, setShowEndModal] = useState(false)
  const [isEndingInterview, setIsEndingInterview] = useState(false)
  const [selectedAgentForProof, setSelectedAgentForProof] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const connect = () => {
      const websocket = new WebSocket(wsUrl(`ws/swarm/${sessionId}`))
      wsRef.current = websocket

      websocket.onopen = () => setConnectionStatus('connected')

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'greeting') {
            setCurrentQuestion(message.data?.text || '')
            triggerSwarmPulse(['Executioner', 'Guardian'])
            return
          }

          if (message.type === 'candidate_answer') {
            setCandidateAnswer(message.data?.text || '')
            return
          }

          if (message.type === 'candidate_typing') {
            setCandidateAnswer(message.data?.text || '')
            return
          }

          if (message.type === 'swarm_response') {
            const data = message.data || {}
            setCurrentQuestion(data.response || '')
            if (data.evaluation) setEvaluation(data.evaluation)
            if (data.guardian) setGuardian(data.guardian)
            if (data.planner_insight) setPlannerInsight(data.planner_insight)
            if (data.progress) setProgress(data.progress)

            // If this is the initial state sync, it might have the last candidate answer
            if (data.last_candidate_answer) {
              setCandidateAnswer(data.last_candidate_answer)
            }

            if (data.thought_history && Array.isArray(data.thought_history)) {
              setLogData(data.thought_history.map((t: any) => ({
                agent: t.agent || 'System',
                thought: t.thought || t.text, // Fallback for old logs
                timestamp: t.timestamp,
                level: t.level,
                confidence: t.confidence
              })))
            } else if (data.thought) {
              setLogData(prev => [...prev, {
                agent: 'System',
                thought: data.thought,
                timestamp: new Date().toISOString()
              }])
            }
            triggerSwarmPulse(['Interpreter', 'Evaluator', 'Planner', 'Executioner', 'Guardian'])
            return
          }

          if (message.type === 'session_ended') {
            window.location.href = '/expert/results'
            return
          }
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }

      websocket.onclose = () => {
        setConnectionStatus('disconnected')
        setTimeout(connect, 2000)
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [sessionId])

  const triggerSwarmPulse = (agents: string[]) => {
    setActiveAgents(agents)
    setTimeout(() => setActiveAgents([]), 3000)
  }


  const handleEndInterview = async () => {
    setIsEndingInterview(true)
    try {
      const response = await fetch(apiUrl(`api/interview/${sessionId}/end`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ended_by: 'expert', reason: 'ended_by_expert' })
      })
      if (response.ok) window.location.href = '/expert/results'
    } catch (error) {
      console.error('Error ending interview:', error)
    } finally {
      setIsEndingInterview(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50 text-gray-900 font-sans selection:bg-brand-primary/30">
      {/* Command Center Header */}
      <header className="border-b border-gray-200/50 bg-white/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl border border-brand-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.1)]">
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter uppercase text-gray-900">Swarm<span className="text-brand-primary">Hire</span> Command Center</h1>
                <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">HITL Expert Dashboard</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Session ID</span>
                <span className="text-xs font-mono text-brand-primary">{sessionId?.slice(0, 18)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`px-4 py-2 rounded-full border ${connectionStatus === 'connected' ? 'border-brand-primary/20 bg-brand-primary/5 text-brand-primary' : 'border-red-500/20 bg-red-500/5 text-red-500'} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-brand-primary animate-pulse shadow-[0_0_10px_#FF6B35]' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{connectionStatus}</span>
            </div>
            <button
              onClick={() => setShowEndModal(true)}
              className="px-6 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-widest"
            >
              End Session
            </button>
            <a href="/admin/sessions" target="_blank" className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-brand-primary">
              Session Inspector
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-8 grid grid-cols-12 gap-8">
        {/* Left Column: Agent Grid & Progress */}
        <div className="col-span-3 space-y-8">
          <section className="p-6 rounded-[2rem] bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6 flex items-center justify-between">
              Swarm Agent Grid
              <span className="text-brand-primary">{activeAgents.length} Active</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {AGENTS.map(agent => (
                <div
                  key={agent.name}
                  className={`p-3 rounded-xl border transition-all duration-500 flex items-center justify-between group/agent ${activeAgents.includes(agent.name) ? 'bg-brand-primary/5 border-brand-primary/30 shadow-sm' : 'bg-gray-50/50 border-gray-100'}`}
                >
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold transition-colors duration-500 ${activeAgents.includes(agent.name) ? 'text-brand-primary' : 'text-gray-400'}`}>{agent.name}</span>
                    <span className="text-[8px] uppercase tracking-widest text-gray-300">{agent.cluster}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedAgentForProof(agent.name)}
                      className="opacity-0 group-hover/agent:opacity-100 transition-opacity p-1.5 hover:bg-brand-primary/20 rounded-lg text-brand-primary text-[8px] font-black uppercase tracking-widest border border-brand-primary/20"
                    >
                      Proof
                    </button>
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeAgents.includes(agent.name) ? 'bg-brand-primary shadow-[0_0_10px_#FF6B35] scale-125' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-[2rem] bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">Mission Progress</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-brand-primary">{Math.round(progress.percentage)}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Round {progress.rounds_completed}/{progress.total_rounds}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-1000 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </section>
        </div>

        {/* Center Column: Live Dialogue & Expert Control */}
        <div className="col-span-6 space-y-8">
          {/* Live Dialogue Card */}
          <section className="relative group">
            <div className="relative p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm space-y-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-black mb-4 block">Current Interrogation</span>
                <h2 className="text-2xl font-bold text-gray-900 leading-relaxed">
                  {currentQuestion || <span className="text-gray-300 italic">Awaiting Swarm initiation...</span>}
                </h2>
              </div>

              <div className="h-px bg-gray-100"></div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-4 block">Candidate Transmission</span>
                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100 min-h-[120px]">
                  {candidateAnswer ? (
                    <p className="text-gray-700 leading-relaxed font-medium">{candidateAnswer}</p>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-300 italic">
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                      <span>Waiting for candidate response...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Expert Control Panel */}
          <section className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-black">HITL Intervention</h3>
              <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-primary/20">Monitoring Mode</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">The swarm is currently operating autonomously. You can override or adjust the trajectory if needed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all">Adjust Strategy</button>
              <button className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all">Direct Override</button>
            </div>
          </section>

          {/* Strategy Insight Card */}
          <section className="p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-brand-primary font-black mb-4">Swarm Strategy</h3>
            {plannerInsight ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Focus:</span>
                  <span className="text-sm font-semibold text-gray-800">{plannerInsight.focus_area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Next Move:</span>
                  <span className="text-sm font-semibold text-gray-800">{plannerInsight.next_step}</span>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">"{plannerInsight.reasoning}"</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-gray-300 italic">
                <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-pulse"></div>
                <span>Waiting for strategic plan...</span>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Evaluation & Logs */}
        <div className="col-span-3 space-y-8 flex flex-col">
          <section className="p-6 rounded-[2rem] bg-white border border-gray-200 shadow-sm">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-6">Live Evaluation</h3>
            <div className="min-h-[200px]">
              {evaluation ? (
                <LiveScores evaluation={evaluation} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-200">
                  <svg className="w-8 h-8 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Data</span>
                </div>
              )}
            </div>
          </section>

          <section className="flex-1 rounded-[2rem] overflow-hidden shadow-sm h-[600px]">
            <SessionInspector logs={logData} />
          </section>
        </div>
      </main>

      <EndInterviewModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndInterview}
        isEnding={isEndingInterview}
      />

      {selectedAgentForProof && (
        <AgentProofCard
          agentName={selectedAgentForProof}
          onClose={() => setSelectedAgentForProof(null)}
          sessionData={{
            currentQuestion,
            candidateAnswer,
            evaluation,
            guardian,
            progress,
            thought: logData.filter(l => l.agent === selectedAgentForProof).pop()?.thought
          }}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(57, 255, 20, 0.3);
        }
      `}</style>
    </div>
  )
}
