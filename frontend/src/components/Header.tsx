'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

interface HeaderProps {
  showQuickStart?: boolean
  showBackToDashboard?: boolean
}

export default function Header({ showQuickStart = true, showBackToDashboard = false }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-black dark:text-white">
                  Swarm<span className="text-brand-primary">Hire</span>
                </span>
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

              <Link
                href="/resources"
                className={`text-sm font-normal transition-colors ${pathname === '/resources'
                  ? 'text-black dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
              >
                Resources
              </Link>
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

              {/* Login Link */}
              <Link
                href="/dashboard"
                className="hidden sm:block text-sm font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Login
              </Link>

              {/* Get Started CTA */}
              {showQuickStart && pathname !== '/quick-start' && (
                <Link
                  href="/quick-start"
                  className="hidden sm:block px-6 py-2.5 text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors rounded-lg"
                >
                  Get Started
                </Link>
              )}

              {/* Global - Static Text */}
              <span className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                Global
                <span className="text-gray-400 dark:text-gray-500">(EN)</span>
              </span>
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
              href="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${pathname === '/resources' ? 'text-brand-primary' : 'text-black dark:text-white'
                }`}
            >
              Resources
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
