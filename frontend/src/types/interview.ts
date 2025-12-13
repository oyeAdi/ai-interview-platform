export interface Evaluation {
  deterministic_scores: {
    factual_correctness: number
    completeness: number
    technical_accuracy: number
    depth: number
    clarity: number
    keyword_coverage: number
  }
  overall_score: number
  evaluation_details?: any
}

export interface Strategy {
  id: string
  name: string
  parameters: Record<string, any>
}

export interface Progress {
  rounds_completed: number
  total_rounds: number
  percentage: number
  current_round?: number
  current_followup?: number
}

export interface WebSocketMessage {
  type: string
  data?: any
  text?: string
  message?: string
}





