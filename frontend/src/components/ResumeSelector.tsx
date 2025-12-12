'use client'

interface ResumeSelectorProps {
  resumes: any[]
  selectedResume: string
  onSelectResume: (resumeId: string) => void
}

export default function ResumeSelector({ resumes, selectedResume, onSelectResume }: ResumeSelectorProps) {
  if (resumes.length === 0) return null

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Or select from existing Resumes
      </label>
      <select
        value={selectedResume}
        onChange={(e) => onSelectResume(e.target.value)}
        className="w-full bg-dark-black border-2 border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
      >
        <option value="">Select a Resume (optional)</option>
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.name}
          </option>
        ))}
      </select>
    </div>
  )
}

