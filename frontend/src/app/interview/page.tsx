'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CandidateView from '@/components/CandidateView'
import AdminDashboard from '@/components/AdminDashboard'
import ExpertView from '@/components/ExpertView'
import Header from '@/components/Header'
import { apiUrl } from '@/config/api'

interface SessionInfo {
  session_id: string
  view: 'candidate' | 'admin'
  position?: { id: string; title: string }
  candidate?: { id: string; name: string; experience_level?: string }
}

function AccessDenied({ message }: { message: string }) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <Header showQuickStart={false} showBackToDashboard={true} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-black dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#00E5FF] text-black font-medium hover:bg-[#00E5FF]/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#00E5FF]/30 border-t-[#00E5FF] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Validating access...</p>
      </div>
    </div>
  )
}

function InterviewContent() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const [validating, setValidating] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  
  // Get params from URL
  const token = searchParams.get('token')
  const viewParam = searchParams.get('view')
  const sessionIdParam = searchParams.get('session_id')
  const langParam = searchParams.get('lang')
  
  // Extract session_id from pathname if using /interview/{session_id} format
  const pathSessionId = pathname.split('/interview/')[1]?.split('?')[0]

  useEffect(() => {
    const validateAccess = async () => {
      setValidating(true)
      
      // New format: /interview/{session_id}?token=xxx&view=candidate|admin
      if (pathSessionId && token) {
        try {
          const response = await fetch(
            apiUrl(`api/interview/validate-token?session_id=${pathSessionId}&token=${token}`)
          )
          
          if (!response.ok) {
            const data = await response.json()
            setAccessDenied(true)
            setErrorMessage(data.detail || 'Invalid or expired session link')
            setValidating(false)
            return
          }
          
          const data = await response.json()
          
          if (data.valid) {
            // Get full session details
            const sessionResponse = await fetch(
              apiUrl(`api/interview/session/${pathSessionId}?token=${token}`)
            )
            const sessionData = await sessionResponse.json()
            
            setSessionInfo({
              session_id: pathSessionId,
              view: data.view as 'candidate' | 'admin',
              position: sessionData.position,
              candidate: sessionData.candidate
            })
            
            // Store for later use
            localStorage.setItem('current_session_id', pathSessionId)
            localStorage.setItem('interview_view', data.view)
          } else {
            setAccessDenied(true)
            setErrorMessage('Invalid access token')
          }
        } catch (error) {
          console.error('Token validation error:', error)
          setAccessDenied(true)
          setErrorMessage('Failed to validate access. Please try again.')
        }
        
        setValidating(false)
        return
      }
      
      // Legacy format: /interview?view=xxx&session_id=xxx&lang=xxx
      // This supports the old flow (direct navigation from dashboard)
      if (sessionIdParam && viewParam) {
        setSessionInfo({
          session_id: sessionIdParam,
          view: viewParam === 'admin' || viewParam === 'expert' ? 'admin' : 'candidate'
        })
        localStorage.setItem('current_session_id', sessionIdParam)
        if (langParam) {
          localStorage.setItem('current_language', langParam)
        }
        setValidating(false)
        return
      }
      
      // No valid params - show error
      setAccessDenied(true)
      setErrorMessage('No valid session information provided. Please use a valid interview link.')
      setValidating(false)
    }
    
    validateAccess()
  }, [pathSessionId, token, sessionIdParam, viewParam, langParam])

  // Show loading while validating
  if (validating) {
    return <LoadingScreen />
  }
  
  // Show access denied
  if (accessDenied) {
    return <AccessDenied message={errorMessage} />
  }
  
  // No session info - shouldn't happen but handle gracefully
  if (!sessionInfo) {
    return <AccessDenied message="Session information not found" />
  }
  
  // Get language from localStorage or params
  const language = langParam || localStorage.getItem('current_language') || 'python'
  const expertMode = localStorage.getItem('expert_mode') === 'true'
  
  // Render appropriate view based on validated role
  if (sessionInfo.view === 'admin') {
    // Check if expert mode was requested
    if (expertMode || viewParam === 'expert') {
      return <ExpertView sessionId={sessionInfo.session_id} language={language} />
    }
    return <AdminDashboard sessionId={sessionInfo.session_id} language={language} />
  }
  
  // Candidate view
  return <CandidateView sessionId={sessionInfo.session_id} language={language} />
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <InterviewContent />
    </Suspense>
  )
}
