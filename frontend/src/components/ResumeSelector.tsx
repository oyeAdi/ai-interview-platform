'use client'

interface ResumeSelectorProps {
  resumes: any[]
  selectedResume: string
  onSelectResume: (resumeId: string) => void
  loading?: boolean
}

export default function ResumeSelector({ resumes, selectedResume, onSelectResume, loading = false }: ResumeSelectorProps) {
  const isEmpty = !resumes || resumes.length === 0

  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
        Or select from existing resumes
      </label>
      <div className="relative">
        <select
          value={selectedResume}
          onChange={(e) => onSelectResume(e.target.value)}
          disabled={loading || isEmpty}
          className="w-full appearance-none bg-gray-50 
                     border border-gray-100 
                     px-6 py-4 pr-12 rounded-2xl
                     text-gray-900 font-bold
                     focus:outline-none focus:border-brand-primary/30 focus:bg-white
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 cursor-pointer"
        >
          <option value="">
            {loading ? 'Loading Resumes...' : isEmpty ? 'No Resumes available' : 'Select a resume (optional)'}
          </option>
          {resumes && resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
