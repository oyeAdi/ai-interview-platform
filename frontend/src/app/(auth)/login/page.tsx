
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type AuthVision = 'B2B' | 'B2C' | 'C2C'

export default function LoginPage() {
    const [vision, setVision] = useState<AuthVision>('B2B')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/dashboard'
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

        // Check user's preferred_vision from profiles table
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, preferred_vision')
                .eq('id', data.user.id)
                .single()

            // Super admins can log in from any vision
            if (profile?.role === 'super_admin') {
                router.push(redirect)
                router.refresh()
                return
            }

            // Regular users must log in from their registered vision
            const userVision = profile?.preferred_vision || data.user.user_metadata?.preferred_vision

            if (userVision !== vision) {
                // Vision mismatch - show error
                const visionNames = {
                    'B2B': 'Enterprise Hub',
                    'B2C': 'Expert Studio',
                    'C2C': 'Private Circle'
                }

                setError(`This account is registered for ${visionNames[userVision as AuthVision]} (${userVision}). Please switch to the ${userVision} tab to log in.`)

                // Sign out the user
                await supabase.auth.signOut()
                setLoading(false)
                return
            }

            // Vision matches - proceed with login
            router.push(redirect)
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your vision to continue</p>
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
                {message && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-lg">
                        {message}
                    </div>
                )}

                {/* B2B: Enterprise Flow */}
                {vision === 'B2B' && (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Work Email</label>
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
                            {loading ? 'Signing in...' : 'Sign In to Enterprise Hub'}
                        </button>
                    </form>
                )}

                {/* B2C: Expert Flow */}
                {vision === 'B2C' && (
                    <div className="space-y-4 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Access your coaching studio and student insights.
                        </p>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3 flex items-center justify-center gap-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222] text-black dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#161616] transition-all disabled:opacity-50"
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
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-[#1A1A1A]"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#0A0A0A] px-2 text-gray-400">Or use email</span></div>
                        </div>
                        <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm outline-none transition-all"
                                placeholder="Email address"
                            />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm outline-none transition-all"
                                placeholder="Password"
                            />
                            <button disabled={loading} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl">
                                Sign In to Expert Studio
                            </button>
                        </form>
                    </div>
                )}

                {/* C2C: Private Flow */}
                {vision === 'C2C' && (
                    <form onSubmit={handleMagicLink} className="space-y-4">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Safe, private, and instant bypass for personal hiring.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#222] rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                                placeholder="name@email.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-brand-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Join Private Circle (Magic Link)'}
                        </button>
                        <p className="text-[10px] text-center text-gray-400 mt-4 leading-relaxed">
                            By continuing, you agree to our Private Circle terms. <br /> No password required for C2C profiles.
                        </p>
                    </form>
                )}
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
