import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'SwarmHire | The World\'s First Agentic Swarm AI Hiring Platform',
  description: 'Multi-agent AI interview platform with context-aware questions, real-time adaptive scoring, and Human-in-the-Loop control. Every session makes the system exponentially smarter.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-primary dark:bg-surface-dark text-text-primary dark:text-text-dark-primary transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
