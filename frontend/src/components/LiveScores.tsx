'use client'

interface LiveScoresProps {
  evaluation: {
    technical_accuracy: number
    communication: number
    problem_solving: number
    culture_fit: number
    overall_score: number
    feedback?: string
  }
}

export default function LiveScores({ evaluation }: LiveScoresProps) {
  const metrics = [
    { label: 'Technical Accuracy', value: evaluation.technical_accuracy || 0, color: '#39FF14' },
    { label: 'Communication', value: evaluation.communication || 0, color: '#00E5FF' },
    { label: 'Problem Solving', value: evaluation.problem_solving || 0, color: '#FF00E5' },
    { label: 'Culture Fit', value: evaluation.culture_fit || 0, color: '#FFD700' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {metrics.map(metric => (
          <div key={metric.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{metric.label}</span>
              <span className="text-xs font-black" style={{ color: metric.color }}>{metric.value}/100</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{
                  width: `${metric.value}%`,
                  backgroundColor: metric.color,
                  boxShadow: `0 0 10px ${metric.color}40`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Overall Swarm Score</span>
          <span className="text-2xl font-black text-[#39FF14]">{evaluation.overall_score || 0}</span>
        </div>
        {evaluation.feedback && (
          <p className="text-[10px] text-white/30 leading-relaxed italic">
            "{evaluation.feedback}"
          </p>
        )}
      </div>
    </div>
  )
}
