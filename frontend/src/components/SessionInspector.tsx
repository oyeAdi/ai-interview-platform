import React, { useState } from 'react';

interface LogEntry {
    agent: string;
    thought: string;
    timestamp?: string;
    level?: string;
    confidence?: number;
}

interface SessionInspectorProps {
    logs: LogEntry[];
}

export default function SessionInspector({ logs }: SessionInspectorProps) {
    const [filterAgent, setFilterAgent] = useState<string>('All');

    const agents = ['All', ...Array.from(new Set(logs.map(l => l.agent)))].sort();
    const filteredLogs = filterAgent === 'All' ? logs : logs.filter(l => l.agent === filterAgent);

    const getConfidenceColor = (score: number | undefined) => {
        if (score === undefined) return 'bg-gray-200';
        if (score >= 0.8) return 'bg-green-500';
        if (score >= 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Session Inspector</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Live Agent Telegraphy</p>
                </div>
                <select
                    value={filterAgent}
                    onChange={(e) => setFilterAgent(e.target.value)}
                    className="text-xs border-gray-200 rounded-lg px-3 py-1.5 focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-600"
                >
                    {agents.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 sticky top-0">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-2">Agent</div>
                <div className="col-span-5">Thought / Action</div>
                <div className="col-span-1 text-right">Conf.</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                        <span className="text-xs font-medium">No logs available</span>
                    </div>
                ) : (
                    filteredLogs.map((log, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors items-start border border-transparent hover:border-gray-100">
                            {/* Timestamp */}
                            <div className="col-span-2 text-[10px] font-mono text-gray-400 pt-1">
                                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                            </div>

                            {/* Level */}
                            <div className="col-span-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">
                                    {log.level || 'Unknown'}
                                </span>
                            </div>

                            {/* Agent */}
                            <div className="col-span-2">
                                <span className={`text-xs font-bold ${log.agent === 'Critic' ? 'text-purple-600' : 'text-brand-primary'}`}>
                                    {log.agent}
                                </span>
                            </div>

                            {/* Thought */}
                            <div className="col-span-5">
                                <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                                    {log.thought}
                                </p>
                            </div>

                            {/* Confidence */}
                            <div className="col-span-1 flex justify-end pt-1">
                                <div className="flex items-center gap-1.5" title={`Confidence: ${log.confidence ?? 'N/A'}`}>
                                    <span className="text-[9px] font-mono text-gray-400">{log.confidence}</span>
                                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(log.confidence)}`}></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
