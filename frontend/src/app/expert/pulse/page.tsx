'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    User,
    Clock,
    CheckCircle2,
    Circle,
    ArrowRight,
    Search,
    Filter,
    RefreshCw,
    Terminal,
    ChevronDown,
    ChevronUp,
    Cpu,
    Brain
} from 'lucide-react';

interface Session {
    session_id: string;
    current_state: string;
    current_phase: string | null;
    current_question_id: string | null;
    questions_asked: number;
    time_elapsed_seconds: number;
    last_updated_at: string;
    candidate_name: string | null;
    position_title: string | null;
    expert_name: string | null;
    detected_language: string | null;
}

interface Event {
    id: number;
    event_type: string;
    event_data: any;
    occurred_at: string;
    sequence_number: number;
}

export default function InterviewPulse() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/intelligence/pulse');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Error fetching pulse data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async (sessionId: string) => {
        setLoadingEvents(true);
        try {
            const res = await fetch(`http://localhost:8000/api/intelligence/sessions/${sessionId}/events`);
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const toggleSession = (sessionId: string) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
            fetchEvents(sessionId);
        }
    };

    const getStatusColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'started': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'questioning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'evaluating': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400">
                        Interview Pulse
                    </h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Activity size={16} className="text-green-400 animate-pulse" />
                        Real-time session monitoring & event sourcing monitor
                    </p>
                </div>
                <button
                    onClick={fetchSessions}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh Pulse
                </button>
            </div>

            {/* Sessions Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <div className="col-span-4">Candidate / Position</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Current Phase</div>
                    <div className="col-span-1 text-center">Qs</div>
                    <div className="col-span-2">Last Activity</div>
                    <div className="col-span-1"></div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400" />
                        <p className="text-gray-500 animate-pulse">Scanning live signals...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        No active interview sessions found.
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {sessions.map((session) => (
                            <React.Fragment key={session.session_id}>
                                <div
                                    onClick={() => toggleSession(session.session_id)}
                                    className={`grid grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors items-center cursor-pointer group ${expandedSession === session.session_id ? 'bg-white/5' : ''}`}
                                >
                                    <div className="col-span-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                                            <User size={20} className="text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">
                                                {session.candidate_name || 'Anonymous candidate'}
                                            </h3>
                                            <p className="text-xs text-gray-500">{session.position_title || 'General Position'}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusColor(session.current_state)}`}>
                                            {session.current_state.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${session.current_phase ? 'bg-purple-400' : 'bg-gray-600'}`} />
                                            <span className="text-sm text-gray-300 font-mono">
                                                {session.current_phase || '--'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-1 text-center">
                                        <span className="text-sm font-medium text-white">{session.questions_asked}</span>
                                    </div>

                                    <div className="col-span-2 text-xs text-gray-500 flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(session.last_updated_at).toLocaleTimeString()}
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        {expandedSession === session.session_id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Audit Trail - Event Stream */}
                                {expandedSession === session.session_id && (
                                    <div className="bg-black/40 border-y border-white/5 p-8 animate-in slide-in-from-top duration-300">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <Terminal size={20} className="text-green-400" />
                                                <h4 className="font-semibold text-white">Event Audit Trail</h4>
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-mono">{session.session_id}</span>
                                        </div>

                                        {loadingEvents ? (
                                            <div className="flex justify-center p-8">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {events.map((event, idx) => (
                                                    <div key={event.id} className="relative pl-8 pb-4 last:pb-0">
                                                        {/* Connector line */}
                                                        {idx !== events.length - 1 && (
                                                            <div className="absolute left-[11px] top-[24px] bottom-0 w-0.5 bg-white/5" />
                                                        )}

                                                        {/* Dot icon */}
                                                        <div className="absolute left-0 top-1 p-1 bg-[#050505] border border-white/10 rounded-full z-10">
                                                            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                <span className="text-[8px] font-bold text-green-400">{event.sequence_number}</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/10 p-4 rounded-xl hover:border-green-500/30 transition-all">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-sm font-bold text-green-400 flex items-center gap-2">
                                                                    {event.event_type}
                                                                    <ArrowRight size={14} className="text-gray-600" />
                                                                </span>
                                                                <span className="text-[10px] text-gray-500">
                                                                    {new Date(event.occurred_at).toLocaleTimeString()}
                                                                </span>
                                                            </div>

                                                            <div className="bg-black/50 p-3 rounded-lg border border-white/5">
                                                                <pre className="text-[11px] text-gray-400 overflow-x-auto font-mono">
                                                                    {JSON.stringify(event.event_data, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Infrastructure Note */}
            <div className="mt-12 flex gap-8">
                <div className="flex-1 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Cpu size={20} className="text-blue-400" />
                        <h3 className="font-semibold text-white">Write Side (Immutable)</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Every action is recorded as an immutable event in the <code className="text-blue-400">interview_events</code> table.
                        This creates a 100% accurate audit trail for compliance and debugging.
                    </p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-green-500/5 to-cyan-500/5 border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain size={20} className="text-green-400" />
                        <h3 className="font-semibold text-white">Read Side (Projections)</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        The data shown above is sourced from <code className="text-green-400">session_state_projection</code>,
                        which is updated in real-time as events land in the event store.
                    </p>
                </div>
            </div>
        </div>
    );
}
