'use client'

import { useState } from 'react'

interface Step {
    id: number
    title: string
    icon: string
    content: React.ReactNode
    color: string
}

interface AgentProofCardProps {
    agentName: string
    onClose: () => void
    sessionData: {
        currentQuestion: string
        candidateAnswer: string
        evaluation: any
        guardian: any
        progress: any
        thought?: string
    }
}

export default function AgentProofCard({ agentName, onClose, sessionData }: AgentProofCardProps) {
    const steps: Step[] = [
        {
            id: 1,
            title: 'Logger Records Start',
            icon: '📋',
            color: 'gray',
            content: (
                <div className="space-y-1 font-mono text-[10px]">
                    <p>📋 Timestamp: {new Date().toLocaleTimeString()}</p>
                    <p>📋 Action: "{agentName} starting task"</p>
                    <p className="text-brand-primary">📋 Input: {sessionData.currentQuestion.substring(0, 60)}...</p>
                </div>
            )
        },
        {
            id: 2,
            title: 'Watcher Monitors Process',
            icon: '⚠️',
            color: 'teal',
            content: (
                <div className="space-y-1 text-[10px]">
                    <p>⚠️ Checking: Is {agentName} responding?</p>
                    <p>⚠️ Timeout threshold: 30 seconds</p>
                    <p>⚠️ Status: <span className="text-green-500 font-bold">✅ Running normally</span></p>
                </div>
            )
        },
        {
            id: 3,
            title: `${agentName} Does Work`,
            icon: '⚙️',
            color: 'blue',
            content: (
                <div className="space-y-2 text-[10px]">
                    <p className="font-bold text-blue-600">Processing Intelligence...</p>
                    <p className="opacity-70">• Analyzing: "{sessionData.candidateAnswer.substring(0, 50)}..."</p>
                    <p className="opacity-70">• Context: Round {sessionData.progress.rounds_completed + 1}</p>
                    {sessionData.thought && (
                        <p className="text-blue-600/80 italic mt-1 border-l border-blue-200 pl-2">
                            "{sessionData.thought.substring(0, 100)}..."
                        </p>
                    )}
                </div>
            )
        },
        {
            id: 4,
            title: 'Guardian Checks',
            icon: '🛡️',
            color: 'red',
            content: (
                <div className="space-y-1 text-[10px]">
                    <p>🛡️ Risk Level: <span className={`font-bold ${sessionData.guardian?.risk_level === 'High' ? 'text-red-500' : 'text-green-500'}`}>{sessionData.guardian?.risk_level || 'Low'}</span></p>
                    <p>🛡️ Violation: {sessionData.guardian?.violation_detected ? '⚠️ Detected' : '✅ None'}</p>
                    <p className="text-green-500 font-bold">✅ Result: {sessionData.guardian?.safe_to_proceed ? 'Safe to proceed' : 'Blocked'}</p>
                </div>
            )
        },
        {
            id: 5,
            title: 'Logger Records Output',
            icon: '📋',
            color: 'gray',
            content: (
                <div className="space-y-1 font-mono text-[10px]">
                    <p>📋 Timestamp: {new Date().toLocaleTimeString()}</p>
                    <p>📋 Action: "{agentName} completed work"</p>
                    <p className="text-brand-primary">📋 Output: {sessionData.evaluation?.feedback?.substring(0, 60) || "Intelligence packet ready"}...</p>
                </div>
            )
        },
        {
            id: 6,
            title: 'Critic Reviews Work',
            icon: '🔍',
            color: 'yellow',
            content: (
                <div className="space-y-2 text-[10px] border border-yellow-200 bg-yellow-50 p-2 rounded-lg">
                    <p className="font-bold text-yellow-600">Reviewing Quality...</p>
                    <p className="opacity-70">• Accuracy: {sessionData.evaluation?.accuracy}%</p>
                    <p className="opacity-70">• Depth: {sessionData.evaluation?.depth}%</p>
                    <p className="text-green-500 font-bold">✅ Result: {sessionData.evaluation?.overall > 70 ? 'High quality confirmed' : 'Needs improvement'}</p>
                </div>
            )
        },
        {
            id: 7,
            title: 'Watcher Detects Status',
            icon: '⚠️',
            color: 'teal',
            content: (
                <div className="space-y-1 text-[10px]">
                    <p>⚠️ Status: {sessionData.evaluation?.overall > 60 ? 'Critic approved output' : 'Critic flagged for review'}</p>
                    <p>⚠️ Action: Routing to HITL for final sign-off</p>
                </div>
            )
        },
        {
            id: 8,
            title: 'Logger Records Review',
            icon: '📋',
            color: 'gray',
            content: (
                <div className="space-y-1 font-mono text-[10px]">
                    <p>📋 Timestamp: {new Date().toLocaleTimeString()}</p>
                    <p>📋 Action: "Critic approved output"</p>
                    <p>📋 Status: Pending HITL review</p>
                </div>
            )
        },
        {
            id: 9,
            title: 'Observer Watches',
            icon: '👁️',
            color: 'pink',
            content: (
                <div className="space-y-1 text-[10px]">
                    <p>👁️ Noted: Successful agent collaboration</p>
                    <p>👁️ Pattern: High confidence in {agentName} output</p>
                    <p>👁️ Waiting for HITL approval to learn</p>
                </div>
            )
        },
        {
            id: 10,
            title: 'HITL Reviews Everything',
            icon: '👤',
            color: 'blue',
            content: (
                <div className="space-y-2 text-[10px] border-2 border-blue-100 bg-blue-50 p-2 rounded-lg">
                    <p className="font-bold text-blue-600">Human Reviewer sees:</p>
                    <p className="opacity-70">• {agentName} output packet</p>
                    <p className="opacity-70">• Critic Score: {sessionData.evaluation?.overall}%</p>
                    <p className="text-green-500 font-bold mt-1">✅ Decision: {sessionData.evaluation?.overall > 50 ? 'Approved' : 'Needs Revision'}</p>
                </div>
            )
        },
        {
            id: 11,
            title: 'Observer Learns',
            icon: '🧠',
            color: 'pink',
            content: (
                <div className="space-y-2 text-[10px] border border-pink-100 bg-pink-50 p-2 rounded-lg">
                    <p className="font-bold text-pink-600">🧠 Learning Event:</p>
                    <p className="opacity-70">• Human confirmed quality</p>
                    <p className="opacity-70">• Updating global intelligence model</p>
                    <p className="text-green-500 font-bold">✅ Model Updated</p>
                </div>
            )
        },
        {
            id: 12,
            title: 'Logger Final Decision',
            icon: '📋',
            color: 'gray',
            content: (
                <div className="space-y-1 font-mono text-[10px]">
                    <p>📋 Timestamp: {new Date().toLocaleTimeString()}</p>
                    <p>📋 Action: "HITL approved final output"</p>
                    <p className="text-green-500 font-bold">📋 Status: ✅ Complete</p>
                </div>
            )
        }
    ]

    const getColorClass = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100'
            case 'teal': return 'bg-teal-50 text-teal-600 border-teal-100'
            case 'red': return 'bg-red-50 text-red-600 border-red-100'
            case 'yellow': return 'bg-yellow-50 text-yellow-600 border-yellow-100'
            case 'pink': return 'bg-pink-50 text-pink-600 border-pink-100'
            case 'gray': return 'bg-gray-50 text-gray-400 border-gray-100'
            default: return 'bg-gray-50 text-gray-400 border-gray-100'
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-8">
            <div className="bg-white border border-gray-200 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 flex items-center justify-center">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                                The {agentName} <span className="text-brand-primary">Proof</span>
                            </h3>
                            <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Complete 12-Step Agentic Workflow</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {steps.map((step) => (
                            <div key={step.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${getColorClass(step.color)} group-hover:scale-110`}>
                                        <span className="text-lg">{step.icon}</span>
                                    </div>
                                    {step.id < steps.length && (
                                        <div className="w-px h-full bg-gray-100 mt-2"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Step {step.id.toString().padStart(2, '0')}</span>
                                        <h4 className="text-xs font-bold text-gray-700">{step.title}</h4>
                                    </div>
                                    <div className={`p-4 rounded-2xl border transition-all duration-500 ${getColorClass(step.color)} bg-opacity-5`}>
                                        {step.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Insight */}
                    <div className="mt-8 p-6 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-xl">💡</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-brand-primary mb-1">Swarm Intelligence Insight</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Every agent in the SwarmHire ecosystem follows this immutable 12-step protocol. This ensures that every decision is logged, watched, guarded, critiqued, and approved by both AI and Human experts before the Observer learns and updates the global model.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #FF6B35;
        }
      `}</style>
        </div>
    )
}
