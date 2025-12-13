'use client'

interface LogViewerProps {
  logData: any
}

function calculateStats(logData: any): { questions: number; responses: number; avgScore: string } {
  if (!logData) return { questions: 0, responses: 0, avgScore: '--' }
  
  const questions = logData.questions || logData.rounds || []
  if (questions.length === 0) return { questions: 0, responses: 0, avgScore: '--' }
  
  let total = 0
  let count = 0
  
  questions.forEach((question: any) => {
    (question.responses || []).forEach((resp: any) => {
      if (resp.evaluation?.overall_score !== undefined) {
        total += resp.evaluation.overall_score
        count++
      }
    })
  })
  
  return {
    questions: questions.length,
    responses: count,
    avgScore: count > 0 ? `${Math.round(total / count)}` : '--'
  }
}

export default function LogViewer({ logData }: LogViewerProps) {
  const stats = calculateStats(logData)

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Questions:</span>
          <span className="text-white font-medium">{stats.questions}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Responses:</span>
          <span className="text-white font-medium">{stats.responses}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Avg:</span>
          <span className="text-primary-orange font-medium">{stats.avgScore}</span>
        </div>
      </div>

      {/* JSON View */}
      <div className="bg-dark-black rounded-lg border border-gray-700 overflow-hidden">
        <div className="max-h-64 overflow-auto p-4">
          <pre className="text-gray-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(logData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Download Button */}
      {logData?.session_id && (
        <a
          href={apiUrl(`api/log/${logData.session_id}`)}
          download={`interview_log_${logData.session_id}.json`}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-primary-orange/10 text-primary-orange hover:bg-primary-orange/20 border border-primary-orange/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Full Log
        </a>
      )}
    </div>
  )
}
