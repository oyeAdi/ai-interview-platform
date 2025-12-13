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
              
              {/* EPAM Logo */}
              <Link href="/" className="flex items-center">
                <span className="text-xl font-light tracking-tight text-black dark:text-white">
                  <span className="text-epam-cyan">&lt;</span>
                  epam
                  <span className="text-epam-cyan">&gt;</span>
                </span>
              </Link>
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>

            {/* Center - Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className={`text-sm font-normal transition-colors ${
                  pathname === '/'
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                href="https://www.epam.com/about"
                target="_blank"
                className="text-sm font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                About
              </Link>
              
              <Link
                href="https://www.epam.com/careers"
                target="_blank"
                className="text-sm font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Careers
              </Link>
            </nav>

            {/* Right Side - CTA & Global */}
            <div className="flex items-center gap-4">
              {showBackToDashboard && (
                <Link
                  href="/"
                  className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </Link>
              )}
              
              {/* Quick Start Button - Only show if not on quick-start page */}
              {showQuickStart && pathname !== '/quick-start' && (
                <Link
                  href="/quick-start"
                  className="hidden sm:block px-5 py-2 text-sm font-medium border border-epam-cyan text-epam-cyan hover:bg-epam-cyan/10 transition-colors"
                >
                  QUICK START
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
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-2xl font-light ${
                pathname === '/' ? 'text-epam-cyan' : 'text-black dark:text-white'
              }`}
            >
              Dashboard
            </Link>
            
            {showQuickStart && (
              <Link
                href="/quick-start"
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-2xl font-light ${
                  pathname === '/quick-start' ? 'text-epam-cyan' : 'text-black dark:text-white'
                }`}
              >
                Quick Start
              </Link>
            )}
            
            <Link
              href="https://www.epam.com/about"
              target="_blank"
              className="block text-2xl font-light text-black dark:text-white"
            >
              About
            </Link>
            
            <Link
              href="https://www.epam.com/careers"
              target="_blank"
              className="block text-2xl font-light text-black dark:text-white"
            >
              Careers
            </Link>
            
            <div className="pt-6 border-t border-gray-200 dark:border-[#2A2A2A]">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Global (EN)
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
