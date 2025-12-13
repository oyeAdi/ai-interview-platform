'use client'

import { useState, useEffect } from 'react'

interface ResponseTiming {
  questionId: string
  questionNumber: number
  isFollowup: boolean
  followupNumber?: number
  startTime: number
  endTime?: number
  score?: number
}

interface TimeMetricsProps {
  timings: ResponseTiming[]
  currentQuestionStart?: number
  isAnswering?: boolean
}

export default function TimeMetrics({ timings, currentQuestionStart, isAnswering }: TimeMetricsProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update current time every second for live timer
  useEffect(() => {
    if (isAnswering) {
      const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
      return () => clearInterval(interval)
    }
  }, [isAnswering])

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Calculate metrics
  const completedTimings = timings.filter(t => t.endTime)
  const averageResponseTime = completedTimings.length > 0
    ? completedTimings.reduce((acc, t) => acc + (t.endTime! - t.startTime), 0) / completedTimings.length
    : 0

  const totalTime = completedTimings.reduce((acc, t) => acc + (t.endTime! - t.startTime), 0)
  
  // Calculate efficiency score (higher score + faster time = better efficiency)
  const avgScore = completedTimings.length > 0
    ? completedTimings.reduce((acc, t) => acc + (t.score || 0), 0) / completedTimings.length
    : 0
  
  // Efficiency: normalized score adjusted by time (faster = bonus, slower = penalty)
  // Baseline: 2 minutes per response
  const baselineTime = 120000 // 2 minutes in ms
  const efficiencyScore = completedTimings.length > 0
    ? Math.round(avgScore * (baselineTime / Math.max(averageResponseTime, 30000)))
    : 0

  // Current question timer
  const currentDuration = currentQuestionStart 
    ? currentTime - currentQuestionStart 
    : 0

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* Average Response Time */}
        <div className="bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-epam-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Avg Response</span>
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-dark-primary">
            {averageResponseTime > 0 ? formatDuration(averageResponseTime) : '--:--'}
          </p>
        </div>

        {/* Total Time */}
        <div className="bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-accent-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Total Time</span>
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-dark-primary">
            {totalTime > 0 ? formatDuration(totalTime) : '--:--'}
          </p>
        </div>

        {/* Responses */}
        <div className="bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-accent-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Responses</span>
          </div>
          <p className="text-xl font-bold text-text-primary dark:text-text-dark-primary">
            {completedTimings.length}
          </p>
        </div>

        {/* Efficiency Score */}
        <div className="bg-surface-secondary dark:bg-surface-dark-tertiary rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-accent-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-text-tertiary dark:text-text-dark-tertiary">Efficiency</span>
          </div>
          <p className={`text-xl font-bold ${
            efficiencyScore >= 80 ? 'text-accent-success' :
            efficiencyScore >= 50 ? 'text-accent-warning' :
            efficiencyScore > 0 ? 'text-accent-error' :
            'text-text-primary dark:text-text-dark-primary'
          }`}>
            {efficiencyScore > 0 ? efficiencyScore : '--'}
          </p>
        </div>
      </div>

      {/* Current Question Timer */}
      {isAnswering && currentQuestionStart && (
        <div className="bg-epam-blue-50 dark:bg-epam-blue/10 rounded-xl p-4 border border-epam-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-epam-blue/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-epam-blue animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-epam-blue">Current Response Time</p>
                <p className="text-xs text-epam-blue/70">Candidate is answering...</p>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-epam-blue">
              {formatDuration(currentDuration)}
            </div>
          </div>
        </div>
      )}

      {/* Response Timeline */}
      {completedTimings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary dark:text-text-dark-secondary mb-3">
            Response Timeline
          </h4>
          <div className="space-y-2">
            {completedTimings.map((timing, idx) => {
              const duration = timing.endTime! - timing.startTime
              const isGood = duration < baselineTime * 0.75
              const isSlow = duration > baselineTime * 1.5
              
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-surface-secondary dark:bg-surface-dark-tertiary rounded-lg"
                >
                  {/* Question Label */}
                  <div className={`w-12 h-8 rounded-md flex items-center justify-center text-xs font-bold
                    ${timing.isFollowup 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-epam-blue-100 text-epam-blue dark:bg-epam-blue/20'
                    }`}
                  >
                    Q{timing.questionNumber}{timing.isFollowup ? `-${String.fromCharCode(96 + (timing.followupNumber || 1))}` : ''}
                  </div>
                  
                  {/* Time Bar */}
                  <div className="flex-1">
                    <div className="h-2 bg-surface-tertiary dark:bg-surface-dark rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-accent-success' : isSlow ? 'bg-accent-error' : 'bg-accent-warning'
                        }`}
                        style={{ width: `${Math.min(100, (duration / (baselineTime * 2)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Duration */}
                  <div className={`text-sm font-mono ${
                    isGood ? 'text-accent-success' : isSlow ? 'text-accent-error' : 'text-accent-warning'
                  }`}>
                    {formatDuration(duration)}
                  </div>
                  
                  {/* Score */}
                  {timing.score !== undefined && (
                    <div className={`w-12 text-center text-sm font-bold ${
                      timing.score >= 75 ? 'text-accent-success' :
                      timing.score >= 50 ? 'text-accent-warning' :
                      'text-accent-error'
                    }`}>
                      {timing.score}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <div className="w-3 h-3 rounded-full bg-accent-success"></div>
          <span>Fast (&lt;1:30)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <div className="w-3 h-3 rounded-full bg-accent-warning"></div>
          <span>Normal (1:30-3:00)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <div className="w-3 h-3 rounded-full bg-accent-error"></div>
          <span>Slow (&gt;3:00)</span>
        </div>
      </div>
    </div>
  )
}



