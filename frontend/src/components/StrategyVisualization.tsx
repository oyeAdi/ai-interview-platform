'use client'

interface StrategyVisualizationProps {
  strategy: {
    id: string
    name: string
    reason?: string
    parameters: any
    focus_areas?: string[]
  }
}

// Strategy info for display - all using orange theme
const strategyInfo: Record<string, { label: string; description: string }> = {
  depth_focused: {
    label: 'DEPTH',
    description: 'Testing comprehensive understanding'
  },
  clarification: {
    label: 'CLARIFY',
    description: 'Getting more details from response'
  },
  breadth_focused: {
    label: 'BREADTH',
    description: 'Exploring related knowledge areas'
  },
  challenge: {
    label: 'CHALLENGE',
    description: 'Testing with advanced scenarios'
  }
}

export default function StrategyVisualization({ strategy }: StrategyVisualizationProps) {
  const info = strategyInfo[strategy.id] || {
    label: 'EVAL',
    description: 'Evaluating response'
  }

  return (
    <div className="space-y-3">
      {/* Strategy Header */}
      <div className="rounded-lg p-3 bg-primary-orange/10 border border-primary-orange/20">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-primary-orange text-dark-black text-xs font-bold rounded">
            {info.label}
          </span>
          <div>
            <h4 className="text-white font-medium text-sm">{strategy.name}</h4>
            <p className="text-gray-400 text-xs">{info.description}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      {strategy.reason && (
        <div className="rounded-lg p-3 bg-gray-800/50 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1">Selection Reason:</p>
          <p className="text-gray-300 text-sm leading-relaxed">{strategy.reason}</p>
        </div>
      )}

      {/* Focus Areas */}
      {strategy.focus_areas && strategy.focus_areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {strategy.focus_areas.map((area, i) => (
            <span key={i} className="px-2 py-0.5 bg-orange-900/30 text-orange-300 text-xs rounded-full">
              {area}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
