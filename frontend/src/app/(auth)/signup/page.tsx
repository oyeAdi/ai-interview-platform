
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type AuthVision = 'B2B' | 'B2C' | 'C2C' | 'SYSTEM'

interface Organization {
    id: string
    name: string
    slug: string
}

export default function SignupPage() {
    const [vision, setVision] = useState<AuthVision>('B2B')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [selectedOrgId, setSelectedOrgId] = useState('')
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showRequestForm, setShowRequestForm] = useState(false)
    const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

    const router = useRouter()
    const supabase = createClient()

    // Fetch organizations for B2B signup
    useEffect(() => {
        if (vision === 'B2B') {
            fetchOrganizations()
        }
    }, [vision])

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/public/organizations')
            if (response.ok) {
                const data = await response.json()
                console.log('Fetched organizations:', data)
                setOrganizations(data.organizations || [])
                if (data.organizations?.length > 0) {
                    setSelectedOrgId(data.organizations[0].id)
                }
            } else {
                console.error('Failed to fetch organizations:', response.status)
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    preferred_vision: vision,
                    tenant_id: vision === 'B2B' ? selectedOrgId : null,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/login?message=Check your email to confirm your account')
        }
    }

    const handleAdminRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Attempting admin request submission...', { email, fullName })
        setRequestStatus('submitting')
        try {
            const res = await fetch('http://localhost:8000/api/admin/public/admin-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    full_name: fullName,
                    reason: `Request to become super_admin. Persona: System Vision.`
                })
            })

            if (res.ok) {
                console.log('Admin request submitted successfully')
                setRequestStatus('success')
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error('Frontend hit backend but request failed:', {
                    status: res.status,
                    statusText: res.statusText,
                    errorData
                })
                setRequestStatus('idle')
                setError(`Failed to submit request: ${errorData.detail || res.statusText || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Network or unexpected error during admin request:', error)
            setRequestStatus('idle')
            setError('Failed to submit request. Please check if the backend is running and reachable.')
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Create Account</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Join the SwarmHire ecosystem</p>
            </div>

            {/* Vision Switcher */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#111111] rounded-xl mb-6">
                {(['B2B', 'B2C', 'C2C', 'SYSTEM'] as AuthVision[]).map((v) => (
                    <button
                        key={v}
                        onClick={() => setVision(v)}
                        className={`flex-1 py-2 text-[10px] font-medium rounded-lg transition-all ${vision === v
                            ? 'bg-white dark:bg-[#1A1A1A] text-black dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {v === 'B2B' && '🏢 Enterprise'}
                        {v === 'B2C' && '👤 Expert'}
                        {v === 'C2C' && '🏠 Private'}
                        {v === 'SYSTEM' && '🛡️ System'}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-6 shadow-sm">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
                        {error}
                    </div>
                )}

                {vision === 'SYSTEM' ? (
                    <div className="text-center py-12 px-4 transition-all duration-300">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">🛡️</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Internal Console Access</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                            System administrator accounts cannot be created via public registration.
                            Please contact the platform governance team or your IT administrator to request access.
                        </p>

                        {!showRequestForm ? (
                            <div className="space-y-4">
                                <Link
                                    href="/login?vision=SYSTEM"
                                    className="w-full inline-block px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm mb-4 text-center"
                                >
                                    Back to Admin Login
                                </Link>
                                <div className="pt-4 border-t border-gray-100 dark:border-[#1A1A1A]">
                                    <button
                                        onClick={() => setShowRequestForm(true)}
                                        className="text-brand-primary font-semibold hover:underline text-sm"
                                    >
                                        Request Admin Privileges
                                    </button>
                                </div>
                            </div>
                        ) : requestStatus === 'success' ? (
                            <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-2xl text-center">
                                <div className="text-2xl mb-2">✅</div>
                                <h4 className="font-bold text-green-700 dark:text-green-400 mb-2">Request Submitted!</h4>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                    Your request has been sent to the system owners. You will be notified once it is reviewed.
                                </p>
                                <button
                                    onClick={() => setShowRequestForm(false)}
                                    className="mt-4 text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleAdminRequest} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#111111] border-none rounded-xl text-sm outline-none transition-all"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Corporate Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-[#111111] border-none rounded-xl text-sm outline-none transition-all"
                                        placeholder="email@company.com"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowRequestForm(false)}
                                        className="flex-1 py-3 border border-gray-200 dark:border-[#222] text-gray-500 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={requestStatus === 'submitting'}
                                        className="flex-[2] py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-xl shadow-black/10"
                                    >
                                        {requestStatus === 'submitting' ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* Organization Selector for B2B - FIRST */}
                        {vision === 'B2B' && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Organization</label>
                                <select
                                    required
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                >
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id} className="bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white">
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
                        >
                            {loading ? 'Creating account...' : `Sign Up for ${vision === 'B2B' ? 'Enterprise Hub' :
                                vision === 'B2C' ? 'Expert Studio' :
                                    vision === 'C2C' ? 'Private Circle' : 'System Console'
                                }`}
                        </button>
                    </form>
                )}
            </div>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-brand-primary font-semibold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}
