'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Briefcase, TrendingUp, Users, FileText, UserPlus, ChevronDown, ChevronRight, Mail } from 'lucide-react'

interface AccountAdminStats {
    positions: number
    sessions: number
    candidates: number
}

interface Account {
    id: string
    name: string
    description: string | null
}

interface Position {
    id: string
    title: string
    jd_text: string | null
    created_at: string
    expanded?: boolean
    candidates?: Candidate[]
    hitl_experts?: User[]
}

interface Candidate {
    id: string
    name: string
    email: string
    status: string
    invited_at: string
}

interface User {
    id: string
    full_name: string
    email: string
}

export default function AccountAdminDashboard() {
    const [stats, setStats] = useState<AccountAdminStats | null>(null)
    const [positions, setPositions] = useState<Position[]>([])
    const [loading, setLoading] = useState(true)
    const [accountNames, setAccountNames] = useState<string[]>([])
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteType, setInviteType] = useState<'hitl_expert' | 'candidate'>('candidate')
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const user = await supabase.auth.getUser()
            const userId = user.data.user?.id || ''

            // Get user's managed accounts
            const { data: profile } = await supabase
                .from('profiles')
                .select('managed_accounts')
                .eq('id', userId)
                .single()

            const managedAccounts = profile?.managed_accounts || []

            if (managedAccounts.length > 0) {
                // Fetch account names
                const accountsRes = await supabase
                    .from('accounts')
                    .select('name')
                    .in('id', managedAccounts)

                setAccountNames(accountsRes.data?.map(a => a.name) || [])

                // Fetch positions for managed accounts
                const positionsRes = await supabase
                    .from('positions')
                    .select('*')
                    .in('account_id', managedAccounts)

                setPositions((positionsRes.data || []).map(pos => ({ ...pos, expanded: false })))

                setStats({
                    positions: positionsRes.data?.length || 0,
                    sessions: 0,
                    candidates: 0
                })
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const togglePositionExpand = async (positionId: string) => {
        const position = positions.find(p => p.id === positionId)
        if (!position) return

        if (!position.expanded && !position.candidates) {
            // Fetch candidates and HITL experts for this position
            // Mock data for now
            setPositions(positions.map(p =>
                p.id === positionId
                    ? {
                        ...p,
                        expanded: true,
                        candidates: [],
                        hitl_experts: []
                    }
                    : p
            ))
        } else {
            setPositions(positions.map(p =>
                p.id === positionId ? { ...p, expanded: !p.expanded } : p
            ))
        }
    }

    const handleInvite = (type: 'hitl_expert' | 'candidate', positionId?: string) => {
        setInviteType(type)
        setSelectedPositionId(positionId || null)
        setShowInviteModal(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">Loading account_admin dashboard...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-8 h-8 text-purple-500" />
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Account Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Managing: <span className="text-white font-medium">{accountNames.join(', ') || 'No accounts assigned'}</span>
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard icon={<TrendingUp />} label="Positions" value={stats?.positions || 0} color="purple" />
                    <StatCard icon={<Users />} label="Sessions" value={stats?.sessions || 0} color="pink" />
                    <StatCard icon={<FileText />} label="Candidates" value={stats?.candidates || 0} color="indigo" />
                </div>

                {/* Position Management */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">Position Management</h2>
                            <p className="text-gray-400 text-sm mt-1">Manage positions and invite HITL experts & candidates</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleInvite('hitl_expert')}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invite HITL Expert
                            </button>
                            <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors">
                                + Create Position
                            </button>
                        </div>
                    </div>

                    {/* Expandable Positions List */}
                    <div className="space-y-4">
                        {positions.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                No positions yet. Create your first position to get started.
                            </div>
                        ) : (
                            positions.map((position) => (
                                <div key={position.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                    {/* Position Header */}
                                    <div
                                        onClick={() => togglePositionExpand(position.id)}
                                        className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            {position.expanded ? (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-semibold">{position.title}</h3>
                                                <p className="text-sm text-gray-400">
                                                    Created {new Date(position.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm text-gray-400">Candidates</div>
                                                <div className="text-lg font-semibold">{position.candidates?.length || 0}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-400">HITL Experts</div>
                                                <div className="text-lg font-semibold">{position.hitl_experts?.length || 0}</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleInvite('candidate', position.id)
                                                }}
                                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <Mail className="w-4 h-4" />
                                                Invite Candidate
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {position.expanded && (
                                        <div className="border-t border-white/10 p-6 bg-black/20">
                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Candidates */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-400 mb-4">Invited Candidates</h4>
                                                    {position.candidates && position.candidates.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {position.candidates.map(candidate => (
                                                                <div key={candidate.id} className="p-3 bg-white/5 rounded-lg">
                                                                    <div className="font-medium">{candidate.name}</div>
                                                                    <div className="text-xs text-gray-400 mt-1">{candidate.email}</div>
                                                                    <div className="mt-2">
                                                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                                                                            {candidate.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">No candidates invited yet</div>
                                                    )}
                                                </div>

                                                {/* HITL Experts */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-400 mb-4">Assigned HITL Experts</h4>
                                                    {position.hitl_experts && position.hitl_experts.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {position.hitl_experts.map(expert => (
                                                                <div key={expert.id} className="p-3 bg-white/5 rounded-lg">
                                                                    <div className="font-medium">{expert.full_name}</div>
                                                                    <div className="text-xs text-gray-400 mt-1">{expert.email}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">No HITL experts assigned</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold mb-6">
                                Invite {inviteType === 'hitl_expert' ? 'HITL Expert' : 'Candidate'}
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        placeholder="user@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {inviteType === 'candidate' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                                            <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500">
                                                <option value="">Select position...</option>
                                                {positions.map(pos => (
                                                    <option key={pos.id} value={pos.id} selected={pos.id === selectedPositionId}>
                                                        {pos.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Resume (Optional)</label>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-500 file:text-white file:cursor-pointer"
                                            />
                                        </div>
                                    </>
                                )}

                                {inviteType === 'hitl_expert' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Assign to Positions</label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {positions.map(pos => (
                                                <label key={pos.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded cursor-pointer">
                                                    <input type="checkbox" className="rounded" />
                                                    <span className="text-sm">{pos.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-3 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium">
                                    Send Invite
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorClasses = {
        purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
        pink: 'from-pink-500/20 to-rose-500/20 text-pink-400',
        indigo: 'from-indigo-500/20 to-purple-500/20 text-indigo-400',
    }

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border border-white/10 rounded-xl p-6 backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}
