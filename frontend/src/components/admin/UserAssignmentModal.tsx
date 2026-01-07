import { useState, useEffect } from 'react'
import { X, Check, Building2, UserCog, Briefcase, Shield, Fingerprint } from 'lucide-react'

interface UserAssignmentModalProps {
    isOpen: boolean
    onClose: () => void
    user: any
    tenants: any[]
    accounts: any[]
    onAssign: (userId: string, data: any) => Promise<void>
}

export function UserAssignmentModal({ isOpen, onClose, user, tenants, accounts, onAssign }: UserAssignmentModalProps) {
    const [selectedTenant, setSelectedTenant] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedAccount, setSelectedAccount] = useState('')
    const [loading, setLoading] = useState(false)

    // Reset form when user changes
    useEffect(() => {
        if (user) {
            setSelectedTenant(user.tenant_id || '')
            // Try to infer role if possible, or default to empty
            setSelectedRole('')
            setSelectedAccount('')
        }
    }, [user])

    if (!isOpen || !user) return null

    const handleSubmit = async () => {
        if (!selectedRole) return
        if (!selectedTenant && selectedRole !== 'super_admin') return

        setLoading(true)
        try {
            await onAssign(user.profile?.id || user.id, {
                tenant_id: selectedTenant,
                role: selectedRole,
                account_id: selectedRole === 'account_admin' ? selectedAccount : null
            })
            onClose()
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Filter accounts by selected tenant
    const tenantAccounts = accounts.filter(a => a.tenant_id === selectedTenant)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assign Access</h3>
                        <p className="text-xs text-slate-500 font-medium">Configure organization context for {user.full_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Tenant Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            Organization
                        </label>
                        <select
                            value={selectedTenant}
                            onChange={(e) => {
                                setSelectedTenant(e.target.value)
                                setSelectedAccount('')
                            }}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                        >
                            <option value="">Select Organization...</option>
                            <option value="global">Global / No Organization</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                            ))}
                        </select>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <UserCog className="w-3 h-3" />
                            Role Assignment
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'super_admin', label: 'Super Admin', desc: 'Full System Access & Governance (Global)', icon: Shield },
                                { id: 'tenant_admin', label: 'Organization Head', desc: 'Full control over organization settings & users', icon: Building2 },
                                { id: 'account_admin', label: 'Account Admin', desc: 'Manages specific Client Accounts & Positions', icon: Briefcase },
                                { id: 'member', label: 'Standard Member', desc: 'Can view assigned jobs and interview candidates', icon: UserCog },
                                { id: 'candidate', label: 'Candidate', desc: 'Restricted access only for taking interviews', icon: Fingerprint }
                            ].map((role: any) => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${selectedRole === role.id
                                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900 ring-1 ring-orange-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-200'
                                        }`}
                                >
                                    <div className={`mt-0.5 p-2 rounded-lg border flex items-center justify-center ${selectedRole === role.id ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                        <role.icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            {role.label}
                                            {selectedRole === role.id && <Check className="w-3 h-3 text-orange-600" />}
                                        </div>
                                        <div className="text-[10px] font-medium text-slate-500 leading-relaxed mt-0.5">{role.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Selection (Conditional) */}
                    {selectedRole === 'account_admin' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Target Account
                            </label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            >
                                <option value="">Select Account Context...</option>
                                {tenantAccounts.length > 0 ? (
                                    tenantAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))
                                ) : (
                                    <option disabled>No accounts found for this organization</option>
                                )}
                            </select>
                            <p className="text-[10px] text-slate-400 ml-1">*Required for Account Admins</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedTenant || !selectedRole || (selectedRole === 'account_admin' && !selectedAccount)}
                        className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        {loading ? 'Processing...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    )
}
