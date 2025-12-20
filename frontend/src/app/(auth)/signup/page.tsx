
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type AuthVision = 'B2B' | 'B2C' | 'C2C'

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

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Create Account</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Join the SwarmHire ecosystem</p>
            </div>

            {/* Vision Switcher */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#111111] rounded-xl mb-6">
                {(['B2B', 'B2C', 'C2C'] as AuthVision[]).map((v) => (
                    <button
                        key={v}
                        onClick={() => setVision(v)}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${vision === v
                            ? 'bg-white dark:bg-[#1A1A1A] text-black dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {v === 'B2B' && '🏢 Enterprise Hub'}
                        {v === 'B2C' && '👤 Expert Studio'}
                        {v === 'C2C' && '🏠 Private Circle'}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-6 shadow-sm">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
                        {error}
                    </div>
                )}

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
                                'Private Circle'
                            }`}
                    </button>
                </form>
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
