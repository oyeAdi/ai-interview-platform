'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  showQuickStart?: boolean
  showBackToDashboard?: boolean
  title?: string
}

export default function Header({ showQuickStart = true, showBackToDashboard = false, title }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('user')
  const [userProfile, setUserProfile] = useState<{ email: string, role: string, preferred_vision: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Fetch user role from profiles table
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, preferred_vision')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRole(profile.role || 'user')
          setUserProfile({
            email: user.email || '',
            role: profile.role || 'user',
            preferred_vision: profile.preferred_vision || 'B2B'
          })
        }
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-[#2A2A2A] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - Hamburger & Logo */}
            <div className="flex items-center gap-6">
              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  )}
                </svg>
              </button>

              {/* SwarmHire Logo */}
              <Link href="/" className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight text-black dark:text-white">
                  Swarm<span className="text-brand-primary">Hire</span>
                </span>
                {title && (
                  <div className="flex items-center gap-2 border-l border-gray-200 dark:border-[#2A2A2A] pl-3 ml-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">/ {title}</span>
                  </div>
                )}
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Center - Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/#features"
                className={`text-sm font-normal transition-colors ${pathname === '/#features'
                  ? 'text-black dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
              >
                Features
              </Link>

              <Link
                href="/#pricing"
                className={`text-sm font-normal transition-colors ${pathname === '/#pricing'
                  ? 'text-black dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
              >
                Pricing
              </Link>

              <Link
                href="/#about"
                className={`text-sm font-normal transition-colors ${pathname === '/#about'
                  ? 'text-black dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
              >
                About
              </Link>


              {/* Wiki & Docs - Only for super_admin */}
              {userRole === 'super_admin' && (
                <Link
                  href="/wiki"
                  className={`text-sm font-normal transition-colors ${pathname === '/wiki'
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                  Wiki & Docs
                </Link>
              )}
            </nav>

            {/* Right Side - CTA & Login */}
            <div className="flex items-center gap-4">
              {showBackToDashboard && (
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </Link>
              )}

              {/* Auth Section */}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:block text-sm font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
              )}

              {/* Get Started CTA */}
              {showQuickStart && pathname !== '/quick-start' && !user && (
                <Link
                  href="/signup"
                  className="hidden sm:block px-6 py-2.5 text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors rounded-lg"
                >
                  Get Started
                </Link>
              )}

              {/* Vision Switcher (Desktop) */}
              <div className="hidden lg:flex items-center gap-2 border-l border-gray-200 dark:border-[#2A2A2A] ml-2 pl-4">
                <div className="relative group">
                  <button className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A1A1A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                    Switch Vision
                    <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] py-2 overflow-hidden">
                    <div className="flex flex-col">
                      <VisionLink
                        href="/dashboard"
                        label="Enterprise Hub"
                        icon="🏢"
                        userVision={user?.user_metadata?.preferred_vision}
                        userRole={userRole}
                        targetVision="B2B"
                      />
                      <VisionLink
                        href="/expert/studio"
                        label="Expert Studio"
                        icon="👤"
                        userVision={user?.user_metadata?.preferred_vision}
                        userRole={userRole}
                        targetVision="B2C"
                      />
                      <VisionLink
                        href="/private/circle"
                        label="Private Circle"
                        icon="🏠"
                        userVision={user?.user_metadata?.preferred_vision}
                        userRole={userRole}
                        targetVision="C2C"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* User Profile Debug Indicator */}
              {userProfile && (
                <div className="hidden sm:flex flex-col items-end gap-0.5 text-[9px] font-mono text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2A2A2A] px-2 py-1 rounded">
                  <div className="font-bold">{userProfile.email}</div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 dark:text-blue-400">Role: {userProfile.role}</span>
                    <span className="text-purple-600 dark:text-purple-400">Vision: {userProfile.preferred_vision}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-black">
          <div className="pt-20 px-6 space-y-6">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${pathname === '/#features' ? 'text-brand-primary' : 'text-black dark:text-white'
                }`}
            >
              Features
            </Link>

            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${pathname === '/#pricing' ? 'text-brand-primary' : 'text-black dark:text-white'
                }`}
            >
              Pricing
            </Link>

            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${pathname === '/#about' ? 'text-brand-primary' : 'text-black dark:text-white'
                }`}
            >
              About
            </Link>

            <Link
              href="/wiki"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${pathname === '/wiki' ? 'text-brand-primary' : 'text-black dark:text-white'
                }`}
            >
              Wiki & Docs
            </Link>

            <div className="pt-6 border-t border-gray-200 dark:border-[#2A2A2A] space-y-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-lg font-normal text-gray-500 dark:text-gray-400"
              >
                Login
              </Link>

              {showQuickStart && (
                <Link
                  href="/quick-start"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-6 py-3 text-center text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
interface VisionLinkProps {
  href: string
  label: string
  icon: string
  userVision: string | undefined
  userRole: string
  targetVision: string
}

function VisionLink({ href, label, icon, userVision, userRole, targetVision }: VisionLinkProps) {
  // Super admins have unrestricted access to all visions
  const isSuperAdmin = userRole === 'super_admin'
  const isLocked = !isSuperAdmin && userVision && userVision !== targetVision
  const isActive = userVision === targetVision

  if (isLocked) {
    return (
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 cursor-not-allowed opacity-60">
        <div className="flex items-center gap-3">
          <span>{icon}</span> {label}
        </div>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-2 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-[#111111] ${isActive ? 'text-brand-primary font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
        }`}
    >
      <div className="flex items-center gap-3">
        <span>{icon}</span> {label}
      </div>
      {isActive && <div className="w-1 h-1 rounded-full bg-brand-primary"></div>}
    </Link>
  )
}
