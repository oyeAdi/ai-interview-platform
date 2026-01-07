'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowRight, Shield, User, Mail, Lock } from 'lucide-react'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showAdminRequest, setShowAdminRequest] = useState(false)
    const [adminRequestReason, setAdminRequestReason] = useState('')

    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        if (data.user) {
            if (showAdminRequest) {
                // If user wants admin access, create the request
                const { error: requestError } = await supabase
                    .from('admin_access_requests')
                    .insert({
                        user_id: data.user.id,
                        full_name: fullName,
                        reason: adminRequestReason || 'Request to become super_admin.'
                    })

                if (requestError) {
                    console.error('Failed to create admin request:', requestError)
                }
            }
            setSuccess(true)
        }
        setLoading(false)
    }

    if (success) {
        return (
            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-8 shadow-sm text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    📧
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Check Your Email</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    We've sent a confirmation link to <span className="font-semibold text-brand-primary">{email}</span>. Please verify your email to get started.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"
                >
                    Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2 mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Start Your Journey</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Join the universal matching platform</p>
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-6 shadow-sm">
                {error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Work Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="name@organization.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAdminRequest(!showAdminRequest)}
                            className={`w-full py-3 px-4 flex items-center justify-between rounded-xl border transition-all ${showAdminRequest
                                ? 'bg-brand-primary/5 border-brand-primary text-brand-primary'
                                : 'bg-gray-50 dark:bg-[#111111] border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Shield className={`w-5 h-5 ${showAdminRequest ? 'text-brand-primary' : 'text-gray-400'}`} />
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Request Admin Access</p>
                                    <p className="text-[10px] opacity-80">For platform administrators only</p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${showAdminRequest ? 'border-brand-primary bg-brand-primary' : 'border-gray-300'
                                }`}>
                                {showAdminRequest && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                        </button>
                    </div>

                    {showAdminRequest && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Reason for Admin Access</label>
                            <textarea
                                value={adminRequestReason}
                                onChange={(e) => setAdminRequestReason(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all min-h-[80px]"
                                placeholder="E.g., I need to manage global organizations and platform settings."
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg active:scale-[0.98]"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#1A1A1A] text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-brand-primary font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
