import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Interviewer',
  description: 'AI-powered interview system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-dark-black text-white">{children}</body>
    </html>
  )
}


