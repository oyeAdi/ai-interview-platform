/**
 * Universal Answer Tracking Hook
 * 
 * Tracks activity for ALL question types (text and code answers)
 * to capture data for future cheating detection.
 * 
 * Currently: Capture-only mode (data stored, not acted upon)
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface Snapshot {
  timestamp: number
  length: number
  textPreview: string  // First 50 chars
}

interface PasteEvent {
  timestamp: number
  charsAdded: number
  source: 'external'
}

interface FocusChange {
  timestamp: number
  focused: boolean
}

interface TypingMetrics {
  totalTimeMs: number
  charsTyped: number
  charsPasted: number
  pasteRatio: number
  avgTypingSpeed: number  // chars per minute
}

export interface ActivityData {
  questionId: string
  questionType: string
  snapshots: Snapshot[]
  pasteEvents: PasteEvent[]
  focusChanges: FocusChange[]
  typingMetrics: TypingMetrics
  startTime: number
  endTime: number | null
}

interface UseAnswerTrackingOptions {
  questionId: string
  questionType: 'coding' | 'conceptual' | 'system_design' | 'problem_solving'
  snapshotIntervalMs?: number  // Default: 30000 (30 seconds)
  enabled?: boolean
}

export function useAnswerTracking(options: UseAnswerTrackingOptions) {
  const {
    questionId,
    questionType,
    snapshotIntervalMs = 30000,
    enabled = true
  } = options

  const [activityData, setActivityData] = useState<ActivityData>({
    questionId,
    questionType,
    snapshots: [],
    pasteEvents: [],
    focusChanges: [],
    typingMetrics: {
      totalTimeMs: 0,
      charsTyped: 0,
      charsPasted: 0,
      pasteRatio: 0,
      avgTypingSpeed: 0
    },
    startTime: Date.now(),
    endTime: null
  })

  const previousValueRef = useRef<string>('')
  const lastKeystrokeRef = useRef<number>(Date.now())
  const charsTypedRef = useRef<number>(0)
  const charsPastedRef = useRef<number>(0)
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track value changes
  const trackChange = useCallback((newValue: string) => {
    if (!enabled) return

    const previousValue = previousValueRef.current
    const charsAdded = newValue.length - previousValue.length

    // Detect large paste (more than 20 chars added at once)
    if (charsAdded > 20) {
      const pasteEvent: PasteEvent = {
        timestamp: Date.now(),
        charsAdded,
        source: 'external'
      }
      setActivityData(prev => ({
        ...prev,
        pasteEvents: [...prev.pasteEvents, pasteEvent]
      }))
      charsPastedRef.current += charsAdded
    } else if (charsAdded > 0) {
      charsTypedRef.current += charsAdded
    }

    previousValueRef.current = newValue
    lastKeystrokeRef.current = Date.now()
  }, [enabled])

  // Capture snapshot
  const captureSnapshot = useCallback((value: string) => {
    if (!enabled || !value) return

    const snapshot: Snapshot = {
      timestamp: Date.now(),
      length: value.length,
      textPreview: value.substring(0, 50)
    }

    setActivityData(prev => ({
      ...prev,
      snapshots: [...prev.snapshots, snapshot]
    }))
  }, [enabled])

  // Track focus changes
  const trackFocus = useCallback((focused: boolean) => {
    if (!enabled) return

    const focusChange: FocusChange = {
      timestamp: Date.now(),
      focused
    }

    setActivityData(prev => ({
      ...prev,
      focusChanges: [...prev.focusChanges, focusChange]
    }))
  }, [enabled])

  // Handle paste event
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!enabled) return

    const pastedText = e.clipboardData?.getData('text') || ''
    if (pastedText.length > 0) {
      const pasteEvent: PasteEvent = {
        timestamp: Date.now(),
        charsAdded: pastedText.length,
        source: 'external'
      }
      setActivityData(prev => ({
        ...prev,
        pasteEvents: [...prev.pasteEvents, pasteEvent]
      }))
      charsPastedRef.current += pastedText.length
    }
  }, [enabled])

  // Finalize activity data
  const finalize = useCallback((finalValue: string): ActivityData => {
    const endTime = Date.now()
    const totalTimeMs = endTime - activityData.startTime
    const totalChars = charsTypedRef.current + charsPastedRef.current

    const finalData: ActivityData = {
      ...activityData,
      endTime,
      typingMetrics: {
        totalTimeMs,
        charsTyped: charsTypedRef.current,
        charsPasted: charsPastedRef.current,
        pasteRatio: totalChars > 0 ? charsPastedRef.current / totalChars : 0,
        avgTypingSpeed: totalTimeMs > 0 ? (charsTypedRef.current / (totalTimeMs / 60000)) : 0
      }
    }

    // Capture final snapshot
    if (finalValue && finalValue.length > 0) {
      finalData.snapshots.push({
        timestamp: endTime,
        length: finalValue.length,
        textPreview: finalValue.substring(0, 50)
      })
    }

    return finalData
  }, [activityData])

  // Set up periodic snapshots
  useEffect(() => {
    if (!enabled) return

    // Start periodic snapshots
    snapshotIntervalRef.current = setInterval(() => {
      if (previousValueRef.current) {
        captureSnapshot(previousValueRef.current)
      }
    }, snapshotIntervalMs)

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current)
      }
    }
  }, [enabled, snapshotIntervalMs, captureSnapshot])

  // Track window focus
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      trackFocus(!document.hidden)
    }

    const handleWindowFocus = () => trackFocus(true)
    const handleWindowBlur = () => trackFocus(false)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [enabled, trackFocus])

  // Reset for new question
  const reset = useCallback((newQuestionId: string, newQuestionType: string) => {
    previousValueRef.current = ''
    charsTypedRef.current = 0
    charsPastedRef.current = 0
    lastKeystrokeRef.current = Date.now()

    setActivityData({
      questionId: newQuestionId,
      questionType: newQuestionType,
      snapshots: [],
      pasteEvents: [],
      focusChanges: [],
      typingMetrics: {
        totalTimeMs: 0,
        charsTyped: 0,
        charsPasted: 0,
        pasteRatio: 0,
        avgTypingSpeed: 0
      },
      startTime: Date.now(),
      endTime: null
    })
  }, [])

  return {
    activityData,
    trackChange,
    trackFocus,
    handlePaste,
    captureSnapshot,
    finalize,
    reset
  }
}

/**
 * Utility to format activity data for API submission
 */
export function formatActivityForAPI(activityData: ActivityData): Record<string, any> {
  return {
    question_id: activityData.questionId,
    question_type: activityData.questionType,
    snapshots: activityData.snapshots.map(s => ({
      timestamp: s.timestamp,
      length: s.length,
      text_preview: s.textPreview
    })),
    paste_events: activityData.pasteEvents.map(p => ({
      timestamp: p.timestamp,
      chars_added: p.charsAdded,
      source: p.source
    })),
    focus_changes: activityData.focusChanges.map(f => ({
      timestamp: f.timestamp,
      focused: f.focused
    })),
    typing_metrics: {
      total_time_ms: activityData.typingMetrics.totalTimeMs,
      chars_typed: activityData.typingMetrics.charsTyped,
      chars_pasted: activityData.typingMetrics.charsPasted,
      paste_ratio: activityData.typingMetrics.pasteRatio,
      avg_typing_speed: activityData.typingMetrics.avgTypingSpeed
    },
    start_time: activityData.startTime,
    end_time: activityData.endTime
  }
}


