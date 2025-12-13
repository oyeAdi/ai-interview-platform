'use client'

interface JDSelectorProps {
  jds: any[]
  selectedJd: string
  onSelectJd: (jdId: string) => void
}

export default function JDSelector({ jds, selectedJd, onSelectJd }: JDSelectorProps) {
  if (jds.length === 0) return null

  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
        Or select from existing job descriptions
      </label>
      <div className="relative">
        <select
          value={selectedJd}
          onChange={(e) => onSelectJd(e.target.value)}
          className="w-full appearance-none bg-white dark:bg-black 
                     border border-gray-200 dark:border-[#2A2A2A] 
                     px-4 py-3 pr-10
                     text-black dark:text-white 
                     focus:outline-none focus:border-epam-cyan 
                     transition-colors duration-200 cursor-pointer"
        >
          <option value="">Select a JD (optional)</option>
          {jds.map((jd) => (
            <option key={jd.id} value={jd.id}>
              {jd.title} - {jd.company}
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
