'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Building2, Users, Briefcase, Activity, Shield, TrendingUp,
    Search, Plus, Filter, MoreHorizontal, Settings, Trash2, Edit
} from 'lucide-react'
import { ManagementTable } from '@/components/admin/ManagementTable'

interface SystemStats {
    tenants: number
    users: number
    accounts: number
    positions: number
    sessions: number
}

interface Tenant {
    id: string
    name: string
    slug: string
    domain: string | null
    subscription_tier: string
    is_active: boolean
    created_at: string
}

interface UserProfile {
    id: string
    email: string
    full_name: string
    role: string
    tenant_id: string | null
    is_super_admin: boolean
    created_at: string
}

interface Account {
    id: string
    name: string
    tenant_id: string
    industry: string | null
    is_active: boolean
    created_at: string
    tenants?: { name: string }
}

interface AdminRequest {
    id: string
    email: string
    full_name: string
    reason: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'tenants' | 'users' | 'accounts' | 'audit' | 'requests'>('tenants')
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Data states
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [users, setUsers] = useState<UserProfile[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [requests, setRequests] = useState<AdminRequest[]>([])

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'tenant' | 'user' | 'account'>('tenant')

    const supabase = createClient()

    useEffect(() => {
        fetchStats()
        fetchData()
    }, [activeTab])

    const fetchStats = async () => {
        try {
            const user = await supabase.auth.getUser()
            const res = await fetch('http://localhost:8000/api/super-admin/stats', {
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

            if (activeTab === 'tenants') {
                const res = await fetch('http://localhost:8000/api/super-admin/tenants', { headers })
                const data = await res.json()
                setTenants(data.tenants || [])
            } else if (activeTab === 'users') {
                const res = await fetch('http://localhost:8000/api/super-admin/users', { headers })
                const data = await res.json()
                setUsers(data.users || [])
            } else if (activeTab === 'accounts') {
                const res = await fetch('http://localhost:8000/api/super-admin/accounts', { headers })
                const data = await res.json()
                setAccounts(data.accounts || [])
            } else if (activeTab === 'requests') {
                const res = await fetch('http://localhost:8000/api/super-admin/access-requests', { headers })
                const data = await res.json()
                setRequests(data.requests || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, type: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return
        try {
            const user = await supabase.auth.getUser()
            const endpoint = type === 'tenant' ? `/api/super-admin/tenants/${id}` : `/api/super-admin/users/${id}`
            const res = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'DELETE',
                headers: { 'X-User-ID': user.data.user?.id || '' }
            })
            if (res.ok) fetchData()
        } catch (e) { console.error(e) }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8 text-orange-500" />
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                                Super Admin Dashboard
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm">Global System Orchestration & Multi-Tenant Control</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} label="Tenants" icon={<Building2 className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<Users className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} label="Accounts" icon={<Briefcase className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} label="Requests" icon={<Shield className="w-4 h-4" />} />
                        <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} label="Audit Logs" icon={<Activity className="w-4 h-4" />} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
                    <StatCard icon={<Building2 />} label="Tenants" value={stats?.tenants || 0} color="orange" />
                    <StatCard icon={<Users />} label="Users" value={stats?.users || 0} color="blue" />
                    <StatCard icon={<Briefcase />} label="Accounts" value={stats?.accounts || 0} color="purple" />
                    <StatCard icon={<TrendingUp />} label="Positions" value={stats?.positions || 0} color="green" />
                    <StatCard icon={<Activity />} label="Sessions" value={stats?.sessions || 0} color="cyan" />
                </div>

                {/* Main Content Area */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold capitalize">{activeTab} Management</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {activeTab === 'tenants' ? 'Configure global tenants and subscription tiers' :
                                    activeTab === 'users' ? 'Manage user roles and permissions across any persona' :
                                        'Overview of client accounts across all tenants'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    className="bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-orange-500 w-64"
                                />
                            </div>
                            <button
                                onClick={() => { setModalType(activeTab === 'users' ? 'user' : activeTab === 'accounts' ? 'account' : 'tenant'); setShowModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tenants' && (
                            <ManagementTable
                                loading={loading}
                                data={tenants}
                                columns={[
                                    {
                                        header: 'Tenant', accessor: (t) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                                                    {t.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{t.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{t.slug}</div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { header: 'Domain', accessor: 'domain' },
                                    {
                                        header: 'Tier', accessor: (t) => (
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                {t.subscription_tier}
                                            </span>
                                        )
                                    },
                                    {
                                        header: 'Status', accessor: (t) => (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {t.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        )
                                    }
                                ]}
                                onEdit={(t) => console.log('Edit', t)}
                                onDelete={(t) => handleDelete(t.id, 'tenant')}
                            />
                        )}

                        {activeTab === 'users' && (
                            <ManagementTable
                                loading={loading}
                                data={users}
                                columns={[
                                    {
                                        header: 'Profile', accessor: (u) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
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
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-gray-400`}>
                                                {u.role.replace('_', ' ')}
                                            </span>
                                        )
                                    },
                                    { header: 'Tenant ID', accessor: (u) => <span className="text-xs font-mono text-gray-500">{u.tenant_id || 'System'}</span> },
                                    { header: 'Super Admin', accessor: (u) => u.is_super_admin ? <Shield className="w-4 h-4 text-orange-500" /> : null }
                                ]}
                                onEdit={(u) => console.log('Edit', u)}
                                onDelete={(u) => handleDelete(u.id, 'user')}
                            />
                        )}

                        {activeTab === 'accounts' && (
                            <ManagementTable
                                loading={loading}
                                data={accounts}
                                columns={[
                                    { header: 'Account Name', accessor: 'name' },
                                    { header: 'Tenant', accessor: (a: any) => a.tenants?.name || a.tenant_id },
                                    { header: 'Industry', accessor: 'industry' },
                                    { header: 'Created', accessor: (a: any) => new Date(a.created_at).toLocaleDateString() }
                                ]}
                                onEdit={(a) => console.log('Edit', a)}
                            />
                        )}

                        {activeTab === 'requests' && (
                            <ManagementTable
                                loading={loading}
                                data={requests}
                                columns={[
                                    {
                                        header: 'Requester', accessor: (r: any) => (
                                            <div>
                                                <div className="font-bold">{r.full_name}</div>
                                                <div className="text-xs text-gray-500">{r.email}</div>
                                            </div>
                                        )
                                    },
                                    { header: 'Reason', accessor: 'reason' },
                                    {
                                        header: 'Status', accessor: (r: any) => (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'pending' ? 'bg-orange-500/10 text-orange-400' :
                                                r.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {r.status}
                                            </span>
                                        )
                                    },
                                    { header: 'Date', accessor: (r: any) => new Date(r.created_at).toLocaleDateString() },
                                    {
                                        header: 'Actions', accessor: (r: any) => r.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Approve this request?')) return
                                                        try {
                                                            const { data: { user } } = await supabase.auth.getUser()
                                                            console.log('Approving request:', r.id)
                                                            const res = await fetch(`http://localhost:8000/api/super-admin/access-requests/${r.id}/approve`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'X-User-ID': user?.id || '',
                                                                    'Content-Type': 'application/json'
                                                                }
                                                            })

                                                            if (!res.ok) {
                                                                const err = await res.text()
                                                                throw new Error(err || res.statusText)
                                                            }

                                                            const data = await res.json()
                                                            console.log('Approval success:', data)

                                                            // Refresh list
                                                            fetchData()
                                                        } catch (e: any) {
                                                            console.error('Approval failed:', e)
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded text-[10px] font-bold uppercase transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Reject this request?')) return
                                                        try {
                                                            const { data: { user } } = await supabase.auth.getUser()
                                                            const res = await fetch(`http://localhost:8000/api/super-admin/access-requests/${r.id}/reject`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'X-User-ID': user?.id || '',
                                                                    'Content-Type': 'application/json'
                                                                }
                                                            })

                                                            if (!res.ok) throw new Error(res.statusText)
                                                            fetchData()
                                                        } catch (e: any) {
                                                            console.error('Rejection failed:', e)
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded text-[10px] font-bold uppercase transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : null
                                    }
                                ]}
                            />
                        )}

                        {activeTab === 'audit' && (
                            <div className="py-20 text-center text-gray-500 italic">
                                Logs will populate as you perform system-wide actions.
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
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            {label}
        </button>
    )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorClasses = {
        orange: 'from-orange-500/20 to-red-500/20 text-orange-400',
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
