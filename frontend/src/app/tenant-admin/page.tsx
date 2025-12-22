'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Building, Users, Briefcase, TrendingUp, UserPlus,
    ChevronDown, ChevronRight, Settings, Plus, Search, Activity
} from 'lucide-react'
import { ManagementTable } from '@/components/admin/ManagementTable'

interface TenantStats {
    accounts: number
    positions: number
    users: number
    sessions: number
}

interface Account {
    id: string
    name: string
    industry: string | null
    description: string | null
    created_at: string
}

interface UserProfile {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

export default function TenantAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'accounts' | 'users' | 'sessions'>('accounts')
    const [stats, setStats] = useState<TenantStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [tenantName, setTenantName] = useState('Loading...')

    // Data states
    const [accounts, setAccounts] = useState<Account[]>([])
    const [users, setUsers] = useState<UserProfile[]>([])

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'account' | 'user'>('account')

    const supabase = createClient()

    useEffect(() => {
        fetchTenantInfo()
        fetchStats()
        fetchData()
    }, [activeTab])

    const fetchTenantInfo = async () => {
        try {
            const user = await supabase.auth.getUser()
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id, tenants(name)')
                .eq('id', user.data.user?.id)
                .single()

            if (profile?.tenants && typeof profile.tenants === 'object' && 'name' in profile.tenants) {
                setTenantName(profile.tenants.name as string)
            }
        } catch (e) { console.error(e) }
    }

    const fetchStats = async () => {
        try {
            const user = await supabase.auth.getUser()
            const res = await fetch('http://localhost:8000/api/tenant-admin/stats', {
                headers: { 'X-User-ID': user.data.user?.id || '' }
            })
            if (res.ok) setStats(await res.json())
        } catch (e) { console.error(e) }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const user = await supabase.auth.getUser()
            const userId = user.data.user?.id || ''
            const headers = { 'X-User-ID': userId }

            if (activeTab === 'accounts') {
                const res = await fetch('http://localhost:8000/api/tenant-admin/accounts', { headers })
                const data = await res.json()
                setAccounts(data.accounts || [])
            } else if (activeTab === 'users') {
                const res = await fetch('http://localhost:8000/api/tenant-admin/users', { headers })
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Building className="w-8 h-8 text-blue-500" />
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                                Tenant Admin Dashboard
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm">Managing: <span className="text-white font-medium">{tenantName}</span></p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <TabButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} label="Accounts" icon={<Briefcase className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<Users className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} label="Sessions" icon={<Activity className="w-4 h-4" />} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard icon={<Briefcase />} label="Accounts" value={stats?.accounts || 0} color="blue" />
                    <StatCard icon={<TrendingUp />} label="Positions" value={stats?.positions || 0} color="purple" />
                    <StatCard icon={<Users />} label="Users" value={stats?.users || 0} color="green" />
                    <StatCard icon={<Activity />} label="Sessions" value={stats?.sessions || 0} color="cyan" />
                </div>

                {/* Main Content Area */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold capitalize">{activeTab} Management</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {activeTab === 'accounts' ? 'Group your recruitment by specific client accounts' :
                                    activeTab === 'users' ? 'Manage roles for account admins, experts, and candidates' :
                                        'Live monitoring of active and completed interviews'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    className="bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-blue-500 w-64"
                                />
                            </div>
                            <button
                                onClick={() => { setModalType(activeTab === 'users' ? 'user' : 'account'); setShowModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                {activeTab === 'users' ? 'Invite User' : 'Add Account'}
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'accounts' && (
                            <ManagementTable
                                loading={loading}
                                data={accounts}
                                columns={[
                                    {
                                        header: 'Account', accessor: (a) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold uppercase">
                                                    {a.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{a.name}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{a.description}</div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { header: 'Industry', accessor: 'industry' },
                                    { header: 'Created', accessor: (a) => new Date(a.created_at).toLocaleDateString() }
                                ]}
                                actionLabel="View Positions"
                                onAction={(a) => console.log('View positions for', a.id)}
                                onEdit={(a) => console.log('Edit', a)}
                            />
                        )}

                        {activeTab === 'users' && (
                            <ManagementTable
                                loading={loading}
                                data={users}
                                columns={[
                                    {
                                        header: 'User', accessor: (u) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold uppercase">
                                                    {u.full_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{u.full_name}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'Role', accessor: (u) => (
                                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        )
                                    },
                                    { header: 'Joined', accessor: (u) => new Date(u.created_at).toLocaleDateString() }
                                ]}
                                onEdit={(u) => console.log('Edit', u)}
                            />
                        )}

                        {activeTab === 'sessions' && (
                            <div className="py-20 text-center text-gray-500 italic">
                                Active sessions will be listed here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorClasses = {
        blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
        purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
        green: 'from-green-500/20 to-emerald-500/20 text-green-400',
        cyan: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
    }

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border border-white/10 rounded-xl p-6 backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    )
}
