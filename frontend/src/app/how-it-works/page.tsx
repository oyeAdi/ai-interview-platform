'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { ArrowRight, Users, Briefcase, Brain, Zap, TrendingUp, Shield, CheckCircle, MessageSquare, X } from 'lucide-react'

export default function HowItWorks() {
    const [showStrategyModal, setShowStrategyModal] = useState(false)
    const [showExecutionerModal, setShowExecutionerModal] = useState(false)
    const [showEvaluatorModal, setShowEvaluatorModal] = useState(false)
    const [showObserverModal, setShowObserverModal] = useState(false)
    const [showCritiqueModal, setShowCritiqueModal] = useState(false)
    const [showMonitorModal, setShowMonitorModal] = useState(false)
    return (
        <>
            <Header />
            <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-purple-50">

                {/* Hero */}
                <section className="pt-32 pb-16 px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
                            How <span className="bg-gradient-to-r from-brand-primary to-purple-600 bg-clip-text text-transparent">SwarmHire</span> Works
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            A simple 3-step process to match demand with supply using AI-powered interviews
                        </p>
                    </div>
                </section>

                {/* The Simple Flow */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-8">
                            <FlowStep
                                number="1"
                                icon={<Briefcase className="w-12 h-12" />}
                                title="Post Your Demand"
                                description="Create a job with JD and requirements. Get a shareable link instantly."
                                color="orange"
                            />
                            <FlowStep
                                number="2"
                                icon={<Brain className="w-12 h-12" />}
                                title="AI Interviews Supply"
                                description="Candidates click the link and talk to our 6-agent AI system. No manual work."
                                color="purple"
                            />
                            <FlowStep
                                number="3"
                                icon={<TrendingUp className="w-12 h-12" />}
                                title="Get Results"
                                description="Review AI-generated scores, feedback, and hiring recommendations."
                                color="green"
                            />
                        </div>
                    </div>
                </section>

                {/* For Recruiters (Demand) */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-900">
                                For <span className="text-brand-primary">Recruiters</span> (Demand Side)
                            </h2>
                            <p className="text-xl text-gray-600">Post jobs and let AI do the screening</p>
                        </div>

                        <div className="space-y-12">
                            <DetailedStep
                                step="1"
                                title="Create Your Job"
                                description="Fill in the job description, requirements, and skills needed. Our AI analyzes it to understand exactly what you're looking for."
                                features={[
                                    "Paste your JD or write from scratch",
                                    "Specify required skills and experience",
                                    "Set your deal-breakers",
                                    "Choose interview focus areas"
                                ]}
                                image="📝"
                            />

                            <DetailedStep
                                step="2"
                                title="Share the Link"
                                description="Get a unique interview link for your job. Share it however you want - email, LinkedIn, job boards, or your careers page."
                                features={[
                                    "One link per job posting",
                                    "Track how many candidates start",
                                    "No scheduling needed",
                                    "Works 24/7 automatically"
                                ]}
                                image="🔗"
                                reverse
                            />

                            <DetailedStep
                                step="3"
                                title="Review & Decide"
                                description="As candidates complete interviews, you get detailed reports with scores, strengths, weaknesses, and AI recommendations."
                                features={[
                                    "Overall match score (0-100)",
                                    "Skill-by-skill breakdown",
                                    "Red flags and highlights",
                                    "Deal or No Deal recommendation"
                                ]}
                                image="📊"
                            />
                        </div>
                    </div>
                </section>

                {/* For Candidates (Supply) */}
                <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4 text-gray-900">
                                For <span className="text-purple-600">Candidates</span> (Supply Side)
                            </h2>
                            <p className="text-xl text-gray-600">Interview anytime, anywhere with AI</p>
                        </div>

                        <div className="space-y-12">
                            <DetailedStep
                                step="1"
                                title="Click the Link"
                                description="Get the interview link from the recruiter or job posting. No account needed to start."
                                features={[
                                    "Works on any device",
                                    "No downloads required",
                                    "Optional: Try free demo first",
                                    "Start immediately"
                                ]}
                                image="🔗"
                            />

                            <DetailedStep
                                step="2"
                                title="Talk to AI"
                                description="Have a natural conversation with our AI interviewer. It adapts to your responses and asks relevant follow-ups."
                                features={[
                                    "Conversational, not robotic",
                                    "Adapts to your skill level",
                                    "Code editor for technical roles",
                                    "Take your time, no rush"
                                ]}
                                image="💬"
                                reverse
                            />

                            <DetailedStep
                                step="3"
                                title="Get Feedback"
                                description="Receive instant feedback on your performance with actionable tips to improve."
                                features={[
                                    "Detailed performance breakdown",
                                    "Strengths and areas to improve",
                                    "Comparison to job requirements",
                                    "Wait for recruiter's decision"
                                ]}
                                image="✨"
                            />
                        </div>
                    </div>
                </section>

                {/* The 6-Agent System */}
                <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-black text-white">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">
                                Behind the Scenes: <span className="text-brand-primary">6 AI Agents</span>
                            </h2>
                            <p className="text-xl text-gray-300">
                                Each agent has a specialized role in conducting the perfect interview
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <AgentDetail
                                icon={<Brain className="w-10 h-10" />}
                                title="Strategy Agent"
                                role="The Planner"
                                description="Analyzes the job description and candidate profile to plan the perfect interview structure. Decides what to ask and in what order."
                                color="orange"
                                onClick={() => setShowStrategyModal(true)}
                            />
                            <AgentDetail
                                icon={<Zap className="w-10 h-10" />}
                                title="Executioner Agent"
                                role="The Interviewer"
                                description="Asks questions, presents challenges, and drives the conversation. Adapts in real-time based on candidate responses."
                                color="blue"
                                onClick={() => setShowExecutionerModal(true)}
                            />
                            <AgentDetail
                                icon={<TrendingUp className="w-10 h-10" />}
                                title="Evaluator Agent"
                                role="The Judge"
                                description="Scores each response, assesses overall fit, and makes the final Deal or No Deal recommendation."
                                color="green"
                                onClick={() => setShowEvaluatorModal(true)}
                            />
                            <AgentDetail
                                icon={<Shield className="w-10 h-10" />}
                                title="Observer Agent"
                                role="The Watchdog & Learner"
                                description="Monitors for plagiarism, AI-generated responses, and suspicious behavior. Also learns from interviews to gradually improve the overall intelligence of the system."
                                color="red"
                                onClick={() => setShowObserverModal(true)}
                            />
                            <AgentDetail
                                icon={<Users className="w-10 h-10" />}
                                title="Critique Agent"
                                role="The Coach"
                                description="Provides constructive feedback, generates follow-up questions, and ensures high-quality interviews."
                                color="purple"
                                onClick={() => setShowCritiqueModal(true)}
                            />
                            <AgentDetail
                                icon={<CheckCircle className="w-10 h-10" />}
                                title="Monitor Agent"
                                role="The Recorder"
                                description="Logs everything, tracks time, watches state transitions, and ensures nothing is missed."
                                color="gray"
                                onClick={() => setShowMonitorModal(true)}
                            />
                        </div>
                    </div>
                </section>

                {/* Universal Domains */}
                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">
                            Works for <span className="text-brand-primary">Any</span> Industry
                        </h2>
                        <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                            Our AI is trained on domain-specific knowledge using RAG (Retrieval-Augmented Generation). From tech to healthcare, we've got you covered.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <DomainExample emoji="💻" title="Software Engineer" example="Asks about algorithms, system design, and code quality" />
                            <DomainExample emoji="⚕️" title="Doctor" example="Tests medical knowledge, diagnosis skills, and patient care" />
                            <DomainExample emoji="⚖️" title="Lawyer" example="Evaluates legal reasoning, case analysis, and ethics" />
                            <DomainExample emoji="💼" title="Sales Rep" example="Assesses persuasion, objection handling, and closing" />
                            <DomainExample emoji="🎨" title="Designer" example="Reviews portfolio, design thinking, and creativity" />
                            <DomainExample emoji="🔬" title="Scientist" example="Tests research methods, data analysis, and hypothesis" />
                            <DomainExample emoji="🍳" title="Chef" example="Evaluates culinary skills, menu planning, and techniques" />
                            <DomainExample emoji="📚" title="Teacher" example="Assesses pedagogy, subject knowledge, and engagement" />
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 px-4 bg-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">
                            Ready to See It in Action?
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Try a free interview right now. No signup required.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/quick-start"
                                className="px-10 py-5 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 text-lg shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>Try Free Interview</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/signup"
                                className="px-10 py-5 border-2 border-black text-black font-semibold rounded-lg hover:bg-black hover:text-white transition-all text-lg"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </section>

            </div>

            {/* Workflow Modals */}
            {showStrategyModal && (
                <WorkflowModal
                    title="Strategy Agent Workflow"
                    onClose={() => setShowStrategyModal(false)}
                    color="orange"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Analyze Job Description">
                            Parses JD to extract required skills, experience level, and key responsibilities
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Analyze Candidate Profile">
                            Reviews resume/profile to identify strengths, gaps, and relevant experience
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Create Interview Plan">
                            Designs interview structure: topics to cover, depth per topic, time allocation
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Prioritize Focus Areas">
                            Identifies critical skills to probe deeply vs. nice-to-have skills
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}

            {showExecutionerModal && (
                <WorkflowModal
                    title="Executioner Agent Workflow"
                    onClose={() => setShowExecutionerModal(false)}
                    color="blue"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Receive Strategy Plan">
                            Gets interview plan from Strategy Agent with topics and priorities
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Ask Initial Question">
                            Starts with seed question based on strategy plan
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Listen & Adapt">
                            Analyzes candidate response in real-time with Evaluator's scoring signals
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Generate Follow-ups">
                            Creates intelligent follow-up questions based on response quality and depth
                        </WorkflowStep>
                        <WorkflowStep number="5" title="Transition Topics">
                            Moves to next topic when current area is sufficiently explored
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}

            {showEvaluatorModal && (
                <WorkflowModal
                    title="Evaluator Agent Workflow"
                    onClose={() => setShowEvaluatorModal(false)}
                    color="green"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Real-time Scoring">
                            Scores each response on accuracy, depth, and relevance (0-10 scale)
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Signal to Executioner">
                            Sends confidence signals to guide follow-up question depth
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Track Overall Performance">
                            Maintains running assessment of candidate fit across all topics
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Generate Final Recommendation">
                            Produces Deal/No Deal recommendation with detailed justification
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}

            {showObserverModal && (
                <WorkflowModal
                    title="Observer Agent Workflow"
                    onClose={() => setShowObserverModal(false)}
                    color="red"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Monitor Behavior">
                            Watches for suspicious patterns: copy-paste, tab switching, unusual delays
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Detect AI Responses">
                            Analyzes response patterns to identify AI-generated answers
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Check Plagiarism">
                            Compares responses against known solutions and online resources
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Learn & Improve">
                            Learns from each interview to gradually improve system intelligence and detection accuracy
                        </WorkflowStep>
                        <WorkflowStep number="5" title="Flag Issues">
                            Alerts recruiters to integrity concerns with evidence and confidence scores
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}

            {showCritiqueModal && (
                <WorkflowModal
                    title="Critique Agent Workflow"
                    onClose={() => setShowCritiqueModal(false)}
                    color="purple"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Review Evaluator Scores">
                            Audits scoring decisions for bias, fairness, and technical accuracy
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Suggest Improvements">
                            Recommends follow-up questions or scoring adjustments if needed
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Ensure Quality">
                            Validates that interview depth matches job requirements
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Generate Feedback">
                            Creates constructive feedback for candidates to improve
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}

            {showMonitorModal && (
                <WorkflowModal
                    title="Monitor Agent Workflow"
                    onClose={() => setShowMonitorModal(false)}
                    color="gray"
                >
                    <div className="space-y-4">
                        <WorkflowStep number="1" title="Log All Events">
                            Records every agent action, decision, and state transition
                        </WorkflowStep>
                        <WorkflowStep number="2" title="Track Time">
                            Monitors interview duration and time spent per question
                        </WorkflowStep>
                        <WorkflowStep number="3" title="Watch State Changes">
                            Tracks interview flow: question → response → evaluation → next question
                        </WorkflowStep>
                        <WorkflowStep number="4" title="Ensure Completeness">
                            Verifies all required topics were covered and nothing was skipped
                        </WorkflowStep>
                        <WorkflowStep number="5" title="Create Audit Trail">
                            Generates complete audit log for compliance and debugging
                        </WorkflowStep>
                    </div>
                </WorkflowModal>
            )}
        </>
    )
}

function FlowStep({ number, icon, title, description, color }: any) {
    const colorClasses: any = {
        orange: 'from-orange-500 to-red-500',
        purple: 'from-purple-500 to-pink-500',
        green: 'from-green-500 to-emerald-500',
    }

    return (
        <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white mb-6 shadow-lg`}>
                    {icon}
                </div>
                <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100">{number}</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600">{description}</p>
            </div>
        </div>
    )
}

function DetailedStep({ step, title, description, features, image, reverse }: any) {
    return (
        <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
            <div className="flex-1">
                <div className="inline-block px-4 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full mb-4">
                    <span className="text-sm font-semibold text-brand-primary">Step {step}</span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">{title}</h3>
                <p className="text-lg text-gray-600 mb-6">{description}</p>
                <ul className="space-y-3">
                    {features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-brand-primary flex-shrink-0 mt-1" />
                            <span className="text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-9xl">{image}</div>
            </div>
        </div>
    )
}

function AgentDetail({ icon, title, role, description, color, onClick }: any) {
    const colorClasses: any = {
        orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
        blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        red: 'from-red-500/20 to-pink-500/20 border-red-500/30',
        purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        gray: 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
    }

    const iconColorClasses: any = {
        orange: 'text-orange-600 hover:bg-orange-50',
        blue: 'text-blue-600 hover:bg-blue-50',
        green: 'text-green-600 hover:bg-green-50',
        red: 'text-red-600 hover:bg-red-50',
        purple: 'text-purple-600 hover:bg-purple-50',
        gray: 'text-gray-600 hover:bg-gray-50',
    }

    return (
        <div className={`group p-6 rounded-xl border bg-gradient-to-br backdrop-blur-xl ${colorClasses[color]} relative hover:shadow-md transition-all`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <div className="text-brand-primary">{icon}</div>
                    <div>
                        <h3 className="text-xl font-bold mb-1">{title}</h3>
                        <p className="text-sm text-gray-400 italic">{role}</p>
                    </div>
                </div>
                <button
                    onClick={onClick}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg ${iconColorClasses[color]}`}
                    title="View workflow"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
            </div>
            <p className="text-gray-300">{description}</p>
        </div>
    )
}

function DomainExample({ emoji, title, example }: any) {
    return (
        <div className="p-6 bg-white rounded-xl border border-gray-200 hover:border-brand-primary transition-all shadow-sm hover:shadow-md text-left">
            <div className="text-4xl mb-3">{emoji}</div>
            <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600">{example}</p>
        </div>
    )
}

function WorkflowModal({ title, onClose, color, children }: any) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

function WorkflowStep({ number, title, children }: any) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                {number}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                <p className="text-gray-600 text-sm">{children}</p>
            </div>
        </div>
    )
}
