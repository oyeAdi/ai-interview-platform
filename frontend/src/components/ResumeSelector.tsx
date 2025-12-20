'use client'

interface ResumeSelectorProps {
  resumes: any[]
  selectedResume: string
  onSelectResume: (resumeId: string) => void
}

export default function ResumeSelector({ resumes, selectedResume, onSelectResume }: ResumeSelectorProps) {
  if (resumes.length === 0) return null

  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
        Or select from existing resumes
      </label>
      <div className="relative">
        <select
          value={selectedResume}
          onChange={(e) => onSelectResume(e.target.value)}
          className="w-full appearance-none bg-white dark:bg-black 
                     border border-gray-200 dark:border-[#2A2A2A] 
                     px-4 py-3 pr-10
                     text-black dark:text-white 
                     focus:outline-none focus:border-brand-primary 
                     transition-colors duration-200 cursor-pointer"
        >
          <option value="">Select a resume (optional)</option>
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
