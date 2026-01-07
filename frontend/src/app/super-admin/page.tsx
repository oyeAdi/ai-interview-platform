'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Building2, Users, Briefcase, Activity, Shield, TrendingUp,
    Search, Plus, Filter, MoreHorizontal, Settings, Trash2, Edit,
    Globe, Lock, CheckCircle2, XCircle, Clock, Zap, ArrowUpRight,
    Server, Fingerprint, Database, LayoutGrid, List
} from 'lucide-react'
import { ManagementTable } from '@/components/admin/ManagementTable'
import Header from '@/components/Header'

interface SystemStats {
    tenants: number
    users: number
    accounts: number
    positions: number
    sessions: number
}

type TabType = 'tenants' | 'users' | 'accounts' | 'positions' | 'requests'

export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>('tenants')
    const [stats, setStats] = useState<SystemStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [debugInfo, setDebugInfo] = useState<any>(null)

    // Data states
    const [tenants, setTenants] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [positions, setPositions] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchStats()
        fetchData()
    }, [activeTab])

    const fetchStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setDebugInfo((prev: any) => ({ ...prev, userId: user.id }))

            const res = await fetch('http://localhost:8000/api/super-admin/stats', {
                headers: { 'X-User-ID': user.id }
            })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
                setDebugInfo((prev: any) => ({ ...prev, statsStatus: 'Success', counts: data }))
            } else {
                const err = await res.text()
                console.error('Stats fetch failed:', err)
                setDebugInfo((prev: any) => ({ ...prev, statsStatus: 'Failed', error: err }))
            }
        } catch (e: any) {
            console.error('Stats error:', e)
            setDebugInfo((prev: any) => ({ ...prev, statsStatus: 'Error', error: e.message }))
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const endpoint = activeTab === 'tenants' ? 'tenants' :
                activeTab === 'users' ? 'users' :
                    activeTab === 'accounts' ? 'accounts' :
                        activeTab === 'positions' ? 'positions' : 'access-requests'

            const res = await fetch(`http://localhost:8000/api/super-admin/${endpoint}`, {
                headers: { 'X-User-ID': user.id }
            })
            const data = await res.json()

            if (activeTab === 'tenants') setTenants(data.tenants || [])
            else if (activeTab === 'users') setUsers(data.users || [])
            else if (activeTab === 'accounts') setAccounts(data.accounts || [])
            else if (activeTab === 'positions') setPositions(data.positions || [])
            else if (activeTab === 'requests') setRequests(data.requests || [])

        } catch (e) {
            console.error('Data error:', e)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = () => {
        let data: any[] = []
        if (activeTab === 'tenants') data = tenants
        else if (activeTab === 'users') data = users
        else if (activeTab === 'accounts') data = accounts
        else if (activeTab === 'positions') data = positions
        else if (activeTab === 'requests') data = requests

        if (!searchQuery) return data

        const query = searchQuery.toLowerCase()
        return data.filter(item => {
            const searchString = JSON.stringify(item).toLowerCase()
            return searchString.includes(query)
        })
    }

    const handleDelete = async (id: string, type: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return
        // Implement delete logic if needed
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-orange-100 font-sans">
            <Header title="Super Admin" showQuickStart={false} showBackToDashboard={false} />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Clean Modern Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-orange-100 rounded-lg">
                                <Shield className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="text-orange-600 font-bold tracking-[0.2em] text-[9px] uppercase">Nexus Core</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                            Super Admin <span className="font-light text-slate-400">Hub</span>
                        </h1>
                        <p className="text-slate-500 text-sm max-w-xl">
                            Global command center for SwarmHire infrastructure, identity, and access.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { fetchStats(); fetchData(); }}
                            className="group flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Refresh Stream</span>
                            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                            <Plus className="w-4 h-4" />
                            New Implementation
                        </button>
                    </div>
                </div>

                {/* Refined Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Orgs', value: stats?.tenants || 0, icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50' },
                        { label: 'Global Users', value: stats?.users || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                        { label: 'Active Business', value: stats?.accounts || 0, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' },
                        { label: 'Live Sessions', value: stats?.sessions || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                    ].map((stat, i) => (
                        <div key={i} className="group relative bg-white border border-slate-200/60 rounded-[1.5rem] p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="text-[10px] font-black text-slate-300 group-hover:text-slate-400 transition-colors">LIVE</div>
                            </div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Grouped Management Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1 space-y-10">
                        {/* Build Group */}
                        <div>
                            <div className="flex items-center gap-2 px-4 mb-4">
                                <Server className="w-3.5 h-3.5 text-slate-300" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory & Infrastructure</h3>
                            </div>
                            <div className="flex flex-col gap-1">
                                {[
                                    { id: 'tenants', label: 'Organizations', icon: Building2 },
                                    { id: 'accounts', label: 'Accounts', icon: Briefcase },
                                    { id: 'positions', label: 'Positions', icon: Zap }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-bold transition-all ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Identity Group */}
                        <div>
                            <div className="flex items-center gap-2 px-4 mb-4">
                                <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access & Identity</h3>
                            </div>
                            <div className="flex flex-col gap-1">
                                {[
                                    { id: 'users', label: 'User Directory', icon: Users },
                                    { id: 'requests', label: 'Access Requests', icon: Lock }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[11px] font-bold transition-all ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white shadow-lg'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Debug Toggle (Optional/Internal) */}
                        {debugInfo && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[9px] font-mono text-slate-400 overflow-hidden">
                                <div className="flex items-center gap-2 mb-2 font-black text-slate-500">
                                    <Database className="w-3 h-3" />
                                    SYSTEM DIAGNOSTIC
                                </div>
                                <div className="truncate">UID: {debugInfo.userId}</div>
                                <div>API: {debugInfo.statsStatus}</div>
                                {debugInfo.error && <div className="text-red-400 mt-1">ERR: {debugInfo.error}</div>}
                            </div>
                        )}
                    </div>

                    {/* Main Management Table View */}
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden min-h-[600px] flex flex-col">
                            {/* Table Header Controls */}
                            <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">{activeTab.replace('tenants', 'Organizations')}</h2>
                                    <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black">{filteredData().length} RECORDS</div>
                                </div>
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={`Filter ${activeTab}...`}
                                        className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-5 text-xs focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none w-full md:w-72 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Table Container */}
                            <div className="flex-1 p-2">
                                <DataRenderer
                                    type={activeTab}
                                    data={filteredData()}
                                    loading={loading}
                                    handleDelete={handleDelete}
                                    supabase={supabase}
                                    fetchData={fetchData}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function DataRenderer({ type, data, loading, handleDelete, supabase, fetchData }: any) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-2 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] animate-pulse">Synchronizing Data...</div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
                    <Search className="w-8 h-8 text-slate-200" />
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-full scale-110 -z-10 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Records Detected</h3>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                    The intelligence stream returned an empty set for <span className="font-bold text-slate-500">{type}</span>.
                </p>
                <button onClick={fetchData} className="mt-8 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Re-verify Data Channel
                </button>
            </div>
        )
    }

    if (type === 'tenants') {
        return (
            <ManagementTable
                loading={loading}
                data={data}
                columns={[
                    {
                        header: 'Organization', accessor: (t: any) => (
                            <div className="flex items-center gap-4 py-1">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-sm font-black border border-orange-100 shadow-sm transition-transform group-hover:scale-105">
                                    {(t.name || '')[0]}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-base leading-tight tracking-tight">{t.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">{t.slug}</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Leadership', accessor: (t: any) => (
                            <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-700">{t.org_head || 'Not Assigned'}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Domain', accessor: (t: any) => (
                            <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-900 transition-colors">
                                <Globe className="w-3.5 h-3.5 opacity-50" />
                                <span className="text-[11px] font-medium tracking-tight">{t.domain || 'internal.swarmhire.io'}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Service Level', accessor: (t: any) => (
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${t.subscription_tier === 'enterprise'
                                ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-[0_0_15px_rgba(234,88,12,0.05)]'
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                {t.subscription_tier}
                            </span>
                        )
                    },
                    {
                        header: 'Health', accessor: (t: any) => (
                            <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${t.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse' : 'bg-slate-200'}`}></div>
                                <span className={`text-[10px] font-black uppercase tracking-wide ${t.is_active ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    {t.is_active ? 'Online' : 'Dormant'}
                                </span>
                            </div>
                        )
                    }
                ]}
                onAction={(t) => window.open(`/${t.slug}/dashboard`, '_blank')}
                actionLabel="Tenant Portal"
            />
        )
    }

    if (type === 'users') {
        return (
            <ManagementTable
                loading={loading}
                data={data}
                columns={[
                    {
                        header: 'User Profile', accessor: (u: any) => (
                            <div className="flex items-center gap-4 py-1">
                                <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
                                    {(u.full_name || u.email || '')[0]}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-sm tracking-tight">{u.full_name || 'Anonymous Interface'}</div>
                                    <div className="text-[10px] text-slate-400 font-medium opacity-80">{u.email}</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'RBAC Authorization', accessor: (u: any) => (
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-slate-50 border border-slate-100 text-slate-500 tracking-wider">
                                    {(u.role || 'Member').replace('_', ' ')}
                                </span>
                                {u.is_super_admin && (
                                    <div className="p-1 px-1.5 bg-orange-50 border border-orange-100 rounded-md">
                                        <Shield className="w-3 h-3 text-orange-500" />
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        header: 'Registry Entry',
                        accessor: (u: any) => (
                            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(u.created_at).toLocaleDateString()}</span>
                            </div>
                        )
                    }
                ]}
            />
        )
    }

    if (type === 'accounts') {
        return (
            <ManagementTable
                loading={loading}
                data={data}
                columns={[
                    {
                        header: 'Entity Name', accessor: (a: any) => (
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
                                    <Briefcase className="w-5 h-5 shadow-sm" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-sm tracking-tight">{a.name}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">{a.industry || 'Core Operations'}</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Head of Account', accessor: (a: any) => (
                            <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3 text-purple-400" />
                                <span className="text-[11px] font-bold text-slate-700">{a.account_head || 'Pending...'}</span>
                            </div>
                        )
                    },
                    {
                        header: 'Organization Backbone', accessor: (a: any) => (
                            <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">{a.tenants?.name || 'ROOT'}</span>
                        )
                    },
                    {
                        header: 'Operational Status',
                        accessor: (a: any) => (
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${a.is_active ? 'text-emerald-500 bg-emerald-50 border border-emerald-100' : 'text-slate-300 bg-slate-50'}`}>
                                {a.is_active ? 'Fully Operational' : 'Offline Mode'}
                            </span>
                        )
                    }
                ]}
            />
        )
    }

    if (type === 'positions') {
        return (
            <ManagementTable
                loading={loading}
                data={data}
                columns={[
                    {
                        header: 'Specialized Role', accessor: (p: any) => (
                            <div className="flex items-center gap-4 py-1">
                                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
                                    <Zap className="w-5 h-5 shadow-[0_0_15px_rgba(234,88,12,0.1)]" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-sm tracking-tight">{p.title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.experience_level}</span>
                                        <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                        <span className="text-[9px] text-orange-600 font-black uppercase tracking-widest">{p.status}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Unit Allocation', accessor: (p: any) => (
                            <div>
                                <div className="text-[10px] font-black text-slate-800 tracking-tight">{p.accounts?.name || 'Global Pool'}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.organizations?.name}</div>
                            </div>
                        )
                    },
                    {
                        header: 'Inference Stack', accessor: (p: any) => (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(p.skills || []).slice(0, 3).map((s: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase tracking-tighter">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )
                    }
                ]}
            />
        )
    }

    if (type === 'requests') {
        return (
            <ManagementTable
                loading={loading}
                data={data}
                columns={[
                    {
                        header: 'Requester Identity', accessor: (r: any) => (
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-base border border-orange-200 shadow-sm">
                                    {r.full_name[0]}
                                </div>
                                <div>
                                    <div className="font-extrabold text-slate-900 text-sm tracking-tight">{r.full_name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium lowercase truncate max-w-[140px] opacity-70">{r.email}</div>
                                </div>
                            </div>
                        )
                    },
                    {
                        header: 'Justification Protocol',
                        accessor: (r: any) => (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl max-w-[240px]">
                                <p className="text-[11px] text-slate-600 leading-snug font-medium italic">"{r.reason}"</p>
                            </div>
                        )
                    },
                    {
                        header: 'Status', accessor: (r: any) => (
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${r.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                r.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-red-50 text-red-600 border-red-100 opacity-50'
                                }`}>
                                {r.status}
                            </span>
                        )
                    },
                    {
                        header: 'Control Actions', accessor: (r: any) => r.status === 'pending' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        const { data: { user } } = await supabase.auth.getUser()
                                        await fetch(`http://localhost:8000/api/super-admin/access-requests/${r.id}/approve`, {
                                            method: 'POST',
                                            headers: { 'X-User-ID': user?.id || '' }
                                        })
                                        fetchData()
                                    }}
                                    className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={async () => {
                                        const { data: { user } } = await supabase.auth.getUser()
                                        await fetch(`http://localhost:8000/api/super-admin/access-requests/${r.id}/reject`, {
                                            method: 'POST',
                                            headers: { 'X-User-ID': user?.id || '' }
                                        })
                                        fetchData()
                                    }}
                                    className="p-2 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                        ) : null
                    }
                ]}
            />
        )
    }

    return null
}
