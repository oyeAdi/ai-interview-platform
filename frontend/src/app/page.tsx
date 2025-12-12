'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import JDSelector from '@/components/JDSelector'
import ResumeSelector from '@/components/ResumeSelector'

export default function LandingPage() {
  const router = useRouter()
  const [jdText, setJdText] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [selectedJd, setSelectedJd] = useState<string>('')
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [jds, setJds] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])

  // Load JDs and Resumes on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/jds')
      .then(res => res.json())
      .then(data => setJds(data.jds || []))
      .catch(err => console.error('Error loading JDs:', err))
    
    fetch('http://localhost:8000/api/resumes')
      .then(res => res.json())
      .then(data => setResumes(data.resumes || []))
      .catch(err => console.error('Error loading Resumes:', err))
  }, [])

  // Update JD textarea when JD is selected
  useEffect(() => {
    if (selectedJd) {
      const jd = jds.find(j => j.id === selectedJd)
      if (jd) {
        setJdText(jd.text)
        setJdFile(null) // Clear file when JD is selected
      }
    } else {
      // Clear textarea if selection is cleared
      if (!jdFile) {
        setJdText('')
      }
    }
  }, [selectedJd, jds])

  // Update Resume textarea when Resume is selected
  useEffect(() => {
    if (selectedResume) {
      const resume = resumes.find(r => r.id === selectedResume)
      if (resume) {
        setResumeText(resume.text)
        setResumeFile(null) // Clear file when Resume is selected
      }
    } else {
      // Clear textarea if selection is cleared
      if (!resumeFile) {
        setResumeText('')
      }
    }
  }, [selectedResume, resumes])

  const handleStartInterview = async (expertMode: boolean = false) => {
    if (!jdText && !jdFile && !selectedJd) {
      alert('Please provide a job description')
      return
    }
    if (!resumeText && !resumeFile && !selectedResume) {
      alert('Please provide a resume')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      
      // Use selected JD text if available
      let finalJdText = jdText
      if (selectedJd) {
        const jd = jds.find(j => j.id === selectedJd)
        if (jd) finalJdText = jd.text
      }
      
      // Use selected Resume text if available
      let finalResumeText = resumeText
      if (selectedResume) {
        const resume = resumes.find(r => r.id === selectedResume)
        if (resume) finalResumeText = resume.text
      }
      
      if (finalJdText) formData.append('jd_text', finalJdText)
      if (jdFile) formData.append('jd_file', jdFile)
      if (finalResumeText) formData.append('resume_text', finalResumeText)
      if (resumeFile) formData.append('resume_file', resumeFile)
      if (selectedJd) formData.append('jd_id', selectedJd)
      if (selectedResume) formData.append('resume_id', selectedResume)
      
      // Add expert mode flag
      if (expertMode) formData.append('expert_mode', 'true')

      const response = await fetch('http://localhost:8000/api/analyze-language', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.session_id) {
        // Store session info for easy access
        localStorage.setItem('current_session_id', data.session_id)
        localStorage.setItem('current_language', data.language)
        localStorage.setItem('expert_mode', expertMode ? 'true' : 'false')
        
        // Navigate to candidate view
        const candidateUrl = `/interview?view=candidate&session_id=${data.session_id}&lang=${data.language}`
        router.push(candidateUrl)
        
        // Automatically open admin/expert view in new tab after a short delay
        setTimeout(() => {
          const viewType = expertMode ? 'expert' : 'admin'
          const adminUrl = `${window.location.origin}/interview?view=${viewType}&session_id=${data.session_id}&lang=${data.language}`
          window.open(adminUrl, '_blank', 'noopener,noreferrer')
        }, 1000)
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-black flex items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-primary-orange mb-4">
            AI Interviewer
          </h1>
          <p className="text-gray-300 text-lg">
            Upload your job description and resume to begin
          </p>
        </div>

        <div className="bg-dark-black-light rounded-lg p-8 space-y-6 border border-gray-800">
          {/* Side-by-side layout for JD and Resume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Description Section - Left */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary-orange">Job Description</h2>
              <JDSelector
                jds={jds}
                selectedJd={selectedJd}
                onSelectJd={setSelectedJd}
              />
              <FileUpload
                label="Job Description"
                text={jdText}
                onTextChange={(text) => {
                  setJdText(text)
                  if (text && selectedJd) {
                    // Clear selection if user manually edits
                    setSelectedJd('')
                  }
                }}
                file={jdFile}
                onFileChange={(file) => {
                  setJdFile(file)
                  if (file && selectedJd) {
                    // Clear selection if user uploads file
                    setSelectedJd('')
                  }
                }}
                disabled={!!selectedJd}
              />
            </div>

            {/* Resume Section - Right */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary-orange">Resume</h2>
              <ResumeSelector
                resumes={resumes}
                selectedResume={selectedResume}
                onSelectResume={setSelectedResume}
              />
              <FileUpload
                label="Resume"
                text={resumeText}
                onTextChange={(text) => {
                  setResumeText(text)
                  if (text && selectedResume) {
                    // Clear selection if user manually edits
                    setSelectedResume('')
                  }
                }}
                file={resumeFile}
                onFileChange={(file) => {
                  setResumeFile(file)
                  if (file && selectedResume) {
                    // Clear selection if user uploads file
                    setSelectedResume('')
                  }
                }}
                disabled={!!selectedResume}
              />
            </div>
          </div>

          {/* Start Interview Buttons - Bottom */}
          <div className="pt-4 border-t border-gray-700 space-y-3">
            <button
              onClick={() => handleStartInterview(false)}
              disabled={loading}
              className="w-full bg-primary-orange hover:bg-primary-orange-light text-white font-semibold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg shadow-lg shadow-primary-orange/20"
            >
              {loading ? 'Starting Interview...' : 'Start Interview'}
            </button>
            
            {/* Expert Mode Link */}
            <button
              onClick={() => handleStartInterview(true)}
              disabled={loading}
              className="w-full bg-transparent border-2 border-primary-orange text-primary-orange hover:bg-primary-orange/10 font-medium py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Start as Expert (Human-in-the-Loop)
            </button>
            <p className="text-xs text-gray-500 text-center">
              Expert mode allows you to review, edit, and approve AI-generated follow-up questions before they are sent to the candidate.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

