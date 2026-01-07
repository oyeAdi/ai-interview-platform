'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/select-org'
    const supabase = createClient()


    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // 1. Fetch Profile for Super Admin and direct Tenant link
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin, tenant_id')
                .eq('id', data.user.id)
                .single()

            if (profile?.is_super_admin) {
                router.push('/super-admin')
                return
            }

            // 2. Fetch Active Roles and Slugs
            const { data: roles, error: rolesError } = await supabase
                .from('user_tenant_roles')
                .select(`
                    role,
                    organizations (
                        slug
                    )
                `)
                .eq('user_id', data.user.id)

            if (rolesError) {
                console.error('Redirection Error (Roles):', rolesError)
            }

            // 3. Robust Redirection Logic
            if (roles && roles.length > 0) {
                if (roles.length > 1) {
                    router.push('/select-org')
                    return
                }

                // Single Role - Extract Slug
                const orgData = Array.isArray(roles[0].organizations)
                    ? roles[0].organizations[0]
                    : roles[0].organizations

                let slug = (orgData as any)?.slug

                // Fallback: If slug is missing from join, use profiles.tenant_id
                if (!slug && profile?.tenant_id) {
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('slug')
                        .eq('id', profile.tenant_id)
                        .single()
                    slug = org?.slug
                }

                if (slug) {
                    console.log('Redirecting to organization dashboard:', slug)
                    router.push(`/${slug}/dashboard`)
                } else {
                    console.warn('Single role found but no organization slug reachable. Falling back to candidate.')
                    router.push('/candidate/dashboard')
                }
            } else {
                console.log('No specific roles found in user_tenant_roles. Checking tenant_id fallback...')
                // No roles found - double check profiles.tenant_id just in case
                if (profile?.tenant_id) {
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('slug')
                        .eq('id', profile.tenant_id)
                        .single()
                    if (org?.slug) {
                        console.log('Fallback slug found via profile.tenant_id:', org.slug)
                        router.push(`/${org.slug}/dashboard`)
                        return
                    }
                }
                console.log('No organizational ties found. Defaulting to candidate dashboard.')
                router.push('/candidate/dashboard')
            }

            router.refresh()
        }
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setMessage('Check your email for the magic link!')
        }
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
            },
        })
        if (error) setError(error.message)
        setLoading(false)
    }

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Welcome Back</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
            </div>

            <div className="bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#1A1A1A] rounded-2xl p-6 shadow-sm">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-lg">
                        {message}
                    </div>
                )}

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 flex items-center justify-center gap-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222] text-black dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#161616] transition-all disabled:opacity-50 mb-4"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100 dark:border-[#1A1A1A]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-[#0A0A0A] px-2 text-gray-400">Or use email</span>
                    </div>
                </div>

                {/* Email/Password Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                            placeholder="name@company.com"
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
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Magic Link Option */}
                <div className="mt-4 text-center">
                    <button
                        onClick={handleMagicLink}
                        disabled={loading}
                        className="text-sm text-brand-primary hover:underline disabled:opacity-50"
                    >
                        Sign in with magic link
                    </button>
                </div>
            </div>

            <div className="text-center mt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    New here?{' '}
                    <Link href="/signup" className="text-brand-primary font-semibold hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    )
}
