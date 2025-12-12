'use client'

interface JDSelectorProps {
  jds: any[]
  selectedJd: string
  onSelectJd: (jdId: string) => void
}

export default function JDSelector({ jds, selectedJd, onSelectJd }: JDSelectorProps) {
  if (jds.length === 0) return null

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Or select from existing Job Descriptions
      </label>
      <select
        value={selectedJd}
        onChange={(e) => onSelectJd(e.target.value)}
        className="w-full bg-dark-black border-2 border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all"
      >
        <option value="">Select a JD (optional)</option>
        {jds.map((jd) => (
          <option key={jd.id} value={jd.id}>
            {jd.title} - {jd.company}
          </option>
        ))}
      </select>
    </div>
  )
}

