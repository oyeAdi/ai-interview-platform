'use client'

interface LiveScoresProps {
  evaluation: {
    deterministic_scores: {
      factual_correctness: number
      completeness: number
      technical_accuracy: number
      depth: number
      clarity: number
      keyword_coverage: number
    }
    overall_score: number
    llm_evaluation?: {
      score: number
      reasoning: string
      strengths: string[]
      improvements: string[]
      is_fallback?: boolean
    }
    evaluation_details?: {
      keywords_matched?: string[]
      keywords_missing?: string[]
      has_examples?: boolean
    }
  }
}

export default function LiveScores({ evaluation }: LiveScoresProps) {
  const scores = evaluation.deterministic_scores
  const llmEval = evaluation.llm_evaluation

  return (
    <div className="space-y-4">
      {/* Two-column layout for evaluations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deterministic Evaluation */}
        <div className="bg-dark-black rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-300">Deterministic Score</h4>
          </div>
          <div className="text-3xl font-bold text-green-400 mb-3">
            {evaluation.overall_score.toFixed(0)}
            <span className="text-sm text-gray-500 font-normal">/100</span>
          </div>
          <div className="space-y-2">
            <ScoreItem label="Factual" value={scores.factual_correctness} />
            <ScoreItem label="Completeness" value={scores.completeness} />
            <ScoreItem label="Technical" value={scores.technical_accuracy} />
            <ScoreItem label="Depth" value={scores.depth} />
            <ScoreItem label="Clarity" value={scores.clarity} />
            <ScoreItem label="Keywords" value={scores.keyword_coverage} />
          </div>
        </div>

        {/* LLM Evaluation */}
        <div className="bg-dark-black rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${llmEval?.is_fallback ? 'bg-yellow-500' : 'bg-purple-500 animate-pulse'}`}></div>
            <h4 className="text-sm font-semibold text-gray-300">
              LLM Assessment
              {llmEval?.is_fallback && (
                <span className="ml-2 text-xs text-yellow-500 font-normal">(Fallback)</span>
              )}
            </h4>
          </div>
          {llmEval ? (
            <>
              <div className={`text-3xl font-bold mb-3 ${llmEval.is_fallback ? 'text-yellow-400' : 'text-purple-400'}`}>
                {llmEval.score.toFixed(0)}
                <span className="text-sm text-gray-500 font-normal">/100</span>
              </div>
              {llmEval.is_fallback && (
                <p className="text-xs text-yellow-500 mb-2">LLM unavailable - using rule-based assessment</p>
              )}
              <div className="space-y-2 text-xs">
                <p className="text-gray-400 italic">{llmEval.reasoning}</p>
                {llmEval.strengths && llmEval.strengths.length > 0 && (
                  <div>
                    <span className="text-green-400">Strengths: </span>
                    <span className="text-gray-300">{llmEval.strengths.join(', ')}</span>
                  </div>
                )}
                {llmEval.improvements && llmEval.improvements.length > 0 && (
                  <div>
                    <span className="text-yellow-400">Improve: </span>
                    <span className="text-gray-300">{llmEval.improvements.join(', ')}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm">
              <div className="animate-pulse">Analyzing response...</div>
              <p className="mt-2 text-xs">LLM evaluation provides qualitative insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Keywords and Details */}
      {evaluation.evaluation_details && (
        <div className="bg-dark-black rounded-lg p-3 border border-gray-700">
          <div className="flex flex-wrap gap-2 text-xs">
            {evaluation.evaluation_details.keywords_matched && 
             evaluation.evaluation_details.keywords_matched.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-primary-orange">Matched:</span>
                {evaluation.evaluation_details.keywords_matched.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}
            {evaluation.evaluation_details.keywords_missing && 
             evaluation.evaluation_details.keywords_missing.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Missing:</span>
                {evaluation.evaluation_details.keywords_missing.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}
            {evaluation.evaluation_details.has_examples && (
              <span className="px-2 py-0.5 bg-orange-900/30 text-orange-400 rounded">
                Has Examples
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  // Calculate color intensity based on value (higher = brighter green)
  const getBarColor = () => {
    if (value >= 80) return 'bg-green-400'
    if (value >= 60) return 'bg-green-500'
    if (value >= 40) return 'bg-green-600'
    return 'bg-green-700'
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-800 rounded-full h-1.5">
          <div
            className={`${getBarColor()} h-1.5 rounded-full transition-all duration-300`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-white text-xs w-8 text-right">{value.toFixed(0)}</span>
      </div>
    </div>
  )
}
