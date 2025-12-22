'use client';

import React, { useState, useEffect } from 'react';
import {
    Brain,
    Sparkles,
    MessageSquare,
    Zap,
    Activity,
    Shield,
    Terminal,
    ChevronRight,
    Database,
    BarChart3,
    Cpu,
    History
} from 'lucide-react';

interface IntelligenceStats {
    total_learnings: number;
    avg_confidence: number;
    intelligence_level: string;
}

interface Learning {
    id: string;
    learning_id: string;
    pattern: string;
    category: string;
    confidence_score: number;
    frequency: number;
    created_at: string;
    tags: string[];
}

interface Prompt {
    id: string;
    name: string;
    category: string;
    version: string;
    status: string;
}

export default function IntelligenceHub() {
    const [stats, setStats] = useState<IntelligenceStats | null>(null);
    const [learnings, setLearnings] = useState<Learning[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stream' | 'prompts'>('stream');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Polling for "live" feel
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, learningsRes, promptsRes] = await Promise.all([
                fetch('http://localhost:8000/api/intelligence/stats'),
                fetch('http://localhost:8000/api/intelligence/learnings?limit=10'),
                fetch('http://localhost:8000/api/intelligence/prompts')
            ]);

            const statsData = await statsRes.json();
            const learningsData = await learningsRes.json();
            const promptsData = await promptsRes.json();

            setStats(statsData);
            setLearnings(learningsData.learnings || []);
            setPrompts(promptsData.prompts || []);
        } catch (error) {
            console.error('Error fetching intelligence data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        Intelligence Hub
                    </h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Cpu size={16} className="text-blue-400" />
                        Centralized AI Intelligence Layer & Learning Repository
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => fetchData()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2"
                    >
                        <Activity size={18} className="text-green-400" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* IQ Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain size={80} />
                    </div>
                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Intelligence Level</p>
                    <h2 className="text-3xl font-bold text-white mb-2">{stats?.intelligence_level || 'Calculating...'}</h2>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-4">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: stats ? (stats.total_learnings > 100 ? '100%' : `${stats.total_learnings}%`) : '0%' }}
                        />
                    </div>
                    <p className="text-xs text-blue-400 mt-2">Based on system IQ and pattern matching</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={80} />
                    </div>
                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Confidence Boost</p>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {stats ? `+${(stats.avg_confidence * 100).toFixed(1)}%` : '...'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                        Average accuracy improvement across all agent generations.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Database size={80} />
                    </div>
                    <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider">Learnings Applied</p>
                    <h2 className="text-3xl font-bold text-white mb-2">{stats?.total_learnings || 0}</h2>
                    <p className="text-sm text-purple-400 mt-4">
                        Unique patterns identified and stored in Supabase.
                    </p>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="flex gap-8 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('stream')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === 'stream' ? 'text-blue-400' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Activity size={18} />
                        Learning Stream
                    </div>
                    {activeTab === 'stream' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === 'prompts' ? 'text-blue-400' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Terminal size={18} />
                        Prompt Monitor
                    </div>
                    {activeTab === 'prompts' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {activeTab === 'stream' ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <span className="text-sm font-semibold flex items-center gap-2">
                                <History size={16} className="text-blue-400" />
                                Live activity feed
                            </span>
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">
                                REAL-TIME
                            </span>
                        </div>
                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                            </div>
                        ) : learnings.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                No learning events recorded yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {learnings.map((learning) => (
                                    <div key={learning.id} className="p-6 hover:bg-white/5 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                    <Zap size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                                        {learning.pattern}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] uppercase tracking-tighter px-1.5 py-0.5 bg-white/10 rounded text-gray-400 border border-white/5">
                                                            {learning.category}
                                                        </span>
                                                        <span className="text-gray-600 text-[10px]">•</span>
                                                        <span className="text-gray-500 text-xs">
                                                            Extracted {new Date(learning.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400 mb-1">Confidence Score</div>
                                                <div className="font-mono text-blue-400 text-sm">
                                                    {(learning.confidence_score * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-blue-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                        <MessageSquare size={18} />
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${prompt.status === 'active'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                        }`}>
                                        {prompt.status.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{prompt.name}</h3>
                                <p className="text-xs text-gray-500 mb-4 font-mono">{prompt.id}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs flex items-center gap-1">
                                            <Shield size={10} />
                                            v{prompt.version}
                                        </span>
                                    </div>
                                    <button className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium flex items-center gap-1">
                                        Edit Template
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
