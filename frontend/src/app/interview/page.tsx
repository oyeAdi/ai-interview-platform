'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import CandidateView from '@/components/CandidateView'
import AdminDashboard from '@/components/AdminDashboard'
import ExpertView from '@/components/ExpertView'

function InterviewContent() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'candidate'
  const sessionId = searchParams.get('session_id')
  const language = searchParams.get('lang')

  if (view === 'admin') {
    return <AdminDashboard sessionId={sessionId || ''} language={language || ''} />
  }

  if (view === 'expert') {
    return <ExpertView sessionId={sessionId || ''} language={language || ''} />
  }

  return <CandidateView sessionId={sessionId || ''} language={language || ''} />
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-black flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <InterviewContent />
    </Suspense>
  )
}

