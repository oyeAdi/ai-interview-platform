'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-[#2A2A2A] transition-colors duration-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1 - Our Brands */}
          <div>
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
              AI INTERVIEW
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  DASHBOARD
                </Link>
              </li>
              <li>
                <Link
                  href="/quick-start"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  QUICK START
                </Link>
              </li>
            </ul>
            
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mt-10 mb-6">
              ABOUT
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              AI-powered interview platform for conducting adaptive, intelligent candidate assessments.
            </p>
          </div>

          {/* Column 2 - Policies */}
          <div>
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
              POLICIES
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="https://www.epam.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  PRIVACY POLICY
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.epam.com/cookie-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  COOKIE POLICY
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.epam.com/web-accessibility-statement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  WEB ACCESSIBILITY
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
              RESOURCES
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="https://www.epam.com/services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  SERVICES
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.epam.com/insights"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  INSIGHTS
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.epam.com/careers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  CAREERS
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.epam.com/about/who-we-are/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black dark:text-white hover:text-epam-cyan transition-colors uppercase tracking-wide"
                >
                  CONTACT US
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Social */}
          <div>
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-6">
              SOCIAL
            </h3>
            <div className="flex gap-4 mb-10">
              <Link
                href="https://www.linkedin.com/company/epam-systems/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-epam-cyan transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
              <Link
                href="https://www.facebook.com/EPAM.Global"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-epam-cyan transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Link>
              <Link
                href="https://www.instagram.com/epamsystems/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-epam-cyan transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </Link>
              <Link
                href="https://www.youtube.com/c/EPAMSystemsGlobal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-epam-cyan transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Link>
            </div>
            
            <h3 className="text-xs font-medium text-epam-cyan uppercase tracking-[0.2em] mb-4">
              SUBSCRIBE
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and customize your{' '}
              <Link
                href="https://preferences.epam.com/Preference-Center.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white underline hover:text-epam-cyan transition-colors"
              >
                email subscription
              </Link>{' '}
              preferences
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 dark:border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} EPAM Systems, Inc. All Rights Reserved. EPAM and the EPAM logo are registered trademarks of EPAM Systems, Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
